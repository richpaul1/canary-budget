<script>
  import { toast } from '../lib/toastStore';
  import { fly, fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  
  function getIcon(type) {
    switch (type) {
      case 'success':
        return `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>`;
      case 'error':
        return `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>`;
      case 'warning':
        return `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>`;
      default:
        return `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>`;
    }
  }
  
  function getToastClass(type) {
    switch (type) {
      case 'success':
        return 'bg-green-700 border-l-4 border-green-500';
      case 'error':
        return 'bg-red-700 border-l-4 border-red-500';
      case 'warning':
        return 'bg-yellow-600 border-l-4 border-yellow-400 text-black';
      default:
        return 'bg-blue-700 border-l-4 border-blue-500';
    }
  }
</script>

<div class="toast-container z-50 space-y-2 w-72">
  {#each $toast as { id, message, type } (id)}
    <div
      animate:flip={{ duration: 200 }}
      in:fly={{ x: 20, duration: 300 }}
      out:fade={{ duration: 200 }}
      class="toast {getToastClass(type)} shadow-lg rounded-md overflow-hidden"
    >
      <div class="p-3 flex items-start">
        <div class="flex-shrink-0 mr-2">
          {@html getIcon(type)}
        </div>
        <div class="flex-1 pr-2">
          <p class="text-sm text-white">{message}</p>
        </div>
       
      </div>
    </div>
  {/each}
</div>
<!-- No code needed here. Toasts will remain visible until manually dismissed. -->
<style>
.toast-container {
  position: fixed;
  top: 4rem; /* or whatever your header height is */
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.toast {
  color: #fff;
  padding: 0.75em 1.25em;
  border-radius: 0.5em;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 0.5em;
}
.toast.success { background: #16a34a; }
.toast.error { background: #dc2626; }
.toast.warning { background: #f59e42; color: #222; }
/* Add this for blue/info toasts */
.toast.info { background: #2563eb; color: #fff; } /* Tailwind blue-600 */
</style>