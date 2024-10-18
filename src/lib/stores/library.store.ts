import { writable } from 'svelte/store';
import { reiverrApi, type TitleDto, type TitleType } from '../apis/reiverr/reiverr-api';
import type { MyListDto } from '../apis/reiverr/reiverr-api';
import {
	tmdbApi,
	type TmdbMovie2,
	type TmdbMovieFull2,
	type TmdbSeries2,
	type TmdbSeriesFull2
} from '../apis/tmdb/tmdb-api';

// type TmdbList = {
// 	movies: {
// 		[key: string]: TmdbMovie2;
// 	};
// 	series: {
// 		[key: string]: TmdbSeries2;
// 	};
// };
type MyList = {
	movies: {
		[key: string]: TitleDto;
	};
	series: {
		[key: string]: TitleDto;
	};
};

function useLibrary() {
	const store = writable<MyList | undefined>(undefined);

	// reiverrApi.getLibrary().then((myList) => {
	// 	store.set(listToObject(myList));
	// });
	setTimeout(refreshLibrary, 2000); //TODO: Fix this
	// refreshLibrary().then();

	async function refreshLibrary() {
		// return tmdbApi.getLibrary().then((myList) => {
		// 	const obj: TmdbList = {
		// 		movies: {},
		// 		series: {}
		// 	};
		//
		// 	myList.forEach((item) => {
		// 		if (item?.type === 'movie') {
		// 			obj.movies[String(item.id) || ''] = item;
		// 		} else {
		// 			obj.series[String(item.id) || ''] = item;
		// 		}
		// 	});
		//
		// 	store.set(obj);
		// });

		return reiverrApi.getLibrary().then(async (myList) => {
			const obj: MyList = {
				movies: {},
				series: {}
			};

			// const movies: Promise<TmdbMovieFull2 | undefined>[] = [];
			// const series: Promise<TmdbSeriesFull2 | undefined>[] = [];

			myList.forEach((item) => {
				if (item?.type === 'movie') {
					// movies.push(tmdbApi.getMovie(item.tmdbId));
					// obj.movies[String(item.id) || ''] = item;
					obj.movies[String(item.id) || ''] = item;
				} else {
					// series.push(tmdbApi.getSeries(item.tmdbId));
					// obj.series[String(item.id) || ''] = item;
					obj.series[String(item.id) || ''] = item;
				}
			});

			// await Promise.all(movies).then((movies) => {
			// 	movies.forEach((m) => {
			// 		if (m) obj.movies[String(m.id) || ''] = m;
			// 	});
			// });
			// await Promise.all(series).then((series) => {
			// 	series.forEach((s) => {
			// 		if (s) obj.series[String(s.id) || ''] = s;
			// 	});
			// });

			store.set(obj);
		});
	}

	// function listToObject(list: TitleDto[]) {
	// 	const obj: MyList = {};
	// 	list.forEach((item) => {
	// 		obj[item.tmdbId] = true;
	// 	});
	// 	return obj;
	// }

	async function add(tmdbId: number, type: TitleType) {
		// const res = await tmdbApi.addToLibrary(tmdbId, type);
		//
		// if (res?.success) {
		// 	return refreshLibrary();
		// }

		const res = await reiverrApi.addToLibrary(tmdbId, type);

		if (res !== undefined) {
			if (type === 'movie') {
				// const m = await tmdbApi.getMovie(tmdbId);

				store.update((obj) => {
					// if (obj && m) obj.movies[tmdbId] = m;
					if (obj) obj.movies[tmdbId] = res;
					return obj;
				});
			} else {
				// const s = await tmdbApi.getSeries(tmdbId);

				store.update((obj) => {
					// if (obj && s) obj.series[tmdbId] = s;
					if (obj) obj.series[tmdbId] = res;
					return obj;
				});
			}
		}
	}

	async function remove(tmdbId: number, type: TitleType) {
		// const res = await tmdbApi.removeFromLibrary(tmdbId, type);
		//
		// if (res?.success) {
		// 	return refreshLibrary();
		// }

		const res = await reiverrApi.removeFromLibrary(tmdbId, type);

		if (res !== undefined) {
			if (type === 'movie') {
				store.update((obj) => {
					if (obj) delete obj.movies[tmdbId];
					return obj;
				});
			} else {
				store.update((obj) => {
					if (obj) delete obj.series[tmdbId];
					return obj;
				});
			}
		}
	}

	return {
		subscribe: store.subscribe,
		add,
		remove
	};
}

export const myList = useLibrary();
