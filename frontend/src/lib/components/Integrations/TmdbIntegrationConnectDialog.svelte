<script>
	import Dialog from '../Dialog/Dialog.svelte';
	import TmdbIntegrationConnect from './TmdbIntegrationConnect.svelte';
	import { modalStack } from '../Modal/modal.store';
</script>

<Dialog>
	<TmdbIntegrationConnect on:connected={() => modalStack.closeTopmost()} />
</Dialog>
