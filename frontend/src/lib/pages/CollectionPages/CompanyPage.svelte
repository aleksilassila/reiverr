<script lang="ts">
	import { companies } from '$lib/components/Collection/collections';
	import { usePaginatedRequest } from '$lib/stores/data.store';
	import { tmdbApi } from '$lib/stores/user.store';
	import { capitalize } from '$lib/utils';
	import CollectionPage from './CollectionPage.svelte';

	export let company: string;

	const tmdbCompanyId = companies[company]?.id;
	const companyName = companies[company]?.name ?? capitalize(company);

	const { interactionObserver, data } = usePaginatedRequest(async (page) => {
		if (!tmdbCompanyId) return { page: 1, items: [], total: 0, itemsPerPage: 20 };

		const res = await tmdbApi.v3
			.discoverMovie({
				with_companies: String(tmdbCompanyId),
				page
			})
			.then((r) => r.data);

		return {
			page: res.page ?? 1,
			items: res.results ?? [],
			total: res.total_results ?? 0,
			itemsPerPage: 20
		};
	});
</script>

<CollectionPage items={$data} title={companyName} subtitle="Production Company">
	<div class="-translate-y-80" slot="footer" use:interactionObserver />
</CollectionPage>
