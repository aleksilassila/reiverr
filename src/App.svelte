<script lang="ts">
	import I18n from './lib/components/Lang/I18n.svelte';
	import { Link, Route, Router } from 'svelte-navigator';
	import { fade } from 'svelte/transition';
	import { Container, handleKeyboardNavigation } from './lib/actions/focusAction';
	import HomePage from './lib/pages/HomePage.svelte';

	const mainContainer = new Container('main').setDirection('horizontal').setFocusByDefault(true);
	const navBarContainer = mainContainer.createChild('nav').setDirection('vertical');
	const contentContainer = mainContainer.createChild('content').setDirection('vertical');

	const navBarRegisterer = navBarContainer.getRegisterer();
</script>

<I18n />
<main class="bg-stone-950 text-white flex flex-1 w-screen">
	<Router>
		<nav class="border">
			<Link to="/">
				<div use:navBarRegisterer tabindex="0">Home</div>
			</Link>

			<Link to="library">
				<div use:navBarRegisterer tabindex="0">Library</div>
			</Link>
		</nav>

		<div class="flex-1 flex flex-col min-w-0">
			<Route path="/">
				<HomePage container={contentContainer} />
			</Route>
			<Route path="library">
				<div transition:fade|global>about path</div>
			</Route>
		</div>
	</Router>
</main>

<svelte:window on:keydown={handleKeyboardNavigation} />
