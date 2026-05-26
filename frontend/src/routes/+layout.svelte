<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { auth, logout } from '$lib/auth.svelte.js';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Card Clash</title>
</svelte:head>

<nav class="bg-gray-900 text-white p-4 flex items-center gap-4">
	<a href="/">Home</a>
	<a href="/lobby">Lobby</a>
	<a href="/stats">Stats</a>

	<div class="ml-auto flex items-center gap-4">
		{#if auth.username}
			<span class="text-gray-300">👤 {auth.username}</span>
			<button onclick={logout} class="bg-red-600 px-3 py-1 rounded hover:bg-red-700">
				Logout
			</button>
		{:else}
			<a href="/login">Login</a>
			<a href="/register">Register</a>
		{/if}
	</div>
</nav>

<div class="p-6">
	{@render children()}
</div>