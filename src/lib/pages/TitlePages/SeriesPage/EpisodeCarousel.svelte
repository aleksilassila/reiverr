<script lang="ts">
	import type { JellyfinItem } from '../../../apis/jellyfin/jellyfin-api';
	import EpisodeCard from '../../../components/EpisodeCard/EpisodeCard.svelte';
	import { useDependantRequest } from '../../../stores/data.store';
	import { derived, get, type Readable } from 'svelte/store';
	import {
		tmdbApi,
		type TmdbSeasonEpisode,
		type TmdbSeason,
		type TmdbSeriesFull2
	} from '../../../apis/tmdb/tmdb-api';
	import Carousel from '../../../components/Carousel/Carousel.svelte';
	import Container from '$components/Container.svelte';
	import {
		registrars,
		scrollElementIntoView,
		scrollIntoView,
		Selectable
	} from '../../../selectable';
	import UICarousel from '../../../components/Carousel/UICarousel.svelte';
	import classNames from 'classnames';
	import ScrollHelper from '../../../components/ScrollHelper.svelte';
	import TmdbEpisodeCard from '../../../components/EpisodeCard/TmdbEpisodeCard.svelte';
	import { playerState } from '../../../components/VideoPlayer/VideoPlayer';

	export let id: number;
	export let tmdbSeries: Readable<TmdbSeriesFull2 | undefined>;
	export let jellyfinEpisodes: Readable<JellyfinItem[] | undefined>;
	export let nextJellyfinEpisode: Readable<JellyfinItem | undefined>;

	// Exports
	export let selectedTmdbEpisode: TmdbSeasonEpisode | undefined;

	const containers = new Map<TmdbSeason | TmdbSeasonEpisode, Selectable>();
	let scrollTop: number;

	const { data: tmdbSeasons, isLoading: isTmdbSeasonsLoading } = useDependantRequest(
		(seasons: number) => tmdbApi.getTmdbSeriesSeasons(id, seasons),
		tmdbSeries,
		(series) => (series?.seasons?.length ? ([series.seasons.length] as const) : undefined)
	);

	function focusFirstEpisodeOf(season: TmdbSeason) {
		let isAlreadySelected = false;

		for (const episode of season.episodes || []) {
			const selectable = containers.get(episode);
			if (selectable && get(selectable.hasFocusWithin)) {
				isAlreadySelected = true;
				break;
			}
		}

		const episode = season.episodes?.[0];
		if (episode && !isAlreadySelected) {
			const selectable = containers.get(episode);
			if (selectable) selectable.focus({ setFocusedElement: false });
		}
	}

	function focusSeason(season: TmdbSeason) {
		const seasonSelectable = containers.get(season);
		if (seasonSelectable) seasonSelectable.focus({ setFocusedElement: false });
	}

	function handleEpisodeMount(event: CustomEvent<Selectable>, tmdbEpisode: TmdbSeasonEpisode) {
		containers.set(tmdbEpisode, event.detail);
		const selectable = event.detail;

		// Handle focus next episode
		nextJellyfinEpisode.subscribe(($jellyfinEpisode) => {
			const isNextEpisode =
				$jellyfinEpisode?.IndexNumber === tmdbEpisode.episode_number &&
				$jellyfinEpisode?.ParentIndexNumber === tmdbEpisode.season_number;

			if (isNextEpisode) {
				selectable.focus({
					setFocusedElement: false,
					propagate: false
				});
				const el = selectable.getHtmlElement();
				if (el) scrollElementIntoView(el, { left: 64 + 16 });
			}
		});
	}
</script>

<ScrollHelper bind:scrollTop />

{#if $isTmdbSeasonsLoading}
	Loading...
{:else if $tmdbSeasons}
	<Carousel
		scrollClass="px-20"
		class={classNames('transition-transform', {
			'-translate-y-20': scrollTop < 140
		})}
		hideControls={scrollTop < 140}
		on:enter
		{...$$restProps}
	>
		<svelte:fragment slot="header">
			<UICarousel
				class={classNames('flex -mx-2 transition-opacity', {
					'opacity-0': scrollTop < 140
				})}
				let:focusIndex
			>
				{#each $tmdbSeasons as season, i}
					<Container
						let:hasFocus
						on:click={() => focusFirstEpisodeOf(season)}
						on:enter={(event) => {
							scrollIntoView({ horizontal: 64 })(event);
							if (event.detail.options.setFocusedElement) focusFirstEpisodeOf(season);
						}}
						on:mount={(e) => containers.set(season, e.detail)}
					>
						<div
							class={classNames(
								'px-3 py-1 cursor-pointer whitespace-nowrap text-xl tracking-wide font-medium rounded-lg',
								'hover:font-semibold hover:tracking-wide hover:text-white',
								{
									'bg-primary-500 text-black': hasFocus,
									//'bg-stone-800/50': hasFocus,
									'text-zinc-400': !(focusIndex === i),
									'text-white': focusIndex === i && !hasFocus
								}
							)}
						>
							Season {season.season_number}
						</div>
					</Container>
				{/each}
			</UICarousel>
		</svelte:fragment>
		{#each $tmdbSeasons as season}
			{#each season?.episodes || [] as episode}
				{@const jellyfinEpisodeId = $jellyfinEpisodes?.find(
					(i) =>
						i.IndexNumber === episode.episode_number &&
						i.ParentIndexNumber === episode.season_number
				)?.Id}
				<TmdbEpisodeCard
					on:enter={(event) => {
						scrollIntoView({ horizontal: 64 + 32 })(event);
						focusSeason(season);
						selectedTmdbEpisode = episode;
					}}
					on:mount={(e) => handleEpisodeMount(e, episode)}
					{episode}
					handlePlay={jellyfinEpisodeId
						? () => playerState.streamJellyfinId(jellyfinEpisodeId)
						: undefined}
				/>
			{/each}
		{/each}
	</Carousel>
{/if}
