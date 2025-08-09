<script lang="ts">
	import classNames from 'classnames';
	import type { Readable } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import Container from '../Container.svelte';
	import { focusSidebar } from '../Sidebar/sidebar';
	import { createStackRouterPage } from './StackRouter';
	import Sidebar from '../Sidebar/Sidebar.svelte';

	export let hasSidebar = true;
	export let hidden = false;

	// Top element, that when focused and back is pressed, will exit the modal
	const { handleGoBack, handleGoToTop, registrar, hasFocus } = createStackRouterPage();
	let hasFocusWithin: Readable<boolean>;
	$: {
		if (hasFocusWithin) {
			hasFocus.set($hasFocusWithin);
		}
	}
</script>

<Container
	class={classNames(
		'fixed inset-0 overflow-y-auto scrollbar-hide transition-opacity duration-200 ease-linear',
		{
			'opacity-100': !hidden,
			'opacity-0': hidden
		}
	)}
	style="backface-visibility: hidden;"
	trapFocus
	focusOnMount
	direction="horizontal"
	on:mount
	bind:hasFocusWithin
>
	<div in:fade|global={{ duration: 200, delay: 200 }} class="contents">
		{#if hasSidebar}
			<Sidebar />
		{/if}
		<Container
			{...$$restProps}
			class="contents"
			on:back={handleGoToTop}
			focusOnMount
			on:navigate={({ detail }) => {
				// if (detail.direction === 'left' && detail.willLeaveContainer) {
				// 	detail.preventNavigation();
				// 	focusSidebar();
				// }
			}}
		>
			<slot />
		</Container>
	</div>
</Container>
