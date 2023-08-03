<script lang="ts">
	import { getTmdbSeries, getTmdbSeriesSeasons, type TmdbSeason } from '$lib/apis/tmdb/tmdbApi';
	import Button from '$lib/components/Button.svelte';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '$lib/components/Carousel/CarouselPlaceholderItems.svelte';
	import EpisodeCard from '$lib/components/EpisodeCard/EpisodeCard.svelte';
	import { TMDB_IMAGES_ORIGINAL, TMDB_POSTER_SMALL } from '$lib/constants';
	import { library } from '$lib/stores/library.store';
	import classNames from 'classnames';
	import { ChevronRight, DotFilled } from 'radix-icons-svelte';
	import type { ComponentProps } from 'svelte';
	import { fade } from 'svelte/transition';
	import type { PageData } from './$types';

	export let data: PageData;

	let visibleSeason = 1;

	let selectedEpisode;
	let episodeProps: ComponentProps<EpisodeCard>[][] = [];

	let tmdbSeriesPromise = (() => {
		const tmdbId = Number(data.tmdbId);
		const series = getTmdbSeries(tmdbId);
		const seasons = series.then((s) => getTmdbSeriesSeasons(tmdbId, s?.number_of_seasons || 0));

		return {
			series,
			seasons
		};
	})();

	tmdbSeriesPromise.seasons.then((seasons) => {
		seasons.forEach((season) => {
			const episodes: ComponentProps<EpisodeCard>[] = [];
			season?.episodes?.forEach((episode) => {
				episodes.push({
					title: episode?.name || '',
					backdropPath: episode?.still_path || '',
					subtitle: `S${episode?.season_number}E${episode?.episode_number}`,
					runtime: episode?.runtime || 0
				});
			});
			episodeProps[season?.season_number || 0] = episodes;
		});
	});

	async function updateEpisodeProps(tmdbSeasons: TmdbSeason[]) {
		const libraryItem = await $library.then((l) => l.items[Number(data.tmdbId)]);
	}

	tmdbSeriesPromise.seasons.then((seasons) => updateEpisodeProps(seasons));
</script>

<div class="fixed inset-0 bg-black -z-20" />

{#await tmdbSeriesPromise.series then series}
	<div class="flex flex-col max-h-screen bg-black">
		<div
			transition:fade
			style={"background-image: url('" + TMDB_IMAGES_ORIGINAL + series?.backdrop_path + "')"}
			class="flex-shrink relative flex pt-24 aspect-video min-h-[50vh] p-8 bg-center bg-cover w-screen"
		>
			<div class="absolute inset-0 bg-gradient-to-t from-black to-50% to-darken" />
			<div class="z-[1] flex-1 flex justify-end gap-8 items-end">
				<div
					class="aspect-[2/3] w-52 bg-center bg-cover rounded-md hidden sm:block"
					style={"background-image: url('" + TMDB_POSTER_SMALL + series?.poster_path + "')"}
				/>
				<div class="flex-1 flex gap-4 justify-between flex-col lg:flex-row lg:items-end">
					<div>
						<div class="text-zinc-300 text-sm uppercase font-medium flex items-center gap-1">
							<p class="">2014</p>
							<DotFilled />
							<p>{series?.genres?.map((g) => g.name).join(', ')}</p>
							<DotFilled />
							<p>{series?.vote_average?.toFixed(1)} TMDB</p>
						</div>
						<h1 class="text-6xl font-semibold">{series?.name}</h1>
					</div>
					<div class="flex-shrink-0">
						<Button type="primary"><span>Add to Sonarr</span><ChevronRight size={20} /></Button>
					</div>
				</div>
			</div>
		</div>
		<div>
			<Carousel gradientFromColor="from-black">
				<div slot="title" class="flex gap-6">
					{#each series?.seasons || [] as season, i}
						{@const isSelected = season?.season_number === visibleSeason}
						<button
							class={classNames('text-lg font-medium', {
								'text-zinc-200 cursor-default': isSelected,
								'text-zinc-500 hover:text-zinc-200 cursor-pointer': !isSelected
							})}
							on:click={() => (visibleSeason = season?.season_number || 1)}
						>
							Season {season?.season_number}
						</button>
					{/each}
				</div>
				{#each episodeProps[visibleSeason] || [] as props}
					<EpisodeCard {...props} />
				{:else}
					<CarouselPlaceholderItems />
				{/each}
			</Carousel>
		</div>
	</div>

	<div class="flex gap-4 p-8 flex-col md:flex-row">
		<div class="flex-1">
			<div class="flex flex-col gap-3 max-w-5xl">
				<h1 class="font-semibold text-2xl">{series?.tagline || series?.name}</h1>
				<p class="pl-4 border-l-2">{series?.overview}</p>
			</div>
		</div>
		<div class="flex-1 grid grid-cols-3">
			<div>
				<p class="text-zinc-400 text-sm">Directed By</p>
				<h2 class="font-medium">{series?.created_by?.map((c) => c.name).join(', ')}</h2>
			</div>
		</div>
	</div>
	<div class="flex items-center justify-between p-8">
		<div>
			<h1 class="font-medium text-lg">No sources found</h1>
			<p class="text-sm text-zinc-400">Check your source settings</p>
		</div>
		<Button type="primary" size="sm">Add to Sonarr</Button>
	</div>
	<Carousel gradientFromColor="from-black">
		<div slot="title" class="font-medium">Cast & Crew</div>
		<CarouselPlaceholderItems />
	</Carousel>
	<Carousel gradientFromColor="from-black">
		<div slot="title" class="font-medium">Recommended</div>
		<CarouselPlaceholderItems />
	</Carousel>
	<Carousel gradientFromColor="from-black">
		<div slot="title" class="font-medium">Similar Titles</div>
		<CarouselPlaceholderItems />
	</Carousel>
{/await}
