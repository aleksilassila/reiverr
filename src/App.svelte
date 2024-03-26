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
	import { userStore } from './lib/stores/user.store';
	import LoginPage from './lib/pages/LoginPage.svelte';
	import { reiverrApi } from './lib/apis/reiverr/reiverrApi';

	reiverrApi
		.getApi()
		.GET('/user', {})
		.then((res) => res.data)
		.then((user) => userStore.set(user || null))
		.catch(() => userStore.set(null));
</script>

<I18n />
<Container horizontal class="bg-stone-950 text-white flex flex-1 w-screen">
	{#if $userStore === undefined}
		<div class="h-screen w-screen flex flex-col items-center justify-center">
			<div class="flex items-center justify-center hover:text-inherit selectable rounded-sm mb-2">
				<div class="rounded-full bg-amber-300 h-4 w-4 mr-2" />
				<h1 class="font-display uppercase font-semibold tracking-wider text-xl">Reiverr</h1>
			</div>
			<div>Loading...</div>
		</div>
	{:else if $userStore === null}
		<LoginPage />
	{:else}
		<Router>
			<Sidebar />

			<Container class="flex-1 flex flex-col min-w-0">
				<Route path="/">
					<BrowseSeriesPage />
				</Route>
				<Route path="movies">
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
				<Route path="*">
					<div>404</div>
				</Route>
			</Container>
		</Router>
	{/if}
</Container>

<svelte:window on:keydown={handleKeyboardNavigation} />
