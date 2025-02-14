import type { MediaSource, SubtitlesDto as Subtitles } from '$lib/apis/reiverr/reiverr.openapi';
import { modalStack } from '../Modal/modal.store';
import TmdbVideoPlayerModal from './TmdbVideoPlayerModal.svelte';

export type SubtitleInfo = {
	subtitles?: Subtitles;
	availableSubtitles: Subtitles[];
	selectSubtitles: (subtitles?: Subtitles) => void;
};

export type AudioTrack = {
	language: string;
	index: number;
};

export interface VideoPlayerContext {
	title?: string;
	subtitle?: string;
	playbackInfo?: VideoSource;
}

export type VideoSource = {
	src: string;
	directPlay: boolean;
	backdropUrl?: string;
	progress?: number;

	audioStreamIndex: number;
	audioTracks: AudioTrack[];
	selectAudioTrack: (index: number) => void;
};

export async function streamTmdbItem(options: {
	tmdbId: string;
	season?: number;
	episode?: number;
	source: MediaSource;
	key: string;
	progress?: number;
}) {
	const { tmdbId, season, episode, progress, source, key } = options;

	modalStack.create(TmdbVideoPlayerModal, {
		tmdbId,
		episode,
		season,
		source,
		key,
		progress
	});
}

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
