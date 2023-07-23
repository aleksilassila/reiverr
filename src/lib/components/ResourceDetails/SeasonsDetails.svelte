<script lang="ts">
	import { getJellyfinEpisodes } from '$lib/apis/jellyfin/jellyfinApi';
	import { getTmdbSeriesSeasons } from '$lib/apis/tmdb/tmdbApi';
	import classNames from 'classnames';
	import { Check, StarFilled } from 'radix-icons-svelte';
	import { onMount, type ComponentProps } from 'svelte';
	import CardPlaceholder from '../Card/CardPlaceholder.svelte';
	import Carousel from '../Carousel/Carousel.svelte';
	import UiCarousel from '../Carousel/UICarousel.svelte';
	import EpisodeCard from '../EpisodeCard/EpisodeCard.svelte';
	import { playerState } from '../VideoPlayer/VideoPlayer';

	export let tmdbId: number;
	export let totalSeasons: number;
	export let jellyfinId: string | undefined = undefined;

	export let nextEpisodeCardProps: ComponentProps<EpisodeCard> | undefined = undefined;

	let visibleSeason = 1;

	async function fetchSeriesData() {
		const tmdbSeasonsPromise = getTmdbSeriesSeasons(tmdbId, totalSeasons);
		const jellyfinEpisodesPromise = jellyfinId ? getJellyfinEpisodes(jellyfinId) : undefined;

		const tmdbSeasons = await tmdbSeasonsPromise;
		const jellyfinEpisodes = await jellyfinEpisodesPromise;

		jellyfinEpisodes?.sort((a, b) => (a.IndexNumber || 99) - (b.IndexNumber || 99));
		const nextJellyfinEpisode = jellyfinEpisodes?.find((e) => e?.UserData?.Played === false);
		const nextEpisode = {
			jellyfinEpisode: nextJellyfinEpisode,
			tmdbEpisode: nextJellyfinEpisode
				? tmdbSeasons
						.flatMap((s) => s?.episodes)
						.find(
							(e) =>
								e?.episode_number === nextJellyfinEpisode.IndexNumber &&
								e?.season_number === nextJellyfinEpisode.ParentIndexNumber
						)
				: undefined
		};
		visibleSeason = nextEpisode.tmdbEpisode?.season_number || visibleSeason;

		const tmdbEpisode = nextEpisode.tmdbEpisode;
		nextEpisodeCardProps = tmdbEpisode
			? {
					title: tmdbEpisode.name || '',
					subtitle: 'Next Episode',
					backdropPath: tmdbEpisode.still_path || '',
					runtime: tmdbEpisode.runtime || 0,
					progress: nextEpisode?.jellyfinEpisode?.UserData?.PlayedPercentage || 0,
					episodeNumber: `S${tmdbEpisode.season_number}E${tmdbEpisode.episode_number}`,
					handlePlay: nextEpisode?.jellyfinEpisode?.Id
						? () => playerState.streamJellyfinId(nextEpisode?.jellyfinEpisode?.Id || '')
						: undefined
			  }
			: undefined;

		return {
			tmdbSeasons,
			jellyfinEpisodes,
			nextJellyfinEpisode,
			nextEpisode,
			nextEpisodeCardProps
		};
	}

	const seriesPromise = fetchSeriesData();

	onMount(() => {
		seriesPromise.then(({ nextEpisode }) => {
			if (nextEpisode) {
				const episodeCard = document.getElementById(
					'episode-card-' + nextEpisode?.tmdbEpisode?.episode_number
				);
				if (episodeCard) {
					const parent = episodeCard.offsetParent;
					if (parent) {
						parent.scrollLeft =
							episodeCard.offsetLeft - document.body.clientWidth / 2 + episodeCard.clientWidth / 2;
					}
				}
			}
		});
	});
</script>

<div class="py-4">
	{#await seriesPromise}
		<Carousel>
			<div slot="title" class="flex gap-4 my-1">
				{#each [...Array(3).keys()] as season}
					<div class={'rounded-full p-2 px-6 font-medium placeholder text-transparent'}>
						Season 1
					</div>
				{/each}
			</div>

			{#each Array(10) as _, i (i)}
				<div class="aspect-video h-40 lg:h-48">
					<CardPlaceholder size="dynamic" />
				</div>
			{/each}
		</Carousel>
	{:then { tmdbSeasons, jellyfinEpisodes }}
		<div class="flex flex-col gap-4">
			<div>
				<Carousel>
					<UiCarousel slot="title" class="flex gap-4 my-1">
						{#each tmdbSeasons as season}
							<button
								class={classNames('rounded-full p-2 px-6 font-medium whitespace-nowrap ', {
									'text-amber-200 bg-darken shadow-lg':
										visibleSeason === (season?.season_number || 1),
									'text-zinc-300 hover:bg-lighten hover:text-amber-100':
										visibleSeason !== (season?.season_number || 1)
								})}
								on:click={() => (visibleSeason = season?.season_number || 1)}
								>Season {season?.season_number}</button
							>
						{/each}
					</UiCarousel>
					{#each tmdbSeasons as season}
						{#if season?.season_number === visibleSeason}
							{#each season?.episodes || [] as tmdbEpisode}
								{@const upcoming =
									new Date(tmdbEpisode.air_date || Date.now()) > new Date() ||
									tmdbEpisode.runtime === null}
								{@const jellyfinEpisode = jellyfinEpisodes?.find(
									(e) =>
										e.IndexNumber === tmdbEpisode.episode_number &&
										e.ParentIndexNumber === season?.season_number
								)}
								<div
									class="flex-shrink-0 h-40 lg:h-48"
									id={'episode-card-' + tmdbEpisode.episode_number}
								>
									<EpisodeCard
										backdropPath={tmdbEpisode.still_path || ''}
										title={tmdbEpisode.name || ''}
										subtitle={upcoming ? 'Upcoming' : 'Episode ' + tmdbEpisode.episode_number}
										runtime={tmdbEpisode.runtime || 0}
										size="dynamic"
										progress={jellyfinEpisode?.UserData?.PlayedPercentage || 0}
										handlePlay={jellyfinEpisode?.Id
											? () => playerState.streamJellyfinId(jellyfinEpisode?.Id || '')
											: undefined}
									>
										<div slot="left-info" class="flex gap-1 items-center">
											{#if upcoming}
												{@const date = new Date(tmdbEpisode.air_date || Date.now())}
												{`${date.getDay()}. ${date.toLocaleDateString('en', { month: 'short' })}`}
											{:else}
												{tmdbEpisode.vote_average?.toFixed(1)}
												<StarFilled size={14} />
											{/if}
										</div>
										<div slot="right-info">
											{#if jellyfinEpisode?.UserData?.Played}
												<div class="flex gap-1 text-amber-200 items-center">
													<Check size={20} /> Watched
												</div>
											{:else if jellyfinEpisode?.UserData?.PlayedPercentage}
												{@const runtime = tmdbEpisode.runtime || 0}
												{(
													runtime -
													runtime * (jellyfinEpisode?.UserData?.PlayedPercentage / 100)
												).toFixed(0)} min left
											{:else}
												{tmdbEpisode.runtime} min
											{/if}
										</div>
									</EpisodeCard>
								</div>
							{/each}
						{/if}
					{/each}
				</Carousel>
			</div>
		</div>
	{/await}
</div>
