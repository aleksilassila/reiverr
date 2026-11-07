<script lang="ts">
	import { companies } from '$lib/components/Collection/collections';
	import { usePageInfiniteQuery } from '$lib/queries/page-query';
	import { tmdbQueries } from '$lib/queries/tmdb.queries';
	import { capitalize } from '$lib/utils';
	import CollectionPage from './CollectionPage.svelte';

	interface Props {
		company: string;
	}

	let { company }: Props = $props();

	const tmdbCompanyId = companies[company]?.id;
	const companyName = companies[company]?.name ?? capitalize(company);

	const items = usePageInfiniteQuery(tmdbQueries.companyMovies(tmdbCompanyId));
	const { loadMore } = items;
</script>

<CollectionPage
	items={$items.data ?? []}
	loading={$items.isLoading}
	title={companyName}
	subtitle="Production Company"
>
	{#snippet footer()}
		<div class="-translate-y-80" use:loadMore></div>
	{/snippet}
</CollectionPage>
