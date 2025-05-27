<script>
  import { createEventDispatcher } from 'svelte';
  import { fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  export let data = [];
  export let message = '';
  export let processing = false;
  
  const dispatch = createEventDispatcher();
  
  function handleProcess() {
    dispatch('process');
  }
  
  // Get columns from first data item
  $: columns = data && data.length > 0 ? Object.keys(data[0]) : [];
  
  // Limit the number of rows shown in the preview
  $: displayData = data ? data.slice(0, 10) : [];
  $: hasMoreRows = data && data.length > 10;
</script>

<div class="space-y-4">
  <div class="card border-success-600 bg-success-950/30">
    <div class="flex items-start">
      <div class="bg-success-900/50 rounded-full p-1 mr-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h3 class="text-lg font-medium text-success-400">Validation Successful</h3>
        <p class="mt-1 text-gray-300">{message}</p>
      </div>
    </div>
  </div>
  
  <div class="card animate-up">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-medium text-white">Data Preview</h3>
      <p class="text-sm text-gray-400">{data.length} records found</p>
    </div>
    
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-dark-border">
        <thead>
          <tr>
            {#each columns as column}
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                {column}
              </th>
            {/each}
          </tr>
        </thead>
        <tbody class="divide-y divide-dark-border">
          {#each displayData as row, i}
            <tr class="hover:bg-dark-hover transition-colors">
              {#each columns as column}
                <td class="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
                  {row[column]}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    
    {#if hasMoreRows}
      <p class="text-sm text-gray-400 mt-3 text-center">
        Showing 10 of {data.length} records
      </p>
    {/if}
    
    <div class="mt-6 flex justify-end">
      <button
        class="btn btn-primary"
        on:click={handleProcess}
        disabled={processing}
      >
        {#if processing}
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        {:else}
          Process Data
        {/if}
      </button>
    </div>
  </div>
</div>