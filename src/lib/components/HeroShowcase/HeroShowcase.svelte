<script lang="ts">
	import type { ShowcaseItemProps } from './HeroShowcase';
	import { ChevronRight, DotFilled } from 'radix-icons-svelte';
	import CardPlaceholder from '../Card/CardPlaceholder.svelte';
	import classNames from 'classnames';
	import Card from '../Card/Card.svelte';
	import { TMDB_IMAGES_ORIGINAL, TMDB_POSTER_SMALL } from '../../constants';
	import HeroCarousel from '../HeroCarousel/HeroCarousel.svelte';
	import SidebarMargin from '../SidebarMargin.svelte';

	export let items: Promise<ShowcaseItemProps[]> = Promise.resolve([]);

	let showcaseIndex = 0;
</script>

<HeroCarousel
	urls={items.then((items) => items.map((i) => `${TMDB_IMAGES_ORIGINAL}${i.backdropUrl}`))}
	bind:index={showcaseIndex}
>
	<SidebarMargin class="h-full flex-1 flex overflow-hidden z-10 relative">
		{#await items}
			<div class="flex-1 flex items-end">
				<CardPlaceholder orientation="portrait" />
				<div class="flex flex-col">
					<div>stats</div>
					<div>title</div>
					<div>genres</div>
				</div>
			</div>
		{:then items}
			{@const item = items[showcaseIndex]}
			{#if item}
				<div class="flex-1 flex items-end">
					<div class="mr-8">
						<Card
							focusable={false}
							orientation="portrait"
							backdropUrl={TMDB_POSTER_SMALL + item.posterUrl}
						/>
					</div>
					<div class="flex flex-col">
						<div
							class={classNames(
								'text-left font-medium tracking-wider text-stone-200 hover:text-amber-200 max-w-xl mt-2',
								{
									'text-4xl sm:text-5xl 2xl:text-6xl': item?.title.length < 15,
									'text-3xl sm:text-4xl 2xl:text-5xl': item?.title.length >= 15
								}
							)}
						>
							{item?.title}
						</div>
						<div
							class="flex items-center gap-1 uppercase text-zinc-300 font-semibold tracking-wider mt-2"
						>
							<p class="flex-shrink-0">{item.year}</p>
							<!-- <DotFilled />
								<p class="flex-shrink-0">{item.runtime}</p> -->
							<DotFilled />
							<p class="flex-shrink-0"><a href={item.url}>{item.rating} TMDB</a></p>
						</div>
						<div class="text-stone-300 font-medium line-clamp-3 opacity-75 max-w-2xl mt-4">
							{item.overview}
						</div>
						<!-- <div class="flex items-center">
								{#each item?.genres.slice(0, 3) as genre}
									<span
										class="backdrop-blur-lg rounded-full bg-zinc-400 bg-opacity-20 p-1.5 px-4 font-medium text-sm flex-grow-0 mr-4"
									>
										{genre}
									</span>
								{/each}
							</div> -->
					</div>
				</div>
			{/if}
		{:catch error}
			<p>{error.message}</p>
		{/await}
	</SidebarMargin>
</HeroCarousel>
