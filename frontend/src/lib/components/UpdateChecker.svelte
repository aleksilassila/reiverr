<script lang="ts">
	import { localSettings } from '$lib/stores/localstorage.store';
	import axios from 'axios';
	import { onMount } from 'svelte';
	import UpdateDialog from './Dialog/UpdateDialog.svelte';
	import { createModal } from './Modal/modal.store';

	// The releases come newest first, pre-releases included
	async function fetchLatestVersion(): Promise<string | undefined> {
		return axios
			.get('https://api.github.com/repos/aleksilassila/reiverr/releases')
			.then(
				(res) => res.data?.find((v: { tag_name: string }) => v.tag_name.startsWith('v3.'))?.tag_name
			);
	}

	onMount(() => {
		if (!$localSettings.checkForUpdates) return;

		fetchLatestVersion().then((latestVersion) => {
			if (
				latestVersion &&
				latestVersion !== `v${REIVERR_VERSION}` &&
				latestVersion !== $localSettings.skippedVersion
			) {
				createModal(UpdateDialog, { version: latestVersion });
			}
		});
	});
</script>
