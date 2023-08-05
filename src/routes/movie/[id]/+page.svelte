<script lang="ts">
	import type { PageData } from './$types';
	import MoviePage from './MoviePage.svelte';

	export let data: PageData;

	let tmdbId: number;
	$: tmdbId = Number(data.tmdbId);
</script>

{#key tmdbId}
	<MoviePage {tmdbId} />
{/key}
