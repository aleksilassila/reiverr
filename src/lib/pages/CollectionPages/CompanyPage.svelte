<script lang="ts">
	import { companies } from '$lib/components/Collection/collections';
	import type { StackRouterPageProps } from '$lib/components/StackRouter/StackRouterPage.type';
	import { tmdbApi } from '$lib/stores/user.store';
	import { capitalize } from '$lib/utils';
	import CollectionPage from './CollectionPage.svelte';

	export let company: string;
	export let registrar: StackRouterPageProps['registrar'];
	export let handleGoBack: StackRouterPageProps['handleGoBack'];

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

<CollectionPage {registrar} {handleGoBack} {items} title={companyName} subtitle="Production Company" />
