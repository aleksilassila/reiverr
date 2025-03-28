<script lang="ts">
	import { collections } from '$lib/components/Collection/collections';
	import { tmdbApi } from '$lib/stores/user.store';
	import { capitalize } from '$lib/utils';
	import CollectionPage from './CollectionPage.svelte';

	export let collection: string;
	
	const listId = collection.match(/^\d+$/) ? parseInt(collection) : collections[collection]?.id;
	const collectionName = collections[collection]?.name ?? capitalize(collection);

	const items = listId
		? tmdbApi.v3.listDetails(listId).then((r) => r.data.items ?? [])
		: Promise.resolve([]);
</script>

<CollectionPage {items} title={collectionName} subtitle="Collection" />
