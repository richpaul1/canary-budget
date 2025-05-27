<script>
	import Typeahead from 'svelte-typeahead';
	import FileUploader from '$components/FileUploader.svelte';
	import { toast } from '$lib/toastStore';
	import Toasts from '$components/Toasts.svelte';
	import Papa from 'papaparse';

	let showDebug = false;
	let props = $props();
	let budgets = $state([]);
	let data = $state([]);
	data = budgets;

	const extract = (item) => item.name;
	let e = $state(null);
	let selected = $state(null);
	let record = $state({});
	let newBudget = $state({});

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
				console.log('Budget:', budget.name + ' ' + budget.budgetAmount);
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

	// Handle select event to store full budget object
	function handleSelect(event) {
		reset();

		e = event.detail.original;
		budgets.forEach((budget) => {
			if (budget.uuid === e.uuid) {
				selected = budget;
			}
		});

		console.log('selected record :\n ' + JSON.stringify(selected, null, 2));
	}

	let results = null;
	let error = $state(null);
	let csvData = $state(null);
	let fileName = $state(null);

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

	async function handleFileUpload(event) {
		try {
			console.log('handleFileUpload ...');
			error = null;
			results = null;
			newBudget = {};

			const file = event.detail.file;
			if (file) {
				const reader = new FileReader();
				fileName = file.name;

				reader.onload = (event) => {
					// You can process the file content here
					console.log('File contents:', event.target.result);
					const result = Papa.parse(event.target.result, { header: true });
					newBudget = result.data[0];
					console.log('Parsed CSV data:');
					console.log(JSON.stringify(newBudget)); // This is your JSON array
				};
				reader.readAsText(file);
			}
			toast.show('CSV file successfully processed', 'success');
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
		//isProcessing = false;
		results = null;
	}

	function upload() {
		console.log('uploading new budget ...');
		toast.show('Uploading budget', 'info');
		const payload = {
			budget: newBudget,
			oldbudget: selected
		};
		console.log('payload : ' + JSON.stringify(payload));
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
					const error = new Error(body?.message || 'Upload failed');
					error.response = response;
					error.body = body;
					throw error;
				}
				return body;
			})
			.then(async (data) => {
				console.log('Success:', data);

				await reloadProps();
			})
			.catch((error) => {
				// You can now access error.response and error.body here
				handleError({
					message: error.message,
					response: error.response,
					body: error.body
				});
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

</script>

<Toasts />
<div class="space-y-4">
	<div class="card variant-filled border-0 p-4">
		<Typeahead
			class="border-none bg-transparent text-gray-100 focus:ring-0"
			label="Select Budget"
			showAllResultsOnFocus
			{data}
			{extract}
			on:select={handleSelect}
			on:clear={reset}
		/>
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
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
<div
	class="card from-primary-900/50 to-primary-800/30 border-primary-700/50 my-4 bg-gradient-to-br"
>
	<FileUploader on:file={handleFileUpload} />
</div>

<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
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
	{#if newBudget.Amount}
		<div class="card variant-filled {dottedBorderColor} p-4 md:col-span-3">
			<section class="p-4 text-center">
				<div class={`text-2xl font-bold ${valueTextColor}`}>
					<span>
						{newBudget ? `${fileName} - successfully processed!` : 'No CSV file uploaded'}
					</span>
				</div>
				{#if error}
					<p class={`text-xs ${labelTextColor}`}>{error}</p>
				{/if}
			</section>
		</div>
		<div id="new_budget" class="card variant-filled {dottedBorderColor} p-4 md:col-span-1">
			<section class="p-4 text-center">
				<div class={`text-4xl font-bold ${valueTextColor}`}>
					${newBudget?.Amount?.toLocaleString() || '0'}
				</div>
				<span class={`text-xs ${labelTextColor}`}>New Budget</span>
			</section>
		</div>
		<div class="card variant-filled p-4 md:col-span-1">
			<section class="p-4 text-center">
				<button
					class="rounded bg-blue-600 px-4 py-2 font-bold text-white transition-colors duration-150 hover:bg-blue-700"
					onclick={upload}
					type="button"
				>
					Upload New Budget
				</button>
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
