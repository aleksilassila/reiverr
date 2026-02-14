<script lang="ts">
	import { collections } from '$lib/components/Collection/collections';
	import { usePaginatedData } from '$lib/stores/data/data.store';
	import { tmdbApi } from '$lib/stores/user.store';
	import { capitalize } from '$lib/utils';
	import CollectionPage from './CollectionPage.svelte';

	export let collection: string;

	const listId = collection.match(/^\d+$/) ? parseInt(collection) : collections[collection]?.id;
	const collectionName = collections[collection]?.name ?? capitalize(collection);

	const { observer, ...items } = usePaginatedData((page) =>
		listId
			? tmdbApi.v3.listDetails(listId, { page }).then((r) => r.data.items ?? [])
			: Promise.resolve([])
	);
</script>

<CollectionPage items={$items} title={collectionName} subtitle="Collection">
	<div class="-translate-y-80" slot="footer" use:observer />
</CollectionPage>
