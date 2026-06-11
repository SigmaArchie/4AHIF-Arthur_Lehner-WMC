<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/auth.svelte.js';
  import { t, lang } from '$lib/i18n.svelte.js';
  import { API } from '$lib/api.js';

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
      message = t('fillAllFields');
      return;
    }
    if (password.length < 6) {
      message = t('pwTooShort');
      return;
    }

    const response = await fetch(`${API}/register`, {
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

<div style="min-height: calc(100vh - 58px); display: flex; align-items: center; justify-content: center; padding: 1.5rem; background: var(--bg)">
  <div class="surface-card" style="width: 100%; max-width: 380px">

    <div style="text-align: center; margin-bottom: 2rem">
      <div style="font-size: 1.6rem; font-weight: 800; color: var(--primary); letter-spacing: -0.5px">Card Clash</div>
      <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 4px">Multiplayer Kartenspiel</div>
    </div>

    <h2 style="font-size: 1.1rem; font-weight: 700; margin: 0 0 0.25rem; color: var(--text)">{t('registerTitle')}</h2>
    <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0 0 1.25rem">
      {t('hasAccount')}
      <a href="/login" style="color: var(--primary); font-weight: 500; text-decoration: none">{t('loginLink')}</a>
    </p>

    {#if success}
      <div style="font-size: 0.85rem; padding: 0.6rem 0.75rem; border-radius: 8px; background: #f0fdf4; color: var(--success); border: 1px solid #bbf7d0; margin-bottom: 1rem">
        {t('accountCreated')}
      </div>
    {/if}

    <div style="display: flex; flex-direction: column; gap: 0.875rem">
      <div>
        <label style="display: block; font-size: 0.85rem; font-weight: 500; color: var(--text); margin-bottom: 5px">{t('username')}</label>
        <input
          bind:value={username}
          type="text"
          placeholder={lang.current === 'de' ? 'Wähle einen Benutzernamen' : 'Choose a username'}
        />
      </div>

      <div>
        <label style="display: block; font-size: 0.85rem; font-weight: 500; color: var(--text); margin-bottom: 5px">{t('password')}</label>
        <div style="position: relative">
          <input
            bind:value={password}
            type={showPassword ? 'text' : 'password'}
            placeholder={lang.current === 'de' ? 'Mindestens 6 Zeichen' : 'At least 6 characters'}
            style="padding-right: 5.5rem"
            onkeydown={e => e.key === 'Enter' && register()}
          />
          <button
            type="button"
            onclick={() => showPassword = !showPassword}
            style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); font-size: 0.75rem; color: var(--text-muted); background: none; border: none; cursor: pointer; padding: 0"
          >
            {showPassword ? t('hide') : t('show')}
          </button>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px">
          {lang.current === 'de' ? 'Mind. 6 Zeichen' : 'Min. 6 characters'}
        </div>
      </div>

      {#if message}
        <div style="font-size: 0.85rem; padding: 0.5rem 0.75rem; border-radius: 8px; background: #fef2f2; color: var(--danger); border: 1px solid #fecaca">
          {message}
        </div>
      {/if}

      <button onclick={register} class="btn-primary" style="width: 100%; justify-content: center; margin-top: 0.25rem">
        {t('registerBtn')}
      </button>
    </div>

  </div>
</div>
