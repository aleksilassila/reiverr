<script lang="ts">
	import type { JellyfinItem } from '../../apis/jellyfin/jellyfin-api';
	import EpisodeCard from './EpisodeCard.svelte';
	import { useDependantRequest } from '../../stores/data.store';
	import type { Readable } from 'svelte/store';
	import { tmdbApi, type TmdbSeason, type TmdbSeriesFull2 } from '../../apis/tmdb/tmdb-api';
	import Carousel from '../Carousel/Carousel.svelte';
	import Container from '../../../Container.svelte';
	import { scrollWithOffset } from '../../selectable';
	import UICarousel from '../Carousel/UICarousel.svelte';
	import classNames from 'classnames';

	export let id: number;
	export let tmdbSeries: Readable<TmdbSeriesFull2 | undefined>;
	export let nextEpisode: JellyfinItem | undefined = undefined;

	const { data: tmdbSeasons, isLoading: isTmdbSeasonsLoading } = useDependantRequest(
		(seasons: number) => tmdbApi.getTmdbSeriesSeasons(id, seasons),
		tmdbSeries,
		(series) => (series?.seasons?.length ? ([series.seasons.length] as const) : undefined)
	);

	function handleSelectSeason(season: TmdbSeason) {
		console.log(season);
	}
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
		<div class="flex">
			{#each $tmdbSeasons as season}
				{#each season?.episodes || [] as episode}
					<div class="mx-2">
						<EpisodeCard {episode} />
					</div>
				{/each}
			{/each}
		</div>
	</Carousel>
{/if}
