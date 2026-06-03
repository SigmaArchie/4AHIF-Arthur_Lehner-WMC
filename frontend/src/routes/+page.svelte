<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/auth.svelte.js';

  onMount(() => {
    if (auth.username) goto('/lobby');
    else goto('/login');
  });
</script>
