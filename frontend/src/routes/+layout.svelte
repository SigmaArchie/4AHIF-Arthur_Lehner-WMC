<script>
  import './layout.css';
  import favicon from '$lib/assets/favicon.svg';
  import { auth, logout } from '$lib/auth.svelte.js';
  import { session, initSession } from '$lib/session.svelte.js';
  import { socketStatus } from '$lib/socket.svelte.js';
  import { t, lang, setLanguage } from '$lib/i18n.svelte.js';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let { children } = $props();
  let menuOpen = $state(false);

  const navItems = [
    { href: '/lobby',   key: 'lobby' },
    { href: '/profile', key: 'profile' },
  ];

  onMount(() => { initSession(); });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>Card Clash</title>
</svelte:head>

{#if auth.username}
  {#if menuOpen}
    <div class="sidebar-overlay" onclick={() => menuOpen = false}></div>
  {/if}

  <div style="display:flex; height:100vh; overflow:hidden; background:var(--bg)">

    <!-- Sidebar -->
    <aside class="sidebar {menuOpen ? 'open' : ''}"
           style="width:210px; background:var(--surface); border-right:1px solid var(--border); display:flex; flex-direction:column; flex-shrink:0; box-shadow:var(--shadow-sm)">
      <div style="padding:1.25rem 1rem 1rem; border-bottom:1px solid var(--border)">
        <span style="font-size:1.15rem; font-weight:700; color:var(--primary); letter-spacing:-0.3px">Card Clash</span>
      </div>

      <nav style="flex:1; padding:0.75rem; display:flex; flex-direction:column; gap:2px">
        {#each navItems as item}
          <a href={item.href}
             onclick={() => menuOpen = false}
             style="display:block; padding:0.5rem 0.75rem; border-radius:8px; font-size:0.9rem; transition:all 0.15s;
                    background:{$page.url.pathname.startsWith(item.href) ? 'var(--primary-light)' : 'transparent'};
                    color:{$page.url.pathname.startsWith(item.href) ? 'var(--primary)' : 'var(--text-muted)'};
                    font-weight:{$page.url.pathname.startsWith(item.href) ? '600' : '500'}">
            {t(item.key)}
          </a>
        {/each}

        {#if session.currentRoomId && !$page.url.pathname.startsWith('/game')}
          <a href="/game"
             onclick={() => menuOpen = false}
             style="display:flex; align-items:center; gap:6px; padding:0.45rem 0.75rem; border-radius:20px; font-size:0.85rem; font-weight:600; margin-top:0.75rem;
                    background:var(--primary-light); color:var(--primary); border:1px solid #bfdbfe">
            {t('backToGame')}
          </a>
        {/if}
      </nav>

      <div style="padding:0.75rem; border-top:1px solid var(--border); display:flex; flex-direction:column; gap:0.5rem">
        <!-- Language toggle -->
        <div style="display:flex; gap:0.35rem">
          {#each ['de','en'] as l}
            <button onclick={() => setLanguage(l)}
              style="flex:1; padding:0.3rem; border-radius:6px; font-size:0.78rem; font-weight:600; cursor:pointer; transition:all 0.15s;
                     border:1px solid {lang.current === l ? 'var(--primary)' : 'var(--border)'};
                     background:{lang.current === l ? 'var(--primary-light)' : 'transparent'};
                     color:{lang.current === l ? 'var(--primary)' : 'var(--text-muted)'}">
              {l.toUpperCase()}
            </button>
          {/each}
        </div>
        <button onclick={logout}
          style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem 0.75rem; border-radius:8px; font-size:0.875rem; font-weight:500; color:var(--text-muted); background:transparent; border:none; cursor:pointer; width:100%; transition:all 0.15s; text-align:left"
          onmouseenter={e => { e.currentTarget.style.background='#fef2f2'; e.currentTarget.style.color='var(--danger)'; }}
          onmouseleave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-muted)'; }}>
          ↩ {t('logout')}
        </button>
      </div>
    </aside>

    <!-- Main -->
    <div style="flex:1; display:flex; flex-direction:column; min-width:0">
      <header style="background:var(--surface); border-bottom:1px solid var(--border); height:58px; display:flex; align-items:center; padding:0 1rem; flex-shrink:0; box-shadow:var(--shadow-sm); gap:0.75rem">
        <button class="hamburger-btn" onclick={() => menuOpen = !menuOpen} aria-label="Menu">☰</button>
        <div style="flex:1; display:flex; align-items:center; justify-content:flex-end; gap:1rem">
          <!-- Connection status dot -->
          <span style="display:flex; align-items:center; gap:5px; font-size:0.75rem; color:{socketStatus.connected ? 'var(--success)' : 'var(--text-muted)'}">
            <span style="width:7px; height:7px; border-radius:50%; background:currentColor; display:inline-block; flex-shrink:0"></span>
            <span class="hidden md:inline">{socketStatus.connected ? t('connected') : t('disconnected')}</span>
          </span>
          <span style="background:var(--primary-light); color:var(--primary); padding:0.3rem 0.85rem; border-radius:20px; font-size:0.875rem; font-weight:600; border:1px solid #bfdbfe">
            {auth.username}
          </span>
        </div>
      </header>
      <main style="flex:1; overflow:auto; padding:1.5rem">
        {@render children()}
      </main>
    </div>
  </div>

{:else}
  {@render children()}
{/if}
