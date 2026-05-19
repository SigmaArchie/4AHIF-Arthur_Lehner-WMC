<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Card Clash</title>
</svelte:head>

<nav class="bg-gray-900 text-white p-4 flex gap-4">
	<a href="/">Home</a>
	<a href="/login">Login</a>
	<a href="/register">Register</a>
	<a href="/lobby">Lobby</a>
	<a href="/game">Game</a>
	<a href="/stats">Stats</a>
	<a href="/server-status">Server Status</a>
</nav>

<div class="p-6">
	{@render children()}
</div>