import { derived, get, writable } from 'svelte/store';
import { type ComponentType } from 'svelte';
import SeriesHomePage from '../../pages/SeriesHomePage.svelte';
import SeriesPage from '../SeriesPage/SeriesPage.svelte';
import EpisodePage from '../../pages/EpisodePage.svelte';
import { modalStack } from '../Modal/modal.store';
import MoviesHomePage from '../../pages/MoviesHomePage.svelte';
import MoviePage from '../../pages/MoviePage.svelte';
import LibraryPage from '../../pages/LibraryPage.svelte';
import SearchPage from '../../pages/SearchPage.svelte';
import PageNotFound from '../../pages/PageNotFound.svelte';
import ManagePage from '../../pages/ManagePage.svelte';

interface Page {
	id: symbol;
	route: Route;
	props?: Record<string, any>;
}

interface Route {
	path: string;
	component: ComponentType;
	default?: boolean;
	root?: boolean;
	parent?: Route;
}

export type StackRouterStore = ReturnType<typeof useStackRouter>;

type Indexes = { id: string; bottom: number; top: number };

export function useStackRouter({ routes, notFound }: { routes: Route[]; notFound: Route }) {
	const { initialPages, initialIndexes } = getInitialValues();
	const indexes = writable<Indexes>(initialIndexes);
	const pageStack = writable<Page[]>(initialPages);
	const visibleStack = derived([indexes, pageStack], ([$indexes, $stack]) => {
		return $stack.slice($indexes.bottom, $indexes.top + 1);
	});

	visibleStack.subscribe((v) => console.log('visibleStack', v));

	function getInitialValues() {
		const initialUrl = window.location.pathname;
		const initialPages = [routeStringToRoute(initialUrl)];

		let initialRouteParent = initialPages[0]?.route.parent;
		const initialProps = initialPages[0]?.props;
		while (initialRouteParent) {
			const newPage: Page = {
				id: Symbol(),
				route: initialRouteParent,
				props: initialProps
			};
			initialPages.unshift(newPage);
			initialRouteParent = initialRouteParent.parent;
		}
		const initialIndexes: Indexes = {
			id: Math.random().toString(36).slice(2),
			bottom: 0,
			top: initialPages.length - 1
		};

		history.replaceState(initialIndexes, '', initialUrl);
		return {
			initialPages,
			initialIndexes
		};
	}

	function routeStringToRoute(routeString: string): Page {
		for (const route of routes) {
			const targetParts = routeString.split('/');
			const routeParts = route.path.split('/');
			const params: Record<string, string> = {};

			if (targetParts.length !== routeParts.length) continue;
			let i = 0;
			while (i < targetParts.length) {
				if (routeParts[i]?.startsWith(':')) {
					const paramName = routeParts[i]?.slice(1);
					if (paramName) {
						// @ts-ignore
						params[paramName] = targetParts[i];
					}
				} else if (routeParts[i] !== targetParts[i]) break;
				i++;
			}
			if (i === targetParts.length) {
				return { props: params, id: Symbol(), route };
			}
		}

		return {
			id: Symbol(),
			route: notFound
		};
	}

	const navigate = (routeString: string, options: { replaceStack?: boolean } = {}) => {
		const page: Page = routeStringToRoute(routeString);
		const replaceStack = page.route.root || options.replaceStack || false;

		pageStack.update((prev) => {
			const idxs = get(indexes);
			if (replaceStack) return [page];
			else {
				prev.splice(idxs.top + 1, Infinity, page);
				return prev;
			}
		});

		if (replaceStack) {
			const stack = get(pageStack);
			indexes.update((prev) => {
				const indexes: Indexes = {
					id: Math.random().toString(36).slice(2),
					bottom: stack.length - 1,
					top: stack.length - 1
				};
				history.pushState(indexes, '', routeString);
				return indexes;
			});
		} else {
			indexes.update((prev) => {
				const indexes: Indexes = { id: prev.id, bottom: prev.bottom, top: prev.top + 1 };
				history.pushState(indexes, '', routeString);
				return indexes;
			});
		}
	};

	const handlePopState = (e: PopStateEvent) => {
		const newIndexes: Indexes = e.state;
		const prevIndexes = get(indexes);

		modalStack.reset();

		if (prevIndexes.id === newIndexes.id) {
			indexes.set(newIndexes);
		} else {
			const initialValues = getInitialValues();
			indexes.set(initialValues.initialIndexes);
			pageStack.set(initialValues.initialPages);
		}
	};

	const back = () => {
		// pageStack.update((prev) => {
		// 	if (prev.length > 1) {
		// 		prev.pop();
		// 	}
		// 	return prev;
		// });

		history.back();
	};

	return {
		subscribe: visibleStack.subscribe,
		navigate,
		back,
		handlePopState
	};
}

const seriesHomeRoute: Route = {
	path: '/series',
	default: true,
	root: true,
	component: SeriesHomePage
};

const seriesRoute: Route = {
	path: '/series/:id',
	component: SeriesPage,
	parent: seriesHomeRoute
};

const episodeRoute: Route = {
	path: '/series/:id/season/:season/episode/:episode',
	component: EpisodePage,
	parent: seriesRoute
};

const moviesHomeRoute: Route = {
	path: '/movies',
	component: MoviesHomePage,
	root: true
};

const movieRoute: Route = {
	path: '/movie/:id',
	component: MoviePage,
	parent: moviesHomeRoute
};

const libraryRoute: Route = {
	path: '/library',
	component: LibraryPage,
	root: true
};

const searchRoute: Route = {
	path: '/search',
	component: SearchPage,
	root: true
};

const manageRoute: Route = {
	path: '/manage',
	component: ManagePage,
	root: true
};

const notFoundRoute: Route = {
	path: '/404',
	component: PageNotFound,
	root: true
};

export const defaultStackRouter = useStackRouter({
	routes: [
		seriesHomeRoute,
		seriesRoute,
		episodeRoute,
		moviesHomeRoute,
		movieRoute,
		libraryRoute,
		searchRoute,
		manageRoute
	],
	notFound: notFoundRoute
});
// export const defaultStackRouter = useStackRouter({
// 	'/': {
// 		component: SeriesHomePage,
// 		default: true
// 	},
// 	'/series/:id': {
// 		component: SeriesPage
// 	},
// 	'/series/:id/season/:season/episode/:episode': {
// 		component: EpisodePage
// 	}
// 	// '/movies': {
// 	// 	component: MoviesHomePage
// 	// },
// 	// '/movies/:id': {
// 	// 	component: MoviePage
// 	// },
// 	// '/library': {
// 	// 	component: LibraryPage
// 	// },
// 	// '/settings': {
// 	// 	component: ManagePage
// 	// }
// } as const);

export const navigate = defaultStackRouter.navigate;
export const back = defaultStackRouter.back;
defaultStackRouter.subscribe(console.log);
