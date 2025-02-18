export type TitleType = 'movie' | 'series' | 'person';
export type TitleId = {
	id: number;
	provider: 'tmdb' | 'tvdb';
	type: TitleType;
};

export type MediaType = 'Movie' | 'Series';

declare global {
	const REIVERR_VERSION: string;

	type YTPlayerOptions = {
		videoId: string;
		playerVars: Record<string, string | number | boolean>;
		// playerVars: {
		// 	autoplay: 0 | 1;
		// 	controls: 0 | 1;
		// 	disablekb: 0 | 1;
		// 	enablejsapi: 0 | 1;
		// 	iv_load_policy: 1 | 3;
		// 	loop: 0 | 1;
		// 	modestbranding: 0 | 1;
		// 	playsinline: 0 | 1;
		// 	rel: 0 | 1;
		// 	showinfo: 0 | 1;
		// 	start: number;
		// 	fs: 0 | 1;
		// 	cc_load_policy: 0 | 1;
		// 	mute: 0 | 1;
		// };
		events: {
			onReady: (event: any) => void;
			onStateChange: (event: any) => void;
			onError: (event: any) => void;
		};
	};

	type YTPlayer = {
		new (id: string, options: YTPlayerOptions): YTPlayer;
		destroy(): void;
		getDuration(): number;
		getCurrentTime(): number;
		pauseVideo(): void;
		playVideo(): void;
		stopVideo(): void;
		seekTo(seconds: number, allowSeekAhead?: boolean): void;
		mute(): void;
		unMute(): void;
		isMuted(): boolean;
		setVolume(volume: number): void;
		getVolume(): number;
	};

	// Youtube API
	interface YT {
		Player: YTPlayer;
		PlayerState: {
			ENDED: number;
			PLAYING: number;
			PAUSED: number;
			BUFFERING: number;
			CUED: number;
		};
	}

	const YT: YT;

	interface Window {
		YT: YT;
	}
}
