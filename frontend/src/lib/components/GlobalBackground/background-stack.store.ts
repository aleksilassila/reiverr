import { Selectable, useRegistrar } from '$lib/selectable';
import { onDestroy, SvelteComponentTyped, type ComponentProps, type ComponentType } from 'svelte';
import { derived, get, writable } from 'svelte/store';
import YoutubeVideo from '../VideoPlayer/YoutubeVideo.svelte';
import MediaVideoPlayer from '../VideoPlayer/MediaVideoPlayer.svelte';
import type { MediaSourceDto } from '$lib/apis/reiverr/reiverr.openapi';
import { getContext, hasContext, setContext } from '../StackRouter/stack-router.store';
import { createStoreContext } from '$lib/utils';
import { reiverrApi, user } from '$lib/stores/user.store';

export const BACKGROUND_CONTEXT_KEY = 'background-context';

export type Background = {
	backdropUri: string;
	mediaId?: string;
};

export type BackgroundVideo<T extends SvelteComponentTyped = SvelteComponentTyped> = {
	id: symbol;
	component: ComponentType<T>;
	props: ComponentProps<T>;
	mediaId?: string;
};

export type BackgroundPage = {
	id: symbol;
	isTransparent: boolean;
	backgrounds: Background[];
	index: number;
	video?: BackgroundVideo;

	setBackgrounds: (items: Background[]) => void;
	setIndex: (i: number) => void;
	nextBackground: () => void;
	previousBackground: () => void;
	setVideo: (video: BackgroundVideo) => void;
	destroyVideo: () => void;
	playYoutubeVideo: (options: { tmdbId: string; videoId: string; onBackground?: boolean }) => void;
	focus: () => void;
	unfocus: () => void;
	destroy: () => void;
};

export const globalBackground = useRegistrar();

export const backgroundPagesStack = writable<BackgroundPage[]>([]);
export const topBackground = (() => {
	const store = derived([backgroundPagesStack], ([pages]) => {
		const topPage = pages[pages.length - 1];

		return {
			index: topPage?.index ?? 0,
			backgrounds:
				topPage?.backgrounds.map((b, i) => ({
					...b,
					visible: topPage.index === i && !topPage.video
				})) ?? [],
			video: topPage?.video
		};
	});

	function getTopPage() {
		const pages = get(backgroundPagesStack);
		return pages[pages.length - 1];
	}

	function setIndex(index: number) {
		getTopPage()?.setIndex(index);
	}

	function nextBackground() {
		getTopPage()?.nextBackground();
	}

	function previousBackground() {
		getTopPage()?.previousBackground();
	}

	function destroyVideo() {
		getTopPage()?.destroyVideo();
	}

	return {
		subscribe: store.subscribe,
		setIndex,
		nextBackground,
		previousBackground,
		destroyVideo
	};
})();

let lastFocused: Selectable | undefined = undefined;

export type BackgroundPageStore = ReturnType<typeof _createBackgroundPage>;
function _createBackgroundPage(
	options: {
		transparent?: boolean;
		backgroundMediaId?: string;
		videoMediaId?: string;
	} = {}
) {
	const { transparent = false, backgroundMediaId, videoMediaId } = options;

	const backgroundPages = get(backgroundPagesStack);
	const previousPage = backgroundPages[backgroundPages.length - 1];
	const reusedPage = previousPage?.backgrounds.find(
		(b, i) => backgroundMediaId && b.mediaId === backgroundMediaId && i === previousPage.index
	);

	const id = Symbol();
	const page: BackgroundPage = {
		id,
		backgrounds: reusedPage ? [reusedPage] : [],
		index: 0,
		isTransparent: transparent,
		video:
			videoMediaId && previousPage?.video?.mediaId === videoMediaId
				? previousPage?.video
				: undefined,
		setBackgrounds,
		setIndex,
		nextBackground,
		previousBackground,
		setVideo,
		destroyVideo,
		playYoutubeVideo,
		focus,
		unfocus,
		destroy
	};
	backgroundPagesStack.update((pages) => [...pages, page]);
	const selectedBackground = derived(
		backgroundPagesStack,
		(pages) => pages.find((p) => p === page)?.backgrounds[page.index]
	);

	function setBackgrounds(unfilteredItems: Background[]) {
		const items = unfilteredItems.filter((b) => b.backdropUri);

		const currentBackground = page.backgrounds[page.index];

		const updatedIndex = items.findIndex(
			(b) => b.mediaId && b.backdropUri === currentBackground?.backdropUri
		);

		page.backgrounds = items;
		page.index = updatedIndex !== -1 ? updatedIndex : 0;
		backgroundPagesStack.update((p) => p);
	}

	function setIndex(i: number) {
		page.index = i;
		backgroundPagesStack.update((p) => p);
	}

	function nextBackground() {
		page.index = (page.index + 1) % page.backgrounds.length;
		backgroundPagesStack.update((p) => p);
	}

	function previousBackground() {
		page.index = (page.index - 1 + page.backgrounds.length) % page.backgrounds.length;
		backgroundPagesStack.update((p) => p);
	}

	function setVideo<T extends SvelteComponentTyped>(video: BackgroundVideo<T>) {
		if (video.mediaId && video.mediaId === page.video?.mediaId) return;

		page.video = video;
		backgroundPagesStack.update((p) => p);
	}

	function destroyVideo() {
		if (!page.video) return;

		const video = page.video;
		page.video = undefined;
		backgroundPagesStack.update((p) => {
			p.forEach((p) => {
				if (video?.mediaId && p.video?.mediaId === video.mediaId) {
					p.video = undefined;
				}
			});

			return p;
		});

		unfocusGlobalBackground();
	}

	function playYoutubeVideo(options: { tmdbId: string; videoId: string; onBackground?: boolean }) {
		const { tmdbId, videoId, onBackground = false } = options;

		setVideo({
			id: Symbol(),
			component: YoutubeVideo,
			props: {
				videoId
			},
			mediaId: tmdbId
		});

		if (!onBackground) focus();
	}

	async function playMedia(props: {
		title: string;
		subtitle?: string;
		sourceName?: string;
		pluginId: string;
		streamId: string;
		progress?: number;
		handleProgressUpdate?: (progress: number) => void;
	}) {
		setVideo({
			id: Symbol(),
			component: MediaVideoPlayer,
			props: {
				...props,
				source: {
					pluginId: props.pluginId,
					streamId: props.streamId
				},
				handleProgressUpdate: props.handleProgressUpdate ?? (() => {})
			}
		});

		focus();
	}

	function focus() {
		const pages = get(backgroundPagesStack);
		const topPage = pages[pages.length - 1];
		if (topPage && topPage.id === id) {
			focusGlobalBackground();
		}
	}

	function unfocus() {
		const pages = get(backgroundPagesStack);
		const topPage = pages[pages.length - 1];
		if (topPage && topPage.id === id) {
			unfocusGlobalBackground();
		}
	}

	function destroy() {
		backgroundPagesStack.update((items) => items.filter((i) => i.id !== id));
	}

	onDestroy(() => {
		destroy();
	});

	return {
		subscribe: selectedBackground.subscribe,
		background: selectedBackground,
		setBackgrounds,
		setIndex,
		nextBackground,
		previousBackground,
		setVideo,
		destroyVideo,
		playYoutubeVideo,
		playMedia,
		focus,
		unfocus,
		destroy
	};
}

export const backgroundContext = createStoreContext(BACKGROUND_CONTEXT_KEY, _createBackgroundPage);

export function focusGlobalBackground() {
	lastFocused = get(Selectable.focusedObject)?.getRootParent();
	const backgroundSelectable = get(globalBackground);

	if (!lastFocused) {
		console.error('[Background Stack]: No focused object to return to');
		return;
	}

	if (!backgroundSelectable) {
		console.error('[Background Stack]: No background selectable registered');
		return;
	}

	console.log('focusing global background', lastFocused);

	backgroundSelectable.focus();
}

export function unfocusGlobalBackground() {
	if (lastFocused && !lastFocused.didUnmount) {
		lastFocused.focus();
		lastFocused = undefined;
	} else {
		Selectable.rootObjectsStack[Selectable.rootObjectsStack.length - 1]?.focus();
	}
	//  else {
	// 	console.error('[Background Stack]: No focused object to return to');
	// }
}

export function toggleFocusGlobalBackground() {
	if (lastFocused) {
		unfocusGlobalBackground();
	} else {
		focusGlobalBackground();
	}
}
