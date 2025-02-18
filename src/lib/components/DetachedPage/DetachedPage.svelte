<script lang="ts">
	import classNames from 'classnames';
	import { get } from 'svelte/store';
	import { useRegistrar } from '../../selectable.js';
	import Container from '../Container.svelte';
	import type { ContainerProps } from '../Container.type';
	import Sidebar from '../Sidebar/Sidebar.svelte';

	interface $$Props extends ContainerProps {
		topmost?: boolean;
		sidebar?: boolean;
	}

	export let topmost = true;
	export let sidebar = true;

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
	class={classNames('fixed inset-0 z-20 bg-secondary-900 overflow-y-auto scrollbar-hide', {
		hidden: !topmost
	})}
	trapFocus
	focusOnMount
	direction="horizontal"
	on:mount
	let:hasFocus
>
	{#if sidebar}
		<Sidebar />
	{/if}
	<Container {...$$restProps} on:back={handleGoToTop} focusOnMount>
		<slot {handleGoBack} registrar={topSelectable.registrar} {hasFocus} />
	</Container>
</Container>
