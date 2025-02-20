<script lang="ts">
	import type { TitleInfoProperty } from '$lib/pages/TitlePages/HeroTitleInfo';
	import HeroTitleInfo from '$lib/pages/TitlePages/HeroTitleInfo.svelte';
	import { createEventDispatcher } from 'svelte';
	import { TMDB_IMAGES_ORIGINAL, TMDB_POSTER_SMALL } from '../../constants';
	import HeroCarousel from '../HeroCarousel/HeroCarousel.svelte';

	type ShowcaseItem = {
		id: number;
		type: 'movie' | 'tv';
		posterUri: string;
		backdropUri: string;
		videoUrl?: string;
		title: string;
		overview: string;
		infoProperties: TitleInfoProperty[];
		url?: string;
	};

	export let items: Promise<ShowcaseItem[]> = Promise.resolve([]);

	const dispatch = createEventDispatcher<{
		select: ShowcaseItem | undefined;
	}>();

	let awaitedItems: undefined | ShowcaseItem[];
	items.then((items) => (awaitedItems = items));

	function openItem() {
		if (awaitedItems) dispatch('select', awaitedItems[showcaseIndex]);
	}

	let showcaseIndex = 0;
</script>

<HeroCarousel
	itemsP={items.then((items) =>
		items.map((i) => ({
			backdropUrl: `${TMDB_IMAGES_ORIGINAL}${i.backdropUri}`,
			videoUrl: i.videoUrl
		}))
	)}
	bind:index={showcaseIndex}
	on:enter
	on:select={openItem}
>
	{#await items}
		<!--			<div class="flex-1 flex items-end">-->
		<!--				<CardPlaceholder orientation="portrait" />-->
		<!--				<div class="flex flex-col">-->
		<!--					<div>stats</div>-->
		<!--					<div>title</div>-->
		<!--					<div>genres</div>-->
		<!--				</div>-->
		<!--			</div>-->
	{:then items}
		{@const item = items[showcaseIndex]}
		{#if item}
			<div class="flex-1 flex items-end">
				<div class="mr-8">
					<!--						<Card orientation="portrait" backdropUrl={TMDB_POSTER_SMALL + item.posterUrl} />-->
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<div
						class="bg-center bg-cover rounded-xl w-44 h-64 cursor-pointer"
						style={`background-image: url("${TMDB_POSTER_SMALL + item.posterUri}")`}
						on:click={openItem}
					/>
				</div>
				<div class="flex flex-col">
					<HeroTitleInfo
						title={item.title}
						properties={item.infoProperties}
						overview={item.overview ?? ''}
						onClickTitle={openItem}
					/>
				</div>
			</div>
		{/if}
	{:catch error}
		<p>{error.message}</p>
	{/await}
</HeroCarousel>
