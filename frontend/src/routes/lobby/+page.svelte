<script>
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/auth.svelte.js';
  import { socket } from '$lib/socket.svelte.js';

  let rooms = $state([]);
  let roomName = $state('');
  let maxPlayers = $state(4);
  let message = $state('');
  let joinedRoomId = $state(null);

  async function loadRooms() {
    const response = await fetch('http://localhost:3000/rooms');
    rooms = await response.json();
  }

  async function createRoom() {
    if (!roomName.trim()) return;

    const response = await fetch('http://localhost:3000/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: roomName, max_players: maxPlayers })
    });

    if (response.ok) {
      const room = await response.json();
      roomName = '';
      maxPlayers = 4;
      message = '';
      joinRoom(room.id);
    } else {
      const data = await response.json();
      message = data.error;
    }
  }

  function joinRoom(roomId) {
    if (!auth.username) {
      message = 'Du musst eingeloggt sein!';
      return;
    }
    socket.emit('join-room', { roomId, username: auth.username });
    joinedRoomId = roomId;
  }

  function startGame() {
    if (!joinedRoomId) return;
    socket.emit('start-game', { roomId: joinedRoomId });
  }

  onMount(() => {
    loadRooms();

    socket.on('rooms-updated', (updatedRooms) => {
      rooms = updatedRooms;
    });

    socket.on('game-started', ({ roomId }) => {
      goto(`/game?room=${roomId}`);
    });
  });

  onDestroy(() => {
    socket.off('rooms-updated');
    socket.off('game-started');
  });
</script>

<div class="max-w-4xl mx-auto">
  <h1 class="text-3xl font-bold mb-6">Lobby</h1>

  <div class="flex gap-6">
    <!-- Raumliste -->
    <div class="flex-1">
      <h2 class="text-xl font-semibold mb-3">Spielräume</h2>

      {#if rooms.length === 0}
        <p class="text-gray-500">Keine Räume verfügbar. Erstelle einen neuen Raum!</p>
      {:else}
        <table class="w-full border-collapse border border-gray-300">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-300 p-2 text-left">Raumname</th>
              <th class="border border-gray-300 p-2 text-left">Spieler</th>
              <th class="border border-gray-300 p-2 text-left">Status</th>
              <th class="border border-gray-300 p-2"></th>
            </tr>
          </thead>
          <tbody>
            {#each rooms as room}
              <tr class="hover:bg-gray-50 {joinedRoomId === room.id ? 'bg-blue-50' : ''}">
                <td class="border border-gray-300 p-2">{room.name}</td>
                <td class="border border-gray-300 p-2">0 / {room.max_players}</td>
                <td class="border border-gray-300 p-2">
                  <span class="bg-green-100 text-green-700 px-2 py-0.5 rounded text-sm">
                    {room.status}
                  </span>
                </td>
                <td class="border border-gray-300 p-2">
                  {#if joinedRoomId === room.id}
                    <span class="text-blue-600 text-sm font-semibold">✓ Beigetreten</span>
                  {:else}
                    <button
                      onclick={() => joinRoom(room.id)}
                      class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                    >
                      Beitreten
                    </button>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}

      <!-- Spiel starten Button -->
      {#if joinedRoomId}
        <div class="mt-4">
          <button
            onclick={startGame}
            class="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-semibold"
          >
            Spiel starten
          </button>
          <p class="text-sm text-gray-500 mt-1">Alle Spieler im Raum werden gestartet.</p>
        </div>
      {/if}
    </div>

    <!-- Raum erstellen -->
    <div class="w-64">
      <h2 class="text-xl font-semibold mb-3">Spiel erstellen</h2>
      <div class="flex flex-col gap-3 border border-gray-300 rounded p-4">
        <input
          bind:value={roomName}
          type="text"
          placeholder="Raumname eingeben"
          class="border p-2 rounded text-sm"
        />

        <div>
          <label class="text-sm text-gray-600 mb-1 block">Max. Spieler</label>
          <select bind:value={maxPlayers} class="border p-2 rounded w-full text-sm">
            <option value={2}>2 Spieler</option>
            <option value={3}>3 Spieler</option>
            <option value={4}>4 Spieler</option>
          </select>
        </div>

        <button
          onclick={createRoom}
          class="bg-purple-600 text-white p-2 rounded hover:bg-purple-700 text-sm"
        >
          Erstellen & Beitreten
        </button>

        {#if message}
          <p class="text-red-500 text-sm">{message}</p>
        {/if}
      </div>
    </div>
  </div>
</div>
