<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import type { ContainerProps } from '$lib/components/Container.type';
	import Container from '$components/Container.svelte';
	import { scrollIntoView } from '$lib/selectable';
	import type { EpisodeUserData } from './episode-status';
	import { getScrollContext } from '$lib/stores/scroll.store';
	import classNames from 'classnames';
	import type { Readable } from 'svelte/store';
	import {
		type TmdbEpisode,
		type TmdbSeason,
		type TmdbSeasonEpisode,
		type TmdbSeriesFull
	} from '../../apis/tmdb/tmdb-api';
	import CardGrid from '../../components/CardGrid.svelte';
	import Scrollable from '../../components/Carousel/Scrollable.svelte';
	import TmdbEpisodeCard from '../../components/EpisodeCard/TmdbEpisodeCard.svelte';
	import { navigate } from '../../components/StackRouter/stack-router.store';
	import { Selectable } from '../../selectable';

	const { topVisible } = getScrollContext();

	// export let jellyfinEpisodes: Promise<JellyfinItem[]>;
	// export let currentJellyfinEpisode: Promise<JellyfinItem | undefined>;

	interface Props {
		onEnter?: ContainerProps['onEnter'];
		onMounted?: ComponentProps<typeof CardGrid>['onMounted'];
		tmdbId: number;
		tmdbSeries: Promise<TmdbSeriesFull | undefined>;
		nextEpisode: Readable<EpisodeUserData>;
		episodesUserData: EpisodeUserData[];
		// export let handleRequestSeason: (season: number) => Promise<any>;
		tmdbSeasons: Promise<TmdbSeason[]>;
	}

	let {
		tmdbId,
		tmdbSeries,
		nextEpisode,
		episodesUserData,
		tmdbSeasons,
		onEnter,
		onMounted
	}: Props = $props();

	let seasonIndex = $state(0);

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
	{onEnter}
	class={classNames('transition-transform mx-32', {
		'-translate-y-16': $topVisible
	})}
>
	{#await Promise.all([tmdbSeries, tmdbSeasons]) then [tmdbSeries, tmdbSeasons]}
		<Scrollable
			class={classNames('flex transition-opacity mb-8', {
				'opacity-0': $topVisible
			})}
			onEnter={scrollIntoView({ horizontal: 64 })}
		>
			{#each tmdbSeasons || [] as season, i}
				<Container
					onMounted={(e) => handleMountSeasonButton(e, season?.season_number || 0)}
					onEnter={(event) => {
						scrollIntoView({ horizontal: 64 })(event);
						seasonIndex = i;
					}}
					focusOnClick
				>
					{#snippet children({ hasFocus })}
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
					{/snippet}
				</Container>
			{/each}
		</Scrollable>
		<CardGrid orientation="landscape" {onMounted}>
			{#each tmdbSeasons?.[seasonIndex]?.episodes || [] as episode}
				{@const userData = episodesUserData.find(
					(e) => e.season === episode.season_number && e.episode === episode.episode_number
				)}
				{#key episode.id}
					<TmdbEpisodeCard
						{episode}
						series={tmdbSeries}
						onMounted={(e) => handleMountCard(e, episode)}
						onEnter={scrollIntoView({ top: 92, bottom: 128 })}
						isWatched={userData?.watched || false}
						progress={userData?.progress}
						onClickOrSelect={() => handleOpenEpisodePage(episode)}
					/>
				{/key}
			{/each}
		</CardGrid>
	{/await}
</Container>
