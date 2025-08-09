import type { MediaSourceDto } from '$lib/apis/reiverr/reiverr.openapi';
import { getBackgroundPage } from '$lib/components/GlobalBackground/BackgroundStack';
import TmdbVideoPlayer from '$lib/components/VideoPlayer/TmdbVideoPlayer.svelte';
import { get } from 'svelte/store';
import { seriesUserDataContext } from './title-user-data.store';
import { user } from '../user.store';

export function useSeriesPlayableUserData(options: {
	tmdbId: string;
	episode?: number;
	season?: number;
}) {
	const seriesUserData = seriesUserDataContext.getContext();
	const background = getBackgroundPage();

	function play(
		options: {
			source?: MediaSourceDto;
		} = {}
	) {
		// const source = options.source ? get(user)?.mediaSources

		background?.setVideo({
			id: Symbol(),
			component: TmdbVideoPlayer,
			props: {
				...videoProps,
				streamId: targetId,
				source
			},
			mediaId: tmdbId
		});
	}

	return {
		...seriesUserData,

		unsubscribe: () => {}
	};
}

export function useMoviePlayableUserData() {}
