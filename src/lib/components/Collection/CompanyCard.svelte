<script lang="ts">
	import { TMDB_IMAGES_ORIGINAL } from '$lib/constants';
	import { tmdbApi } from '$lib/stores/user.store';
	import classNames from 'classnames';
	import Card from '../Card/Card.svelte';
	import { navigate } from '../StackRouter/StackRouter';
	import type { Company } from './collections';

	export let company: Company;

	let backdropUrl: string | undefined;
	$: tmdbApi.v3.companyDetails(company.id).then((r) => {
		backdropUrl = r.data.logo_path ? `${TMDB_IMAGES_ORIGINAL}${r.data.logo_path}` : undefined;
	});
</script>

<Card
	orientation="landscape"
	class="bg-primary-800"
	on:clickOrSelect={() => navigate(`/company/${company.route}`)}
	title={company.name}
	on:enter
>
	{#if backdropUrl}
		<div
			class={classNames('absolute inset-10 transition-colors m-6')}
			style={`background-image: url('${backdropUrl}'); filter: grayscale(1) invert(1); background-size: contain; background-position: center; background-repeat: no-repeat;`}
		/>
	{:else}
		<h1 class="text-center flex-1 h2 bg-primary-800 flex items-center justify-center">
			{company.name}
		</h1>
	{/if}
</Card>
