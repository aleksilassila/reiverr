import type { PageServerLoad } from './$types';
import { RadarrApi, getRadarrMovies } from '$lib/radarr/radarr';
import type { CardProps } from '../components/Card/card';
import { fetchCardProps } from '../components/Card/card';

interface DownloadingCardProps extends CardProps {
	progress: number;
	completionTime: string;
}

export const load = (() => {
	const [downloading, available, unavailable] = getLibraryItems();

	// radarrMovies.then((d) => console.log(d.map((m) => m.ratings)));

	const libraryInfo = getLibraryInfo();

	return {
		streamed: {
			libraryInfo,
			downloading,
			available,
			unavailable
		}
	};
}) satisfies PageServerLoad;

async function getLibraryInfo(): Promise<any> { }

function getLibraryItems(): [Promise<DownloadingCardProps[]>, Promise<CardProps[]>, Promise<CardProps[]>] {
	const radarrMovies = getRadarrMovies();

	const downloadingRadarrMovies = RadarrApi.get('/api/v3/queue', {
		params: {
			query: {
				includeMovie: true
			}
		}
	}).then((r) => r.data?.records?.filter((record) => record.movie));

	const unavailable: Promise<CardProps[]> = radarrMovies.then(async (movies) => {
		const downloadingMovies = await downloadingRadarrMovies;
		return await Promise.all(
			movies
				?.filter(
					(m) =>
						(!m.movieFile || !m.movieFile || !m.isAvailable) &&
						!downloadingMovies?.find((d) => d.movie?.tmdbId === m.tmdbId)
				)
				.map(async (m) => fetchCardProps(m)) || []
		);
	});

	const available: Promise<CardProps[]> = radarrMovies.then(async (movies) => {
		const downloadingMovies = await downloading;
		const unavailableMovies = await unavailable;

		if (!downloadingMovies || !movies) return [];

		return await Promise.all(
			movies
				.filter((movie) => {
					return !downloadingMovies.find(
						(downloadingMovie) => downloadingMovie.tmdbId === String(movie.tmdbId)
					);
				})
				.filter(
					(movie) =>
						!unavailableMovies?.find(
							(unavailableMovie) => unavailableMovie.tmdbId === String(movie.tmdbId)
						)
				)
				.map(async (m) => fetchCardProps(m)) || []
		);
	});

	const downloading: Promise<DownloadingCardProps[]> = downloadingRadarrMovies.then(
		async (movies) => {
			return Promise.all(
				movies
					?.filter((m) => m?.movie?.tmdbId)
					?.map(
						async (m) =>
						({
							...(await fetchCardProps(m.movie as any)),
							progress: m.sizeleft && m.size ? ((m.size - m.sizeleft) / m.size) * 100 : 0,
							completionTime: m.estimatedCompletionTime
						} as DownloadingCardProps)
					) || []
			);
		}
	);

	return [downloading, available, unavailable];
}
