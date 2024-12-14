import { get, writable } from 'svelte/store';
import { modalStack } from '../Modal/modal.store';
import { jellyfinItemsStore } from '../../stores/data.store';
import JellyfinVideoPlayerModal from './JellyfinVideoPlayerModal.svelte';
import { reiverrApiNew, sources } from '../../stores/user.store';
import { createErrorNotification } from '../Notifications/notification.store';
import VideoPlayerModal from './VideoPlayerModal.svelte';
import MovieVideoPlayerModal from './MovieVideoPlayerModal.svelte';
import type { MovieUserDataDto } from '../../apis/reiverr/reiverr.openapi';

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
	startTime?: number;

	audioStreamIndex: number;
	audioTracks: AudioTrack[];
	selectAudioTrack: (index: number) => void;
};

const initialValue = { visible: false, jellyfinId: '', sourceId: '' };
export type PlayerStateValue = typeof initialValue;

function usePlayerState() {
	const store = writable<PlayerStateValue>(initialValue);

	async function streamTmdbMovie(
		tmdbId: string,
		userData: MovieUserDataDto,
		sourceId: string = '',
		key: string = ''
	) {
		if (!sourceId) {
			const streams = await Promise.all(
				get(sources).map((s) =>
					reiverrApiNew.movies
						.getMovieStreams(tmdbId, s.source.id)
						.then((r) => ({ source: s.source, streams: r.data.streams }))
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
		modalStack.create(MovieVideoPlayerModal, {
			tmdbId,
			sourceId,
			key,
			progress: userData.playState?.progress || 0
		});
	}

	return {
		...store,
		streamMovie: streamTmdbMovie,
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
