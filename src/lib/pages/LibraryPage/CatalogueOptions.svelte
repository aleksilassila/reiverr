<script lang="ts">
	import type { CatalogueSortOptionDto, MediaSourceDto } from '$lib/apis/reiverr/reiverr.openapi';
	import Dialog from '$lib/components/Dialog/Dialog.svelte';
	import SelectButtonGroup from '$lib/components/SelectButtonGroup.svelte';
	import type { Writable } from 'svelte/store';

	export let source: MediaSourceDto;
	export let viewSettings: Writable<{
		order: string | undefined;
		direction: string | undefined;
	}>;

	$: sortOptions = source.capabilities.sortOptions;
	$: selectedSortOption = $viewSettings.order;
	$: selectedSortDirection = $viewSettings.direction;

	// export let sortOptions: CatalogueSortOptionDto[];
	// export let selectedSortOption: string | undefined = undefined;
	// export let selectedSortDirection: string | undefined = undefined;
	// export let onSelectSort: (order: string) => void = () => {};
	// export let onSelectDirection: (direction: string) => void = () => {};

	$: directionOptions = sortOptions.find((o) => o.value === selectedSortOption)?.directions ?? [];

	// function updateOrder(order: string) {
	// 	libraryViewSettings.update((settings) => ({ ...settings, order: order as MyListOrder }));
	// }

	// function updateSortByDirection(direction: string) {
	// 	libraryViewSettings.update((settings) => ({
	// 		...settings,
	// 		direction: direction as MyListOrderDirection
	// 	}));
	// }

	function handleSelectSort(order: string) {
		viewSettings.update((settings) => ({ ...settings, order }));
	}

	function handleSelectDirection(direction: string) {
		viewSettings.update((settings) => ({ ...settings, direction }));
	}
</script>

<Dialog let:close on:close class="space-y-4">
	<h1 class="h3 mb-4 flex items-center space-x-4">
		<span>View Options</span>
	</h1>

	{#if sortOptions.length}
		<SelectButtonGroup
			name="Sort by"
			options={sortOptions}
			selected={selectedSortOption}
			on:select={({ detail: order }) => handleSelectSort(order)}
		/>
	{/if}

	{#if directionOptions.length > 0}
		<SelectButtonGroup
			name="Direction"
			options={directionOptions}
			selected={selectedSortDirection}
			on:select={({ detail: direction }) => handleSelectDirection(direction)}
		/>
	{/if}

	{#if !directionOptions.length && !sortOptions.length}
		<p class="body">This catalogue doesn't have any view options.</p>
	{/if}

	<!-- <div class="space-y-2 font-medium">
		<Toggle
			label="Separate watched"
			checked={$libraryViewSettings.separateWatched}
			on:change={({ detail: separateWatched }) =>
				libraryViewSettings.update((settings) => ({
					...settings,
					separateWatched: !separateWatched
				}))}
		/>
	</div> -->
</Dialog>
