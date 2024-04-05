<script lang="ts">
	import type { JellyfinItem } from '../../apis/jellyfin/jellyfin-api';
	import EpisodeCard from './EpisodeCard.svelte';
	import { useDependantRequest } from '../../stores/data.store';
	import { derived, get, type Readable } from 'svelte/store';
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
	import ScrollHelper from '../ScrollHelper.svelte';

	export let id: number;
	export let tmdbSeries: Readable<TmdbSeriesFull2 | undefined>;
	export let jellyfinEpisodes: Readable<JellyfinItem[] | undefined>;
	export let nextJellyfinEpisode: Readable<JellyfinItem | undefined>;
	export let selectedTmdbEpisode: TmdbEpisode | undefined = undefined;

	const { data: tmdbSeasons, isLoading: isTmdbSeasonsLoading } = useDependantRequest(
		(seasons: number) => tmdbApi.getTmdbSeriesSeasons(id, seasons),
		tmdbSeries,
		(series) => (series?.seasons?.length ? ([series.seasons.length] as const) : undefined)
	);

	const containers: Record<string, Container> = {};
	let scrollTop: number;

	function focusFirstEpisodeOf(season: TmdbSeason) {
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
			if (selectable) selectable.focus({ setFocusedElement: false });
		}
	}

	function focusSeasonOf(episode: TmdbEpisode) {
		const seasonSelectable = containers[`season-${episode.season_number}`]?.container;
		if (seasonSelectable) seasonSelectable.focus({ setFocusedElement: false });
	}

	tmdbSeasons.subscribe((seasons) => {
		selectedTmdbEpisode = seasons?.[0]?.episodes?.[0];
	});

	// Handle focus next episode
	derived([tmdbSeasons, nextJellyfinEpisode], (r) => r).subscribe(
		([$seasons, $jellyfinEpisode]) => {
			const tmdbEpisode = $seasons
				?.flatMap((s) => s.episodes)
				.find(
					(e) =>
						e?.episode_number === $jellyfinEpisode?.IndexNumber &&
						e?.season_number === $jellyfinEpisode?.ParentIndexNumber
				);
			if (tmdbEpisode) {
				const container = containers[`episode-${tmdbEpisode.id}`]?.container;
				container?.focus({
					setFocusedElement: false,
					propagate: false
				});
				const element = container?.getHtmlElement();
				if (element) scrollElementIntoView(element, { horizontal: 64 + 16 });
			}
		}
	);
</script>

<ScrollHelper bind:scrollTop />

{#if $isTmdbSeasonsLoading}
	Loading...
{:else if $tmdbSeasons}
	<Carousel
		scrollClass="px-20"
		class={classNames('transition-transform', {
			'-translate-y-16': scrollTop < 140
		})}
	>
		<UICarousel
			slot="title"
			class={classNames('text-xl flex -mx-2 max-w-2xl transition-opacity', {
				'opacity-0': scrollTop < 140
			})}
		>
			{#each $tmdbSeasons as season}
				<Container
					let:hasFocus
					class="mx-2"
					on:click={() => focusFirstEpisodeOf(season)}
					on:enter={(event) => {
						console.log(event);
						scrollIntoView({ horizontal: 64 })(event);
						if (event.detail.options.setFocusedElement) focusFirstEpisodeOf(season);
					}}
					bind:this={containers[`season-${season.season_number}`]}
				>
					<div
						class={classNames(
							'cursor-pointer whitespace-nowrap hover:font-semibold hover:tracking-wide hover:text-white',
							{
								'font-semibold tracking-wide': hasFocus,
								'text-zinc-300 font-medium': !hasFocus
							}
						)}
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
						on:enter={(event) => {
							scrollIntoView({ left: 64 + 16 })(event);
							selectedTmdbEpisode = episode;
							if (event.detail.options.setFocusedElement) focusSeasonOf(episode);
						}}
						focusOnClick
					>
						<EpisodeCard
							jellyfinEpisode={$jellyfinEpisodes?.find(
								(i) =>
									i.IndexNumber === episode.episode_number &&
									i.ParentIndexNumber === episode.season_number
							)}
							{episode}
						/>
					</Container>
				{/each}
			{/each}
		</div>
	</Carousel>
{/if}
