<script lang="ts">
	import type { ContainerProps } from '$lib/components/Container.type';
	import Container from '$components/Container.svelte';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import { scrollElementIntoView } from '$lib/scroll-into-view';
	import { scrollIntoView } from '$lib/selectable';
	import type { EpisodeUserData } from './episode-status';
	import { getScrollContext } from '$lib/stores/scroll.store';
	import classNames from 'classnames';
	import { onDestroy, type ComponentProps } from 'svelte';
	import type { Readable, Writable } from 'svelte/store';
	import {
		type TmdbEpisode,
		type TmdbSeason,
		type TmdbSeasonEpisode,
		type TmdbSeriesFull
	} from '../../apis/tmdb/tmdb-api';
	import TmdbEpisodeCard from '../../components/EpisodeCard/TmdbEpisodeCard.svelte';
	import { Selectable } from '../../selectable';

	const { topVisible } = getScrollContext();

	// export let jellyfinEpisodes: Promise<JellyfinItem[]>;
	// export let currentJellyfinEpisode: Promise<JellyfinItem | undefined>;

	interface Props {
		onEnter?: ContainerProps['onEnter'];
		onMounted?: ComponentProps<typeof Carousel>['onMounted'];
		tmdbSeries: Promise<TmdbSeriesFull | undefined>;
		nextEpisode: Readable<EpisodeUserData>;
		episodesUserData: EpisodeUserData[];
		// export let handleRequestSeason: (season: number) => Promise<any>;
		tmdbSeasons: Promise<TmdbSeason[]>;
		onSelectEpisode: (season: number, episode: number) => void;
		selectedEpisode: Writable<TmdbSeasonEpisode | undefined>;
	}

	let {
		tmdbSeries,
		nextEpisode,
		episodesUserData,
		tmdbSeasons,
		onSelectEpisode,
		selectedEpisode,
		onEnter,
		onMounted
	}: Props = $props();

	let selectedSeason: number | undefined = $state(1);

	const unsubscribers: (() => void)[] = [];
	function handleMountCard(s: Selectable, episode: TmdbEpisode) {
		unsubscribers.push(
			nextEpisode.subscribe((nextEpisode) => {
				if (
					nextEpisode?.season === episode.season_number &&
					nextEpisode?.episode === episode.episode_number
				) {
					s.activate();
					scrollElementIntoView(s.getHtmlElement()!, { left: 128 });
					selectedSeason = episode.season_number;
				}
			})
		);

		// currentJellyfinEpisode.then((currentEpisode) => {
		// 	if (
		// 		currentEpisode?.IndexNumber === episode.episode_number &&
		// 		currentEpisode?.ParentIndexNumber === episode.season_number
		// 	) {
		// 		s.focus({ setFocusedElement: false, propagate: false });
		// 	}
		// });
	}

	onDestroy(() => unsubscribers.forEach((unsub) => unsub()));
</script>

<Container
	{onEnter}
	class={classNames('transition-transform', {
		'-translate-y-16': $topVisible
	})}
>
	{#await Promise.all([tmdbSeries, tmdbSeasons]) then [tmdbSeries, tmdbSeasons]}
		<!-- <UICarousel
			class={classNames('flex transition-opacity mb-8 mx-32', {
				'opacity-0': $topVisible
			})}
		 onEnter={scrollIntoView({ horizontal: 64 })}
		>
			{#each tmdbSeasons || [] as season, i}
				<Container
				 onMounted={(e) => handleMountSeasonButton(e, season?.season_number || 0)}
					let:hasFocus
				 onEnter={(event) => {
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
		</UICarousel> -->
		<Carousel
			scrollClass="px-32"
			{onMounted}
			onNavigate={(e) => {
				if (e.willLeaveContainer) {
					selectedEpisode.set(undefined);
				}
			}}
		>
			{#snippet header()}
				<span
					class={classNames('transition-opacity', {
						'opacity-0': $topVisible
					})}
				>
					{$selectedEpisode ? `Season ${$selectedEpisode.season_number}` : 'Episodes'}
				</span>
			{/snippet}
			{#each tmdbSeasons as season}
				{#each season.episodes ?? [] as episode}
					{@const userData = episodesUserData.find(
						(e) => e.season === episode.season_number && e.episode === episode.episode_number
					)}
					{#key episode.id}
						<TmdbEpisodeCard
							{episode}
							series={tmdbSeries}
							onMounted={(e) => handleMountCard(e, episode)}
							onEnter={(e) => {
								scrollIntoView({ left: 128 })(e);
								selectedSeason = episode.season_number;
								selectedEpisode.set(episode);
							}}
							isWatched={userData?.watched || false}
							progress={userData?.progress}
							onClickOrSelect={() =>
								onSelectEpisode(episode?.season_number ?? 1, episode.episode_number ?? 1)}
						/>
					{/key}
				{/each}
			{/each}
		</Carousel>
	{/await}
</Container>
