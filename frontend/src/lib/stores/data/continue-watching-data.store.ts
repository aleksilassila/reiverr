import { createStoreContext } from '$lib/utils';
import { useData, useStaleable } from './data.store';
import { reiverrApi } from '../user.store';

export const continueWatchingSeriesContext = createStoreContext(`continue-watching-series`, () => {
	const data = useData(() =>
		reiverrApi.catalog
			.getMyList({
				mediaType: 'series',
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

export const continueWatchingMoviesContext = createStoreContext(`continue-watching-movies`, () => {
	const data = useData(() =>
		reiverrApi.catalog
			.getMyList({
				mediaType: 'movie',
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
