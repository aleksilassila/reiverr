import { createStoreContext } from '$lib/utils';
import { get } from 'svelte/store';
import { _useData, useStaleable } from './data.store';
import { reiverrApi, user } from './user.store';

export const continueWatchingSeriesContext = createStoreContext(`continue-watching-series`, () => {
	const data = _useData(() =>
		reiverrApi.library
			.getMyList(String(get(user)?.id), {
				type: 'series',
				order: 'last-played',
				status: 'continue-watching',
				itemsPerPage: 10
			})
			.then((r) => r.data.items)
	);

	const { setStale, unsubscribe } = useStaleable(() => data.update());

	return {
		data: data.data,
		promise: data.promise,
		isLoading: data.isLoading,
		setStale,
		unsubscribe
	};
});

export const continueWatchingMoviesContext = createStoreContext(`continue-watching-movies`, () =>
	{
		const data = _useData(() =>
			reiverrApi.library
				.getMyList(String(get(user)?.id), {
					type: 'movies',
					order: 'last-played',
					status: 'continue-watching',
					itemsPerPage: 10
				})
				.then((r) => r.data.items)
		);

		const { setStale, unsubscribe } = useStaleable(() => data.update());

		return {
			data: data.data,
			promise: data.promise,
			isLoading: data.isLoading,
			setStale,
			unsubscribe
		};
	}
);
