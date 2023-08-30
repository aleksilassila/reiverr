<script lang="ts">
	import type { PageData } from './$types';
	import SeriesPage from './SeriesPage.svelte';

	export let data: PageData;

	let tmdbId: number;
	$: tmdbId = Number(data.tmdbId);
</script>

{#key tmdbId}
	<SeriesPage {tmdbId} />
{/key}
