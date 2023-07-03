<script lang="ts">
	import type { PageData } from './$types';
	import Card from '../components/Card/Card.svelte';
	import { TMDB_IMAGES } from '$lib/constants.js';
	import CardPlaceholder from '../components/Card/CardPlaceholder.svelte';
	export let data: PageData;
	const watched = [];

	const posterGridStyle = 'flex flex-wrap justify-center gap-x-4 gap-y-8';
	const headerStyle = 'uppercase tracking-widest font-bold text-center mt-2';
</script>

<div
	style={"background-image: url('" + TMDB_IMAGES + "/vvjYv7bSWerbsi0LsMjLnTVOX7c.jpg')"}
	class="transition-all"
>
	<div class="py-24 backdrop-blur-2xl bg-darken px-8 flex flex-col gap-4">
		<!--	Contains all the titles available locally, the ones already watched previously (greyed out at the-->
		<!--	bottom), and the ones that are in some sort of watchlist and not available via any source.-->

		<!--	<div>Library</div>-->

		{#await Promise.all( [data.streamed.available, data.streamed.unavailable, data.streamed.downloading] )}
			<div class={posterGridStyle}>
				{#each [...Array(20).keys()] as index (index)}
					<CardPlaceholder {index} />
				{/each}
			</div>
		{:then [available, unavailable, downloading]}
			{#if downloading.length > 0}
				<h1 class={headerStyle}>Downloading</h1>
				<div class={posterGridStyle}>
					{#each downloading as movie (movie.tmdbId)}
						<Card
							{...movie}
							progress={movie.progress}
							progressType="downloading"
							available={false}
							type="download"
						/>
					{/each}
				</div>
			{/if}

			{#if available.length > 0}
				<h1 class={headerStyle}>Available</h1>
				<div class={posterGridStyle}>
					{#each available as movie (movie.tmdbId)}
						<Card {...movie} randomProgress={false} />
					{/each}
				</div>
			{/if}

			{#if unavailable.length > 0}
				<h1 class={headerStyle}>Unavailable</h1>
				<div class={posterGridStyle}>
					{#each unavailable as movie (movie.tmdbId)}
						<Card {...movie} available={false} />
					{/each}
				</div>
			{/if}

			{#if watched.length > 0}
				<h1 class={headerStyle}>Watched</h1>
			{/if}
		{/await}
	</div>
</div>
