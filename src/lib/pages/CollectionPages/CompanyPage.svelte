<script lang="ts">
	import { companies } from '$lib/components/Collection/collections';
	import { tmdbApi } from '$lib/stores/user.store';
	import { capitalize } from '$lib/utils';
	import CollectionPage from './CollectionPage.svelte';

	export let company: string;

	const tmdbCompanyId = companies[company]?.id;
	const companyName = companies[company]?.name ?? capitalize(company);

	const items = tmdbCompanyId
		? tmdbApi.v3
				.discoverMovie({
					with_companies: String(tmdbCompanyId)
				})
				.then((r) => r.data.results ?? [])
		: Promise.resolve([]);
</script>

<CollectionPage {items} title={companyName} subtitle="Production Company" />
