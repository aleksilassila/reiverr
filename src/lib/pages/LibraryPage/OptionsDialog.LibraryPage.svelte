<script lang="ts">
	import Dialog from '$lib/components/Dialog/Dialog.svelte';
	import SelectButtonGroup from '$lib/components/SelectButtonGroup.svelte';
	import Toggle from '$lib/components/Toggle.svelte';
	import { libraryViewSettings, type MyListOrder, type MyListOrderDirection } from './LibraryPage';

	const sortByOptions: { label: string; value: MyListOrder }[] = [
		{ label: 'Last Release Date', value: 'last-release-date' },
		{ label: 'First Release Date', value: 'first-release-date' },
		{ label: 'Date Added', value: 'date-added' },
		{ label: 'Title', value: 'name' }
	];

	const sortByDirectionOptions = [
		{ label: 'Ascending', value: 'asc' },
		{ label: 'Descending', value: 'desc' }
	];

	function updateOrder(order: string) {
		libraryViewSettings.update((settings) => ({ ...settings, order: order as MyListOrder }));
	}

	function updateSortByDirection(direction: string) {
		libraryViewSettings.update((settings) => ({
			...settings,
			direction: direction as MyListOrderDirection
		}));
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
		selected={$libraryViewSettings.order}
		on:select={({ detail: order }) => updateOrder(order)}
	/>

	<SelectButtonGroup
		name="Direction"
		options={sortByDirectionOptions}
		selected={$libraryViewSettings.direction}
		on:select={({ detail: direction }) => updateSortByDirection(direction)}
	/>

	<div class="space-y-2 font-medium">
		<Toggle
			label="Separate watched"
			checked={$libraryViewSettings.separateWatched}
			on:change={({ detail: separateWatched }) =>
				libraryViewSettings.update((settings) => ({
					...settings,
					separateWatched: !separateWatched
				}))}
		/>
	</div>
</Dialog>
