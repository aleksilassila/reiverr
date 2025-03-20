<script lang="ts">
	import { collections } from '$lib/components/Collection/collections';
	import type { StackRouterPageProps } from '$lib/components/StackRouter/StackRouterPage.type';
	import { tmdbApi } from '$lib/stores/user.store';
	import { capitalize } from '$lib/utils';
	import CollectionPage from './CollectionPage.svelte';

	export let collection: string;
	export let registrar: StackRouterPageProps['registrar'];
	export let handleGoBack: StackRouterPageProps['handleGoBack'];

	const listId = collection.match(/^\d+$/) ? parseInt(collection) : collections[collection]?.id;
	console.log('listId', listId);
	const collectionName = collections[collection]?.name ?? capitalize(collection);

	const items = listId
		? tmdbApi.v3.listDetails(listId).then((r) => r.data.items ?? [])
		: Promise.resolve([]);
</script>

<CollectionPage {registrar} {handleGoBack} {items} title={collectionName} subtitle="Collection" />
