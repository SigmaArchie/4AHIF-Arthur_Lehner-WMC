<script>
  import { auth } from '$lib/auth.svelte.js';
</script>

<div style="max-width:500px; margin:0 auto">
  <div class="surface-card mb-4">
    <div class="text-xs mb-1" style="color:var(--text-muted)">Angemeldet als</div>
    <div class="text-2xl font-bold" style="color:var(--primary)">👤 {auth.username}</div>
  </div>

  <div class="surface-card">
    <h3 class="font-semibold mb-3">Statistiken</h3>
    <div class="flex flex-col gap-2" style="color:var(--text-muted); font-size:0.9rem">
      <div class="flex justify-between">
        <span>Gespielte Spiele</span><span>—</span>
      </div>
      <div class="flex justify-between">
        <span>Siege</span><span>—</span>
      </div>
      <div class="flex justify-between">
        <span>Siegesquote</span><span>—</span>
      </div>
    </div>
    <p class="text-xs mt-3" style="color:var(--text-muted)">Echte Daten kommen in Meilenstein 4.</p>
  </div>
</div>
