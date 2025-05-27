<script>
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  
  let showMobileMenu = false;
  let scrollY = 0;
  let headerClass = '';
  
  const navItems = [
    { path: '/', label: 'Upload' },
    { path: '/settings', label: 'Settings' }
  ];
  
  function toggleMobileMenu() {
    showMobileMenu = !showMobileMenu;
  }
  
  function handleScroll() {
    scrollY = window.scrollY;
    headerClass = scrollY > 10 ? 'shadow-md bg-dark-surface' : 'bg-dark-surface/90';
  }
  
  onMount(() => {
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  });
</script>

<header class="sticky top-0 z-10 transition-all duration-200 {headerClass}">
  <div class="px-4 py-3 flex items-center justify-between md:hidden">
    <div class="flex items-center space-x-2">
      <div class="bg-primary-500 rounded-lg p-1">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h1 class="text-base font-bold text-white">CSV Processor</h1>
    </div>
    
    <button 
      class="p-2 rounded-md hover:bg-dark-hover text-gray-400 hover:text-white transition-colors"
      on:click={toggleMobileMenu}
      aria-label="Toggle menu"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  </div>
  
  {#if showMobileMenu}
    <nav class="md:hidden px-4 pb-3" transition:slide={{ duration: 200 }}>
      <ul class="space-y-1">
        {#each navItems as item}
          <li>
            <a
              href={item.path}
              class="block px-3 py-2 rounded-md transition-colors {$page.url.pathname === item.path ? 'bg-primary-600/20 text-primary-400' : 'text-gray-400 hover:bg-dark-hover hover:text-white'}"
              on:click={() => showMobileMenu = false}
            >
              {item.label}
            </a>
          </li>
        {/each}
      </ul>
    </nav>
  {/if}
  
  <div class="hidden md:flex items-center justify-end px-6 py-3 border-b border-dark-border">
    <div class="flex items-center space-x-2">
      <button class="btn btn-ghost">
        <span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        <span class="ml-1">Help</span>
      </button>
    </div>
  </div>
</header>