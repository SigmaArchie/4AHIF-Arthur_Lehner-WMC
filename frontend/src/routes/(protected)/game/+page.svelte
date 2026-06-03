<script>
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/auth.svelte.js';
  import { connectSocket, getSocket } from '$lib/socket.svelte.js';

  let gameState = $state(null);
  let roomId = $state(null);
  let colorPickerVisible = $state(false);
  let selectedCardIndex = $state(null);
  let errorMsg = $state('');
  let confirmLeave = $state(false);

  const isMyTurn = $derived(gameState?.currentPlayer === auth.username);
  const myHand = $derived(
    Array.isArray(gameState?.hands?.[auth.username]) ? gameState.hands[auth.username] : []
  );
  const otherPlayers = $derived(
    gameState?.players?.filter(p => p !== auth.username) ?? []
  );

  function playCard(cardIndex, card) {
    errorMsg = '';
    if (card.color === 'wild' || card.value === 'wild+4') {
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
    errorMsg = '';
    getSocket()?.emit('draw-card', { roomId });
  }

  function leaveGame() {
    getSocket()?.emit('leave-game', { roomId, username: auth.username });
    if (typeof localStorage !== 'undefined') localStorage.removeItem('currentRoomId');
    goto('/lobby');
  }

  onMount(() => {
    roomId = typeof localStorage !== 'undefined' ? localStorage.getItem('currentRoomId') : null;
    if (!roomId) { goto('/lobby'); return; }

    const socket = connectSocket();
    socket.on('game-state', (state) => {
      gameState = state;
      errorMsg = '';
      if (state.status === 'finished' && typeof localStorage !== 'undefined') {
        localStorage.removeItem('currentRoomId');
      }
    });
    socket.on('error', (msg) => { errorMsg = msg; });
    socket.emit('rejoin-room', { roomId, username: auth.username });
  });

  onDestroy(() => {
    const s = getSocket();
    if (s) { s.off('game-state'); s.off('error'); }
  });

  // fan rotation for mini-cards
  function fanRotation(i, total) {
    return ((i - (total - 1) / 2) * 8).toFixed(1);
  }
  function fanY(i, total) {
    return (Math.abs(i - (total - 1) / 2) * 2).toFixed(1);
  }
</script>

<style>
  .game-wrap {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 58px);
    margin: -1.5rem;
    overflow: hidden;
  }

  /* top bar */
  .game-topbar {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 0.5rem 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  /* playing field */
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

  /* hand area */
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

  /* opponents */
  .opponents-row {
    display: flex;
    gap: 1.5rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  .opponent-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 0.6rem 1rem;
    min-width: 100px;
    box-shadow: var(--shadow-sm);
  }
  .opponent-box.active {
    border-color: var(--primary);
    background: var(--primary-light);
  }
  .opponent-fan {
    display: flex;
    position: relative;
    height: 45px;
    align-items: flex-end;
    justify-content: center;
  }

  /* table area */
  .table-area {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2.5rem;
  }
  .pile-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-align: center;
    margin-top: 0.4rem;
  }
  .deck-stack {
    position: relative;
    width: 78px;
    height: 120px;
    cursor: pointer;
  }
  .deck-stack-card {
    position: absolute;
    width: 72px;
    height: 108px;
  }

  /* status */
  .status-box {
    text-align: center;
    min-width: 160px;
  }

  /* direction badge */
  .direction-badge {
    display: inline-block;
    font-size: 1.1rem;
    padding: 0.2rem 0.5rem;
    border-radius: 20px;
    background: var(--surface2);
    color: var(--text-muted);
    border: 1px solid var(--border);
  }
</style>

{#if !gameState}
  <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:calc(100vh - 58px); gap:1rem; color:var(--text-muted)">
    <div style="font-size:3rem">🃏</div>
    <p style="margin:0; font-size:1rem">Warte auf Spielstart...</p>
    <button onclick={() => goto('/lobby')} class="btn-secondary" style="font-size:0.85rem">← Zurück zur Lobby</button>
  </div>

{:else}
  <div class="game-wrap">

    <!-- Top bar: status + leave -->
    <div class="game-topbar">
      <div style="display:flex; align-items:center; gap:1rem">
        {#if isMyTurn}
          <span style="font-weight:700; color:var(--success); font-size:1rem">✓ Du bist dran!</span>
        {:else}
          <span style="color:var(--text-muted); font-size:0.9rem">
            Warte auf <strong style="color:var(--text)">{gameState.currentPlayer}</strong>…
          </span>
        {/if}
        {#if gameState.pendingDraw > 0}
          <span style="background:#fef2f2; color:var(--danger); border:1px solid #fecaca; border-radius:20px; padding:0.2rem 0.7rem; font-size:0.8rem; font-weight:700">
            +{gameState.pendingDraw} ziehen!
          </span>
        {/if}
      </div>
      <button onclick={() => confirmLeave = true} class="btn-danger">Aufgeben</button>
    </div>

    <!-- Playing field -->
    <div class="game-field">

      <!-- Opponents -->
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
            <div style="font-size:0.75rem; color:var(--text-muted)">{count} Karten</div>
          </div>
        {/each}
      </div>

      <!-- Table: discard + status + draw -->
      <div class="table-area">
        <!-- Discard pile -->
        <div style="display:flex; flex-direction:column; align-items:center">
          <div class="game-card card-{gameState.topCard.color}" style="transform:scale(1.1); cursor:default; pointer-events:none">
            <span class="card-corner-top">{gameState.topCard.value}</span>
            <span class="card-center">{gameState.topCard.value}</span>
            <span class="card-corner-bottom">{gameState.topCard.value}</span>
          </div>
          <div class="pile-label">
            Ablagestapel
            {#if gameState.topCard.color === 'wild'}
              <br/><span style="color:var(--primary); font-weight:600">{gameState.currentColor}</span>
            {/if}
          </div>
        </div>

        <!-- Status + direction -->
        <div class="status-box">
          <div class="direction-badge">
            {gameState.direction === 1 ? '→ Uhrzeigersinn' : '← Gegenuhrzeiger'}
          </div>
          {#if errorMsg}
            <div style="margin-top:0.5rem; font-size:0.8rem; color:var(--danger); background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:0.35rem 0.6rem">
              {errorMsg}
            </div>
          {/if}
        </div>

        <!-- Draw pile -->
        <div style="display:flex; flex-direction:column; align-items:center">
          <div class="deck-stack" onclick={isMyTurn ? drawCard : null} style="cursor:{isMyTurn ? 'pointer' : 'not-allowed'}">
            <div class="game-card card-back deck-stack-card" style="top:4px; left:4px; transform:rotate(-2.5deg)"></div>
            <div class="game-card card-back deck-stack-card" style="top:2px; left:2px; transform:rotate(-1deg)"></div>
            <div class="game-card card-back" style="position:absolute; top:0; left:0; {isMyTurn ? '' : 'opacity:0.6'}">
              {#if gameState.pendingDraw > 0}
                <span style="font-size:1.1rem; font-weight:900; color:white">+{gameState.pendingDraw}</span>
              {:else}
                CC
              {/if}
            </div>
          </div>
          <div class="pile-label">{gameState.deckCount} Karten</div>
        </div>
      </div>

    </div>

    <!-- Hand area -->
    <div class="game-hand">
      <div style="font-size:0.8rem; color:var(--text-muted); text-align:center; margin-bottom:0.5rem">
        Deine Karten ({myHand.length})
      </div>
      <div class="hand-cards">
        {#each myHand as card, i}
          <button
            class="game-card card-{card.color}"
            class:disabled={!isMyTurn}
            onclick={() => isMyTurn && playCard(i, card)}
            disabled={!isMyTurn}
          >
            <span class="card-corner-top">{card.value}</span>
            <span class="card-center">{card.value}</span>
            <span class="card-corner-bottom">{card.value}</span>
          </button>
        {/each}
      </div>
    </div>

  </div>

  <!-- Game over overlay -->
  {#if gameState.status === 'finished'}
    <div class="modal-overlay">
      <div class="modal">
        <div style="font-size:3.5rem; margin-bottom:0.5rem">
          {gameState.winner === auth.username ? '🎉' : '😔'}
        </div>
        <h2 style="font-size:1.5rem; font-weight:700; margin:0 0 0.5rem">
          {gameState.winner === auth.username ? 'Du hast gewonnen!' : `${gameState.winner} hat gewonnen!`}
        </h2>
        <p style="color:var(--text-muted); font-size:0.9rem; margin:0 0 1.5rem">Gutes Spiel!</p>
        <button onclick={leaveGame} class="btn-primary">Zurück zur Lobby</button>
      </div>
    </div>
  {/if}
{/if}

<!-- Color picker -->
{#if colorPickerVisible}
  <div class="modal-overlay">
    <div class="modal">
      <p style="font-weight:600; margin:0 0 1rem">Wähle eine Farbe:</p>
      <div style="display:flex; gap:0.75rem; justify-content:center">
        {#each [['red','Rot'],['blue','Blau'],['green','Grün'],['yellow','Gelb']] as [color, label]}
          <button class="game-card card-{color}" style="cursor:pointer; height:70px; width:70px"
                  onclick={() => chooseColor(color)}>
            <span class="card-center" style="font-size:0.75rem; width:52px; height:52px">{label}</span>
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}

<!-- Leave confirmation -->
{#if confirmLeave}
  <div class="modal-overlay">
    <div class="modal">
      <p style="font-weight:600; font-size:1rem; margin:0 0 0.5rem">Spiel verlassen?</p>
      <p style="color:var(--text-muted); font-size:0.875rem; margin:0 0 1.5rem">
        Wenn du aufgibst, gewinnst du automatisch nicht mehr.
      </p>
      <div style="display:flex; gap:0.75rem; justify-content:center">
        <button onclick={() => confirmLeave = false} class="btn-secondary">Abbrechen</button>
        <button onclick={leaveGame} class="btn-danger" style="background:var(--danger); color:white">Ja, verlassen</button>
      </div>
    </div>
  </div>
{/if}
