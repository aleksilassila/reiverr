<script lang="ts">
	import I18n from './lib/components/Lang/I18n.svelte';
	import { Link, navigate, Route, Router } from 'svelte-navigator';
	import { fade } from 'svelte/transition';
	import { handleKeyboardNavigation, navigationContainers } from './lib/actions/focusAction';
	import HomePage from './lib/pages/HomePage.svelte';

	let focusableElements: HTMLElement[] = [];

	function registerArrayFocus(node: HTMLElement) {
		focusableElements.push(node);
		console.log('Added node', node);

		return {
			destroy() {
				focusableElements = focusableElements.filter((el) => el !== node);
				console.log('Removed node', node);
			}
		};
	}

	const navBarContainer = navigationContainers.navBar.getRegisterer();
	const mainContainer = navigationContainers.main.getRegisterer();
	const homeContainer = navigationContainers.home.getRegisterer();
</script>

<I18n />
<main class="bg-stone-950 text-white flex flex-1 w-screen">
	<Router>
		<nav class="border">
			<Link to="/">
				<div use:navBarContainer tabindex="0">Home</div>
			</Link>
			<Link to="library">
				<div use:navBarContainer tabindex="0">Library</div>
			</Link>
		</nav>

		<div class="flex-1 flex flex-col min-w-0" use:mainContainer>
			<Route path="/">
				<HomePage />
			</Route>
			<Route path="library">
				<div transition:fade|global>about path</div>
			</Route>
		</div>
	</Router>
</main>

<svelte:window on:keydown={handleKeyboardNavigation} />
