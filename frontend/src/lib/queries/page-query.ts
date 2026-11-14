import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';
import {
	createInfiniteQuery,
	createQuery,
	type Accessor,
	type CreateInfiniteQueryOptions,
	type CreateInfiniteQueryResult,
	type CreateQueryOptions,
	type CreateQueryResult,
	type DefaultError,
	type InfiniteData,
	type QueryKey
} from '@tanstack/svelte-query';
import type { Attachment } from 'svelte/attachments';
import { fromStore, readable } from 'svelte/store';

/** The options, disabled while another page covers the component's page */
function enabledAtFront<TOptions extends { enabled?: unknown }>(options: Accessor<TOptions>) {
	// Outside the router (the users page) nothing covers the component
	const isHidden = fromStore(useComponentStack()?.isHidden ?? readable(false));

	return () => {
		const current = options();
		return { ...current, enabled: !isHidden.current && (current.enabled ?? true) };
	};
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
	options: Accessor<CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>>
): CreateQueryResult<TData, TError> {
	return createQuery(enabledAtFront(options));
}

/** A list of a page of the stack router (`pagedQueryOptions`), fetched like {@link usePageQuery} */
export function usePageInfiniteQuery<
	TQueryFnData,
	TError = DefaultError,
	TData = InfiniteData<TQueryFnData>,
	TQueryKey extends QueryKey = QueryKey,
	TPageParam = unknown
>(
	options: Accessor<CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>>
): CreateInfiniteQueryResult<TData, TError> {
	return createInfiniteQuery(enabledAtFront(options));
}

/**
 * The attachment of the element after a list ({@link usePageInfiniteQuery}): while it is in view,
 * the next page is fetched, if there is one and nothing is fetching. It observes anew whenever a
 * fetch settles, since a page that does not push it out of view, or a fetch that was running when
 * it came into view, leaves it in view without a new intersection.
 *
 * @example
 * <div {@attach loadMore(titles)}></div>
 */
export function loadMore(
	query: Pick<CreateInfiniteQueryResult, 'hasNextPage' | 'isFetching' | 'fetchNextPage'>
): Attachment {
	return (node) => {
		if (!query.hasNextPage || query.isFetching) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) query.fetchNextPage();
			},
			{ threshold: 0.1 }
		);
		observer.observe(node);

		return () => observer.disconnect();
	};
}
