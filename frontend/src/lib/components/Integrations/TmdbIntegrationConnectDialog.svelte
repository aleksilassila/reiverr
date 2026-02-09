<script>
	import Dialog from '../Dialog/Dialog.svelte';
	import TmdbIntegrationConnect from './TmdbIntegrationConnect.svelte';
	import { useComponentStack } from '../StackRouter/stack-router.store';

	const { close } = useComponentStack();
</script>

<Dialog>
	<TmdbIntegrationConnect on:connected={() => close()} />
</Dialog>
