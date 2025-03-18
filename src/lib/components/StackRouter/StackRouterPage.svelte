<script lang="ts">
	import { useRegistrar } from '$lib/selectable';
	import classNames from 'classnames';
	import { get } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import Container from '../Container.svelte';
	import { focusSidebar } from '../Sidebar/sidebar';

	// const background = createBackgroundPage();

	export let hasSidebar = true;
	export let hidden = false;

	// Top element, that when focused and back is pressed, will exit the modal
	const topSelectable = useRegistrar();

	function handleGoBack() {
		// if ('willLeaveContainer' in detail) {
		// 	if (detail.direction !== 'left' || !detail.willLeaveContainer) return;
		// 	detail.preventNavigation();
		// }

		const selectable = get(topSelectable);
		if (selectable && get(selectable.focusIndex) === 0) {
			history.back();
		} else {
			selectable?.focusChild(0, { cycleTo: true }) || selectable?.focus({ cycleTo: true });
		}
	}

	function handleGoToTop() {
		const selectable = get(topSelectable);
		if (topSelectable) {
			selectable?.focusChild(0, { cycleTo: true }) || selectable?.focus({ cycleTo: true });
		} else handleGoBack();
	}

	// onDestroy(() => background.destroy())
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
	let:hasFocus
>
	<div in:fade|global={{ duration: 200, delay: 200 }} class="contents">
		{#if hasSidebar}
			<Container />
		{/if}
		<Container
			{...$$restProps}
			class="contents"
			on:back={handleGoToTop}
			focusOnMount
			on:navigate={({ detail }) => {
				if (detail.direction === 'left' && detail.willLeaveContainer) {
					detail.preventNavigation();
					focusSidebar();
				}
			}}
		>
			<slot {handleGoBack} registrar={topSelectable.registrar} {hasFocus} />
		</Container>
	</div>
</Container>
