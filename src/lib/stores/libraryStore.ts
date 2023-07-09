import {
	getRadarrDownloads,
	getRadarrMovies,
	RadarrApi,
	type RadarrMovie
} from '$lib/apis/radarr/radarrApi';
import type { CardProps } from '$lib/components/Card/card';
import { writable } from 'svelte/store';
import { fetchCardProps } from '$lib/components/Card/card';
import { fetchTmdbMovieImages } from '$lib/apis/tmdbApi';

interface PlayableRadarrMovie extends RadarrMovie {
	cardBackdropUrl: string;
	download?: {
		progress: number;
		completionTime: string;
	};
}

export interface Library {
	movies: PlayableRadarrMovie[];
	totalMovies: number;
}

interface DownloadingCardProps extends CardProps {
	progress: number;
	completionTime: string;
}

async function getLibrary(): Promise<Library> {
	const radarrMoviesPromise = getRadarrMovies();
	const radarrDownloadsPromise = getRadarrDownloads();

	const movies: PlayableRadarrMovie[] = await radarrMoviesPromise.then(async (radarrMovies) => {
		const radarrDownloads = await radarrDownloadsPromise;

		const playableMoviePromises = radarrMovies.map(async (m) => {
			const radarrDownload = radarrDownloads.find((d) => d.movie.tmdbId === m.tmdbId);

			const progress = radarrDownload
				? radarrDownload.sizeleft && radarrDownload.size
					? ((radarrDownload.size - radarrDownload.sizeleft) / radarrDownload.size) * 100
					: 0
				: undefined;
			const completionTime = radarrDownload ? radarrDownload.estimatedCompletionTime : undefined;
			const download = progress && completionTime ? { progress, completionTime } : undefined;

			const backdropUrl = await fetchTmdbMovieImages(String(m.tmdbId)).then(
				(r) => r.backdrops.filter((b) => b.iso_639_1 === 'en')[0].file_path
			);

			return {
				...m,
				cardBackdropUrl: backdropUrl,
				download
			};
		});

		return await Promise.all(playableMoviePromises);
	});

	return {
		movies,
		totalMovies: movies?.length || 0
	};
}

export const library = writable<Promise<Library>>(getLibrary());
