<script lang="ts">
	import { getTmdbSeries, getTmdbSeriesSeasons, type TmdbSeason } from '$lib/apis/tmdb/tmdbApi';
	import Button from '$lib/components/Button.svelte';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '$lib/components/Carousel/CarouselPlaceholderItems.svelte';
	import EpisodeCard from '$lib/components/EpisodeCard/EpisodeCard.svelte';
	import { TMDB_IMAGES_ORIGINAL, TMDB_POSTER_SMALL } from '$lib/constants';
	import { createLibraryItemStore, library } from '$lib/stores/library.store';
	import classNames from 'classnames';
	import { ChevronRight, DotFilled } from 'radix-icons-svelte';
	import type { ComponentProps } from 'svelte';
	import { fade } from 'svelte/transition';
	import type { PageData } from './$types';
	import { playerState } from '$lib/components/VideoPlayer/VideoPlayer';
	import { capitalize } from '$lib/utils';

	export let data: PageData;
	let tmdbId = Number(data.tmdbId);

	const itemStore = createLibraryItemStore(tmdbId);

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

	itemStore.subscribe(async (libraryItem) => {
		const tmdbSeasons = await tmdbSeriesPromise.seasons;

		tmdbSeasons.forEach((season) => {
			const episodes: ComponentProps<EpisodeCard>[] = [];
			season?.episodes?.forEach((tmdbEpisode) => {
				const jellyfinEpisode = libraryItem.item?.jellyfinEpisodes?.find(
					(e) =>
						e?.IndexNumber === tmdbEpisode?.episode_number &&
						e?.ParentIndexNumber === tmdbEpisode?.season_number
				);

				episodes.push({
					title: tmdbEpisode?.name || '',
					subtitle: `Episode ${tmdbEpisode?.episode_number}`,
					backdropPath: tmdbEpisode?.still_path || '',
					progress: jellyfinEpisode?.UserData?.PlayedPercentage || 0,
					handlePlay: jellyfinEpisode?.Id
						? () => playerState.streamJellyfinId(jellyfinEpisode?.Id || '')
						: undefined
				});
			});
			episodeProps[season?.season_number || 0] = episodes;
		});
	});
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
						<div class="text-zinc-300 text-sm uppercase font-semibold flex items-center gap-1">
							<p>{new Date(series?.first_air_date || Date.now()).getFullYear()}</p>
							<DotFilled />
							<p>{series?.status}</p>
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
					{#each [...Array(series?.number_of_seasons || 0).keys()].map((i) => i + 1) as seasonNumber}
						{@const season = series?.seasons?.find((s) => s.season_number === seasonNumber)}
						{@const isSelected = season?.season_number === visibleSeason}
						<button
							class={classNames('text-lg font-semibold tracking-wide', {
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
					<div class="flex flex-col gap-3">
						<EpisodeCard {...props} />
						<!-- <EpisodeCard backdropPath={props.backdropPath} />
						<div class="flex items-end justify-between">
							<div>
								<div class="text-zinc-400 text-xs font-medium">{props.episodeNumber}</div>
								<h1 class="font-medium text-lg line-clamp-1">{props.title}</h1>
							</div>
							<div class="flex-shrink-0 text-zinc-300 font-medium">{props.runtime} min</div>
						</div> -->
					</div>
				{:else}
					<CarouselPlaceholderItems />
				{/each}
			</Carousel>
		</div>
	</div>

	<div class="flex gap-8 p-8 flex-col xl:flex-row">
		<div class="flex-1">
			<div class="flex flex-col gap-3 max-w-5xl">
				<h1 class="font-semibold text-2xl">{series?.tagline || series?.name}</h1>
				<p class="pl-4 border-l-2">{series?.overview}</p>
			</div>
		</div>
		<div class="flex-1 grid grid-cols-3 gap-4">
			<div>
				<p class="text-zinc-400 text-sm">Created By</p>
				<h2 class="font-medium">{series?.created_by?.map((c) => c.name).join(', ')}</h2>
			</div>
			{#if series?.first_air_date}
				<div>
					<p class="text-zinc-400 text-sm">First Air Date</p>
					<h2 class="font-medium">
						{new Date(series?.first_air_date).toLocaleDateString('en', {
							year: 'numeric',
							month: 'short',
							day: 'numeric'
						})}
					</h2>
				</div>
			{/if}
			{#if series?.next_episode_to_air}
				<div>
					<p class="text-zinc-400 text-sm">Next Air Date</p>
					<h2 class="font-medium">
						{new Date(series.next_episode_to_air?.air_date).toLocaleDateString('en', {
							year: 'numeric',
							month: 'short',
							day: 'numeric'
						})}
					</h2>
				</div>
			{:else if series?.last_air_date}
				<div>
					<p class="text-zinc-400 text-sm">Last Air Date</p>
					<h2 class="font-medium">
						{new Date(series.last_air_date).toLocaleDateString('en', {
							year: 'numeric',
							month: 'short',
							day: 'numeric'
						})}
					</h2>
				</div>
			{/if}
			<div>
				<p class="text-zinc-400 text-sm">Networks</p>
				<h2 class="font-medium">{series?.networks?.map((n) => n.name).join(', ')}</h2>
			</div>
			<div>
				<p class="text-zinc-400 text-sm">Episode Run Time</p>
				<h2 class="font-medium">{series?.episode_run_time} Minutes</h2>
			</div>
			<div>
				<p class="text-zinc-400 text-sm">Spoken Languages</p>
				<h2 class="font-medium">
					{series?.spoken_languages?.map((l) => capitalize(l.name || '')).join(', ')}
				</h2>
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
