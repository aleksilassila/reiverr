<script lang="ts">
	import { skippedVersion } from '$lib/localstorage';
	import axios from 'axios';
	import IconButton from './IconButton.svelte';
	import { Cross2 } from 'radix-icons-svelte';
	import { log } from '$lib/utils';
	import { version } from '$app/environment';

	let visible = true;

	function fetchLatestVersion() {
		return axios
			.get('https://api.github.com/repos/aleksilassila/reiverr/tags')
			.then((res) => res.data?.[0]?.name)
			.then(log);
	}
</script>

{#await fetchLatestVersion() then latestVersion}
	{#if latestVersion !== `v${version}` && latestVersion !== $skippedVersion && visible}
		<div class="fixed inset-x-0 bottom-0 p-2 flex items-center justify-center z-20 bg-stone-800">
			<a href="https://github.com/aleksilassila/reiverr">New version is available!</a>
			<IconButton on:click={() => (visible = false)} class="absolute right-8 inset-y-0">
				<Cross2 size={20} />
			</IconButton>
		</div>
	{/if}
{/await}
