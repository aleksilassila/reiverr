<script lang="ts">
	import { MagnifyingGlass, TextAlignBottom, Trash } from 'radix-icons-svelte';
	import Card from '../components/Card/Card.svelte';
	import CardPlaceholder from '../components/Card/CardPlaceholder.svelte';
	import IconButton from '../components/IconButton.svelte';
	import RadarrStats from '../components/SourceStats/RadarrStats.svelte';
	import SonarrStats from '../components/SourceStats/SonarrStats.svelte';
	import type { PageData } from './$types';
	export let data: PageData;
	const watched = [];

	const posterGridStyle =
		'grid gap-x-4 gap-y-8 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6';
	const headerStyle = 'uppercase tracking-widest font-bold mt-2';
</script>

<div class="pt-24 pb-8 px-8 bg-black">
	<div class="max-w-screen-2xl mx-auto">
		<div class="grid grid-cols-1 lg:grid-cols-2 items-center justify-center gap-4">
			<RadarrStats />
			<SonarrStats />
		</div>
	</div>
</div>

<div class="py-4 px-8">
	<div class="max-w-screen-2xl m-auto backdrop-blur-2xl flex flex-col gap-4">
		<!--	Contains all the titles available locally, the ones already watched previously (greyed out at the-->
		<!--	bottom), and the ones that are in some sort of watchlist and not available via any source.-->

		<div class="flex justify-between gap-2 sm:flex-row flex-col">
			<div
				class="flex gap-2 items-center bg-stone-950 rounded-2xl p-3 px-4 shadow-xl focus-within:outline outline-2 outline-stone-400"
			>
				<MagnifyingGlass size={24} class="text-zinc-200" />
				<input
					type="text"
					class="bg-transparent outline-none text-zinc-300"
					placeholder="Search from library"
				/>
			</div>
			<div class="flex items-center gap-2 bg-stone-950 rounded-2xl p-3 px-5 shadow-lg">
				<IconButton>
					<TextAlignBottom size={20} />
				</IconButton>
				<IconButton>
					<Trash size={20} />
				</IconButton>
			</div>
		</div>

		<!-- <div class="flex justify-between">
			<div class="flex gap-2 items-center">
				<MagnifyingGlass size={28} class="text-zinc-400" />
				<input
					type="text"
					class="bg-transparent outline-none font-light text-zinc-200 border-b border-b-zinc-400 text-sm"
				/>
			</div>
			<div class="flex items-center gap-2 bg-stone-950 rounded-full p-3 px-5 shadow-lg">
				<IconButton>
					<TextAlignBottom size={20} />
				</IconButton>
				<IconButton>
					<Trash size={20} />
				</IconButton>
			</div>
		</div> -->
		{#await Promise.all( [data.streamed.available, data.streamed.unavailable, data.streamed.downloading] )}
			<div class={posterGridStyle}>
				{#each [...Array(20).keys()] as index (index)}
					<CardPlaceholder type="dynamic" {index} />
				{/each}
			</div>
		{:then [available, unavailable, downloading]}
			{#if downloading.length > 0}
				<h1 class={headerStyle}>Downloading</h1>
				<div class={posterGridStyle}>
					{#each downloading as movie (movie)}
						<Card
							type="dynamic"
							{...movie}
							progress={movie.progress}
							progressType="downloading"
							available={false}
						/>
					{/each}
				</div>
			{/if}

			{#if available.length > 0}
				<h1 class={headerStyle}>Available</h1>
				<div class={posterGridStyle}>
					{#each available as movie (movie.tmdbId)}
						<Card type="dynamic" {...movie} randomProgress={false} />
					{/each}
				</div>
			{/if}

			{#if unavailable.length > 0}
				<h1 class={headerStyle}>Unavailable</h1>
				<div class={posterGridStyle}>
					{#each unavailable as movie (movie.tmdbId)}
						<Card type="dynamic" {...movie} available={false} />
					{/each}
				</div>
			{/if}

			{#if watched.length > 0}
				<h1 class={headerStyle}>Watched</h1>
			{/if}
		{/await}
	</div>
</div>
