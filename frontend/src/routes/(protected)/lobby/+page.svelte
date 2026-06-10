<script>
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/auth.svelte.js';
  import { session, setCurrentRoom } from '$lib/session.svelte.js';
  import { connectSocket, getSocket } from '$lib/socket.svelte.js';
  import { t } from '$lib/i18n.svelte.js';

  let rooms = $state([]);
  let roomName = $state('');
  let maxPlayers = $state(4);
  let message = $state('');
  let joinedRoom = $state(null);

  async function loadRooms() {
    try {
      const res = await fetch('http://localhost:3000/rooms');
      rooms = await res.json();
    } catch {
      message = t('connFailed');
    }
  }

  async function createRoom() {
    if (!roomName.trim()) return;
    try {
      const res = await fetch('http://localhost:3000/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roomName.trim(), max_players: maxPlayers, owner: auth.username })
      });
      const data = await res.json();
      if (!res.ok) { message = data.error; return; }
      roomName = '';
      maxPlayers = 4;
      message = '';
      joinRoom(data);
    } catch {
      message = t('createRoomError');
    }
  }

  function joinRoom(room) {
    if (!auth.username) { message = t('mustLogin'); return; }
    const socket = connectSocket();
    socket.emit('join-room', { roomId: room.id, username: auth.username });
    joinedRoom = room;
  }

  function startGame() {
    if (!joinedRoom) return;
    getSocket()?.emit('start-game', { roomId: joinedRoom.id });
  }

  onMount(() => {
    loadRooms();
    const socket = connectSocket();
    socket.on('rooms-updated', (r) => { rooms = r; });
    socket.on('game-started', ({ roomId }) => {
      setCurrentRoom(roomId);
      goto('/game');
    });
    socket.on('error', (msg) => { message = msg; });
  });

  onDestroy(() => {
    const s = getSocket();
    if (s) { s.off('rooms-updated'); s.off('game-started'); s.off('error'); }
  });
</script>

<!-- Active game banner -->
{#if session.currentRoomId}
  <div style="background:var(--primary-light); border:1px solid #bfdbfe; border-radius:var(--radius); padding:0.75rem 1rem; margin-bottom:1.5rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem">
    <span style="color:var(--primary); font-weight:500; font-size:0.9rem">
      🃏 {t('activeGameBanner')}
    </span>
    <button onclick={() => goto('/game')} class="btn-primary" style="padding:0.35rem 1rem; font-size:0.85rem">
      {t('backToGameBtn')}
    </button>
  </div>
{/if}

<div style="max-width:960px; margin:0 auto">
  <div class="flex gap-6" style="align-items:flex-start">

    <!-- Raumliste -->
    <div class="flex-1">
      <div class="flex items-center justify-between mb-4">
        <h2 style="font-size:1.1rem; font-weight:600; margin:0">{t('gameRooms')}</h2>
      </div>

      {#if rooms.length === 0}
        <div class="surface-card" style="text-align:center; color:var(--text-muted); padding:2.5rem 1.5rem">
          {t('noRooms')}
        </div>
      {:else}
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:1rem">
          {#each rooms as room}
            <div class="surface-card"
                 style="transition:all 0.15s; cursor:default;
                        {joinedRoom?.id === room.id ? 'border-color:var(--primary); box-shadow:var(--shadow)' : ''}">
              <div style="margin-bottom:0.75rem">
                <div style="font-weight:600; font-size:1rem; margin-bottom:0.25rem">{room.name}</div>
                <div style="display:flex; align-items:center; gap:0.5rem">
                  <span style="background:var(--surface2); border-radius:20px; padding:0.15rem 0.6rem; font-size:0.8rem; color:var(--text-muted)">
                    {room.player_count ?? 0} / {room.max_players}
                  </span>
                  {#if room.owner}
                    <span style="font-size:0.8rem; color:var(--text-muted)">{t('by')} {room.owner}</span>
                  {/if}
                </div>
              </div>

              <div class="flex gap-2">
                {#if joinedRoom?.id === room.id}
                  <span style="font-size:0.85rem; font-weight:600; color:var(--primary); padding:0.4rem 0">{t('joined')}</span>
                  {#if auth.username === room.owner}
                    <button onclick={startGame} class="btn-secondary" style="margin-left:auto">{t('startGame')}</button>
                  {/if}
                {:else}
                  <button onclick={() => joinRoom(room)} class="btn-primary">{t('join')}</button>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}

      {#if message}
        <div style="margin-top:1rem; font-size:0.875rem; color:var(--danger); background:#fef2f2; border:1px solid #fecaca; border-radius:var(--radius); padding:0.5rem 0.875rem">
          {message}
        </div>
      {/if}
    </div>

    <!-- Raum erstellen -->
    <div class="lobby-create" style="width:250px; flex-shrink:0">
      <h2 style="font-size:1.1rem; font-weight:600; margin:0 0 1rem">{t('createGame')}</h2>
      <div class="surface-card flex flex-col gap-3">
        <div>
          <label style="font-size:0.85rem; font-weight:500; color:var(--text); display:block; margin-bottom:5px">{t('roomName')}</label>
          <input bind:value={roomName} type="text" placeholder="z.B. Chill Room" />
        </div>
        <div>
          <label style="font-size:0.85rem; font-weight:500; color:var(--text); display:block; margin-bottom:5px">{t('maxPlayers')}</label>
          <select bind:value={maxPlayers}>
            <option value={2}>2 {t('player')}</option>
            <option value={3}>3 {t('player')}</option>
            <option value={4}>4 {t('player')}</option>
          </select>
        </div>
        <button onclick={createRoom} class="btn-primary" style="width:100%; justify-content:center">
          {t('createJoin')}
        </button>
      </div>
    </div>

  </div>
</div>
