<script lang="ts">
	import { page } from '$app/state';
	import { Switch } from '@skeletonlabs/skeleton-svelte';
	// Icons
	import IconMoon from '@lucide/svelte/icons/moon';
	import IconSun from '@lucide/svelte/icons/sun';

	import { Navigation } from '@skeletonlabs/skeleton-svelte';
	import IconBox from '@lucide/svelte/icons/box';
	import IconHouse from '@lucide/svelte/icons/house';
	import IconUpload from '@lucide/svelte/icons/upload';
	import IconSettings from '@lucide/svelte/icons/settings';

	const mode = 'dark'; // Default mode, can be overridden by localStorage

	</script>


<header>
	<div id="navbar">
		  <div class="card preset-filled-surface-100-900 grid grid-cols-3 gap-5 p-5">
			<!-- By default tiles are <button> elements -->
			<Navigation.Tile label="Budget Lookup" href="/lookup">
			  <IconSettings />
			</Navigation.Tile>
			<Navigation.Tile label="Upload Budget" href="/upload">
				<IconSettings />
			</Navigation.Tile>
			<Navigation.Tile label="Bulk Upload Budget" href="/bulk">
				<IconUpload />
			</Navigation.Tile>
		  </div>
	</div>
	<div id="right_corner">
		<div id="logo">
			<img loading="eager" alt="harness logo" src="https://cdn.prod.website-files.com/6222ca42ea87e1bd1aa1d10c/65aada95970b01f49948895a_harness_logo_white.svg"/>
		</div>
	</div>
</header>

<style>
	header {
		display: flex;
		justify-content: space-between;
		background-color: rgb(36, 34, 34);
	}

	#right_corner {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 15px; /* Optional: adds margin on sides */
	}

	#logo {
		padding-right: 10px; /* Optional: adds space between logo and switch */
	}

</style>
