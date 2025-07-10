<script>
  import FileUploader from '$components/FileUploader.svelte';
  import { toast } from '$lib/toastStore';
  import Toasts from '$components/Toasts.svelte';
  import Papa from 'papaparse';
  import { onMount } from 'svelte';

  let budgets = $state([]);
  let csvData = $state([]);
  let fileName = $state(null);
  let error = $state(null);
  let isUploading = $state(false);
  let uploadProgress = $state(0);
  let uploadStatus = $state({}); // Tracks status per row (e.g., { 0: { status: 'success' }, 1: { status: 'error', message: '...' } })

  const monthOrder = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch existing budgets
  onMount(async () => {
    try {
      const res = await fetch('/api/v1/budgets');
      if (!res.ok) throw new Error('Failed to load budgets');
      const resp = await res.json();
      budgets = resp.data || [];
    } catch (err) {
      handleError(err.message);
    }
  });

  // Validate CSV headers and data
  function validateCsv(data) {
    if (!data.length) {
      return { valid: false, error: 'CSV is empty' };
    }

    const expectedHeaders = ['Budget', 'Year', ...monthOrder];
    const headers = Object.keys(data[0]);
    if (!expectedHeaders.every(h => headers.includes(h))) {
      return { valid: false, error: `Invalid headers. Expected: ${expectedHeaders.join(', ')}` };
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row.Budget) {
        return { valid: false, error: `Row ${i + 1}: Missing Budget name` };
      }
      const year = parseInt(row.Year);
      if (isNaN(year) || year < 2000 || year > 2100) {
        return { valid: false, error: `Row ${i + 1}: Invalid Year (${row.Year})` };
      }
      for (const month of monthOrder) {
        const amount = parseFloat(row[month]);
        if (isNaN(amount) || amount <= 0) {
          return { valid: false, error: `Row ${i + 1}: Invalid amount for ${month} (${row[month]})` };
        }
      }
    }

    return { valid: true };
  }

  // Transform CSV row to API payload
  function rowToPayload(row, budget) {
    const year = parseInt(row.Year);
    const monthlyAmounts = monthOrder.map((month, index) => ({
      time: Date.UTC(year, index, 1),
      value: parseFloat(row[month])
    }));
    return {
      monthlyAmounts,
      oldbudget: budget
    };
  }

  // Handle file upload
  function handleFileUpload(event) {
    try {
      error = null;
      csvData = [];
      uploadStatus = {};
      fileName = null;
      const file = event.detail.file;
      if (!file) {
        handleError('No file selected');
        return;
      }
      fileName = file.name;
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = Papa.parse(event.target.result, { header: true });
        const data = result.data.filter(row => row.Budget && row.Year); // Remove empty rows
        const validation = validateCsv(data);
        if (!validation.valid) {
          handleError(validation.error);
          return;
        }

        // Check if budgets exist
        data.forEach((row, index) => {
          const budget = budgets.find(b => b.name === row.Budget);
          if (!budget) {
            uploadStatus[index] = { status: 'error', message: `Budget "${row.Budget}" not found` };
          } else {
            uploadStatus[index] = { status: 'pending', message: '' };
          }
        });

        csvData = data;
        if (Object.values(uploadStatus).some(s => s.status === 'error')) {
          toast.show('Some budgets not found. Check table for details.', 'error');
        } else {
          toast.show('CSV file successfully processed', 'success');
        }
      };
      reader.onerror = () => handleError('Error reading file');
      reader.readAsText(file);
    } catch (err) {
      handleError(err.message);
    }
  }

  // Handle error
  function handleError(message) {
    error = message;
    toast.show(error, 'error');
  }

  // Upload rows to Harness
  async function uploadToHarness() {
    if (!csvData.length) {
      handleError('No data to upload');
      return;
    }
    isUploading = true;
    uploadProgress = 0;
    const validRows = csvData.filter((_, index) => uploadStatus[index].status !== 'error');
    if (!validRows.length) {
      handleError('No valid rows to upload');
      isUploading = false;
      return;
    }

    for (let i = 0; i < csvData.length; i++) {
      if (uploadStatus[i].status === 'error') {
        uploadProgress = ((i + 1) / csvData.length) * 100;
        continue; // Skip rows with errors
      }
      const row = csvData[i];
      const budget = budgets.find(b => b.name === row.Budget);
      try {
        const payload = rowToPayload(row, budget);
        const response = await fetch('/api/v1/budgets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          const body = await response.json();
          throw new Error(body?.message || 'Upload failed');
        }
        uploadStatus[i] = { status: 'success', message: '' };
      } catch (err) {
        uploadStatus[i] = { status: 'error', message: `Upload failed: ${err.message}` };
      }
      uploadProgress = ((i + 1) / csvData.length) * 100;
    }

    isUploading = false;
    if (Object.values(uploadStatus).every(s => s.status === 'success')) {
      toast.show('All valid budgets uploaded successfully', 'success');
    } else {
      toast.show('Some uploads failed. Check the table for details.', 'error');
    }
  }

  // Calculate total for a row
  function calculateRowTotal(row) {
    return monthOrder.reduce((sum, month) => sum + parseFloat(row[month] || 0), 0);
  }
</script>

<Toasts />
<div class="space-y-4 p-4">
  <div class="card from-primary-900/50 to-primary-800/30 border-primary-700/50 bg-gradient-to-br p-4">
    <FileUploader on:file={handleFileUpload} />
    {#if fileName}
      <p class="text-xs text-gray-500 mt-2">Uploaded: {fileName}</p>
    {/if}
  </div>

  {#if error}
    <div class="card variant-filled border-2 border-dotted border-gray-700 p-4">
      <p class="text-red-500 text-center">{error}</p>
    </div>
  {/if}

  {#if csvData.length > 0}
    <div class="card variant-filled border-2 border-dotted border-gray-700 p-4">
      <section class="p-4">
        <table class="min-w-full border-collapse">
          <thead>
            <tr>
              <th class="px-4 py-2 text-gray-200">Status</th>
              <th class="px-4 py-2 text-gray-200">Budget</th>
              <th class="px-4 py-2 text-gray-200">Year</th>
              {#each monthOrder as month}
                <th class="px-4 py-2 text-gray-200">{month}</th>
              {/each}
              <th class="px-4 py-2 text-gray-200">Total</th>
            </tr>
          </thead>
          <tbody>
            {#each csvData as row, index}
              <tr>
                <td class="border border-gray-300 px-4 py-2 text-gray-300 text-center">
                  {#if uploadStatus[index].status === 'success'}
                    <span class="text-green-500">✔</span>
                  {:else if uploadStatus[index].status === 'error'}
                    <span class="text-red-500">✖ {uploadStatus[index].message}</span>
                  {:else}
                    <span>⏳</span>
                  {/if}
                </td>
                <td class="border border-gray-300 px-4 py-2 text-gray-300">{row.Budget}</td>
                <td class="border border-gray-300 px-4 py-2 text-gray-300">{row.Year}</td>
                {#each monthOrder as month}
                  <td class="border border-gray-300 px-4 py-2 text-gray-300">
                    ${parseFloat(row[month]).toLocaleString()}
                  </td>
                {/each}
                <td class="border border-gray-300 px-4 py-2 text-gray-300 font-bold">
                  ${calculateRowTotal(row).toLocaleString()}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </section>
      {#if isUploading}
        <div class="mt-4">
          <div class="w-full bg-gray-700 rounded-full h-4">
            <div
              class="bg-blue-600 h-4 rounded-full transition-all duration-300"
              style="width: {uploadProgress}%"
            ></div>
          </div>
          <p class="text-center text-gray-500 mt-2">Uploading... {Math.round(uploadProgress)}%</p>
        </div>
      {:else}
        <button
          class="mt-4 rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700"
          on:click={uploadToHarness}
          disabled={isUploading || csvData.every((_, i) => uploadStatus[i].status === 'error')}
        >
          Upload All Budgets
        </button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .card {
    background: #1f2937; /* Tailwind gray-800 */
  }
  table {
    border-collapse: collapse;
  }
  th, td {
    text-align: left;
  }
</style>