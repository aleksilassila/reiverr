<script lang="ts">
	import I18n from './lib/components/Lang/I18n.svelte';
	import { Link, Route, Router } from 'svelte-navigator';
	import { handleKeyboardNavigation, mainContainer } from './lib/actions/focusAction';
	import SeriesPage from './lib/pages/SeriesPage.svelte';
	import MoviesPage from './lib/pages/MoviesPage.svelte';
	import LibraryPage from './lib/pages/LibraryPage.svelte';
	import ManagePage from './lib/pages/ManagePage.svelte';
	import SearchPage from './lib/pages/SearchPage.svelte';
	import { onMount } from 'svelte';
	import classNames from 'classnames';
	import { Bookmark, CardStack, Gear, Laptop, MagnifyingGlass } from 'radix-icons-svelte';
	import NavbarItem from './lib/components-new/NavbarItem.svelte';

	const navBarContainer = mainContainer.createChild('nav').setDirection('vertical');
	const isNavBarOpen = navBarContainer.hasFocusWithin;

	const contentContainer = mainContainer.createChild('content').setDirection('vertical');

	onMount(() => {
		contentContainer.focus();
	});
</script>

<I18n />
<main class="bg-stone-950 text-white flex flex-1 w-screen">
	<Router>
		<nav
			class={classNames('flex flex-col', 'p-4', {
				border: $isNavBarOpen
			})}
		>
			<div>
				<Link to="" class="rounded-sm flex items-center">
					<div class="rounded-full bg-amber-300 h-4 w-4 mr-2" />
					<h1 class="font-display uppercase font-semibold tracking-wider text-xl">Reiverr</h1>
				</Link>
			</div>

			<div class="flex flex-col flex-1 justify-center">
				<NavbarItem parentContainer={navBarContainer} to="series">
					<Laptop class="w-8 h-8 mr-3" slot="icon" />
					<span class="text-xl" slot="text"> Series</span>
				</NavbarItem>
				<NavbarItem parentContainer={navBarContainer} to="movies">
					<CardStack class="w-8 h-8 mr-3" slot="icon" />
					<span class="text-xl" slot="text"> Movies</span>
				</NavbarItem>
				<NavbarItem parentContainer={navBarContainer} to="library">
					<Bookmark class="w-8 h-8 mr-3" slot="icon" />
					<span class="text-xl" slot="text"> Library</span>
				</NavbarItem>
				<NavbarItem parentContainer={navBarContainer} to="search">
					<MagnifyingGlass class="w-8 h-8 mr-3" slot="icon" />
					<span class="text-xl" slot="text"> Search</span>
				</NavbarItem>
			</div>

			<div>
				<NavbarItem parentContainer={navBarContainer} to="manage">
					<Gear class="w-8 h-8 mr-3" slot="icon" />
					<span class="text-xl" slot="text"> Manage</span>
				</NavbarItem>
			</div>
		</nav>

		<div class="flex-1 flex flex-col min-w-0">
			<Route>
				<SeriesPage container={contentContainer} />
			</Route>
			<Route path="movies">
				<MoviesPage container={contentContainer} />
			</Route>
			<Route path="library">
				<LibraryPage container={contentContainer} />
			</Route>
			<Route path="manage">
				<ManagePage container={contentContainer} />
			</Route>
			<Route path="search">
				<SearchPage container={contentContainer} />
			</Route>
		</div>
	</Router>
</main>

<svelte:window on:keydown={handleKeyboardNavigation} />
