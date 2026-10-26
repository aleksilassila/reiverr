<script lang="ts">
	import { companies } from '$lib/components/Collection/collections';
	import { usePageInfiniteQuery } from '$lib/queries/page-query';
	import { tmdbQueries } from '$lib/queries/tmdb.queries';
	import { capitalize } from '$lib/utils';
	import CollectionPage from './CollectionPage.svelte';

	export let company: string;

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
	<div class="-translate-y-80" slot="footer" use:loadMore />
</CollectionPage>
