<script>
	import Typeahead from 'svelte-typeahead';
	import FileUploader from '$components/FileUploader.svelte';
	import { toast } from '$lib/toastStore';
	import Toasts from '$components/Toasts.svelte';
	import Papa from 'papaparse';

	let showDebug = false;
	let props = $props();
	let budgets = $state([]);
	let data = $state(budgets);
	// data = budgets;

	const extract = (item) => item.name;
	let selected = $state(null);
	let record = $state({});
	let newBudget = $state([]);
	let newBudgetTotal = $state(0);
	let error = $state(null);
	let csvData = $state(null);
	let fileName = $state(null);

	// Helper to reload props (and budgets) after upload
	async function reloadProps() {
		// SvelteKit provides `load` for page data, but in +page.svelte we can't call it directly.
		// Instead, refetch the endpoint and update props/budgets.
		const res = await fetch('/api/v1/budgets');
		if (res.ok) {
			console.log('Reloading budgets ...');
			console.log('Selected:', selected.uuid);

			const resp = await res.json();
			budgets = resp.data;
			data = budgets;
			budgets.forEach((budget) => {
				if (budget.uuid === selected.uuid) {
					const currentBudgetDiv = document.getElementById('current_budget');
					currentBudgetDiv.classList.add('animate-match');
					setTimeout(() => {
						selected = budget;
						currentBudgetDiv.classList.remove('animate-match');
						toast.show('Budget Upload Successful', 'success');
					}, 2500);
				}
			});
		} else {
			toast.show('Failed to reload budgets', 'error');
		}
	}

	function processBudgetDataToGMT(data) {
		// Array to store the processed results
		const result = [];

		// Iterate through the budgetMonthlyAmount array
		data.forEach(item => {
			// Convert timestamp to a Date object in GMT
			const date = new Date(item.time);

			// Extract the month name using Intl.DateTimeFormat in GMT
			const month = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'GMT' }).format(date);

			// Push the formatted object to the result array
			result.push({
				Month: month,
				Amount: item.value.toFixed(2) // Format the amount to 2 decimal places
			});
		});

		// Return the processed array
		return result;
	}

	const monthMap = {
		January: 0,
		February: 1,
		March: 2,
		April: 3,
		May: 4,
		June: 5,
		July: 6,
		August: 7,
		September: 8,
		October: 9,
		November: 10,
		December: 11
	};


	function reverseProcessBudgetDataToGMT(data) {
		// Array to store the processed results
		const result = [];
		
		// Iterate through the input array
		data.forEach(item => {
			// Current year for timestamp calculation (adjust as needed)
			const year = item.Year; // Example year for conversion
			
			// Get the month number from the monthMap
			const monthNumber = monthMap[item.Month];

			// Create a timestamp in GMT for the first day of the month
			const timestamp = Date.UTC(year, monthNumber, 1); // GMT timestamp

			// Push the formatted object to the result array
			let rec = {
				time: timestamp,
				value: parseFloat(item.Amount) // Convert the amount back to a number
			}
			result.push(rec);
		});

		// Return the processed array
		return result;
	}
	
	function handleError(err) {
		if (err.body) {
			error = err.body.error;
			console.error('Error:', JSON.stringify(err.body));
		} else {
			error = err.message;
			console.error('Error:', err.message);
		}

		toast.show(error, 'error');
	}

	function handleErrorMessage(message){
		error = message;
		toast.show(error, 'error');
	}

	function stripEmptyRows(budget){
		let cleanBudget = [];
		//attempt to remove any rows
		budget.forEach((item) => {
			if (item.Month && item.Amount) {
				cleanBudget.push(item);
			}
		});

		return cleanBudget;
	}

	function validateNewBudget(budget){
		let validate = {};
		validate.result = true
		

		//we should have 12 months
		if(budget.length != 12){
			validate.error = "Must upload all 12 Months only, " + budget.length + " records found in file.\n";
			//validate.error += "Here are the last 2 lines of the file:\n'" + JSON.stringify(budget.slice(-2), null, 2) + "'";v
			validate.result = false;
		}else{
			for (const item of budget) {
				const { Month, Amount } = item;

				// Validate that the amount is greater than 0
				if (parseFloat(Amount) <= 0) {
					validate.error = `Invalid amount for ${Month}: ${Amount} ~ Amount must be greater than 0`;
					validate.result = false;
					break;
				}

				if (!(Month in monthMap)) {
					validate.error = `Invalid month: \'${Month}\' `;
					validate.result = false;
					break;
				}
				newBudgetTotal += parseFloat(Amount);
			}
		}
		return validate
	}


	async function handleFileUpload(event) {
		try {
			console.log('handleFileUpload ...');
			error = null;
			newBudget = [];
			let budgetName = null
			const file = event.detail.file;
			if (file) {
				const reader = new FileReader();
				fileName = file.name;
				
				reader.onload = (event) => {
					const result = Papa.parse(event.target.result, { header: true });
					newBudget = result.data;
					newBudget = stripEmptyRows(newBudget); // Remove any empty rows
					try {
						if(!budgetName){
							budgetName = newBudget[0].Budget; // use first row's budget name
						}
					} catch (e) {
						handleErrorMessage('Could not extract budget name from CSV');
						return;
					}
					if (budgetName){
						let budgetExists = false
						budgets.forEach((budget) => {
							if (budget.name === budgetName) {
								//validate file
								let valid = validateNewBudget(newBudget)
								if(valid.result){
									selected = budget;
									console.log('Selected Budget: \n' + JSON.stringify(selected,null,2));
									selected.displayMonths = processBudgetDataToGMT(selected.budgetMonthlyBreakdown.budgetMonthlyAmount)

								}else{
									handleErrorMessage('validation error :\n'+valid.error);
								}
								budgetExists = true;
							}
						});
						if(!budgetExists){
							handleErrorMessage('Budget '+budgetName+' Not Found!');
							return;
						}
						if(selected){
							toast.show('CSV file successfully processed', 'success');
						}
					}else{
						handleErrorMessage('Budget '+budgetName+' Not Found!');
					}
				};
				reader.readAsText(file);
			}
		} catch (err) {
			handleError(err);
		} finally {
			//isProcessing = false;
		}
	}
	const labelTextColor = 'text-gray-500';
	const valueTextColor = 'text-gray-300';
	const dottedBorderColor = 'border-2 border-dotted border-gray-700';

	function reset() {
		selected = null;
		record = {};
		newBudget = {};
		csvData = null;
		fileName = null;
		error = null;
	}

	function upload() {
		
		toast.show('Uploading budget ...', 'info');
		let monthlyAmounts = reverseProcessBudgetDataToGMT(newBudget);
		const payload = {
			monthlyAmounts: monthlyAmounts,
			oldbudget: selected
		};
		
		fetch('/api/v1/budgets', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		})
			.then(async (response) => {
				const body = await response.json();
				if (!response.ok) {
					// Attach response to error for later access
					throw new Error(body?.message || 'Upload failed');
				}
				return body;
			})
			.then(async (data) => {
				await reloadProps();
			})
			.catch((error) => {
				handleErrorMessage(error.message)
			});
	}

	import { onMount } from 'svelte';

	onMount(async () => {
		try {
			const res = await fetch('/api/v1/budgets');
			if (res.ok) {
				const resp = await res.json();
				budgets = resp.data;
				data = budgets;
			} else {
				toast.show('Failed to load budgets', 'error');
			}
		} catch (err) {
			handleError(err);
		}
	});

	let headers = ['Budget', 'Year', 'Month', 'Amount'];

</script>

<Toasts />
<div class="space-y-4">
	<div
	class="card from-primary-900/50 to-primary-800/30 border-primary-700/50 my-4 bg-gradient-to-br"
>
	<FileUploader on:file={handleFileUpload} />
</div>
	{#if error}
		<div class="card variant-filled {dottedBorderColor} p-4 md:col-span-3">
			<section class="p-4 text-center">
				<div class={`text-2xl font-bold ${valueTextColor}`}>
					<span>
						<p class="text-red-500">{error}!</p>
					</span>
				</div>
			</section>
		</div>
	{/if}
	<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
		
		<div class="card variant-filled flex-grow {dottedBorderColor} p-4 md:col-span-3">
			<section class="flex flex-row items-start justify-between gap-x-8 p-4">
				Budget : {selected?.name || ''}
			</section>
		</div>


		<div class="card variant-filled flex-grow {dottedBorderColor} p-4 md:col-span-3">
			<section class="flex flex-row items-start justify-between gap-x-8 p-4">
				<p class="flex flex-1 flex-col">
					<span class={`text-xs ${labelTextColor}`}>Budget Period:</span>
					<span class={`text-base ${valueTextColor}`}>{selected?.period || ''}</span>
				</p>
				<p class="flex flex-1 flex-col">
					<span class={`text-xs ${labelTextColor}`}>Budget Type:</span>
					<span class={`text-base ${valueTextColor}`}>{selected?.type || ''}</span>
				</p>
				<p class="flex flex-1 flex-col">
					<span class={`text-xs ${labelTextColor}`}>Perspective:</span>
					<span class={`text-base ${valueTextColor}`}>{selected?.scope.viewName || ''}</span>
				</p>
			</section>
		</div>

		<div id="current_budget" class="card variant-filled {dottedBorderColor} p-4">
			<section class="p-4 text-center">
				<div class={`text-4xl font-bold ${valueTextColor}`}>
					${selected?.budgetAmount?.toLocaleString() || '0'}
				</div>
				<span class={`text-xs ${labelTextColor}`}>Budget Amount</span>
			</section>
		</div>

		<div class="card variant-filled {dottedBorderColor} p-4">
			<section class="p-4 text-center">
				<div class={`text-4xl font-bold ${valueTextColor}`}>
					${selected?.actualCost?.toLocaleString() || '0'}
				</div>
				<span class={`text-xs ${labelTextColor}`}>Actual Spend</span>
			</section>
		</div>

		<div class="card variant-filled {dottedBorderColor} p-4">
			<section class="p-4 text-center">
				<div class={`text-4xl font-bold ${valueTextColor}`}>
					${selected?.forecastCost?.toLocaleString() || '0'}
				</div>
				<span class={`text-xs ${labelTextColor}`}>Forecasted Spend</span>
			</section>
		</div>
	</div>

	{#if showDebug}
		<pre class="bg-surface-700 rounded-container-token p-4 whitespace-pre-wrap">
      {JSON.stringify(selected, null, 2)}
    </pre>
	{/if}
</div>

<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
	{#if newBudget.length > 0 && selected }
		<div class="card variant-filled {dottedBorderColor} p-4 md:col-span-3">
			<section class="p-4 text-center">
				{#if error}
					<p class={`text-xs ${labelTextColor}`}>{error}</p>
				{:else}
				<button
					class="rounded bg-blue-600 px-4 py-2 font-bold text-white transition-colors duration-150 hover:bg-blue-700"
					onclick={upload}
					type="button"
				>
					Upload Budget Updates
				</button>
				{/if}
			</section>
		</div>
		<div id="new_budget" class="card variant-filled {dottedBorderColor} p-4 md:col-span-1">
			<section class="p-4 text-center">
				<table class="min-w-full">
					<thead>
						<tr>
							<th class="px-4 py-2 text-gray-500">Month</th>
							<th class="px-4 py-2 text-gray-500">Amount</th>
						</tr>
					</thead>
					<tbody>
						{#each selected.displayMonths as row}
							<tr>
								<td class="border px-4 py-2 text-gray-500">{row.Month}</td>
								<td class="border px-4 py-2 text-gray-500">{row.Amount}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</section>
		</div>
		<div id="new_budget" class="card variant-filled {dottedBorderColor} p-4 md:col-span-2">
			<section class="p-4 text-center">
				<table class="min-w-full">
					<thead>
						<tr>
							{#each headers as header}
								<th class="px-4 py-2 text-gray-200">{header}</th> <!-- Dimmed header text -->
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each newBudget as row}
							<tr>
								<td class="border border-gray-300 px-4 py-2 text-gray-300">{row.Budget}</td> <!-- Dimmed row text -->
								<td class="border border-gray-300 px-4 py-2 text-gray-300">{row.Year}</td> <!-- Dimmed row text -->
								<td class="border border-gray-300 px-4 py-2 text-gray-300">{row.Month}</td> <!-- Dimmed row text -->
								<td class="border border-gray-300 px-4 py-2 text-gray-300">{row.Amount}</td> <!-- Dimmed row text -->
							</tr>
						{/each}
						<tr class="font-bold">
							<td class="border border-gray-300 px-4 py-2 text-gray-300"></td>
							<td class="border border-gray-300 px-4 py-2 text-gray-300"></td>
							<td class="border border-gray-300 px-4 py-2 text-gray-300">Total</td>
							<td class="border px-4 py-2 text-gray-300">
								${newBudgetTotal|| '0'}
							</td>
						</tr>
					</tbody>
				</table>
			</section>
		</div>
	{/if}
</div>

<style>
	pre {
		background: #f4f4f4;
		padding: 1em;
		border-radius: 5px;
		max-height: 400px;
		overflow: auto;
	}

	:global(form[data-svelte-search]) {
		background: transparent !important;
		padding: 0 !important;
		border-radius: 0.5rem !important;
		width: 100%;
	}

	:global(form[data-svelte-search] label) {
		color: #9ca3af !important; /* Tailwind gray-400 */
		font-size: 0.75rem !important;
		margin-bottom: 0.25rem !important;
		display: block;
	}

	:global(form[data-svelte-search] input[type='search']) {
		background: transparent !important;
		color: #f3f4f6 !important; /* Tailwind gray-100 */
		border: none !important;
		outline: none !important;
		width: 100%;
		font-size: 1rem;
		padding: 0.5rem 0;
	}

	/* Style the outer Typeahead container */
	:global(div[data-svelte-typeahead]) {
		background: transparent !important;
		border: none !important;
		box-shadow: none !important;
		width: 100%;
	}

	/* Dropdown list styling for dark mode */
	:global(.typeahead__list),
	:global(.svelte-typeahead-list),
	:global(ul[role='listbox']) {
		background: #1f2937 !important; /* Tailwind gray-800 */
		color: #f3f4f6 !important;
		border-radius: 0.5rem !important;
		border: 1px dotted #4b5563 !important; /* Tailwind gray-600 */
		margin-top: 0.5rem;
		box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.15);
		padding: 0.25rem 0;
	}

	/* Dropdown item styling */
	:global(.typeahead__item),
	:global(.svelte-typeahead-list li) {
		color: #f3f4f6 !important;
		padding: 0.5rem 1rem;
		cursor: pointer;
		background: transparent !important;
	}

	/* Highlighted/active dropdown item */
	:global(.typeahead__item.active),
	:global(.svelte-typeahead-list li.active) {
		background: #374151 !important; /* Tailwind gray-700 */
		color: #fff !important;
	}

	.animate-match {
		animation: match-highlight 1.2s ease;
		box-shadow:
			0 0 0 4px #2563eb55,
			0 0 12px #2563eb88;
		border-color: #2563eb !important; /* Tailwind blue-600 */
	}

	@keyframes match-highlight {
		0% {
			box-shadow:
				0 0 0 8px #2563eb88,
				0 0 24px #2563ebcc;
			border-color: #2563eb;
		}
		80% {
			box-shadow:
				0 0 0 2px #2563eb33,
				0 0 6px #2563eb44;
			border-color: #2563eb;
		}
		100% {
			box-shadow: none;
			border-color: inherit;
		}
	}
</style>
