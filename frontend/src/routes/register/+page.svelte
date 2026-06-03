<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/auth.svelte.js';

  let username = $state('');
  let password = $state('');
  let showPassword = $state(false);
  let message = $state('');
  let success = $state(false);

  onMount(() => {
    if (auth.username) goto('/lobby');
  });

  async function register() {
    if (!username.trim() || !password.trim()) {
      message = 'Bitte alle Felder ausfüllen.';
      return;
    }

    const response = await fetch('http://localhost:3000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      success = true;
      username = '';
      password = '';
      message = '';
      setTimeout(() => goto('/login'), 1500);
    } else {
      message = data.error;
    }
  }
</script>

<div class="min-h-screen flex">
  <!-- Left: Branding -->
  <div class="hidden md:flex w-2/5 bg-purple-600 flex-col items-center justify-center gap-5 p-12 text-white">
    <div class="text-7xl">🃏</div>
    <h1 class="text-4xl font-bold tracking-tight">Card Clash</h1>
    <p class="text-purple-200 text-center text-sm max-w-xs leading-relaxed">
      Erstelle deinen Account und spiel los – kostenlos und ohne Installation.
    </p>
  </div>

  <!-- Right: Form -->
  <div class="flex-1 flex items-center justify-center bg-white p-10">
    <div class="w-full max-w-sm">
      <h2 class="text-2xl font-bold text-gray-900 mb-1">Account erstellen</h2>
      <p class="text-sm text-gray-500 mb-8">
        Bereits registriert?
        <a href="/login" class="text-purple-600 hover:underline font-medium">Anmelden</a>
      </p>

      {#if success}
        <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
          ✓ Account erstellt! Du wirst zum Login weitergeleitet...
        </div>
      {/if}

      <div class="flex flex-col gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Benutzername</label>
          <input
            bind:value={username}
            type="text"
            placeholder="Wähle einen Benutzernamen"
            class="border border-gray-300 p-3 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
          <div class="relative">
            <input
              bind:value={password}
              type={showPassword ? 'text' : 'password'}
              placeholder="Wähle ein sicheres Passwort"
              class="border border-gray-300 p-3 rounded-lg w-full text-sm pr-24 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            />
            <button
              type="button"
              onclick={() => showPassword = !showPassword}
              class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              {showPassword ? 'Verstecken' : 'Anzeigen'}
            </button>
          </div>
        </div>

        {#if message}
          <p class="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{message}</p>
        {/if}

        <button
          onclick={register}
          class="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg font-semibold text-sm transition-colors mt-1"
        >
          Registrieren
        </button>
      </div>
    </div>
  </div>
</div>
