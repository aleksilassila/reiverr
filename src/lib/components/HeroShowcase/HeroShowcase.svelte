<script lang="ts">
	import type { TitleInfoProperty } from '$lib/pages/TitlePages/HeroTitleInfo';
	import HeroTitleInfo from '$lib/pages/TitlePages/HeroTitleInfo.svelte';
	import { ChevronRight } from 'radix-icons-svelte';
	import { createEventDispatcher, tick } from 'svelte';
	import { get, type Readable } from 'svelte/store';
	import { TMDB_IMAGES_ORIGINAL, TMDB_POSTER_SMALL } from '../../constants';
	import Container from '../Container.svelte';
	import FloatingIconButton from '../FloatingIconButton.svelte';
	import {
		destroyBackgroundVideo,
		focusGlobalBackground,
		getBackgroundPage,
		globalBackground,
		globalVideo,
		toggleFocusGlobalBackground
	} from '../GlobalBackground/BackgroundStack';
	import YoutubeVideo from '../VideoPlayer/YoutubeVideo.svelte';
	import HeroContainer from './HeroContainer.svelte';
	import PageDots from './PageDots.svelte';
	import { localSettings } from '$lib/stores/localstorage.store';

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

	const background = getBackgroundPage();
	const dispatch = createEventDispatcher<{
		select: ShowcaseItem | undefined;
	}>();

	export let items: Promise<ShowcaseItem[]> = Promise.resolve([]);

	let index = 0;
	let awaitedItems: undefined | ShowcaseItem[];
	let componentHasFocus: Readable<boolean>;

	$: items.then((items) => {
		awaitedItems = items;

		background?.setBackgrounds(
			items.map((i) => ({
				backdropUrl: `${TMDB_IMAGES_ORIGINAL}${i.backdropUri}`
			}))
		);
	});
	$: {
		awaitedItems?.[index];
		updateTrailer();
	}
	function updateTrailer() {
		if (get(componentHasFocus)) {
			destroyBackgroundVideo();
			if (get(localSettings).autoplayTrailers) {
				playTrailer();
			}
		}
	}

	async function playTrailer() {
		const videoId = awaitedItems?.[index]?.videoUrl;
		if (!videoId) return;

		await destroyBackgroundVideo();

		if (videoId) {
			globalVideo.set({
				id: Symbol(),
				component: YoutubeVideo,
				props: {
					videoId
				}
			});
		}
	}

	function focusTrailer() {
		if (!get(localSettings).autoplayTrailers) playTrailer();
		toggleFocusGlobalBackground();
	}

	function onNext() {
		if (!awaitedItems) return false;

		if (index === awaitedItems.length - 1) {
			return false;
		} else {
			index = (index + 1) % awaitedItems.length;
		}

		background?.setIndex(index);

		// if (autoFocusVideo && awaitedItems[index]?.videoUrl) {
		// 	videoHasFocus = true;
		// } else if (!awaitedItems[index]?.videoUrl) {
		// 	videoHasFocus = false;
		// }

		return true;
	}

	function onPrevious() {
		if (!awaitedItems) return false;

		if (index === 0) {
			return false;
		} else {
			index = (index - 1 + awaitedItems.length) % awaitedItems.length;
		}

		background?.setIndex(index);

		// if (autoFocusVideo && items[index]?.videoUrl) {
		// 	videoHasFocus = true;
		// } else if (!items[index]?.videoUrl) {
		// 	videoHasFocus = false;
		// }

		return true;
	}

	function onJump(i: number) {
		index = i;
		background?.setIndex(index);
		return true;
	}

	function openItem() {
		if (awaitedItems) dispatch('select', awaitedItems[index]);
	}
</script>

<HeroContainer>
	<Container
		bind:hasFocusWithin={componentHasFocus}
		class="flex-1 flex items-end"
		on:select={openItem}
		on:enter
		on:navigate={({ detail }) => {
			if (detail.direction === 'left') {
				const success = onPrevious();
				if (success) {
					detail.preventNavigation();
					detail.stopPropagation();
				}
			} else if (detail.direction === 'right') {
				const success = onNext();
				if (success) {
					detail.preventNavigation();
					detail.stopPropagation();
				}
			} else if (detail.direction === 'up') {
				focusTrailer();
				detail.preventNavigation();
				detail.stopPropagation();
			}
		}}
		on:click={({ detail: e }) => {
			if (e.target === e.currentTarget) focusTrailer();
		}}
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
			{@const item = items[index]}
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

			<div class="self-stretch flex flex-col justify-end ml-4">
				<div class="flex flex-1 justify-end items-center">
					<FloatingIconButton on:click={onNext}>
						<ChevronRight size={38} />
					</FloatingIconButton>
				</div>
				<PageDots {index} length={items.length} {onJump} />
			</div>
		{:catch error}
			<p>{error.message}</p>
		{/await}
	</Container>
</HeroContainer>
