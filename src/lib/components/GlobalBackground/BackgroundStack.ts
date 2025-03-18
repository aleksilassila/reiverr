import { Selectable, useRegistrar } from '$lib/selectable';
import { useTimeoutStore } from '$lib/utils';
import { getContext, hasContext, onDestroy, setContext, type ComponentType } from 'svelte';
import { derived, get, writable } from 'svelte/store';
import YoutubeVideo from '../VideoPlayer/YoutubeVideo.svelte';

const BACKGROUND_CONTEXT_KEY = Symbol('BACKGROUND_CONTEXT_KEY');

export type Background = {
	backdropUrl: string;
	mediaId?: string;
};

export type BackgroundVideo = {
	id: symbol;
	component: ComponentType;
	props: Record<string, any>;
	mediaId?: string;
};

export type BackgroundPage = {
	id: symbol;
	isTransparent: boolean;
	backgrounds: Background[];
	index: number;
	video?: BackgroundVideo;
};

export const globalBackground = useRegistrar();

const fadeTimeout = useTimeoutStore(500, true);
export const backgroundPagesStack = writable<BackgroundPage[]>([]);
export const visibleBackgrounds = (() => {
	const store = derived([backgroundPagesStack, fadeTimeout], ([pages, $fadeTimeout]) => {
		const topPage = pages[pages.length - 1];

		return {
			index: topPage?.index ?? 0,
			backgrounds:
				topPage?.backgrounds.map((b, i) => ({
					...b,
					visible: topPage.index === i && !$fadeTimeout
				})) ?? [],
			video: topPage?.video
		};
	});

	function jumpToBackground(index: number) {
		fadeTimeout.reset();
		backgroundPagesStack.update((pages) => {
			const topPage = pages[pages.length - 1];
			if (topPage) topPage.index = index;
			return pages;
		});
	}

	function nextBackground() {
		fadeTimeout.reset();
		backgroundPagesStack.update((pages) => {
			const topPage = pages[pages.length - 1];
			if (topPage) topPage.index = (topPage.index + 1) % topPage.backgrounds.length;
			return pages;
		});
	}

	function previousBackground() {
		fadeTimeout.reset();
		backgroundPagesStack.update((pages) => {
			const topPage = pages[pages.length - 1];
			if (topPage)
				topPage.index =
					(topPage.index - 1 + topPage.backgrounds.length) % topPage.backgrounds.length;
			return pages;
		});
	}

	function destroyVideo() {
		const pages = get(backgroundPagesStack);
		const topPage = pages[pages.length - 1];
		if (!topPage?.video) return;

		backgroundPagesStack.update((pages) => {
			const topPage = pages[pages.length - 1];
			if (topPage) topPage.video = undefined;
			return pages;
		});

		unfocusGlobalBackground();
	}

	return {
		subscribe: store.subscribe,
		jumpToBackground,
		nextBackground,
		previousBackground,
		destroyVideo
	};
})();

let lastFocused: Selectable | undefined = undefined;

function _createBackgroundPage(
	options: {
		transparent?: boolean;
		mediaId?: string;
	} = {}
) {
	const { transparent = false, mediaId } = options;

	const backgroundPages = get(backgroundPagesStack);
	const previousPage = backgroundPages[backgroundPages.length - 1];
	const reusedPage = previousPage?.backgrounds.find(
		(b, i) => mediaId && b.mediaId === mediaId && i === previousPage.index
	);

	const id = Symbol();
	const initialPage: BackgroundPage = {
		id,
		backgrounds: reusedPage ? [reusedPage] : [],
		index: 0,
		isTransparent: transparent,
		video: mediaId && previousPage?.video?.mediaId === mediaId ? previousPage?.video : undefined
	};
	backgroundPagesStack.update((pages) => [...pages, initialPage]);
	// backgroundPagesStack.subscribe(console.log);

	function updatePage(fn: (page: BackgroundPage) => BackgroundPage) {
		backgroundPagesStack.update((pages) => {
			const p = pages.find((p) => p.id === id);
			if (p) {
				return pages.map((page) => (page.id === id ? fn(page) : page));
			}
			return pages;
		});
	}

	function setBackgrounds(unfilteredItems: Background[]) {
		const items = unfilteredItems.filter((b) => b.backdropUrl);

		const page = get(backgroundPagesStack).find((p) => p.id === id);
		const currentBackground = page?.backgrounds[page.index];

		const updatedIndex = items.findIndex(
			(b) => b.mediaId && b.backdropUrl === currentBackground?.backdropUrl
		);

		updatePage((page) => ({
			...page,
			backgrounds: items,
			index: updatedIndex !== -1 ? updatedIndex : 0
		}));
	}

	function setIndex(i: number) {
		fadeTimeout.reset();
		updatePage((page) => ({ ...page, index: i }));
	}

	function nextBackground() {
		fadeTimeout.reset();
		updatePage((page) => ({ ...page, index: (page.index + 1) % page.backgrounds.length }));
	}

	function previousBackground() {
		fadeTimeout.reset();
		updatePage((page) => ({
			...page,
			index: (page.index - 1 + page.backgrounds.length) % page.backgrounds.length
		}));
	}

	function setVideo(video: BackgroundVideo) {
		const page = get(backgroundPagesStack).find((p) => p.id === id);
		if (video.mediaId && video.mediaId === page?.video?.mediaId) return;

		updatePage((page) => ({ ...page, video }));
	}

	function destroyVideo() {
		updatePage((page) => ({ ...page, video: undefined }));
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

	onDestroy(() => {
		destroy();
	});

	return {
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
}
export const createBackgroundPage: typeof _createBackgroundPage = (...args) => {
	const page = _createBackgroundPage(...args);
	setContext(BACKGROUND_CONTEXT_KEY, page);
	return page;
};

export function getBackgroundPage() {
	if (hasContext(BACKGROUND_CONTEXT_KEY)) {
		return getContext<ReturnType<typeof _createBackgroundPage>>(BACKGROUND_CONTEXT_KEY);
	}

	return undefined;
}

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
	if (lastFocused) {
		lastFocused.focus();
		lastFocused = undefined;
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
