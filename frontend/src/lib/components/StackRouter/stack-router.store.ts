import CompanyPage from '$lib/pages/CollectionPages/CompanyPage.svelte';
import ListPage from '$lib/pages/CollectionPages/ListPage.svelte';
import NetworkPage from '$lib/pages/CollectionPages/NetworkPage.svelte';
import { Selectable } from '$lib/selectable';
import { linkedListToArray } from '$lib/utils';
import {
	getContext as getSvelteContext,
	SvelteComponentTyped,
	type ComponentProps,
	type ComponentType
} from 'svelte';
import { writable, type Readable, type Writable } from 'svelte/store';
import LibraryPage from '../../pages/LibraryPage/LibraryPage.svelte';
import ManagePage from '../../pages/ManagePage/ManagePage.svelte';
import MoviesHomePage from '../../pages/MoviesHomePage.svelte';
import PageNotFound from '../../pages/PageNotFound.svelte';
import PersonPage from '../../pages/PersonPage.svelte';
import SearchPage from '../../pages/SearchPage.svelte';
import SeriesHomePage from '../../pages/SeriesHomePage.svelte';
import EpisodePage from '../../pages/TitlePages/EpisodePage.svelte';
import MoviePage from '../../pages/TitlePages/MoviePage/MoviePage.svelte';
import SeriesPage from '../../pages/TitlePages/SeriesPage/SeriesPage.svelte';
import UiComponents from '../../pages/UIComponents.svelte';
import UsersPage from '../../pages/UsersPage.svelte';

export type CreateCompStackPage<T extends SvelteComponentTyped = SvelteComponentTyped> = {
	component: ComponentType<T>;
	props: ComponentProps<T>;

	id?: symbol;
	group?: symbol | 'top';

	preventScroll?: boolean;
	trapFocus?: boolean;
	sidebar?: boolean;
};

export interface CompStackPage extends CreateCompStackPage {
	context: Record<string, unknown>;
	pages: CompStackPage[];

	hasContext: (key: string) => boolean;
	getContext: <T = unknown>(key: string) => T;
	setContext: <T = unknown>(key: string, value: T) => void;
	handleMount: () => void;
	close: () => void;
	push: (opts: CreateCompStackPage) => void;
}

export interface CompStackForPageContext extends Readonly<CompStackPage> {
	readonly root: Readable<Selectable | undefined>;
}

class RouteGroup {
	pages: CompStackPage[] = [];
	groups: RouteGroup[];
	handleUpdate: () => void;

	constructor(opts: {
		groups: RouteGroup[];
		route: Route;
		props: Record<string, unknown>;
		handleUpdate: () => void;
	}) {
		this.groups = opts.groups;
		this.handleUpdate = opts.handleUpdate;
		this.createRoutePage(opts.route, opts.props);
	}

	private hasContext(context: Record<string, unknown>) {
		return (key: string): boolean => key in context;
	}

	private getContext(context: Record<string, unknown>) {
		return <T = unknown>(key: string): T => context[key] as T;
	}

	private setContext(context: Record<string, unknown>) {
		return <T = unknown>(key: string, value: T): void => {
			context[key] = value;
		};
	}

	private close(id: symbol) {
		const index = this.pages.findIndex((p) => p.id === id);
		if (index !== -1) {
			this.pages.splice(index, 1);
		}
		this.handleUpdate();
	}

	push(opts: CreateCompStackPage) {
		const previousPage = this.pages.length > 0 ? this.pages[this.pages.length - 1] : undefined;
		const previousContext = previousPage?.context ?? {};
		const context = {};

		const id = opts.id ?? Symbol();

		const page: CompStackPage = {
			id,
			group: (opts.group === 'top' ? previousPage?.group : opts.group) ?? Symbol(),
			component: opts.component,
			props: opts.props,
			preventScroll: opts.preventScroll ?? false,
			trapFocus: opts.trapFocus ?? true,
			sidebar: opts.sidebar ?? false,
			context,
			pages: this.pages,
			hasContext: this.hasContext(context),
			getContext: this.getContext(context),
			setContext: this.setContext(context),
			handleMount: () => this.initializeContext(context, previousContext),
			close: () => this.close(id),
			push: (newOpts) => this.push(newOpts)
		};
		this.pages.push(page);
		this.handleUpdate();
	}

	private createRoutePage(route: Route, props: Record<string, unknown>) {
		const previousGroup = this.groups[this.groups.length - 1];
		const previousContext = previousGroup?.pages[previousGroup.pages.length - 1]?.context ?? {};

		const context: Record<string, unknown> = {};
		const page: CompStackPage = {
			id: Symbol(),
			group: Symbol(),
			component: route.component,
			props,
			preventScroll: false,
			trapFocus: true,
			sidebar: route.sidebar ?? true,
			context,
			pages: this.pages,
			hasContext: this.hasContext(context),
			getContext: this.getContext(context),
			setContext: this.setContext(context),
			handleMount: () => this.initializeContext(context, previousContext),
			close: () => history.back(),
			push: (opts) => this.push(opts)
		};
		this.pages.push(page);
		// Don't update visibleStack yet, update history first
	}

	initializeContext(context: Record<string, unknown>, previousContext: Record<string, unknown>) {
		if (context.didInitialize) return;
		context.didInitialize = true;

		for (const key in previousContext) {
			if (!(key in context)) {
				context[key] = previousContext[key];
			}
		}
	}

	handleUnmount() {
		this.pages.splice(1);
	}
}

interface Route {
	path: string;
	component: ComponentType;
	default?: boolean;
	// When root is navigated to, stack is cleared
	root?: boolean;
	// Parent route, that is always rendered under this route, possibly sharing props that are a subset of the child's props.
	// Child's props are also passed to these.
	parent?: Route;
	sidebar?: boolean;
}

// Defines what part of the stack is visible (not always the last x pages)
type HistoryState = {
	// Id is used to identify if the history state belongs to the same stack instance, to deduce if stack has to be rebuilt
	id: string;
	end: number;
};

export type StackRouterStore = ReturnType<typeof useStackRouter>;

export function useStackRouter({
	routes,
	notFound,
	maxDepth
}: {
	routes: Route[];
	notFound: Route;
	maxDepth?: number;
}) {
	const groups: RouteGroup[] = [];
	let historyState: HistoryState = {
		id: Math.random().toString(36).slice(2),
		end: 0
	};
	// Only updates when historyState changes
	const visibleStack: Writable<Array<CompStackPage>> = writable([]);
	visibleStack.subscribe(console.log);

	initializeFromUrl();

	function updateVisibleStack() {
		const start = Math.max(0, historyState.end - (maxDepth ?? Infinity) + 1);
		const newVisibleStack = groups
			.slice(start, historyState.end + 1)
			.map((g) => g.pages)
			.flat();

		// Unmount hidden
		for (let i = 0; i < start; i++) {
			groups[i]?.handleUnmount();
		}

		visibleStack.set(newVisibleStack);
	}

	function routeStringToRoutes(routeString: string): {
		top: Route;
		routes: Array<Route>;
		params: Record<string, string>;
	} {
		let matchedRoute: Route = notFound;
		let matchedParams: Record<string, string> = {};

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
				matchedRoute = route;
				matchedParams = params;
				break;
			}
		}

		const allRoutes = linkedListToArray(matchedRoute, (r) => r.parent).reverse();

		return {
			top: matchedRoute,
			routes: allRoutes,
			params: matchedParams
		};
	}

	function initializeFromUrl() {
		const initialUrl = window.location.pathname;
		const { routes, params } = routeStringToRoutes(initialUrl);

		groups.splice(0);
		for (const route of routes) {
			groups.push(
				new RouteGroup({ groups, route, props: params, handleUpdate: updateVisibleStack })
			);
		}

		historyState = {
			id: Math.random().toString(36).slice(2),
			end: groups.length - 1
		};

		history.replaceState(historyState, '', initialUrl);
		updateVisibleStack();
	}

	const navigate = (
		routeString: string,
		options: { replaceStack?: boolean; refresh?: boolean } = {}
	) => {
		if (options.refresh) {
			location.assign(routeString);
			return;
		}

		const { top: topRoute, params } = routeStringToRoutes(routeString);

		const replaceStack = options.replaceStack ?? topRoute.root ?? false;

		const group = new RouteGroup({
			groups,
			route: topRoute,
			props: params,
			handleUpdate: updateVisibleStack
		});

		if (replaceStack) {
			groups.splice(0);
			groups.push(group);
			historyState = {
				id: Math.random().toString(36).slice(2),
				end: 0
			};
			history.pushState(historyState, '', routeString);
		} else {
			groups.splice(historyState.end + 1, Infinity, group); // Remove any forward history

			historyState.end = historyState.end + 1;
			history.pushState(historyState, '', routeString);
		}

		updateVisibleStack();
	};

	/** Handle browser history navigation, https://developer.mozilla.org/en-US/docs/Web/API/Window/popstate_event */
	const handlePopState = (e: PopStateEvent) => {
		const newHistory: HistoryState = e.state;

		if (historyState.id === newHistory.id) {
			historyState = newHistory;
			updateVisibleStack();
		} else {
			// Rebuild stack
			initializeFromUrl();
		}
	};

	const back = () => {
		if (historyState.end === 0) return;

		history.back();
	};

	return {
		subscribe: visibleStack.subscribe,
		navigate,
		back,
		handlePopState
	};
}

const usersRoute: Route = {
	path: '/users',
	root: true,
	component: UsersPage,
	sidebar: false
};

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

const networkRoute: Route = {
	path: '/network/:network',
	component: NetworkPage,
	parent: seriesHomeRoute
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

const collectionRoute: Route = {
	path: '/collection/:collection',
	component: ListPage,
	parent: moviesHomeRoute
};

const companyRoute: Route = {
	path: '/company/:company',
	component: CompanyPage,
	parent: moviesHomeRoute
};

const personRoute: Route = {
	path: '/person/:id',
	component: PersonPage
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

const uiComponentsRoute: Route = {
	path: '/ui-components',
	component: UiComponents,
	root: true
};

const notFoundRoute: Route = {
	path: '/404',
	component: PageNotFound,
	root: true
};

export const stackRouter = useStackRouter({
	routes: [
		usersRoute,
		seriesHomeRoute,
		seriesRoute,
		episodeRoute,
		networkRoute,
		moviesHomeRoute,
		movieRoute,
		collectionRoute,
		companyRoute,
		personRoute,
		libraryRoute,
		searchRoute,
		manageRoute,
		uiComponentsRoute
	],
	notFound: notFoundRoute
	// maxDepth: 3
});

export const STACK_ROUTER_CONTEXT = 'stack-router-context';

export function useComponentStack() {
	return getSvelteContext<CompStackForPageContext>(STACK_ROUTER_CONTEXT);
}

export function hasContext(key: string): boolean {
	return useComponentStack().hasContext(key);
}

export function getContext<T = unknown>(key: string): T {
	return useComponentStack().getContext(key);
}

export function setContext<T = unknown>(key: string, value: T): void {
	return useComponentStack().setContext(key, value);
}

export const navigate = stackRouter.navigate;
