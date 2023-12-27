<script lang="ts">
	import I18n from './lib/components/Lang/I18n.svelte';
	import { Link, navigate, Route, Router } from 'svelte-navigator';
	import { fade } from 'svelte/transition';
	import { handleKeyboardNavigation, navigationContainers } from './lib/actions/focusAction';

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
	const homeContainer = navigationContainers.home.getRegisterer();
</script>

<I18n />
<main class="bg-stone-950 text-white flex">
	<Router>
		<nav class="border">
			<Link to="/">
				<div use:navBarContainer tabindex="0">Home</div>
			</Link>
			<Link to="about">
				<div use:navBarContainer tabindex="0">About</div>
			</Link>
		</nav>

		<div class="flex-1">
			<Route path="/">
				<div class="flex flex-row">
					<div use:homeContainer tabindex="0" transition:fade|global class="focus:ring">
						Home path
					</div>
					<div use:homeContainer tabindex="0" transition:fade|global class="focus:ring">
						Another item
					</div>
					<div use:homeContainer tabindex="0" transition:fade|global class="focus:ring">
						Button perhaps?
					</div>
				</div>
			</Route>
			<Route path="about">
				<div transition:fade|global>about path</div>
			</Route>
		</div>
	</Router>
</main>

<svelte:window on:keydown={handleKeyboardNavigation} />
