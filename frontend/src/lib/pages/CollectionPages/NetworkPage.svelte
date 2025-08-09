<script lang="ts">
	import { networks } from '$lib/components/Collection/collections';
	import { usePaginatedRequest } from '$lib/stores/data.store';
	import { tmdbApi } from '$lib/stores/user.store';
	import { capitalize } from '$lib/utils';
	import CollectionPage from './CollectionPage.svelte';

	export let network: string;

	const networkId = networks[network]?.id;
	const networkName = networks[network]?.name ?? capitalize(network);

	const { interactionObserver, data } = usePaginatedRequest(async (page) => {
		const res = await tmdbApi.v3
			.discoverTv({
				with_networks: networkId,
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

<CollectionPage items={$data} title={networkName} subtitle="Network">
	<div class="-translate-y-80" slot="footer" use:interactionObserver />
</CollectionPage>
