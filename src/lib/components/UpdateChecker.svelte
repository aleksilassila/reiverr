<script lang="ts">
	import { version } from '$app/environment';
	import { createLocalStorageStore } from '$lib/stores/localstorage.store';
	import { Cross2 } from 'radix-icons-svelte';
	import IconButton from './IconButton.svelte';
	import axios from 'axios';
	import Button from './Button.svelte';

	let visible = true;

	const skippedVersion = createLocalStorageStore<string>('skipped-version');

	async function fetchLatestVersion() {
		return axios
			.get('https://api.github.com/repos/aleksilassila/reiverr/tags')
			.then((res) => res.data?.[0]?.name);
	}
</script>

{#await fetchLatestVersion() then latestVersion}
	{#if latestVersion !== `v${version}` && latestVersion !== $skippedVersion && visible}
		<div
			class="fixed inset-x-0 bottom-0 p-3 flex items-center justify-center z-20 bg-stone-800 text-sm"
		>
			<a href="https://github.com/aleksilassila/reiverr">{latestVersion} is now available!</a>
			<div class="absolute right-4 inset-y-0 flex items-center gap-2">
				<Button type="tertiary" size="xs" on:click={() => skippedVersion.set(latestVersion)}>
					Skip this version
				</Button>
				<IconButton on:click={() => (visible = false)}>
					<Cross2 size={20} />
				</IconButton>
			</div>
		</div>
	{/if}
{/await}
