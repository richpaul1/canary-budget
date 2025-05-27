<script>
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { toast } from '../../lib/toastStore';
  
  let apiKey = '';
  let isSaving = false;
  let showSuccess = false;
  
  onMount(async () => {
    try {
      apiKey = await window.electronAPI.getApiKey();
    } catch (error) {
      console.error('Failed to load API key:', error);
    }
  });
  
  async function handleSave() {
    if (!apiKey.trim()) {
      toast.show('Please enter a valid API key', 'warning');
      return;
    }
    
    try {
      isSaving = true;
      const result = await window.electronAPI.saveApiKey(apiKey);
      
      if (result.success) {
        showSuccess = true;
        toast.show('API key saved successfully', 'success');
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          showSuccess = false;
        }, 3000);
      }
    } catch (error) {
      toast.show('Failed to save API key', 'error');
    } finally {
      isSaving = false;
    }
  }
</script>

<svelte:head>
  <title>CSV Processor - Settings</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-8 animate-in">
  <header>
    <h1 class="text-3xl font-bold text-white">Settings</h1>
    <p class="text-gray-400 mt-2">
      Configure your application settings and API integrations.
    </p>
  </header>
  
  <div class="card animate-up">
    <h2 class="text-xl font-semibold mb-4">API Configuration</h2>
    <p class="text-gray-400 mb-6">
      Enter your API key for connecting with external services. This key will be stored securely.
    </p>
    
    <div class="space-y-4">
      <div>
        <label for="apiKey" class="block text-sm font-medium text-gray-300 mb-1">
          API Key
        </label>
        <input
          type="text"
          id="apiKey"
          bind:value={apiKey}
          class="input w-full"
          placeholder="Enter your API key"
        />
      </div>
      
      <div class="flex items-center justify-between pt-2">
        {#if showSuccess}
          <div in:fade={{ duration: 200 }} out:fade={{ duration: 200 }}>
            <span class="text-success-400 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Saved successfully
            </span>
          </div>
        {:else}
          <div class="h-5"></div>
        {/if}
        
        <button
          class="btn btn-primary"
          on:click={handleSave}
          disabled={isSaving}
        >
          {#if isSaving}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          {:else}
            Save API Key
          {/if}
        </button>
      </div>
    </div>
  </div>
  
  <div class="card bg-dark-surface/70">
    <h2 class="text-xl font-semibold mb-4">About API Integration</h2>
    <div class="prose prose-invert max-w-none">
      <p class="text-gray-300">
        The API key is used to authenticate requests to the external service when processing CSV data. 
        Your API key is stored securely on your local machine and is not transmitted unless you 
        explicitly process and send data.
      </p>
      <p class="text-gray-300 mt-4">
        If you don't have an API key yet, you can still use the application to validate and process 
        CSV files locally.
      </p>
    </div>
  </div>
</div>