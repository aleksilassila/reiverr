<script lang="ts">
	import Container from '../../../Container.svelte';
	import { type KeyEvent, type NavigateEvent, useRegistrar } from '../../selectable.js';
	import { get } from 'svelte/store';
	import Sidebar from '../Sidebar/Sidebar.svelte';
	import classNames from 'classnames';

	export let topmost = true;

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
>
	<Sidebar />
	<Container on:back={handleGoToTop} focusOnMount class={classNames($$restProps.class)}>
		<slot {handleGoBack} registrar={topSelectable.registrar} />
	</Container>
</Container>
