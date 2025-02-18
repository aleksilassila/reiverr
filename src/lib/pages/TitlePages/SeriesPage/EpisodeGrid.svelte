<script lang="ts">
	import Container from '$components/Container.svelte';
	import type { EpisodeData } from '$lib/stores/media-user-data.store';
	import classNames from 'classnames';
	import type { Readable } from 'svelte/store';
	import {
		tmdbApi,
		type TmdbEpisode,
		type TmdbSeasonEpisode,
		type TmdbSeriesFull2
	} from '../../../apis/tmdb/tmdb-api';
	import CardGrid from '../../../components/CardGrid.svelte';
	import UICarousel from '../../../components/Carousel/UICarousel.svelte';
	import TmdbEpisodeCard from '../../../components/EpisodeCard/TmdbEpisodeCard.svelte';
	import { navigate } from '../../../components/StackRouter/StackRouter';
	import { scrollIntoView, Selectable } from '../../../selectable';
	import { getScrollContext, setScrollContext } from '$lib/stores/scroll.store';

	const { topVisible } = getScrollContext();

	export let tmdbId: number;
	export let tmdbSeries: Promise<TmdbSeriesFull2 | undefined>;
	export let nextEpisode: Readable<EpisodeData>;
	export let episodesUserData: EpisodeData[];
	// export let jellyfinEpisodes: Promise<JellyfinItem[]>;
	// export let currentJellyfinEpisode: Promise<JellyfinItem | undefined>;
	// export let handleRequestSeason: (season: number) => Promise<any>;
	export let tmdbSeasons = tmdbSeries.then((series) =>
		tmdbApi.getTmdbSeriesSeasons(tmdbId, series?.seasons?.length ?? 1)
	);

	let seasonIndex = 0;

	function handleOpenEpisodePage(episode: TmdbSeasonEpisode) {
		navigate(`/series/${tmdbId}/season/${episode.season_number}/episode/${episode.episode_number}`);
	}

	function handleMountSeasonButton(s: Selectable, seasonNumber: number) {
		nextEpisode.subscribe((episode) => {
			if (episode?.season === seasonNumber) {
				seasonIndex = seasonNumber - 1;
				s.focus({ setFocusedElement: false, propagate: false });
			}
		});
	}

	function handleMountCard(s: Selectable, episode: TmdbEpisode) {
		// currentJellyfinEpisode.then((currentEpisode) => {
		// 	if (
		// 		currentEpisode?.IndexNumber === episode.episode_number &&
		// 		currentEpisode?.ParentIndexNumber === episode.season_number
		// 	) {
		// 		s.focus({ setFocusedElement: false, propagate: false });
		// 	}
		// });
	}
</script>

<Container
	on:enter
	class={classNames('transition-transform mx-32', {
		'-translate-y-16': $topVisible
	})}
>
	{#await Promise.all([tmdbSeries, tmdbSeasons]) then [tmdbSeries, tmdbSeasons]}
		<UICarousel
			class={classNames('flex transition-opacity mb-8', {
				'opacity-0': $topVisible
			})}
			on:enter={scrollIntoView({ horizontal: 64 })}
		>
			{#each tmdbSeasons || [] as season, i}
				<Container
					on:mount={(e) => handleMountSeasonButton(e.detail, season?.season_number || 0)}
					let:hasFocus
					on:enter={(event) => {
						scrollIntoView({ horizontal: 64 })(event);
						seasonIndex = i;
					}}
					focusOnClick
				>
					<div
						class={classNames(
							'font-semibold text-2xl',
							'px-3 py-1 cursor-pointer whitespace-nowrap rounded-lg',
							'hover:text-white',
							{
								'bg-primary-500 text-black': hasFocus,
								//'bg-stone-800/50': hasFocus,
								'text-zinc-400': !(seasonIndex === i),
								'text-white': seasonIndex === i && !hasFocus
							}
						)}
					>
						Season {season.season_number}
					</div>
				</Container>
			{/each}
		</UICarousel>
		<CardGrid type="landscape" on:mount>
			{#each tmdbSeasons?.[seasonIndex]?.episodes || [] as episode}
				{@const userData = episodesUserData.find(
					(e) => e.season === episode.season_number && e.episode === episode.episode_number
				)}
				{#key episode.id}
					<TmdbEpisodeCard
						{episode}
						series={tmdbSeries}
						on:mount={(e) => handleMountCard(e.detail, episode)}
						on:enter={scrollIntoView({ top: 92, bottom: 128 })}
						isWatched={userData?.watched || false}
						progress={userData?.progress}
						on:clickOrSelect={() => handleOpenEpisodePage(episode)}
					/>
				{/key}
			{/each}
			<!-- <ManageSeasonCard
				backdropUrl={TMDB_BACKDROP_SMALL + tmdbSeries?.backdrop_path}
				on:clickOrSelect={() => handleRequestSeason(seasonIndex + 1)}
				on:enter={scrollIntoView({ top: 92, bottom: 128 })}
			/> -->
		</CardGrid>
	{/await}
</Container>
