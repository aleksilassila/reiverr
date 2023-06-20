import type { Genre } from '$lib/tmdb-api';
import { writable } from 'svelte/store';

export function formatMinutes(minutes: number) {
	const hours = Math.floor(minutes / 60);
	const mins = Math.floor(minutes % 60);

	return `${hours > 0 ? hours + 'h ' : ''}${mins}min`;
}

export function formatGenres(genres: Genre[]) {
	return genres.map((genre) => genre.name.charAt(0).toUpperCase() + genre.name.slice(1)).join(', ');
}

export function formatSize(size: number) {
	const gbs = size / 1024 / 1024 / 1024;
	const mbs = size / 1024 / 1024;

	if (gbs >= 1) {
		return `${gbs.toFixed(2)} GB`;
	} else {
		return `${mbs.toFixed(2)} MB`;
	}
}

export function request<R, A>(fetcher: (arg: A) => Promise<R>, args: A | undefined = undefined) {
	const loading = writable(args !== undefined);
	const error = writable<Error | null>(null);
	const data = writable<R | null>(null);
	const didLoad = writable(false);

	async function load(arg: A) {
		loading.set(true);
		error.set(null);

		fetcher(arg)
			.then((d) => {
				// if (typeof window !== undefined) console.log('request data', d);
				data.set(d);
			})
			.catch((e) => error.set(e))
			.finally(() => {
				loading.set(false);
				didLoad.set(true);
			});
	}

	if (args !== undefined) {
		load(args);
	}

	return {
		loading,
		error,
		data,
		didLoad,
		load
	};
}
