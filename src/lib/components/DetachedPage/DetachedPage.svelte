<script lang="ts">
	import Container from '../../../Container.svelte';
	import { type KeyEvent, type NavigateEvent, useRegistrar } from '../../selectable.js';
	import { get } from 'svelte/store';
	import Sidebar from '../Sidebar/Sidebar.svelte';
	import classNames from 'classnames';

	export let topmost = true;

	// Top element, that when focused and back is pressed, will exit the modal
	const topSelectable = useRegistrar();

	function handleGoBack({ detail }: CustomEvent<KeyEvent> | CustomEvent<NavigateEvent>) {
		// if ('willLeaveContainer' in detail) {
		// 	if (detail.direction !== 'left' || !detail.willLeaveContainer) return;
		// 	detail.preventNavigation();
		// }

		const selectable = get(topSelectable);
		if (selectable && get(selectable.focusIndex) === 0) {
			history.back();
		} else {
			selectable?.focusChild(0) || selectable?.focus();
		}
	}

	function handleGoToTop({ detail }: CustomEvent<KeyEvent> | CustomEvent<NavigateEvent>) {
		if ('willLeaveContainer' in detail) {
			// Navigate event
			// if (detail.direction === 'left' && detail.willLeaveContainer) {
			// 	detail.preventNavigation();
			// 	get(topSelectable)?.focus();
			// }
		} else {
			// Back event
			const selectable = get(topSelectable);
			selectable?.focusChild(0) || selectable?.focus();
		}
	}
</script>

<Container
	class={classNames('fixed inset-0 z-20 bg-secondary-900 overflow-y-auto scrollbar-hide', {
		hidden: !topmost
	})}
	trapFocus
	direction="horizontal"
	on:mount
>
	<Sidebar />
	<Container on:back={handleGoToTop} focusOnMount>
		<slot {handleGoBack} registrar={topSelectable.registrar} />
	</Container>
</Container>
