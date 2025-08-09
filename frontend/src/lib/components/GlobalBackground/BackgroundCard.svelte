<script lang="ts">
	import Card from '$lib/components/Card/Card.svelte';
	import { TMDB_BACKDROP_SMALL } from '$lib/constants';

	export let backdropUri: string;
</script>

<Card
	{...$$restProps}
	backdropUrl={TMDB_BACKDROP_SMALL + backdropUri}
	orientation="landscape"
	size="sm"
	on:click
	on:clickOrSelect
	on:enter
/>
