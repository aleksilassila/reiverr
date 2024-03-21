<script lang="ts">
	import I18n from './lib/components/Lang/I18n.svelte';
	import { Route, Router } from 'svelte-navigator';
	import { handleKeyboardNavigation, Selectable } from './lib/selectable';
	import { onMount } from 'svelte';
	import Container from './Container.svelte';
	import BrowseSeriesPage from './lib/pages/BrowseSeriesPage.svelte';
	import MoviesPage from './lib/pages/MoviesPage.svelte';
	import LibraryPage from './lib/pages/LibraryPage.svelte';
	import ManagePage from './lib/pages/ManagePage.svelte';
	import SearchPage from './lib/pages/SearchPage.svelte';
	import SeriesPage from './lib/pages/SeriesPage.svelte';
	import Sidebar from './lib/components/Sidebar/Sidebar.svelte';

	let mainContent: Selectable;

	onMount(() => {
		mainContent.focus();
	});
</script>

<I18n />
<Container horizontal class="bg-stone-950 text-white flex flex-1 w-screen">
	<Router>
		<Sidebar />

		<Container bind:container={mainContent} class="flex-1 flex flex-col min-w-0">
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
</Container>

<svelte:window on:keydown={handleKeyboardNavigation} />
