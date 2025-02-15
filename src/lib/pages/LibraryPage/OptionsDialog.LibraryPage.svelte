<script lang="ts">
	import Dialog from '$lib/components/Dialog/Dialog.svelte';
	import SelectButtonGroup from '$lib/components/SelectButtonGroup.svelte';
	import Toggle from '$lib/components/Toggle.svelte';
	import { libraryViewSettings } from '$lib/stores/localstorage.store';

	const sortByOptions = [
		{ label: 'Last Release Date', value: 'last-release-date' },
		{ label: 'First Release Date', value: 'first-release-date' },
		{ label: 'Date Added', value: 'date-added' },
		{ label: 'Title', value: 'title' }
	];

	const sortByDirectionOptions = [
		{ label: 'Ascending', value: 'asc' },
		{ label: 'Descending', value: 'desc' }
	];

	function updateSortBy(sortBy: string) {
		libraryViewSettings.update((settings) => ({ ...settings, sortBy: sortBy as any }));
	}

	function updateSortByDirection(direction: string) {
		libraryViewSettings.update((settings) => ({ ...settings, sortDirection: direction as any }));
	}
</script>

<Dialog let:close on:close class="space-y-4">
	<h1 class="h3 mb-4 flex items-center space-x-4">
		<span>View Options</span>
		<!-- <MixerHorizontal size={28} /> -->
	</h1>

	<SelectButtonGroup
		name="Sort by"
		options={sortByOptions}
		selected={$libraryViewSettings.sortBy}
		on:select={({ detail: sortBy }) => updateSortBy(sortBy)}
	/>

	<SelectButtonGroup
		name="Direction"
		options={sortByDirectionOptions}
		selected={$libraryViewSettings.sortDirection}
		on:select={({ detail: direction }) => updateSortByDirection(direction)}
	/>

	<div class="space-y-2 font-medium">
		<Toggle
			label="Include upcoming"
			checked={!$libraryViewSettings.separateUpcoming}
			on:change={({ detail: separateUpcoming }) =>
				libraryViewSettings.update((settings) => ({
					...settings,
					separateUpcoming: !separateUpcoming
				}))}
		/>

		<Toggle
			label="Include watched"
			checked={!$libraryViewSettings.separateWatched}
			on:change={({ detail: separateWatched }) =>
				libraryViewSettings.update((settings) => ({
					...settings,
					separateWatched: !separateWatched
				}))}
		/>
	</div>
</Dialog>
