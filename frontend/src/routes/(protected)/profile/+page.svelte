<script>
  import { onMount } from 'svelte';
  import { auth } from '$lib/auth.svelte.js';

  let stats = $state(null);
  let leaderboard = $state([]);

  let oldPassword = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let pwMsg = $state('');
  let pwSuccess = $state(false);

  onMount(async () => {
    const [sRes, lRes] = await Promise.all([
      fetch(`http://localhost:3000/stats/${auth.username}`),
      fetch('http://localhost:3000/leaderboard')
    ]);
    if (sRes.ok) stats = await sRes.json();
    if (lRes.ok) leaderboard = await lRes.json();
  });

  async function changePassword() {
    pwMsg = '';
    pwSuccess = false;
    if (!oldPassword || !newPassword || !confirmPassword) {
      pwMsg = 'Alle Felder ausfüllen.'; return;
    }
    if (newPassword !== confirmPassword) {
      pwMsg = 'Neue Passwörter stimmen nicht überein.'; return;
    }
    if (newPassword.length < 6) {
      pwMsg = 'Mindestens 6 Zeichen erforderlich.'; return;
    }
    const res = await fetch('http://localhost:3000/profile/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: auth.username, oldPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok) { pwMsg = data.error; return; }
    pwMsg = data.message;
    pwSuccess = true;
    oldPassword = ''; newPassword = ''; confirmPassword = '';
  }
</script>

<div style="max-width:960px; margin:0 auto; display:flex; flex-direction:column; gap:1.25rem">

  <!-- Zeile 1: Account + Stats -->
  <div style="display:grid; grid-template-columns:200px 1fr; gap:1.25rem">

    <!-- Account -->
    <div class="surface-card" style="display:flex; flex-direction:column; align-items:center; gap:0.75rem; text-align:center">
      <div style="width:64px; height:64px; border-radius:50%; background:var(--primary); display:flex; align-items:center; justify-content:center; font-size:1.75rem; font-weight:800; color:white; flex-shrink:0">
        {auth.username?.[0]?.toUpperCase()}
      </div>
      <div>
        <div style="font-size:1.1rem; font-weight:700">{auth.username}</div>
        <div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px">Spieler</div>
      </div>
    </div>

    <!-- Statistiken -->
    <div class="surface-card">
      <h3 style="font-size:0.95rem; font-weight:600; margin:0 0 1rem">Meine Statistiken</h3>
      {#if stats}
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:0.75rem">
          {#each [
            { label: 'Gespielte Spiele', value: stats.games },
            { label: 'Siege',            value: stats.wins },
            { label: 'Siegesquote',      value: stats.winRate + '%' }
          ] as s}
            <div style="background:var(--surface2); border-radius:var(--radius); padding:1rem; text-align:center">
              <div style="font-size:1.75rem; font-weight:800; color:var(--primary)">{s.value}</div>
              <div style="font-size:0.78rem; color:var(--text-muted); margin-top:4px">{s.label}</div>
            </div>
          {/each}
        </div>
      {:else}
        <p style="color:var(--text-muted); font-size:0.9rem; margin:0">Lade Statistiken...</p>
      {/if}
    </div>

  </div>

  <!-- Zeile 2: Passwort ändern + Leaderboard -->
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.25rem">

    <!-- Passwort ändern -->
    <div class="surface-card">
      <h3 style="font-size:0.95rem; font-weight:600; margin:0 0 1rem">Passwort ändern</h3>
      <div style="display:flex; flex-direction:column; gap:0.75rem">
        <div>
          <label style="font-size:0.85rem; font-weight:500; display:block; margin-bottom:4px">Altes Passwort</label>
          <input bind:value={oldPassword} type="password" placeholder="••••••" />
        </div>
        <div>
          <label style="font-size:0.85rem; font-weight:500; display:block; margin-bottom:4px">Neues Passwort</label>
          <input bind:value={newPassword} type="password" placeholder="Min. 6 Zeichen" />
        </div>
        <div>
          <label style="font-size:0.85rem; font-weight:500; display:block; margin-bottom:4px">Neues Passwort bestätigen</label>
          <input bind:value={confirmPassword} type="password" placeholder="••••••" />
        </div>
        {#if pwMsg}
          <div style="font-size:0.85rem; padding:0.5rem 0.75rem; border-radius:8px;
                      background:{pwSuccess ? '#f0fdf4' : '#fef2f2'};
                      color:{pwSuccess ? 'var(--success)' : 'var(--danger)'};
                      border:1px solid {pwSuccess ? '#bbf7d0' : '#fecaca'}">
            {pwMsg}
          </div>
        {/if}
        <button onclick={changePassword} class="btn-primary" style="width:100%; justify-content:center">
          Speichern
        </button>
      </div>
    </div>

    <!-- Leaderboard -->
    <div class="surface-card">
      <h3 style="font-size:0.95rem; font-weight:600; margin:0 0 1rem">Bestenliste</h3>
      {#if leaderboard.length === 0}
        <p style="color:var(--text-muted); font-size:0.9rem; margin:0">Noch keine Spiele gespielt.</p>
      {:else}
        <div style="display:flex; flex-direction:column; gap:0.3rem">
          {#each leaderboard as entry, i}
            <div style="display:flex; align-items:center; gap:0.75rem; padding:0.4rem 0.6rem; border-radius:8px;
                        background:{entry.username === auth.username ? 'var(--primary-light)' : (i % 2 === 0 ? 'var(--surface2)' : 'transparent')};
                        border:{entry.username === auth.username ? '1px solid #bfdbfe' : '1px solid transparent'}">
              <span style="font-size:0.875rem; font-weight:700; width:24px; text-align:center; color:{i < 3 ? 'var(--primary)' : 'var(--text-muted)'}">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </span>
              <span style="flex:1; font-size:0.875rem; font-weight:{entry.username === auth.username ? '700' : '400'}">{entry.username}</span>
              <span style="font-size:0.875rem; font-weight:600; color:var(--primary)">{entry.wins} Siege</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>

  </div>

</div>
