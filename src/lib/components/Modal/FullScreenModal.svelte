<script lang="ts">
	import Container from '../../../Container.svelte';
	import { modalStack } from './modal.store';

	export let modalId: symbol;
</script>

<Container
	navigationActions={{
		left: () => {
			modalStack.close(modalId);
			return true;
		}
	}}
	focusOnMount
	trapFocus
	class="fixed inset-0 bg-stone-950/80"
>
	<slot />
</Container>
