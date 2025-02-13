<script lang="ts">
	import { ExternalLink, InfoCircled } from 'radix-icons-svelte';
	import { PLATFORM_WEB } from '../../constants';
	import { localSettings } from '../../stores/localstorage.store';
	import Button from '../Button.svelte';
	import Container from '../Container.svelte';
	import Dialog from './Dialog.svelte';

	export let version: string;

	function disableUpdateChecking() {
		localSettings.update((s) => ({ ...s, checkForUpdates: false, skippedVersion: version }));
	}

	function dismiss() {
		localSettings.update((s) => ({ ...s, skippedVersion: version }));
	}
</script>

<Dialog let:close on:close={dismiss} size="dynamic">
	<div class="flex items-center justify-center text-secondary-500 mb-4">
		<InfoCircled size={64} />
	</div>
	<h1 class="h3 text-center">Update Available</h1>
	<div class="body mb-8 text-center">Reiverr {version} is now available.</div>
	<Container class="flex space-x-4" direction="horizontal">
		<Button
			type="primary-dark"
			on:clickOrSelect={() => {
				disableUpdateChecking();
				close();
			}}
		>
			Disable Update Checking
		</Button>
		{#if PLATFORM_WEB}
			<Button
				type="primary-dark"
				iconAfter={ExternalLink}
				on:clickOrSelect={() => window.open('https://github.com/aleksilassila/reiverr/releases')}
				focusOnMount
				focusedChild
			>
				Open Releases
			</Button>
		{/if}
	</Container>
</Dialog>
