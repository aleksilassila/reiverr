<script lang="ts">
	import type { ContainerProps } from '$lib/components/Container.type';
	import { localSettings } from '$lib/stores/localstorage.store';
	import { ChevronRight } from 'radix-icons-svelte';

	import { get } from 'svelte/store';
	import { TMDB_POSTER_SMALL } from '../../constants';
	import Container from '../Container.svelte';
	import FloatingIconButton from '../FloatingIconButton.svelte';
	import { backgroundContext } from '../GlobalBackground/background-stack.store';
	import HeroContainer from './HeroContainer.svelte';
	import type { TitleInfoProperty } from './HeroTitleInfo';
	import HeroTitleInfo from './HeroTitleInfo.svelte';
	import PageDots from './PageDots.svelte';

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

	const background = backgroundContext.getContext();

	interface Props {
		onEnter?: ContainerProps['onEnter'];
		onSelect?: (detail: ShowcaseItem | undefined) => void;
		items?: Promise<ShowcaseItem[]>;
	}

	let { items = Promise.resolve([]), onSelect, onEnter }: Props = $props();

	let index = $state(0);
	let awaitedItems: undefined | ShowcaseItem[] = $state();

	function updateTrailer(item: ShowcaseItem | undefined) {
		background.destroyVideo?.();
		if (get(localSettings).autoplayTrailers) {
			playTrailer(item, true);
		}
	}

	async function playTrailer(item: ShowcaseItem | undefined, onBackground: boolean = false) {
		const videoId = item?.videoUrl;
		const tmdbId = item?.id;
		if (!videoId) return;

		background.playYoutubeVideo?.({ videoId, tmdbId: String(tmdbId), onBackground });
	}

	function focusTrailer() {
		if (!get(localSettings).autoplayTrailers) playTrailer(awaitedItems?.[index]);
		else background.focus?.();
		// toggleFocusGlobalBackground();
	}

	function onNext() {
		if (!awaitedItems) return false;

		if (index === awaitedItems.length - 1) {
			return false;
		} else {
			index = (index + 1) % awaitedItems.length;
		}

		background.setIndex?.(index);

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

		background.setIndex?.(index);

		// if (autoFocusVideo && items[index]?.videoUrl) {
		// 	videoHasFocus = true;
		// } else if (!items[index]?.videoUrl) {
		// 	videoHasFocus = false;
		// }

		return true;
	}

	function onJump(i: number) {
		index = i;
		background.setIndex?.(index);
		return true;
	}

	function openItem() {
		if (awaitedItems) onSelect?.(awaitedItems[index]);
	}
	$effect(() => {
		items.then((items) => {
			awaitedItems = items;

			background.setBackgrounds?.(
				items.map((i) => ({
					backdropUri: `${i.backdropUri}`,
					mediaId: String(i.id)
				}))
			);
		});
	});
	// The trailer follows the item: whatever plays stops when the item changes
	$effect(() => {
		updateTrailer(awaitedItems?.[index]);
	});
</script>

<HeroContainer>
	<Container
		class="flex-1 flex items-end"
		onSelect={openItem}
		{onEnter}
		onNavigate={(e) => {
			if (e.direction === 'left') {
				const success = onPrevious();
				if (success) {
					e.preventNavigation();
					e.stopPropagation();
				}
			} else if (e.direction === 'right') {
				const success = onNext();
				if (success) {
					e.preventNavigation();
					e.stopPropagation();
				}
			} else if (e.direction === 'up') {
				focusTrailer();
				e.preventNavigation();
				e.stopPropagation();
			}
		}}
		onclick={(e) => {
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
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<div
							class="bg-center bg-cover rounded-xl w-44 h-64 cursor-pointer"
							style={`background-image: url("${TMDB_POSTER_SMALL + item.posterUri}")`}
							onclick={openItem}
						></div>
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
					<FloatingIconButton onclick={onNext}>
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
