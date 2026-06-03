<script>
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/auth.svelte.js';
  import { socket } from '$lib/socket.svelte.js';

  let gameState = $state(null);
  let errorMsg = $state('');
  let showColorPicker = $state(false);
  let pendingCardIndex = $state(null);

  const roomId = $derived($page.url.searchParams.get('room'));

  const colorMap = {
    red:    'bg-red-500',
    blue:   'bg-blue-500',
    green:  'bg-green-500',
    yellow: 'bg-yellow-400',
    wild:   'bg-gray-700'
  };

  const colorBorder = {
    red:    'border-red-500',
    blue:   'border-blue-500',
    green:  'border-green-500',
    yellow: 'border-yellow-400',
    wild:   'border-gray-700'
  };

  function isMyTurn() {
    return gameState?.currentPlayer === auth.username;
  }

  function myHand() {
    return Array.isArray(gameState?.hands?.[auth.username])
      ? gameState.hands[auth.username]
      : [];
  }

  function otherPlayers() {
    if (!gameState) return [];
    return gameState.players.filter(p => p !== auth.username);
  }

  function playCard(index) {
    if (!isMyTurn()) return;
    const card = myHand()[index];
    if (card.value === 'wild' || card.value === 'wild+4') {
      pendingCardIndex = index;
      showColorPicker = true;
    } else {
      socket.emit('play-card', { roomId, cardIndex: index, chosenColor: null });
    }
  }

  function chooseColor(color) {
    socket.emit('play-card', { roomId, cardIndex: pendingCardIndex, chosenColor: color });
    showColorPicker = false;
    pendingCardIndex = null;
  }

  function drawCard() {
    if (!isMyTurn()) return;
    socket.emit('draw-card', { roomId });
  }

  onMount(() => {
    socket.on('game-state', (state) => {
      gameState = state;
      errorMsg = '';
    });

    socket.on('error', (msg) => {
      errorMsg = msg;
    });
  });

  onDestroy(() => {
    socket.off('game-state');
    socket.off('error');
  });
</script>

{#if !gameState}
  <div class="flex items-center justify-center h-64">
    <p class="text-gray-500 text-xl">Warte auf Spielstart...</p>
  </div>

{:else if gameState.status === 'finished'}
  <div class="flex flex-col items-center justify-center h-64 gap-4">
    <h1 class="text-4xl font-bold">🎉 {gameState.winner} hat gewonnen!</h1>
    <button onclick={() => goto('/lobby')} class="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
      Zurück zur Lobby
    </button>
  </div>

{:else}
  <div class="flex flex-col gap-4 max-w-4xl mx-auto">

    <!-- Aktueller Spieler -->
    <div class="text-center">
      <span class="text-lg font-semibold">
        {#if isMyTurn()}
          <span class="text-green-600">Du bist dran!</span>
        {:else}
          <span class="text-gray-600">{gameState.currentPlayer} ist dran</span>
        {/if}
      </span>
      {#if gameState.pendingDraw > 0}
        <span class="ml-2 text-red-500 font-bold">(+{gameState.pendingDraw} ziehen!)</span>
      {/if}
    </div>

    <!-- Andere Spieler -->
    <div class="flex justify-center gap-6">
      {#each otherPlayers() as player}
        <div class="flex flex-col items-center border rounded p-3 {gameState.currentPlayer === player ? 'border-green-500 bg-green-50' : 'border-gray-300'}">
          <span class="font-semibold">{player}</span>
          <span class="text-sm text-gray-500">{gameState.hands[player]} Karten</span>
        </div>
      {/each}
    </div>

    <!-- Spielfeld Mitte -->
    <div class="flex items-center justify-center gap-8">
      <!-- Aktuelle Karte -->
      <div class="flex flex-col items-center gap-1">
        <span class="text-xs text-gray-500">Aktuelle Karte</span>
        <div class="w-16 h-24 rounded-lg border-4 {colorBorder[gameState.currentColor]} {colorMap[gameState.topCard.color]} flex items-center justify-center text-white font-bold text-xl shadow-lg">
          {gameState.topCard.value}
        </div>
        {#if gameState.topCard.color === 'wild'}
          <div class="w-4 h-4 rounded-full {colorMap[gameState.currentColor]} border border-gray-400"></div>
        {/if}
      </div>

      <!-- Nachziehstapel -->
      <div class="flex flex-col items-center gap-1">
        <span class="text-xs text-gray-500">Stapel ({gameState.deckCount})</span>
        <button
          onclick={drawCard}
          disabled={!isMyTurn()}
          class="w-16 h-24 rounded-lg bg-gray-800 border-4 border-gray-600 flex items-center justify-center text-white font-bold text-xs shadow-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Ziehen
        </button>
      </div>
    </div>

    <!-- Fehlermeldung -->
    {#if errorMsg}
      <p class="text-center text-red-500 font-semibold">{errorMsg}</p>
    {/if}

    <!-- Eigene Handkarten -->
    <div class="border-t pt-4">
      <p class="text-sm text-gray-500 mb-2 text-center">Deine Karten ({myHand().length})</p>
      <div class="flex flex-wrap justify-center gap-2">
        {#each myHand() as card, i}
          <button
            onclick={() => playCard(i)}
            disabled={!isMyTurn()}
            class="w-14 h-20 rounded-lg border-2 border-white {colorMap[card.color]} flex items-center justify-center text-white font-bold text-sm shadow hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {card.value}
          </button>
        {/each}
      </div>
    </div>

  </div>
{/if}

<!-- Farbauswahl-Dialog für Wild-Karten -->
{#if showColorPicker}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl p-6 flex flex-col items-center gap-4 shadow-2xl">
      <h2 class="text-lg font-bold">Farbe wählen</h2>
      <div class="flex gap-3">
        {#each ['red', 'blue', 'green', 'yellow'] as color}
          <button
            onclick={() => chooseColor(color)}
            class="w-14 h-14 rounded-full {colorMap[color]} hover:scale-110 transition-transform shadow"
          ></button>
        {/each}
      </div>
    </div>
  </div>
{/if}
