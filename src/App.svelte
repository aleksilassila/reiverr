<script lang="ts">
	import I18n from './lib/components/Lang/I18n.svelte';
	import { Link, Route, Router } from 'svelte-navigator';
	import { handleKeyboardNavigation, Selectable } from './lib/selectable';
	import { onMount } from 'svelte';
	import Container from './Container.svelte';
	import NavbarItem from './lib/components/NavbarItem.svelte';
	import { Bookmark, CardStack, Gear, Laptop, MagnifyingGlass } from 'radix-icons-svelte';
	import classNames from 'classnames';
	import type { Readable } from 'svelte/store';
	import BrowseSeriesPage from './lib/pages/BrowseSeriesPage.svelte';
	import MoviesPage from './lib/pages/MoviesPage.svelte';
	import LibraryPage from './lib/pages/LibraryPage.svelte';
	import ManagePage from './lib/pages/ManagePage.svelte';
	import SearchPage from './lib/pages/SearchPage.svelte';
	import SeriesPage from './lib/pages/SeriesPage.svelte';

	let mainContent: Selectable;

	onMount(() => {
		mainContent.focus();
	});

	let isNavBarOpen: Readable<boolean>;
</script>

<I18n />
<Container horizontal class="bg-stone-950 text-white flex flex-1 w-screen">
	<Router>
		<Container
			class={classNames('flex flex-col', 'p-4', {
				border: $isNavBarOpen
			})}
			bind:isNavBarOpen
		>
			<div>
				<Link to="" class="rounded-sm flex items-center">
					<div class="rounded-full bg-amber-300 h-4 w-4 mr-2" />
					<h1 class="font-display uppercase font-semibold tracking-wider text-xl">Reiverr</h1>
				</Link>
			</div>

			<div class="flex flex-col flex-1 justify-center">
				<NavbarItem to="/">
					<Laptop class="w-8 h-8 mr-3" slot="icon" />
					<span class="text-xl" slot="text"> Series</span>
				</NavbarItem>
				<NavbarItem to="movies">
					<CardStack class="w-8 h-8 mr-3" slot="icon" />
					<span class="text-xl" slot="text"> Movies</span>
				</NavbarItem>
				<NavbarItem to="library">
					<Bookmark class="w-8 h-8 mr-3" slot="icon" />
					<span class="text-xl" slot="text"> Library</span>
				</NavbarItem>
				<NavbarItem to="search">
					<MagnifyingGlass class="w-8 h-8 mr-3" slot="icon" />
					<span class="text-xl" slot="text"> Search</span>
				</NavbarItem>
			</div>

			<div>
				<NavbarItem to="manage">
					<Gear class="w-8 h-8 mr-3" slot="icon" />
					<span class="text-xl" slot="text"> Manage</span>
				</NavbarItem>
			</div>
		</Container>

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
