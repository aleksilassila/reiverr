<script lang="ts">
	import Container from '../../../Container.svelte';
	import { type KeyEvent, type NavigateEvent, useRegistrar } from '../../selectable.js';
	import { get } from 'svelte/store';

	// Top element, that when focused and back is pressed, will exit the modal
	const topSelectable = useRegistrar();

	function handleGoBack({ detail }: CustomEvent<KeyEvent> | CustomEvent<NavigateEvent>) {
		if ('willLeaveContainer' in detail) {
			if (detail.direction !== 'left' || !detail.willLeaveContainer) return;
			detail.preventNavigation();
		}

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
			if (detail.direction === 'left' && detail.willLeaveContainer) {
				detail.preventNavigation();
				get(topSelectable)?.focus();
			}
		} else {
			// Back event
			const selectable = get(topSelectable);
			selectable?.focusChild(0) || selectable?.focus();
		}
	}
</script>

<Container
	class="fixed inset-0 z-20 bg-secondary-800 overflow-y-auto"
	trapFocus
	direction="horizontal"
>
	<Container />
	<Container on:navigate={handleGoToTop} on:back={handleGoToTop} focusOnMount>
		<slot {handleGoBack} registrar={topSelectable.registrar} />
	</Container>
</Container>
