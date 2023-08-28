<script lang="ts">
	import type { PageData } from './$types';
	import SeriesPage from './SeriesPage.svelte';

	export let data: PageData;

	let tmdbId: number;
	$: tmdbId = Number(data.tmdbId);
	let name: string;
	$: name = data.name || '';
</script>

{#key tmdbId}
	<SeriesPage {tmdbId} title={name} />
{/key}
