<script>
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/auth.svelte.js';
  import { setCurrentRoom } from '$lib/session.svelte.js';
  import { connectSocket, getSocket } from '$lib/socket.svelte.js';
  import { t } from '$lib/i18n.svelte.js';
  import reverseImg from '$lib/assets/reverse.jpg';

  let gameState = $state(null);
  let roomId = $state(null);
  let colorPickerVisible = $state(false);
  let selectedCardIndex = $state(null);
  let confirmLeave = $state(false);
  let chatOpen = $state(false);

  // chat
  let messages = $state([]);
  let chatText = $state('');
  let chatContainer;

  // toasts
  let toasts = $state([]);

  function addToast(msg, type = 'error') {
    const id = Date.now();
    toasts = [...toasts, { id, msg, type }];
    setTimeout(() => { toasts = toasts.filter(toast => toast.id !== id); }, 3000);
  }

  const isMyTurn = $derived(gameState?.currentPlayer === auth.username);
  const myHand = $derived(
    Array.isArray(gameState?.hands?.[auth.username]) ? gameState.hands[auth.username] : []
  );
  const otherPlayers = $derived(
    gameState?.players?.filter(p => p !== auth.username) ?? []
  );

  $effect(() => {
    if (messages.length > 0 && chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  });

  function formatTime(ts) {
    const d = new Date(ts);
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  }

  function sendChat() {
    const text = chatText.trim();
    if (!text || !roomId) return;
    getSocket()?.emit('chat-message', { roomId, username: auth.username, text });
    chatText = '';
  }

  function playCard(cardIndex, card) {
    if (card.color === 'wild') {
      selectedCardIndex = cardIndex;
      colorPickerVisible = true;
    } else {
      getSocket()?.emit('play-card', { roomId, cardIndex, chosenColor: null });
    }
  }

  function chooseColor(color) {
    getSocket()?.emit('play-card', { roomId, cardIndex: selectedCardIndex, chosenColor: color });
    colorPickerVisible = false;
    selectedCardIndex = null;
  }

  function drawCard() {
    if (gameState?.drawnCard) {
      getSocket()?.emit('pass-turn', { roomId });
    } else {
      getSocket()?.emit('draw-card', { roomId });
    }
  }

  function leaveGame() {
    getSocket()?.emit('leave-game', { roomId, username: auth.username });
    setCurrentRoom(null);
    goto('/lobby');
  }

  onMount(() => {
    roomId = typeof localStorage !== 'undefined' ? localStorage.getItem('currentRoomId') : null;
    if (!roomId) { goto('/lobby'); return; }

    const socket = connectSocket();
    socket.on('game-state', (state) => {
      gameState = state;
      if (state.status === 'finished') setCurrentRoom(null);
    });
    socket.on('chat-message', (msg) => {
      messages = [...messages, msg];
    });
    socket.on('error', (msg) => { addToast(msg); });
    socket.on('no-active-game', () => { setCurrentRoom(null); goto('/lobby'); });
    socket.emit('rejoin-room', { roomId, username: auth.username });
  });

  onDestroy(() => {
    const s = getSocket();
    if (s) { s.off('game-state'); s.off('error'); s.off('no-active-game'); s.off('chat-message'); }
  });

  function displayVal(v) {
    if (v === 'wild+4') return '+4';
    if (v === 'wild') return 'W';
    return v;
  }

  function fanRotation(i, total) {
    return ((i - (total - 1) / 2) * 8).toFixed(1);
  }
  function fanY(i, total) {
    return (Math.abs(i - (total - 1) / 2) * 2).toFixed(1);
  }
</script>

<style>
  .game-outer {
    display: flex;
    height: calc(100vh - 58px);
    margin: -1.5rem;
    overflow: hidden;
  }

  .game-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
  }

  .game-topbar {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 0.5rem 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .game-field {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    padding: 1rem;
    background: #f0f4ff;
    overflow: hidden;
  }

  .game-hand {
    background: var(--surface);
    border-top: 1px solid var(--border);
    padding: 1rem 1.5rem;
    flex-shrink: 0;
    min-height: 150px;
  }
  .hand-cards {
    display: flex;
    gap: 4px;
    justify-content: center;
    flex-wrap: wrap;
    overflow-x: auto;
  }

  /* ── chat sidebar ── */
  .game-chat {
    width: 260px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--border);
    background: var(--surface);
  }
  .chat-header {
    padding: 0.65rem 1rem;
    border-bottom: 1px solid var(--border);
    font-weight: 600;
    font-size: 0.875rem;
    flex-shrink: 0;
  }
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .chat-empty {
    text-align: center;
    color: var(--text-muted);
    font-size: 0.8rem;
    margin-top: 1rem;
  }
  .chat-msg { display: flex; flex-direction: column; gap: 2px; max-width: 88%; }
  .chat-msg.own  { align-self: flex-end;   align-items: flex-end; }
  .chat-msg.other { align-self: flex-start; }
  .chat-bubble {
    padding: 0.35rem 0.65rem;
    border-radius: 12px;
    font-size: 0.83rem;
    word-break: break-word;
    line-height: 1.4;
  }
  .chat-msg.own   .chat-bubble { background: var(--primary); color: white; border-radius: 12px 12px 4px 12px; }
  .chat-msg.other .chat-bubble { background: var(--surface2); color: var(--text); border-radius: 12px 12px 12px 4px; }
  .chat-meta { font-size: 0.68rem; color: var(--text-muted); padding: 0 0.25rem; }
  .chat-input-row {
    padding: 0.6rem;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 0.4rem;
    flex-shrink: 0;
  }
  .chat-input-row input { flex: 1; padding: 0.4rem 0.65rem; font-size: 0.85rem; }
  .chat-send-btn {
    padding: 0.4rem 0.75rem;
    background: var(--primary); color: white;
    border: none; border-radius: 8px; cursor: pointer;
    font-size: 0.9rem; flex-shrink: 0; transition: background 0.15s;
  }
  .chat-send-btn:hover { background: var(--primary-hover); }

  /* ── opponents ── */
  .opponents-row { display: flex; gap: 1.5rem; justify-content: center; flex-wrap: wrap; }
  .opponent-box {
    display: flex; flex-direction: column; align-items: center; gap: 0.4rem;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 12px; padding: 0.6rem 1rem; min-width: 100px;
    box-shadow: var(--shadow-sm);
  }
  .opponent-box.active { border-color: var(--primary); background: var(--primary-light); }
  .opponent-fan { display: flex; position: relative; height: 45px; align-items: flex-end; justify-content: center; }

  /* ── table ── */
  .table-area { display: flex; align-items: center; justify-content: center; gap: 2.5rem; }
  .pile-label { font-size: 0.75rem; color: var(--text-muted); text-align: center; margin-top: 0.4rem; }
  .deck-stack { position: relative; width: 78px; height: 120px; cursor: pointer; }
  .deck-stack-card { position: absolute; width: 72px; height: 108px; }
  .status-box { text-align: center; min-width: 160px; }
  .direction-badge {
    display: inline-block; font-size: 1.1rem; padding: 0.2rem 0.5rem;
    border-radius: 20px; background: var(--surface2); color: var(--text-muted);
    border: 1px solid var(--border);
  }
</style>

<!-- Toast container -->
<div class="toast-container">
  {#each toasts as toast (toast.id)}
    <div class="toast {toast.type}">{toast.msg}</div>
  {/each}
</div>

{#if !gameState}
  <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:calc(100vh - 58px); gap:1rem; color:var(--text-muted)">
    <div style="font-size:3rem">🃏</div>
    <p style="margin:0; font-size:1rem">{t('waitingStart')}</p>
    <button onclick={() => goto('/lobby')} class="btn-secondary" style="font-size:0.85rem">{t('backToLobby')}</button>
  </div>

{:else}
  <div class="game-outer">

    <!-- ── Spielfeld ── -->
    <div class="game-main">

      <div class="game-topbar">
        <div style="display:flex; align-items:center; gap:1rem; flex-wrap:wrap">
          {#if isMyTurn}
            <span style="font-weight:700; color:var(--success); font-size:1rem">{t('yourTurn')}</span>
          {:else}
            <span style="color:var(--text-muted); font-size:0.9rem">
              {t('waitingFor')} <strong style="color:var(--text)">{gameState.currentPlayer}</strong>…
            </span>
          {/if}
          {#if gameState.pendingDraw > 0}
            <span style="background:#fef2f2; color:var(--danger); border:1px solid #fecaca; border-radius:20px; padding:0.2rem 0.7rem; font-size:0.8rem; font-weight:700">
              +{gameState.pendingDraw} {t('pendingDraw')}
            </span>
          {/if}
        </div>
        <div style="display:flex; align-items:center; gap:0.5rem">
          <button class="chat-toggle-btn" onclick={() => chatOpen = !chatOpen}>
            {t('openChat')} {#if messages.length > 0}({messages.length}){/if}
          </button>
          <button onclick={() => confirmLeave = true} class="btn-danger">{t('surrender')}</button>
        </div>
      </div>

      <div class="game-field">

        <div class="opponents-row">
          {#each otherPlayers as player}
            {@const count = gameState.hands[player]}
            {@const displayCount = Math.min(count, 8)}
            <div class="opponent-box" class:active={gameState.currentPlayer === player}>
              <div class="opponent-fan">
                {#each Array(displayCount) as _, i}
                  <div class="mini-card"
                       style="position:absolute; transform:rotate({fanRotation(i, displayCount)}deg) translateY({fanY(i, displayCount)}px); left:{(i - (displayCount-1)/2) * 14 + 30}px; z-index:{i}">
                  </div>
                {/each}
              </div>
              <div style="font-weight:600; font-size:0.875rem">{player}</div>
              <div style="display:flex; align-items:center; gap:0.35rem; font-size:0.75rem; color:var(--text-muted)">
                {count} {t('cards')}
                {#if count === 1}<span class="uno-badge">UNO!</span>{/if}
              </div>
            </div>
          {/each}
        </div>

        <div class="table-area">
          <div style="display:flex; flex-direction:column; align-items:center">
            <div class="game-card card-{gameState.topCard.color === 'wild' ? gameState.currentColor : gameState.topCard.color}" style="transform:scale(1.1); cursor:default; pointer-events:none">
              {#if gameState.topCard.value === 'reverse'}
                <span class="card-corner-top">↺</span>
                <img src={reverseImg} alt="↺" style="width:42px; height:42px; border-radius:50%; object-fit:contain; background:rgba(255,255,255,0.22); border:2px solid rgba(255,255,255,0.45); padding:5px; filter:brightness(0) invert(1)" />
                <span class="card-corner-bottom">↺</span>
              {:else}
                <span class="card-corner-top">{displayVal(gameState.topCard.value)}</span>
                <span class="card-center">{displayVal(gameState.topCard.value)}</span>
                <span class="card-corner-bottom">{displayVal(gameState.topCard.value)}</span>
              {/if}
            </div>
            <div class="pile-label">{t('discardPile')}</div>
          </div>

          <div class="status-box">
            <div class="direction-badge">
              {gameState.direction === 1 ? t('clockwise') : t('counterClock')}
            </div>
          </div>

          <div style="display:flex; flex-direction:column; align-items:center">
            <div class="deck-stack" onclick={isMyTurn ? drawCard : null} style="cursor:{isMyTurn ? 'pointer' : 'not-allowed'}">
              <div class="game-card card-back deck-stack-card" style="top:4px; left:4px; transform:rotate(-2.5deg)"></div>
              <div class="game-card card-back deck-stack-card" style="top:2px; left:2px; transform:rotate(-1deg)"></div>
              <div class="game-card card-back" style="position:absolute; top:0; left:0; {isMyTurn ? '' : 'opacity:0.6'}">
                {#if gameState.pendingDraw > 0}
                  <span style="font-size:1.1rem; font-weight:900; color:white">+{gameState.pendingDraw}</span>
                {:else if isMyTurn && gameState.drawnCard}
                  <span style="font-size:0.75rem; font-weight:700; color:white; text-align:center; line-height:1.2">{t('passTurn')}</span>
                {:else}
                  CC
                {/if}
              </div>
            </div>
            <div class="pile-label">{gameState.deckCount} {t('cards')}</div>
          </div>
        </div>

      </div>

      <div class="game-hand">
        <div style="font-size:0.8rem; color:var(--text-muted); text-align:center; margin-bottom:0.5rem">
          {t('yourCards')} ({myHand.length})
          {#if myHand.length === 1}<span class="uno-badge" style="margin-left:0.4rem">UNO!</span>{/if}
        </div>
        <div class="hand-cards">
          {#each myHand as card, i}
            <button
              class="game-card card-{card.color}"
              class:disabled={!isMyTurn}
              onclick={() => isMyTurn && playCard(i, card)}
              disabled={!isMyTurn}
            >
              {#if card.value === 'reverse'}
                <span class="card-corner-top">↺</span>
                <img src={reverseImg} alt="↺" style="width:42px; height:42px; border-radius:50%; object-fit:contain; background:rgba(255,255,255,0.22); border:2px solid rgba(255,255,255,0.45); padding:5px; filter:brightness(0) invert(1); pointer-events:none" />
                <span class="card-corner-bottom">↺</span>
              {:else}
                <span class="card-corner-top">{displayVal(card.value)}</span>
                <span class="card-center">{displayVal(card.value)}</span>
                <span class="card-corner-bottom">{displayVal(card.value)}</span>
              {/if}
            </button>
          {/each}
        </div>
      </div>

    </div>

    <!-- ── Chat-Sidebar ── -->
    <div class="game-chat {chatOpen ? 'chat-open' : ''}">
      <div class="chat-header">{t('chatTitle')}</div>
      <div class="chat-messages" bind:this={chatContainer}>
        {#if messages.length === 0}
          <div class="chat-empty">{t('noMessages')}</div>
        {/if}
        {#each messages as msg}
          <div class="chat-msg {msg.username === auth.username ? 'own' : 'other'}">
            <div class="chat-meta">{msg.username}</div>
            <div class="chat-bubble">{msg.text}</div>
            <div class="chat-meta">{formatTime(msg.time)}</div>
          </div>
        {/each}
      </div>
      <div class="chat-input-row">
        <input
          bind:value={chatText}
          onkeydown={e => e.key === 'Enter' && sendChat()}
          placeholder={t('chatPlaceholder')}
          maxlength="200"
        />
        <button onclick={sendChat} class="chat-send-btn">→</button>
      </div>
    </div>

  </div>

  {#if gameState.status === 'finished'}
    <div class="modal-overlay">
      <div class="modal">
        <div style="font-size:3.5rem; margin-bottom:0.5rem">
          {gameState.winner === auth.username ? '🎉' : '😔'}
        </div>
        <h2 style="font-size:1.5rem; font-weight:700; margin:0 0 0.5rem">
          {gameState.winner === auth.username ? t('youWon') : `${gameState.winner} ${t('won')}`}
        </h2>
        <p style="color:var(--text-muted); font-size:0.9rem; margin:0 0 1.5rem">{t('goodGame')}</p>
        <button onclick={leaveGame} class="btn-primary">{t('backToLobby')}</button>
      </div>
    </div>
  {/if}
{/if}

{#if colorPickerVisible}
  <div class="modal-overlay">
    <div class="modal">
      <p style="font-weight:600; margin:0 0 1rem">{t('chooseColor')}</p>
      <div style="display:flex; gap:0.75rem; justify-content:center">
        {#each [['red', t('red')],['blue', t('blue')],['green', t('green')],['yellow', t('yellow')]] as [color, label]}
          <button class="game-card card-{color}" style="cursor:pointer; height:70px; width:70px"
                  onclick={() => chooseColor(color)}>
            <span class="card-center" style="font-size:0.75rem; width:52px; height:52px">{label}</span>
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}

{#if confirmLeave}
  <div class="modal-overlay">
    <div class="modal">
      <p style="font-weight:600; font-size:1rem; margin:0 0 0.5rem">{t('surrenderTitle')}</p>
      <p style="color:var(--text-muted); font-size:0.875rem; margin:0 0 1.5rem">
        {t('surrenderHint')}
      </p>
      <div style="display:flex; gap:0.75rem; justify-content:center">
        <button onclick={() => confirmLeave = false} class="btn-secondary">{t('cancel')}</button>
        <button onclick={leaveGame} class="btn-danger" style="background:var(--danger); color:white">{t('yesLeave')}</button>
      </div>
    </div>
  </div>
{/if}
