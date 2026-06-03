<script>
  import { auth } from '$lib/auth.svelte.js';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  const { children } = $props();

  onMount(() => {
    if (!auth.username) goto('/login');
  });
</script>

{@render children()}
