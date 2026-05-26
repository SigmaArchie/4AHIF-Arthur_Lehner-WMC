<script>
  import { goto } from '$app/navigation';
  import { login } from '$lib/auth.svelte.js';

  let username = $state('');
  let password = $state('');
  let message = $state('');

  async function handleLogin() {
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      login(data.username);
      goto('/lobby');
    } else {
      message = data.error;
    }
  }
</script>

<h1 class="text-3xl font-bold mb-4">Login</h1>

<div class="flex flex-col gap-4 max-w-sm">
  <input
    bind:value={username}
    type="text"
    placeholder="Username"
    class="border p-2 rounded"
  />

  <input
    bind:value={password}
    type="password"
    placeholder="Password"
    class="border p-2 rounded"
  />

  <button
    onclick={handleLogin}
    class="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
  >
    Login
  </button>

  {#if message}
    <p class="text-red-500">{message}</p>
  {/if}

  <p>Noch keinen Account? <a href="/register" class="text-blue-500 underline">Registrieren</a></p>
</div>
