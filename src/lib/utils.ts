import type { Genre } from '$lib/tmdb-api';

export function getRuntime(minutes: number) {
	const hours = Math.floor(minutes / 60);
	const mins = Math.floor(minutes % 60);

	return `${hours > 0 ? hours + 'h ' : ''}${mins}min`;
}

export function formatGenres(genres: Genre[]) {
	return genres.map((genre) => genre.name.charAt(0).toUpperCase() + genre.name.slice(1)).join(', ');
}
