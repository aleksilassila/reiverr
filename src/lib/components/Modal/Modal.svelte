<script lang="ts">
	import Container from '../../../Container.svelte';
	import { modalStack } from './modal.store';
</script>

<Container focusOnMount trapFocus class="fixed inset-0" on:back={() => modalStack.closeTopmost()}>
	<slot />
</Container>
