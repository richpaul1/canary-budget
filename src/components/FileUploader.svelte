<script>
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';

  export let isProcessing = false;

  const dispatch = createEventDispatcher();
  let dragActive = false;
  let fileInput;

  function handleDragEnter(e) {
    e.preventDefault();
    dragActive = true;
  }

  function handleDragLeave(e) {
    e.preventDefault();
    dragActive = false;
  }

  function handleDragOver(e) {
    e.preventDefault();
    dragActive = true;
  }

  function handleDrop(e) {
    e.preventDefault();
    dragActive = false;
    if (isProcessing) return;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }

  function selectFile() {
    if (isProcessing) return;
    fileInput.click();
  }

  function handleInputChange(e) {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }

  function handleFile(file) {
    // You can emit the file object or read its content here
    dispatch('file', { file });
  }
</script>

<div
  class="border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 {dragActive ? 'border-primary-500 bg-primary-900/10' : 'border-dark-border hover:border-primary-600/50 hover:bg-dark-hover/20'}"
  class:cursor-pointer={!isProcessing}
  on:dragenter={handleDragEnter}
  on:dragleave={handleDragLeave}
  on:dragover={handleDragOver}
  on:drop={handleDrop}
  on:click={selectFile}
  on:keydown={(e) => e.key === 'Enter' && selectFile()}
  tabindex="0"
  role="button"
  aria-label="Upload CSV file"
>
  <input
    type="file"
    accept=".csv,application/json"
    bind:this={fileInput}
    class="hidden"
    on:change={handleInputChange}
    tabindex="-1"
  />
  <div class="flex flex-col items-center justify-center">
    {#if isProcessing}
      <svg class="animate-spin h-10 w-10 text-primary-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p class="text-lg font-medium text-gray-300">Processing...</p>
    {:else}
      <svg class="h-16 w-16 text-gray-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      <p class="text-lg font-medium text-gray-300 mb-2">
        Drag and drop your Budget's CSV File here ...
      </p>
      <p class="text-sm text-gray-400">
        or click to browse
      </p>
    {/if}
  </div>
</div>