import { Selectable, useRegistrar } from '$lib/selectable';
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

type Page = {
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

export const backgroundPagesStack = writable<Page[]>([]);
export const visibleBackgrounds = (() => {
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
	const page: Page = {
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

	function setBackgrounds(unfilteredItems: Background[]) {
		const items = unfilteredItems.filter((b) => b.backdropUrl);

		const currentBackground = page.backgrounds[page.index];

		const updatedIndex = items.findIndex(
			(b) => b.mediaId && b.backdropUrl === currentBackground?.backdropUrl
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

	function setVideo(video: BackgroundVideo) {
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
