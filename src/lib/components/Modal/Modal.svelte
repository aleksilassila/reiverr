<script lang="ts">
	import Container from '../../../Container.svelte';
	import { modalStack } from './modal.store';

	export let modalId: symbol;

	function handleShortcuts(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			modalStack.close(modalId);
		}
	}
</script>

<Container focusOnMount trapFocus class="fixed inset-0">
	<slot />
</Container>

<svelte:window on:keypress={handleShortcuts} />
