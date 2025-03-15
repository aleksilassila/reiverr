<script lang="ts">
	import { useRegistrar } from '$lib/selectable';
	import { get } from 'svelte/store';
	import Container from '../Container.svelte';
	import { createBackgroundPage } from '../GlobalBackground/BackgroundStack';
	import { focusSidebar } from '../Sidebar/sidebar';
	import classNames from 'classnames';
	import { fade } from 'svelte/transition';

	createBackgroundPage();

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
</script>

<Container
	class={classNames(
		'fixed inset-0 overflow-y-auto scrollbar-hide transition-opacity duration-200',
		{
			'opacity-100': !hidden,
			'opacity-0': hidden
		}
	)}
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
