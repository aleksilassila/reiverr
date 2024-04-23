<script lang="ts">
	import { type Readable } from 'svelte/store';
	import { tmdbApi, type TmdbSeasonEpisode, type TmdbSeriesFull2 } from '../../apis/tmdb/tmdb-api';
	import Container from '../../../Container.svelte';
	import { useDependantRequest } from '../../stores/data.store';
	import type { JellyfinItem } from '../../apis/jellyfin/jellyfin-api';
	import TmdbEpisodeCard from '../EpisodeCard/TmdbEpisodeCard.svelte';
	import { scrollIntoView, useRegistrars } from '../../selectable';
	import { playerState } from '../VideoPlayer/VideoPlayer';
	import CardGrid from '../CardGrid.svelte';
	import UICarousel from '../Carousel/UICarousel.svelte';
	import classNames from 'classnames';
	import ScrollHelper from '../ScrollHelper.svelte';
	import { useNavigate } from 'svelte-navigator';

	const navigate = useNavigate();

	export let id: number;
	export let tmdbSeries: Readable<TmdbSeriesFull2 | undefined>;
	export let jellyfinEpisodes: Readable<JellyfinItem[] | undefined>;
	export let currentJellyfinEpisode: Readable<JellyfinItem | undefined>;

	const seasonButtons = useRegistrars<number>();
	const episodeCards = useRegistrars<string>();
	let seasonIndex = 0;
	let scrollTop: number;
	$: translateUp = scrollTop < 140;

	const { data: tmdbSeasons } = useDependantRequest(
		(seasons: number) => tmdbApi.getTmdbSeriesSeasons(id, seasons),
		tmdbSeries,
		(series) => (series?.seasons?.length ? ([series.seasons.length] as const) : undefined)
	);

	currentJellyfinEpisode.subscribe((episode) => {
		if (!episode) return;

		seasonIndex = episode.ParentIndexNumber ? episode.ParentIndexNumber - 1 : seasonIndex;

		const seasonButton = seasonButtons.get(episode?.ParentIndexNumber || -1);
		const episodeCard = episodeCards.get(`${episode?.ParentIndexNumber}-${episode?.IndexNumber}`);

		seasonButton.subscribe((s) => s?.focus({ setFocusedElement: false, propagate: false }));
		episodeCard.subscribe((e) => e?.focus({ setFocusedElement: false, propagate: false }));
	});

	function handleOpenEpisodePage(episode: TmdbSeasonEpisode) {
		navigate(`season/${episode.season_number}/episode/${episode.episode_number}`);
	}
</script>

<ScrollHelper bind:scrollTop />

<Container
	on:enter
	class={classNames('transition-transform mx-20', {
		'-translate-y-24': translateUp
	})}
>
	<UICarousel
		class={classNames('flex -mx-2 transition-opacity mb-8', {
			'opacity-0': translateUp
		})}
	>
		{#each $tmdbSeasons || [] as season, i}
			<Container
				on:mount={seasonButtons.registrar(season.season_number || -1)}
				let:hasFocus
				on:enter={(event) => {
					scrollIntoView({ horizontal: 64 })(event);
					seasonIndex = i;
				}}
				focusOnClick
			>
				<div
					class={classNames(
						'px-3 py-1 cursor-pointer whitespace-nowrap text-xl tracking-wide font-medium rounded-lg',
						'hover:font-semibold hover:tracking-wide hover:text-white',
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
	<CardGrid direction="horizontal" on:mount>
		{#each $tmdbSeasons?.[seasonIndex]?.episodes || [] as episode}
			{@const jellyfinEpisode = $jellyfinEpisodes?.find(
				(i) =>
					i.IndexNumber === episode.episode_number && i.ParentIndexNumber === episode.season_number
			)}
			{@const jellyfinEpisodeId = jellyfinEpisode?.Id}
			<TmdbEpisodeCard
				on:mount={episodeCards.registrar(`${episode.season_number}-${episode.episode_number}`)}
				{episode}
				handlePlay={jellyfinEpisodeId
					? () => playerState.streamJellyfinId(jellyfinEpisodeId)
					: undefined}
				isWatched={jellyfinEpisode?.UserData?.Played || false}
				playbackProgress={jellyfinEpisode?.UserData?.PlayedPercentage || 0}
				on:clickOrSelect={() => handleOpenEpisodePage(episode)}
			/>
		{/each}
	</CardGrid>
</Container>
