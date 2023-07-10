import {
	getRadarrDownloads,
	getRadarrMovies,
	RadarrApi,
	type RadarrDownload,
	type RadarrMovie
} from '$lib/apis/radarr/radarrApi';
import type { CardProps } from '$lib/components/Card/card';
import { writable } from 'svelte/store';
import { fetchCardProps } from '$lib/components/Card/card';
import { fetchTmdbMovieImages } from '$lib/apis/tmdbApi';
import { getJellyfinContinueWatching, type JellyfinItem } from '$lib/apis/jellyfin/jellyfinApi';

export interface PlayableRadarrMovie extends RadarrMovie {
	cardBackdropUrl: string;
	download?: {
		progress: number;
		completionTime: string;
	};
	continueWatching?: {
		progress: number;
		length: number;
	};
}

export interface Library {
	movies: PlayableRadarrMovie[];
	totalMovies: number;
	getItem: (tmdbId: number) => PlayableRadarrMovie | undefined;
}

async function getLibrary(): Promise<Library> {
	const radarrMoviesPromise = getRadarrMovies();
	const radarrDownloadsPromise = getRadarrDownloads();
	const continueWatchingPromise = getJellyfinContinueWatching();

	const movies: PlayableRadarrMovie[] = await radarrMoviesPromise.then(async (radarrMovies) => {
		const radarrDownloads = await radarrDownloadsPromise;
		const continueWatching = await continueWatchingPromise;

		return getLibraryMovies(radarrMovies, radarrDownloads, continueWatching);
	});

	return {
		movies,
		totalMovies: movies?.length || 0,
		getItem: (tmdbId: number) => movies.find((m) => m.tmdbId === tmdbId)
	};
}

export const library = writable<Promise<Library>>(getLibrary());

async function getLibraryMovies(
	radarrMovies: RadarrMovie[],
	radarrDownloads: RadarrDownload[],
	jellyfinContinueWatching: JellyfinItem[]
): Promise<PlayableRadarrMovie[]> {
	const playableMoviesPromises = radarrMovies.map(async (m) => {
		const radarrDownload = radarrDownloads.find((d) => d.movie.tmdbId === m.tmdbId);
		const jellyfinItem = jellyfinContinueWatching.find(
			(i) => i.ProviderIds?.Tmdb === String(m.tmdbId)
		);

		const downloadProgress = radarrDownload
			? radarrDownload.sizeleft && radarrDownload.size
				? ((radarrDownload.size - radarrDownload.sizeleft) / radarrDownload.size) * 100
				: 0
			: undefined;
		const completionTime = radarrDownload ? radarrDownload.estimatedCompletionTime : undefined;
		const download =
			downloadProgress && completionTime
				? { progress: downloadProgress, completionTime }
				: undefined;

		const length = jellyfinItem?.RunTimeTicks
			? jellyfinItem.RunTimeTicks / 10_000_000 / 60
			: undefined;
		const watchingProgress = jellyfinItem?.UserData?.PlayedPercentage;
		const continueWatching =
			length && watchingProgress ? { length, progress: watchingProgress } : undefined;

		const backdropUrl = await fetchTmdbMovieImages(String(m.tmdbId)).then(
			(r) => r.backdrops.filter((b) => b.iso_639_1 === 'en')[0].file_path
		);

		return {
			...m,
			cardBackdropUrl: backdropUrl,
			download,
			continueWatching
		};
	});

	return await Promise.all(playableMoviesPromises);
}
