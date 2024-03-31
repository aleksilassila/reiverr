<script lang="ts">
	import I18n from './lib/components/Lang/I18n.svelte';
	import { Route, Router } from 'svelte-navigator';
	import { handleKeyboardNavigation } from './lib/selectable';
	import Container from './Container.svelte';
	import BrowseSeriesPage from './lib/pages/BrowseSeriesPage.svelte';
	import MoviesPage from './lib/pages/MoviesPage.svelte';
	import LibraryPage from './lib/pages/LibraryPage.svelte';
	import ManagePage from './lib/pages/ManagePage.svelte';
	import SearchPage from './lib/pages/SearchPage.svelte';
	import SeriesPage from './lib/pages/SeriesPage.svelte';
	import Sidebar from './lib/components/Sidebar/Sidebar.svelte';
	import LoginPage from './lib/pages/LoginPage.svelte';
	import { getReiverrApiClient } from './lib/apis/reiverr/reiverr-api';
	import { appState } from './lib/stores/app-state.store';
	import MoviePage from './lib/pages/MoviePage.svelte';
	import DetatchedPage from './lib/components/DetatchedPage/DetatchedPage.svelte';
	import Button from './lib/components/Button.svelte';

	getReiverrApiClient()
		.GET('/user', {})
		.then((res) => res.data)
		.then((user) => appState.setUser(user || null))
		.catch(() => appState.setUser(null));
</script>

<I18n />
<Container class="bg-stone-950 text-white flex flex-1 w-screen">
	{#if $appState.user === undefined}
		<div class="h-screen w-screen flex flex-col items-center justify-center">
			<div class="flex items-center justify-center hover:text-inherit selectable rounded-sm mb-2">
				<div class="rounded-full bg-amber-300 h-4 w-4 mr-2" />
				<h1 class="font-display uppercase font-semibold tracking-wider text-xl">Reiverr</h1>
			</div>
			<div>Loading...</div>
		</div>
	{:else if $appState.user === null}
		<LoginPage />
	{:else}
		<Router>
			<Container class="flex-1 flex flex-col min-w-0" direction="horizontal" trapFocus>
				<Sidebar />
				<Route path="/">
					<BrowseSeriesPage />
				</Route>
				<Route path="movies/*">
					<MoviesPage />
				</Route>
				<Route path="library">
					<LibraryPage />
				</Route>
				<Route path="manage">
					<ManagePage />
				</Route>
				<Route path="search">
					<SearchPage />
				</Route>
				<Route path="series/:id" component={SeriesPage} />
				<Route path="movie/:id" component={MoviePage} />
				<Route path="*">
					<div>404</div>
				</Route>
			</Container>
		</Router>

		<Router>
			<Route path="movies/movie/:id" component={MoviePage} />
		</Router>
	{/if}
</Container>

<svelte:window on:keydown={handleKeyboardNavigation} />
