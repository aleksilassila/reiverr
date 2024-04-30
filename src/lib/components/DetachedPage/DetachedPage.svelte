<script lang="ts">
	import Container from '../../../Container.svelte';
	import { type KeyEvent, type NavigateEvent, useRegistrar } from '../../selectable.js';
	import { get } from 'svelte/store';

	const selectable = useRegistrar();

	function handleGoBack({ detail }: CustomEvent<KeyEvent> | CustomEvent<NavigateEvent>) {
		if ('willLeaveContainer' in detail) {
			if (detail.direction !== 'left' || !detail.willLeaveContainer) return;
			detail.preventNavigation();
		}

		history.back();
	}

	function handleGoToTop({ detail }: CustomEvent<KeyEvent> | CustomEvent<NavigateEvent>) {
		if ('willLeaveContainer' in detail) {
			// Navigate event
			if (detail.direction === 'left' && detail.willLeaveContainer) {
				detail.preventNavigation();
				get(selectable)?.focus();
			}
		} else {
			// Back event
			get(selectable)?.focus();
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
		<slot {handleGoBack} registrar={selectable.registrar} />
	</Container>
</Container>
