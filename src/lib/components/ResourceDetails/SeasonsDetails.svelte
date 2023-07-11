<script lang="ts">
	import { getTmdbSeriesSeason } from '$lib/apis/tmdb/tmdbApi';
	import classNames from 'classnames';
	import EpisodeCard from '../EpisodeCard/EpisodeCard.svelte';
	import Carousel from '../Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '../Carousel/CarouselPlaceholderItems.svelte';
	import { Star, StarFilled } from 'radix-icons-svelte';
	import UiCarousel from '../Carousel/UICarousel.svelte';

	export let tmdbId: number;
	export let totalSeasons: number;
	let visibleSeason = 1;

	async function fetchSeasons(seasons: number) {
		const promises = [...Array(seasons).keys()].map((i) => getTmdbSeriesSeason(tmdbId, i + 1));

		console.log(promises);

		return Promise.all(promises);
	}
</script>

<div class="py-4">
	{#await fetchSeasons(totalSeasons)}
		<Carousel>
			<div slot="title" class="flex gap-4 my-1">
				{#each [...Array(3).keys()] as season}
					<div class={'rounded-full p-2 px-6 font-medium placeholder text-transparent'}>
						Season 1
					</div>
				{/each}
			</div>
			<CarouselPlaceholderItems />
		</Carousel>
	{:then seasons}
		<div class="flex flex-col gap-4">
			<div>
				{#each seasons as season}
					<div
						class={classNames({
							hidden: visibleSeason !== (season?.season_number || 1)
						})}
					>
						<Carousel>
							<UiCarousel slot="title" class="flex gap-4 my-1">
								{#each seasons as season}
									<button
										class={classNames('rounded-full p-2 px-6 font-medium whitespace-nowrap ', {
											'text-amber-200 bg-darken shadow-lg':
												visibleSeason === (season?.season_number || 1),
											'text-zinc-300 hover:bg-lighten hover:text-amber-100':
												visibleSeason !== (season?.season_number || 1)
										})}
										on:click={() => (visibleSeason = season?.season_number || 1)}
										>{season?.name}</button
									>
								{/each}
							</UiCarousel>
							{#each season?.episodes || [] as episode}
								{@const upcoming =
									new Date(episode.air_date || Date.now()) > new Date() || episode.runtime === null}
								<div class="flex-shrink-0 h-40 lg:h-48">
									<EpisodeCard
										backdropPath={episode.still_path || ''}
										title={episode.name || ''}
										subtitle={upcoming ? 'Upcoming' : 'Episode ' + episode.episode_number}
										runtime={episode.runtime || 0}
										size="dynamic"
									>
										<div slot="episode-tag" class="flex gap-1 items-center">
											{#if upcoming}
												{@const date = new Date(episode.air_date || Date.now())}
												<span />
											{:else}
												{episode.vote_average?.toFixed(1)}
												<StarFilled size={14} />
											{/if}
										</div>
									</EpisodeCard>
								</div>
							{/each}
						</Carousel>
					</div>
				{/each}
			</div>
		</div>
	{/await}
</div>
