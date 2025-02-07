import { get, writable } from 'svelte/store';
import { jellyfinItemsStore } from '../../stores/data.store';
import { reiverrApiNew, sources } from '../../stores/user.store';
import { modalStack } from '../Modal/modal.store';
import { createErrorNotification } from '../Notifications/notification.store';
import JellyfinVideoPlayerModal from './JellyfinVideoPlayerModal.svelte';
import TmdbVideoPlayerModal from './TmdbVideoPlayerModal.svelte';

export type SubtitleInfo = {
	subtitles?: Subtitles;
	availableSubtitles: Subtitles[];
	selectSubtitles: (subtitles?: Subtitles) => void;
};

export type Subtitles = {
	url: string;
	srclang: string;
	kind: 'subtitles' | 'captions' | 'descriptions';
	language: string;
};

export type AudioTrack = {
	language: string;
	index: number;
};

export interface VideoPlayerContext {
	title?: string;
	subtitle?: string;
	playbackInfo?: PlaybackInfo;
}

export type PlaybackInfo = {
	playbackUrl: string;
	directPlay: boolean;
	backdrop?: string;
	progress?: number;

	audioStreamIndex: number;
	audioTracks: AudioTrack[];
	selectAudioTrack: (index: number) => void;
};

const initialValue = { visible: false, jellyfinId: '', sourceId: '' };
export type PlayerStateValue = typeof initialValue;

function usePlayerState() {
	const store = writable<PlayerStateValue>(initialValue);

	async function streamTmdbItem(options: {
		tmdbId: string;
		season?: number;
		episode?: number;
		sourceId: string;
		key: string;
		progress?: number;
	}) {
		const { tmdbId, season, episode, sourceId, key, progress } = options;

		store.set({ visible: true, jellyfinId: tmdbId, sourceId });
		modalStack.create(TmdbVideoPlayerModal, {
			tmdbId,
			episode,
			season,
			sourceId,
			key,
			progress
		});
	}

	async function streamTmdbMovie(
		tmdbId: string,
		options: {
			sourceId?: string;
			key?: string;
			progress?: number;
		}
	) {
		let { sourceId, key } = options;
		const { progress = 0 } = options;

		if (!sourceId) {
			const streams = await Promise.all(
				get(sources).map((s) =>
					reiverrApiNew.sources
						.getMovieStreams(s.source.id, tmdbId)
						.then((r) => ({ source: s.source, streams: r.data.candidates }))
				)
			);
			sourceId = streams?.[0]?.source.id || '';
			key = streams?.[0]?.streams?.[0]?.key || '';
		}

		if (!sourceId) {
			createErrorNotification('Could not find a suitable source');
			return;
		}

		store.set({ visible: true, jellyfinId: tmdbId, sourceId });
		modalStack.create(TmdbVideoPlayerModal, {
			tmdbId,
			sourceId,
			key,
			progress
		});
	}

	async function streamTmdbEpisode(
		tmdbId: string,
		season: number,
		episode: number,
		options: {
			sourceId?: string;
			key?: string;
			progress?: number;
		} = {}
	) {
		let { sourceId, key } = options;
		const { progress = 0 } = options;

		if (!sourceId) {
			const streams = await Promise.all(
				get(sources).map((s) =>
					reiverrApiNew.sources
						.getEpisodeStreams(s.source.id, tmdbId, season, episode)
						.then((r) => ({ source: s.source, streams: r.data.candidates }))
				)
			);
			sourceId = streams?.[0]?.source.id || '';
			key = streams?.[0]?.streams?.[0]?.key || '';
		}

		if (!sourceId) {
			createErrorNotification('Could not find a suitable source');
			return;
		}

		store.set({ visible: true, jellyfinId: tmdbId, sourceId });
		console.log('sourceId', season, episode);
		modalStack.create(TmdbVideoPlayerModal, {
			tmdbId,
			episode,
			season,
			sourceId,
			key,
			progress
		});
	}

	return {
		...store,
		streamMovie: streamTmdbMovie,
		streamEpisode: streamTmdbEpisode,
		streamTmdbItem,
		streamJellyfinId: (id: string) => {
			store.set({ visible: true, jellyfinId: id, sourceId: '' });
			modalStack.create(JellyfinVideoPlayerModal, { id });
		},
		close: () => {
			store.set({ visible: false, jellyfinId: '', sourceId: '' });
			jellyfinItemsStore.send();
		}
	};
}

export const playerState = usePlayerState();

export function getBrowserSpecificMediaFunctions() {
	// These functions are different in every browser
	let reqFullscreenFunc: ((elem: HTMLElement) => void) | undefined = undefined;
	let exitFullscreen: (() => void) | undefined = undefined;
	let fullscreenChangeEvent: string | undefined = undefined;
	let getFullscreenElement: (() => HTMLElement) | undefined = undefined;

	// Find the correct functions
	let elem = document.createElement('div');
	// @ts-expect-error
	if (elem.requestFullscreen) {
		reqFullscreenFunc = (elem) => {
			elem.requestFullscreen();
		};
		fullscreenChangeEvent = 'fullscreenchange';
		getFullscreenElement = () => <HTMLElement>document.fullscreenElement;
		if (document.exitFullscreen) exitFullscreen = () => document.exitFullscreen();

		// @ts-expect-error
	} else if (elem.webkitRequestFullscreen) {
		reqFullscreenFunc = (elem) => {
			// @ts-expect-error
			elem.webkitRequestFullscreen();
		};
		fullscreenChangeEvent = 'webkitfullscreenchange';

		// @ts-expect-error
		getFullscreenElement = () => <HTMLElement>document.webkitFullscreenElement;

		// @ts-expect-error
		if (document.webkitExitFullscreen) exitFullscreen = () => document.webkitExitFullscreen();

		// @ts-expect-error
	} else if (elem.msRequestFullscreen) {
		reqFullscreenFunc = (elem) => {
			// @ts-expect-error
			elem.msRequestFullscreen();
		};
		fullscreenChangeEvent = 'MSFullscreenChange';

		// @ts-expect-error
		getFullscreenElement = () => <HTMLElement>document.msFullscreenElement;

		// @ts-expect-error
		if (document.msExitFullscreen) exitFullscreen = () => document.msExitFullscreen();

		// @ts-expect-error
	} else if (elem.mozRequestFullScreen) {
		reqFullscreenFunc = (elem) => {
			// @ts-expect-error
			elem.mozRequestFullScreen();
		};
		fullscreenChangeEvent = 'mozfullscreenchange';

		// @ts-expect-error
		getFullscreenElement = () => <HTMLElement>document.mozFullScreenElement;

		// @ts-expect-error
		if (document.mozCancelFullScreen) exitFullscreen = () => document.mozCancelFullScreen();
	}

	return {
		reqFullscreenFunc,
		exitFullscreen,
		fullscreenChangeEvent,
		getFullscreenElement
	};
}
