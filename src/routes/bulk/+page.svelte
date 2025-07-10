<script>
  import FileUploader from '$components/FileUploader.svelte';
  import { toast } from '$lib/toastStore';
  import Toasts from '$components/Toasts.svelte';
  import Papa from 'papaparse';
  import { onMount } from 'svelte';
  import IconUpload from '@lucide/svelte/icons/upload';
  import Check from '@lucide/svelte/icons/check';

  let budgets = $state([]);
  let csvData = $state([]);
  let fileName = $state(null);
  let error = $state(null);
  let isUploading = $state(false);
  let uploadProgress = $state(0);
  let uploadStatus = $state({}); // Tracks status per row

  const monthOrder = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthShortNames = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
  ];

  // Headers for the new CSV format
  const amountHeaders = Array.from({ length: 12 }, (_, i) => `Month${i + 1}`);

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

    const expectedHeaders = ['Budget', 'Year', 'Month', ...amountHeaders];
    const headers = Object.keys(data[0]);
    if (!expectedHeaders.every(h => headers.includes(h))) {
      return { valid: false, error: `Invalid headers. Expected: ${expectedHeaders.join(', ')}` };
    }

    const seenBudgets = new Set();
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row.Budget) {
        return { valid: false, error: `Row ${i + 2}: Missing Budget name` };
      }
      const budget = budgets.find(b => b.name === row.Budget);
      if (!budget) {
        return { valid: false, error: `Row ${i + 2}: Budget "${row.Budget}" not found` };
      }
      const year = parseInt(row.Year);
      if (isNaN(year) || year < 2000 || year > 2100) {
        return { valid: false, error: `Row ${i + 2}: Invalid Year (${row.Year})` };
      }
      if (!monthOrder.includes(row.Month)) {
        return { valid: false, error: `Row ${i + 2}: Invalid Month (${row.Month})` };
      }
      const budgetYearKey = `${row.Budget}-${row.Year}-${row.Month}`;
      if (seenBudgets.has(budgetYearKey)) {
        return { valid: false, error: `Row ${i + 2}: Duplicate Budget-Year-Month combination (${row.Budget}, ${row.Year}, ${row.Month})` };
      }
      seenBudgets.add(budgetYearKey);
      for (const monthKey of amountHeaders) {
        const amount = parseFloat(row[monthKey]?.toString().replace(/,/g, ''));
        if (isNaN(amount) || amount <= 0) {
          return { valid: false, error: `Row ${i + 2}: Invalid amount for ${monthKey} (${row[monthKey]})` };
        }
      }
    }

    return { valid: true };
  }

  // Transform CSV row to API payload
  function rowToPayload(row, budget) {
    const startYear = parseInt(row.Year);
    const startMonthIndex = monthOrder.indexOf(row.Month);
    const monthlyAmounts = amountHeaders.map((monthKey, index) => {
      const monthIndex = (startMonthIndex + index) % 12;
      const yearOffset = Math.floor((startMonthIndex + index) / 12);
      return {
        time: Date.UTC(startYear + yearOffset, monthIndex, 1),
        value: parseFloat(row[monthKey].toString().replace(/,/g, ''))
      };
    });
    return {
      monthlyAmounts,
      oldbudget: budget
    };
  }

  // Get short month names for a row
  function getShortMonthNames(row) {
    const startYear = parseInt(row.Year);
    const startMonthIndex = monthOrder.indexOf(row.Month);
    return amountHeaders.map((_, index) => {
      const monthIndex = (startMonthIndex + index) % 12;
      return monthShortNames[monthIndex];
    });
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
        const data = result.data.filter(row => row.Budget && row.Year && row.Month);
        const validation = validateCsv(data);
        if (!validation.valid) {
          handleError(validation.error);
          return;
        }

        // Check budget existence
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
        continue;
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
    return amountHeaders.reduce((sum, monthKey) => sum + parseFloat(row[monthKey]?.toString().replace(/,/g, '') || 0), 0);
  }

  // Download CSV template
  function downloadCsvTemplate() {
    const headers = ['Budget', 'Year', 'Month', ...amountHeaders];
    const sampleRow = {
      Budget: 'Example Budget',
      Year: '2025',
      Month: 'January',
      ...Object.fromEntries(amountHeaders.map(month => [month, '1000.00']))
    };
    const csv = Papa.unparse([sampleRow], { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'budget_template.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }
</script>

<Toasts />
<div class="space-y-4 p-4">
  <div class="card from-primary-900/50 to-primary-800/30 border-primary-700/50 bg-gradient-to-br p-4">
    <FileUploader on:file={handleFileUpload} />
    {#if fileName}
      <p class="text-xs text-gray-500 mt-2">Uploaded: {fileName}</p>
    {/if}
    <button
      class="mt-2 rounded bg-gray-600 px-4 py-2 font-bold text-white hover:bg-gray-700"
      on:click={downloadCsvTemplate}
    >
      Download CSV Template
    </button>
  </div>

  {#if error}
    <div class="card variant-filled border-2 border-dotted border-gray-700 p-4">
      <p class="text-red-500 text-center">{error}</p>
    </div>
  {/if}

  {#if csvData.length > 0}
    <div class="card variant-filled border-2 border-dotted border-gray-700 p-4">
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
      <section class="p-4">
        <table class="min-w-full border-collapse" aria-label="CSV Budget Data">
          <thead>
            <tr>
              <th scope="col" class="px-4 py-2 text-gray-200">Status</th>
              <th scope="col" class="px-4 py-2 text-gray-200">Budget</th>
              <th scope="col" class="px-4 py-2 text-gray-200">Year</th>
              <th scope="col" class="px-4 py-2 text-gray-200">Start Month</th>
              {#each amountHeaders as _, index}
                <th scope="col" class="px-4 py-2 text-gray-200">Month {index + 1}</th>
              {/each}
              <th scope="col" class="px-4 py-2 text-gray-200">Total</th>
            </tr>
          </thead>
          <tbody>
            {#each csvData as row, index}
              <tr>
                <td class="border border-gray-300 px-4 py-2 text-gray-300 text-center" aria-label={`Status for row ${index + 1}`}>
                  {#if uploadStatus[index].status === 'success'}
                    <span class="text-green-500"><Check class="inline w-10 h-10 text-green-400" aria-label="Success" /></span>
                  {:else if uploadStatus[index].status === 'error'}
                    <span class="text-red-500" aria-label="Error: {uploadStatus[index].message}">✖ {uploadStatus[index].message}</span>
                  {:else}
                    <IconUpload title="Pending upload" class="inline w-10 h-10 text-grey-400" aria-label="Pending" />
                  {/if}
                </td>
                <td class="border border-gray-300 px-4 py-2 text-gray-300">{row.Budget}</td>
                <td class="border border-gray-300 px-4 py-2 text-gray-300">{row.Year}</td>
                <td class="border border-gray-300 px-4 py-2 text-gray-300">{row.Month}</td>
                {#each amountHeaders as month, monthIndex}
                  <td class="border border-gray-300 px-4 py-2 text-gray-300">
                    {getShortMonthNames(row)[monthIndex]} - ${parseFloat(row[month].toString().replace(/,/g, '')).toLocaleString()}
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