import { type VideoTrackDto, type SubtitleTrackDto } from '$lib/apis/reiverr/reiverr.openapi';
import { _createStoreContext } from '$lib/utils';
import type { Subtitles } from '@aleksilassila/reiverr-shared/dist/src/old';
import { time } from 'svelte-i18n';
import { derived, get, writable } from 'svelte/store';

export type VideoPlayerProps = {
	load: boolean;
	paused: boolean;
	muted: boolean;
};

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

export function getBrowserSpecificMediaFunctions() {
	// These functions are different in every browser
	let reqFullscreenFunc: ((elem: HTMLElement) => void) | undefined = undefined;
	let exitFullscreen: (() => void) | undefined = undefined;
	let fullscreenChangeEvent: string | undefined = undefined;
	let getFullscreenElement: (() => HTMLElement) | undefined = undefined;

	// Find the correct functions
	const elem = document.createElement('div');
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

export type VideoPlayerSubtitle = {
	id?: string;
	src: string;
	lang: string;
	kind: 'subtitles' | 'captions' | 'descriptions';
	label: string;
	showing: boolean;
};

export interface UseVideoPlayerOptions {
	initialProgress?: number;
}

export function useVideoPlayer(_options: UseVideoPlayerOptions = {}) {
	// --- State (writable stores) ---
	const video = writable<HTMLVideoElement | undefined>(undefined);
	/** @deprecated */
	const videoSource = writable<VideoSource | undefined>(undefined);
	/** @deprecated */
	const subtitleInfo = writable<SubtitleInfo | undefined>(undefined);
	/** @deprecated */
	const subtitles = writable<VideoPlayerSubtitle[]>([]);

	const videoTracks = writable<{ current?: VideoTrackDto; tracks: VideoTrackDto[] }>({
		tracks: []
	});
	const subtitleTracks = writable<{ current?: SubtitleTrackDto; tracks: SubtitleTrackDto[] }>({
		tracks: []
	});

	const paused = writable(false);
	const muted = writable(false);
	const volume = writable(1);
	const duration = writable(0);
	const currentTime = writable(0);
	const bufferedTime = writable(0);
	const buffering = writable(false);
	const videoDidLoad = writable(false);
	const seeking = writable(false);

	// --- Derived state ---
	const progress = derived([currentTime, duration], ([$currentTime, $duration]) =>
		$duration > 0 ? $currentTime / $duration : 0
	);

	// --- Actions ---

	function play() {
		get(video)?.play();
	}

	function pause() {
		get(video)?.pause();
	}

	function togglePause() {
		const el = get(video);
		if (!el) return;
		if (el.paused) el.play();
		else el.pause();
	}

	function seek(time: number) {
		const el = get(video);
		if (el) el.currentTime = time;
	}

	function seekAndPlay(time: number) {
		const el = get(video);
		if (el) {
			el.currentTime = time;
			el.play();
		}
	}

	function setVolume(v: number) {
		const el = get(video);
		if (el) el.volume = Math.max(0, Math.min(1, v));
	}

	function adjustVolume(delta: number) {
		const el = get(video);
		if (el) el.volume = Math.max(0, Math.min(1, el.volume + delta));
	}

	function toggleMute() {
		const el = get(video);
		if (el) el.muted = !el.muted;
	}

	function toggleFullscreen() {
		const el = get(video);
		if (!el) return;
		if (document.fullscreenElement) document.exitFullscreen();
		else el.requestFullscreen();
	}

	function selectSubtitles(sub?: SubtitleTrackDto) {
		// const info = get(subtitleInfo);
		// if (info) info.selectSubtitles(sub);
		// else console.error('No subtitle info when selecting subtitles');
		subtitleTracks.update((prev) => ({
			...prev,
			current: sub
		}));
	}

	function selectAudioTrack(index: number) {
		const source = get(videoSource);
		if (source) source.selectAudioTrack(index);
		else console.error('No video source when selecting audio track');
	}

	/** Update bufferedTime from the video element's buffered TimeRanges */
	function handleProgress() {
		const el = get(video);
		if (!el) return;
		const timeRanges = el.buffered;
		for (let i = 0; i < timeRanges.length; i++) {
			if (timeRanges.end(i) > el.currentTime) {
				bufferedTime.set(timeRanges.end(i));
				break;
			}
		}
	}

	/** Called when the video element fires 'loadeddata' */
	function handleLoadedData() {
		videoDidLoad.set(true);
		const el = get(video);
		const source = get(videoSource);
		if (el && source?.progress && el.currentTime < el.duration * source.progress) {
			el.currentTime = el.duration * source.progress;
		}
	}

	function handleWaiting() {
		buffering.set(true);
	}

	function handlePlaying() {
		buffering.set(false);
	}

	/** Update subtitles track visibility based on the active subtitle */
	function updateSubtitlesVisibility() {
		const el = get(video);
		const subs = get(subtitleTracks);
		const enabledSubtitle = subs.current;
		const tracks = el?.textTracks ?? [];
		for (const track of tracks) {
			track.mode =
				track.id === (enabledSubtitle?.label ?? enabledSubtitle?.url) ? 'showing' : 'disabled';
		}
	}

	function handleKeyboardShortcut(e: KeyboardEvent) {
		const el = get(video);
		if (!el) return;

		if (e.key === ' ' || e.key === 'k') {
			e.preventDefault();
			togglePause();
		} else if (e.key === 'm') {
			e.preventDefault();
			toggleMute();
		} else if (e.key === 'f') {
			e.preventDefault();
			toggleFullscreen();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			adjustVolume(0.1);
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			adjustVolume(-0.1);
		}
	}

	function destroy() {
		const el = get(video);
		if (el) {
			el.pause();
			el.removeAttribute('src');
			el.load();
		}
	}

	return {
		// State (Writable — can be bound in components via $store syntax)
		video,
		videoSource,
		subtitleInfo,
		subtitles,
		videoTracks,
		subtitleTracks,
		paused,
		muted,
		volume,
		duration,
		currentTime,
		bufferedTime,
		buffering,
		videoDidLoad,
		seeking,

		// Derived state (Readable)
		progress,

		// Actions
		play,
		pause,
		togglePause,
		seek,
		seekAndPlay,
		setVolume,
		adjustVolume,
		toggleMute,
		toggleFullscreen,
		selectSubtitles,
		selectAudioTrack,
		handleProgress,
		handleLoadedData,
		handleWaiting,
		handlePlaying,
		updateSubtitlesVisibility,
		handleKeyboardShortcut,
		destroy,

		progressUpdateHandler: (time: number) => {}
	};
}

export type VideoPlayerStore = ReturnType<typeof useVideoPlayer>;

export const videoPlayerContext = _createStoreContext('video-player', useVideoPlayer, {
	required: true
});
