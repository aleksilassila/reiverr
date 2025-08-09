<script lang="ts">
	import { collections } from '$lib/components/Collection/collections';
	import { usePaginatedRequest } from '$lib/stores/data.store';
	import { tmdbApi } from '$lib/stores/user.store';
	import { capitalize } from '$lib/utils';
	import CollectionPage from './CollectionPage.svelte';

	export let collection: string;

	const listId = collection.match(/^\d+$/) ? parseInt(collection) : collections[collection]?.id;
	const collectionName = collections[collection]?.name ?? capitalize(collection);

	const { interactionObserver, data } = usePaginatedRequest(async (page) => {
		if (!listId) return { page: 1, items: [], total: 0, itemsPerPage: 20 };

		const res = await tmdbApi.v3.listDetails(listId, { page }).then((r) => r.data);

		return {
			page,
			items: res.items ?? [],
			total: res.item_count ?? 0,
			itemsPerPage: 20
		};
	});
</script>

<CollectionPage items={$data} title={collectionName} subtitle="Collection">
	<div class="-translate-y-80" slot="footer" use:interactionObserver />
</CollectionPage>
