import { _createStoreContext } from '$lib/utils';
import { isTizen, isWebOS1, isWebOS2, isWebOS3, tizenVersion } from '$lib/utils/browser-detection';
import { derived, get, writable } from 'svelte/store';

export type VideoTrack = {
	id: string;
	label: string;
	src: string;
	/** Direct tracks are given to the video element as they are, HLS tracks go through hls.js where needed */
	type: 'direct' | 'hls';
};

export type SubtitleTrack = {
	id: string;
	label: string;
	src: string;
	lang?: string;
};

export type AudioTrack = {
	/** The position of the track in the audio tracks of the video element */
	index: number;
	label: string;
	lang?: string;
};

/** HTMLMediaElement.audioTracks, which TypeScript does not type since few browsers have it */
type AudioTrackList = EventTarget &
	ArrayLike<{ label: string; language: string; enabled: boolean }>;

/**
 * The audio tracks of the file a video element plays, on platforms that can
 * switch between them. Tizen before 5.5 and from 8 on, and webOS before 4,
 * list the tracks but play only the first one (after jellyfin-web).
 */
export function getAudioTrackList(video: HTMLVideoElement): AudioTrackList | undefined {
	const tizen = tizenVersion();
	const canSwitch =
		(!isTizen() || (tizen !== undefined && tizen >= 5.5 && tizen < 8)) &&
		!isWebOS1() &&
		!isWebOS2() &&
		!isWebOS3();

	return canSwitch
		? (video as HTMLVideoElement & { audioTracks?: AudioTrackList }).audioTracks
		: undefined;
}

export interface VideoPlayerOptions {
	videoTracks: VideoTrack[];
	subtitleTracks: SubtitleTrack[];
	/** From 0 to 1, where playback starts */
	initialProgress?: number;
	/** Called with the progress from 0 to 1 every now and then and when the player closes */
	onProgress?: (progress: number) => void;
}

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

export function useVideoPlayer(options: VideoPlayerOptions) {
	const video = writable<HTMLVideoElement | undefined>(undefined);

	const videoTracks = writable<{ current?: VideoTrack; tracks: VideoTrack[] }>({
		current: options.videoTracks[0],
		tracks: options.videoTracks
	});
	const subtitleTracks = writable<{ current?: SubtitleTrack; tracks: SubtitleTrack[] }>({
		tracks: options.subtitleTracks
	});
	const audioTracks = writable<{ current?: AudioTrack; tracks: AudioTrack[] }>({ tracks: [] });

	const paused = writable(false);
	const muted = writable(false);
	const volume = writable(1);
	const duration = writable(0);
	const currentTime = writable(0);
	const bufferedTime = writable(0);
	const buffering = writable(false);
	const videoDidLoad = writable(false);
	const seeking = writable(false);
	/** Why the current track cannot be played */
	const error = writable<string | undefined>(undefined);

	const progress = derived([currentTime, duration], ([$currentTime, $duration]) =>
		$duration > 0 ? $currentTime / $duration : 0
	);

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

	function selectVideoTrack(track?: VideoTrack) {
		videoTracks.update((prev) => ({ ...prev, current: track }));
	}

	function selectSubtitles(track?: SubtitleTrack) {
		subtitleTracks.update((prev) => ({ ...prev, current: track }));
	}

	function readAudioTrackList() {
		const el = get(video);

		return Array.from((el && getAudioTrackList(el)) ?? []);
	}

	/** Called when the audio tracks of the video element change, which lists them once the file's metadata has loaded */
	function updateAudioTracks() {
		const list = readAudioTrackList();
		const tracks = list.map((track, index) => ({
			index,
			label: track.label,
			lang: track.language || undefined
		}));

		audioTracks.set({ current: tracks[list.findIndex((track) => track.enabled)], tracks });
	}

	function selectAudioTrack(track: AudioTrack) {
		readAudioTrackList().forEach((audioTrack, index) => {
			audioTrack.enabled = index === track.index;
		});
		updateAudioTracks();
	}

	function reportProgress() {
		const el = get(video);
		if (el && el.duration > 0 && el.currentTime > 5) {
			options.onProgress?.(el.currentTime / el.duration);
		}
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
		const initialProgress = options.initialProgress ?? 0;

		if (el && el.currentTime < el.duration * initialProgress) {
			el.currentTime = el.duration * initialProgress;
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
		const current = get(subtitleTracks).current;
		for (const track of el?.textTracks ?? []) {
			track.mode = track.id === current?.id ? 'showing' : 'disabled';
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

	return {
		video,
		videoTracks,
		subtitleTracks,
		audioTracks,
		paused,
		muted,
		volume,
		duration,
		currentTime,
		bufferedTime,
		buffering,
		videoDidLoad,
		seeking,
		error,
		progress,

		play,
		pause,
		togglePause,
		seek,
		seekAndPlay,
		setVolume,
		adjustVolume,
		toggleMute,
		toggleFullscreen,
		selectVideoTrack,
		selectSubtitles,
		selectAudioTrack,
		updateAudioTracks,
		reportProgress,
		handleProgress,
		handleLoadedData,
		handleWaiting,
		handlePlaying,
		updateSubtitlesVisibility,
		handleKeyboardShortcut
	};
}

export type VideoPlayerStore = ReturnType<typeof useVideoPlayer>;

export const videoPlayerContext = _createStoreContext('video-player', useVideoPlayer, {
	required: true
});
