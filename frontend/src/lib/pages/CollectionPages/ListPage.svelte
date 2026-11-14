<script lang="ts">
	import { collections } from '$lib/components/Collection/collections';
	import { loadMore, usePageInfiniteQuery } from '$lib/queries/page-query';
	import { tmdbQueries } from '$lib/queries/tmdb.queries';
	import { capitalize } from '$lib/utils';
	import CollectionPage from './CollectionPage.svelte';

	interface Props {
		collection: string;
	}

	let { collection }: Props = $props();

	const listId = collection.match(/^\d+$/) ? parseInt(collection) : collections[collection]?.id;
	const collectionName = collections[collection]?.name ?? capitalize(collection);

	const items = usePageInfiniteQuery(() => tmdbQueries.list(listId));
</script>

<CollectionPage
	items={items.data ?? []}
	loading={items.isLoading}
	title={collectionName}
	subtitle="Collection"
>
	{#snippet footer()}
		<div class="-translate-y-80" {@attach loadMore(items)}></div>
	{/snippet}
</CollectionPage>
