<script lang="ts">
	import { getTmdbGenreMovies } from '$lib/apis/tmdb/tmdbApi';
	import Card from '$lib/components/Card/Card.svelte';
	import CardPlaceholder from '$lib/components/Card/CardPlaceholder.svelte';
	import { fetchCardTmdbProps } from '$lib/components/Card/card';
	import GridPage from '$lib/components/GridPage/GridPage.svelte';
	import { genres, type Genre } from '$lib/discover';
	import type { PageData } from './$types';

	export let data: PageData;

	const genre = genres[data.genre];

	async function fetchGenreItems(genre: Genre) {
		const movies = await getTmdbGenreMovies(genre.tmdbGenreId);

		const itemProps = await Promise.all(movies.map(fetchCardTmdbProps));

		return {
			movies,
			itemProps
		};
	}
</script>

<GridPage title={data.genre}>
	{#if genre}
		{#await fetchGenreItems(genre)}
			{#each [...Array(20).keys()] as index (index)}
				<CardPlaceholder size="dynamic" {index} />
			{/each}
		{:then { itemProps }}
			{#each itemProps as itemProps}
				<Card {...itemProps} size="dynamic" />
			{/each}
		{:catch error}
			{error.message}
		{/await}
	{:else}
		404
	{/if}
</GridPage>

<!-- <div class="pt-24 p-8 bg-black">
	<button on:click={() => window?.history?.back()}>Back</button>
	{data.genre}
</div>

<div class="p-8">
	{#if genre}
		{#await fetchGenreItems(genre)}
			<CardGrid>
				{#each [...Array(20).keys()] as index (index)}
					<CardPlaceholder size="dynamic" {index} />
				{/each}
			</CardGrid>
		{:then { itemProps }}
			<CardGrid>
				{#each itemProps as itemProps}
					<Card {...itemProps} size="dynamic" />
				{/each}
			</CardGrid>
		{:catch error}
			{error.message}
		{/await}
	{:else}
		404
	{/if}
</div> -->
