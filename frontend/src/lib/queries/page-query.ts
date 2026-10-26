import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';
import {
	createInfiniteQuery,
	createQuery,
	type CreateInfiniteQueryOptions,
	type CreateInfiniteQueryResult,
	type CreateQueryOptions,
	type CreateQueryResult,
	type DefaultError,
	type InfiniteData,
	type QueryKey,
	type StoreOrVal
} from '@tanstack/svelte-query';
import { tick } from 'svelte';
import type { Action } from 'svelte/action';
import { derived, get, readable } from 'svelte/store';

/** The options, disabled while another page covers the component's page */
function enabledAtFront<TOptions extends { enabled?: unknown }>(options: StoreOrVal<TOptions>) {
	// Outside the router (the users page) nothing covers the component
	const isHidden = useComponentStack()?.isHidden ?? readable(false);
	const optionsStore = 'subscribe' in options ? options : readable(options);

	return derived([optionsStore, isHidden], ([$options, $isHidden]) => ({
		...$options,
		enabled: !$isHidden && ($options.enabled ?? true)
	}));
}

/**
 * A query of a page of the stack router. It fetches while the page is at the front of the stack
 * and keeps its data while another page covers it: an invalidation refetches only what is on
 * screen, and a page that comes back refetches what went stale while it was covered.
 */
export function usePageQuery<
	TQueryFnData = unknown,
	TError = DefaultError,
	TData = TQueryFnData,
	TQueryKey extends QueryKey = QueryKey
>(
	options: StoreOrVal<CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>>
): CreateQueryResult<TData, TError> {
	return createQuery(enabledAtFront(options));
}

/**
 * A list of a page of the stack router (`pagedQueryOptions`), fetched like {@link usePageQuery}.
 * `loadMore` is the action of the element after the list: while it is in view, the next page is
 * fetched, if there is one and nothing is fetching. It looks again whenever a fetch settles, since
 * a page that does not push it out of view, or a fetch that was running when it came into view,
 * leaves it in view without a new intersection.
 */
export function usePageInfiniteQuery<
	TQueryFnData,
	TError = DefaultError,
	TData = InfiniteData<TQueryFnData>,
	TQueryKey extends QueryKey = QueryKey,
	TPageParam = unknown
>(
	options: StoreOrVal<
		CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>
	>
): CreateInfiniteQueryResult<TData, TError> & { loadMore: Action } {
	const query = createInfiniteQuery(enabledAtFront(options));

	const loadMore: Action = (node) => {
		const observer = new IntersectionObserver(
			([entry]) => {
				const { hasNextPage, isFetching, fetchNextPage } = get(query);
				if (entry?.isIntersecting && hasNextPage && !isFetching) fetchNextPage();
			},
			{ threshold: 0.1 }
		);
		observer.observe(node);

		// Observing again reports where the element is once the new rows are rendered
		let wasFetching = false;
		const unsubscribe = query.subscribe(({ isFetching }) => {
			if (wasFetching && !isFetching) {
				tick().then(() => {
					observer.unobserve(node);
					observer.observe(node);
				});
			}
			wasFetching = isFetching;
		});

		return {
			destroy() {
				unsubscribe();
				observer.disconnect();
			}
		};
	};

	return { subscribe: query.subscribe, loadMore };
}
