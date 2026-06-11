<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { auth, login } from '$lib/auth.svelte.js';
  import { connectSocket } from '$lib/socket.svelte.js';
  import { t, lang } from '$lib/i18n.svelte.js';
  import { API } from '$lib/api.js';

  let username = $state('');
  let password = $state('');
  let showPassword = $state(false);
  let message = $state('');

  onMount(() => {
    if (auth.username) goto('/lobby');
  });

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      message = t('fillAllFields');
      return;
    }

    const response = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      login(data.username);
      connectSocket();
      goto('/lobby');
    } else {
      message = data.error;
    }
  }
</script>

<div style="min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--bg); padding:1.5rem">
  <div style="width:100%; max-width:400px">

    <div style="text-align:center; margin-bottom:2rem">
      <h1 style="font-size:1.5rem; font-weight:700; color:var(--text); margin:0 0 0.25rem">Card Clash</h1>
      <p style="font-size:0.9rem; color:var(--text-muted); margin:0">{t('loginTitle')}</p>
    </div>

    <div style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:2rem; box-shadow:var(--shadow)">
      <div style="display:flex; flex-direction:column; gap:1rem">

        <div>
          <label style="display:block; font-size:0.85rem; font-weight:500; color:var(--text); margin-bottom:5px">{t('username')}</label>
          <input
            bind:value={username}
            type="text"
            placeholder={lang.current === 'de' ? 'Dein Benutzername' : 'Your username'}
            style="width:100%; padding:0.6rem 0.75rem; border:1px solid var(--border); border-radius:8px; font-size:0.9rem; outline:none; background:var(--surface)"
            onfocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
            onblur={e => e.currentTarget.style.borderColor = 'var(--border)'}
          />
        </div>

        <div>
          <label style="display:block; font-size:0.85rem; font-weight:500; color:var(--text); margin-bottom:5px">{t('password')}</label>
          <div style="position:relative">
            <input
              bind:value={password}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••"
              onkeydown={e => e.key === 'Enter' && handleLogin()}
              style="width:100%; padding:0.6rem 0.75rem; padding-right:5rem; border:1px solid var(--border); border-radius:8px; font-size:0.9rem; outline:none; background:var(--surface)"
              onfocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
              onblur={e => e.currentTarget.style.borderColor = 'var(--border)'}
            />
            <button
              type="button"
              onclick={() => showPassword = !showPassword}
              style="position:absolute; right:0.75rem; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:0.78rem; color:var(--text-muted); padding:0"
            >
              {showPassword ? t('hide') : t('show')}
            </button>
          </div>
        </div>

        {#if message}
          <div style="font-size:0.85rem; padding:0.5rem 0.75rem; border-radius:8px; background:#fef2f2; color:var(--danger); border:1px solid #fecaca">
            {message}
          </div>
        {/if}

        <button onclick={handleLogin} class="btn-primary" style="width:100%; justify-content:center; padding:0.65rem">
          {t('loginBtn')}
        </button>

        <p style="text-align:center; font-size:0.85rem; color:var(--text-muted); margin:0">
          {t('noAccount')}
          <a href="/register" style="color:var(--primary); font-weight:500">{t('registerLink')}</a>
        </p>

      </div>
    </div>

  </div>
</div>
