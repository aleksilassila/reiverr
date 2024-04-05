<script lang="ts">
	import type { JellyfinItem } from '../../apis/jellyfin/jellyfin-api';
	import EpisodeCard from './EpisodeCard.svelte';
	import { useDependantRequest } from '../../stores/data.store';
	import { get, type Readable } from 'svelte/store';
	import {
		tmdbApi,
		type TmdbEpisode,
		type TmdbSeason,
		type TmdbSeriesFull2
	} from '../../apis/tmdb/tmdb-api';
	import Carousel from '../Carousel/Carousel.svelte';
	import Container from '../../../Container.svelte';
	import { scrollElementIntoView, scrollIntoView } from '../../selectable';
	import UICarousel from '../Carousel/UICarousel.svelte';
	import classNames from 'classnames';

	export let id: number;
	export let tmdbSeries: Readable<TmdbSeriesFull2 | undefined>;
	export let nextEpisode: JellyfinItem | undefined = undefined;
	export let selectedTmdbEpisode: TmdbEpisode | undefined = undefined;

	const { data: tmdbSeasons, isLoading: isTmdbSeasonsLoading } = useDependantRequest(
		(seasons: number) => tmdbApi.getTmdbSeriesSeasons(id, seasons),
		tmdbSeries,
		(series) => (series?.seasons?.length ? ([series.seasons.length] as const) : undefined)
	);

	const containers: Record<string, Container> = {};

	function handleSelectSeason(season: TmdbSeason) {
		let isAlreadySelected = false;

		for (const episode of season.episodes || []) {
			const selectable = containers[`episode-${episode.id}`]?.container;
			if (selectable && get(selectable.hasFocusWithin)) {
				isAlreadySelected = true;
				break;
			}
		}

		const episode = season.episodes?.[0];
		if (episode && !isAlreadySelected) {
			const selectable = containers[`episode-${episode.id}`]?.container;
			if (selectable) selectable.focus(false);
		}
	}

	function handleFocusEpisode(episode: TmdbEpisode) {
		const seasonSelectable = containers[`season-${episode.season_number}`]?.container;
		if (seasonSelectable) seasonSelectable.focus(false);
	}

	tmdbSeasons.subscribe((seasons) => {
		selectedTmdbEpisode = seasons?.[0]?.episodes?.[0];
	});
</script>

{#if $isTmdbSeasonsLoading}
	Loading...
{:else if $tmdbSeasons}
	<Carousel scrollClass="px-20">
		<UICarousel slot="title" class="text-xl flex -mx-2 max-w-2xl">
			{#each $tmdbSeasons as season}
				<Container
					let:hasFocus
					class="mx-2 text-nowrap"
					on:click={() => handleSelectSeason(season)}
					handleFocus={(s, options) => {
						const element = s.getHtmlElement();
						if (element) scrollElementIntoView(element, { horizontal: 64 });
						if (options.didNavigate) handleSelectSeason(season);
					}}
					bind:this={containers[`season-${season.season_number}`]}
				>
					<div
						class={classNames({
							'font-semibold tracking-wide': hasFocus,
							'text-zinc-300 font-medium': !hasFocus
						})}
					>
						Season {season.season_number}
					</div>
				</Container>
			{/each}
		</UICarousel>
		<div class="flex -mx-2">
			{#each $tmdbSeasons as season}
				{#each season?.episodes || [] as episode}
					<Container
						class="mx-2"
						bind:this={containers[`episode-${episode.id}`]}
						handleFocus={(s, options) => {
							scrollIntoView({ left: 64 + 16 })(s);
							selectedTmdbEpisode = episode;
							if (options.didNavigate) handleFocusEpisode(episode);
						}}
					>
						<EpisodeCard {episode} />
					</Container>
				{/each}
			{/each}
		</div>
	</Carousel>
{/if}
