<script lang="ts">
	import type { PageData } from './$types';
	import Card from '../components/Card/Card.svelte';
	import { TMDB_IMAGES } from '$lib/constants.js';
	import CardPlaceholder from '../components/Card/CardPlaceholder.svelte';
	import { formatSize } from '$lib/utils.js';
	export let data: PageData;
	const watched = [];

	const posterGridStyle = 'flex flex-wrap justify-center gap-x-4 gap-y-8';
	const headerStyle = 'uppercase tracking-widest font-bold text-center mt-2';
</script>

<div class="bg-black pt-24 pb-8 px-8">
	<div class="grid grid-cols-1 lg:grid-cols-2 items-center justify-center gap-4">
		<div class="bg-highlight-dim relative w-full m-auto p-3 px-4 rounded-xl overflow-hidden">
			<div class="absolute left-0 inset-y-0 w-[70%] bg-[#ffffff22]" />
			<div class="relative z-[1] flex justify-between items-center">
				<div class="flex flex-col">
					<h3 class="text-zinc-400 font-medium text-xs tracking-wider">Mac-Mini</h3>
					<a href="/" class="text-zinc-200 font-bold text-xl tracking-wide">Radarr</a>
				</div>
				<div class="flex gap-8">
					<div class="flex flex-col items-center gap-0.5">
						<h3 class="uppercase text-zinc-400 font-medium text-xs tracking-wider">Movies</h3>
						<div class="font-medium text-sm">30</div>
					</div>
					<div class="flex flex-col items-center gap-0.5">
						<h3 class="uppercase text-zinc-400 font-medium text-xs tracking-wider">Space Taken</h3>
						<div class="font-medium text-sm">{formatSize(120_000_000_000)}</div>
					</div>
					<div class="flex flex-col items-center gap-0.5">
						<h3 class="uppercase text-zinc-400 font-medium text-xs tracking-wider">Space Left</h3>
						<div class="font-medium text-sm">{formatSize(50_000_000_000)}</div>
					</div>
				</div>
			</div>
		</div>
		<div class="bg-highlight-dim relative w-full m-auto p-3 px-4 rounded-xl overflow-hidden">
			<div class="absolute left-0 inset-y-0 w-[70%] bg-[#ffffff22]" />
			<div class="relative z-[1] flex justify-between items-center">
				<div class="flex flex-col">
					<h3 class="text-zinc-400 font-medium text-xs tracking-wider">Mac-Mini</h3>
					<a href="/" class="text-zinc-200 font-bold text-xl tracking-wide">Sonarr</a>
				</div>
				<div class="flex gap-8">
					<div class="flex flex-col items-center gap-0.5">
						<h3 class="uppercase text-zinc-400 font-medium text-xs tracking-wider">Movies</h3>
						<div class="font-medium text-sm">30</div>
					</div>
					<div class="flex flex-col items-center gap-0.5">
						<h3 class="uppercase text-zinc-400 font-medium text-xs tracking-wider">Space Taken</h3>
						<div class="font-medium text-sm">{formatSize(120_000_000_000)}</div>
					</div>
					<div class="flex flex-col items-center gap-0.5">
						<h3 class="uppercase text-zinc-400 font-medium text-xs tracking-wider">Space Left</h3>
						<div class="font-medium text-sm">{formatSize(50_000_000_000)}</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<div>
	<div class="py-8 backdrop-blur-2xl bg-darken px-8 flex flex-col gap-4">
		<!--	Contains all the titles available locally, the ones already watched previously (greyed out at the-->
		<!--	bottom), and the ones that are in some sort of watchlist and not available via any source.-->

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
