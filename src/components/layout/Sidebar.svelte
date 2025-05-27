<script>
  import { page } from '$app/stores';
  import { fly } from 'svelte/transition';
  
  let currentPath;
  $: currentPath = $page.url.pathname;
  
  const navItems = [
    { path: '/', label: 'Home', icon: 'home' },
    { path: '/upload', label: 'Upload', icon: 'upload' },
    { path: '/settings', label: 'Settings', icon: 'settings' }
  ];
  
  function getIcon(name) {
    switch (name) {
      case 'home':
        return `M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6`;
      case 'upload':
        return `M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12`;
      case 'settings':
        return `M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z`;
      default:
        return '';
    }
  }
</script>

<aside
  class="w-64 bg-dark-surface border-r border-dark-border hidden md:block"
  in:fly={{ x: -20, duration: 300, delay: 100 }}
>
  <div class="h-full flex flex-col">
    <div class="p-4 border-b border-dark-border">
      <div class="flex items-center space-x-3">
        <div class="bg-primary-500 rounded-lg p-2">
          <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h1 class="text-lg font-bold text-white">CSV Processor</h1>
          <p class="text-xs text-gray-400">v1.0.0</p>
        </div>
      </div>
    </div>
    
    <nav class="flex-1 py-4 px-2">
      <ul class="space-y-1">
        {#each navItems as item}
          <li>
            <a
              href={item.path}
              class="flex items-center px-4 py-3 rounded-md transition-colors duration-200 {currentPath === item.path ? 'bg-primary-600/20 text-primary-400' : 'text-gray-400 hover:bg-dark-hover hover:text-white'}"
            >
              <svg class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIcon(item.icon)} />
              </svg>
              <span>{item.label}</span>
            </a>
          </li>
        {/each}
      </ul>
    </nav>
    
    <div class="p-4 border-t border-dark-border">
      <div class="bg-dark-hover rounded-md p-3">
        <h3 class="text-sm font-medium text-gray-300">Need Help?</h3>
        <p class="text-xs text-gray-400 mt-1">
          Check out the documentation for help with CSV formatting and API integration.
        </p>
      </div>
    </div>
  </div>
</aside>