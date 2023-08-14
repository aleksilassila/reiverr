<script lang="ts">
	import type { LibraryItemStore } from '$lib/stores/library.store';
	import type { TitleType } from '$lib/types';
	import ContextMenuButton from '../ContextMenu/ContextMenuButton.svelte';
	import LibraryItemContextItems from '../ContextMenu/LibraryItemContextItems.svelte';

	export let title = '';
	export let itemStore: LibraryItemStore;
	export let type: TitleType;
	export let tmdbId: number;
</script>

<ContextMenuButton heading={$itemStore.loading ? 'Loading...' : title}>
	<svelte:fragment slot="menu">
		<LibraryItemContextItems {itemStore} {type} {tmdbId} />
	</svelte:fragment>
</ContextMenuButton>
