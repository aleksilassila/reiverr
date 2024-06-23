<script lang="ts">
	import Dialog from './Dialog.svelte';
	import Container from '../../../Container.svelte';
	import Button from '../Button.svelte';
	import { PLATFORM_WEB } from '../../constants';
	import { ExternalLink, InfoCircled } from 'radix-icons-svelte';
	import { modalStack } from '../Modal/modal.store';
	import { localSettings } from '../../stores/localstorage.store';

	export let version: string;

	function disableUpdateChecking() {
		localSettings.update((s) => ({ ...s, checkForUpdates: false, skippedVersion: version }));
		modalStack.closeTopmost();
	}

	function dismiss() {
		localSettings.update((s) => ({ ...s, skippedVersion: version }));
		modalStack.closeTopmost();
	}
</script>

<Dialog>
	<div class="flex items-center justify-center text-secondary-500 mb-4">
		<InfoCircled size={64} />
	</div>
	<h1 class="header2 text-center">Update Available</h1>
	<div class="body mb-8 text-center">Reiverr {version} is now available.</div>
	<Container class="space-y-4">
		<Button type="primary-dark" on:clickOrSelect={dismiss}>Dismiss</Button>
		{#if PLATFORM_WEB}
			<Button
				type="primary-dark"
				iconAfter={ExternalLink}
				on:clickOrSelect={() => window.open('https://github.com/aleksilassila/reiverr/releases')}
			>
				Open Releases
			</Button>
		{/if}
		<Button type="primary-dark" on:clickOrSelect={disableUpdateChecking}>
			Disable Update Checking
		</Button>
	</Container>
</Dialog>
