<script lang="ts">
	import type { TitleId } from '$lib/types';
	import type { PageData } from './$types';
	import SeriesPage from './SeriesPage.svelte';

	export let data: PageData;

	let titleId: TitleId;
	$: titleId = { provider: 'tmdb', id: data.tmdbId, type: 'series' };
</script>

{#key titleId}
	<SeriesPage {titleId} />
{/key}
