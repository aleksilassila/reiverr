<script lang="ts">
	import { companies } from '$lib/components/Collection/collections';
	import { usePaginatedData } from '$lib/stores/data/data.store';
	import { tmdbApi } from '$lib/stores/user.store';
	import { capitalize } from '$lib/utils';
	import CollectionPage from './CollectionPage.svelte';

	export let company: string;

	const tmdbCompanyId = companies[company]?.id;
	const companyName = companies[company]?.name ?? capitalize(company);

	const { observer, ...items } = usePaginatedData((page) =>
		tmdbCompanyId
			? tmdbApi.v3
					.discoverMovie({
						with_companies: String(tmdbCompanyId),
						page
					})
					.then((r) => r.data.results ?? [])
			: Promise.resolve([])
	);
</script>

<CollectionPage items={$items} title={companyName} subtitle="Production Company">
	<div class="-translate-y-80" slot="footer" use:observer />
</CollectionPage>
