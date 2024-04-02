<script lang="ts">
	import type { MovieDownload } from '../../apis/radarr/radarr-api';
	import ButtonGhost from '../Ghosts/ButtonGhost.svelte';
	import Button from '../Button.svelte';
	import { formatSize } from '../../utils';
	import { ChevronRight } from 'radix-icons-svelte';

	export let downloads: Promise<MovieDownload[]>;
	export let cancelDownload: (downloadId: number) => Promise<any>;
</script>

<div class="-my-1">
	{#await downloads}
		{#each new Array(5) as _, index}
			<div class="flex-1 my-1">
				<ButtonGhost />
			</div>
		{/each}
	{:then downloads}
		{#each downloads as download, index}
			<Button on:click={() => cancelDownload(download.id || -1)} let:hasFocus>
				<div class="flex w-full">
					<h1 class="flex-1 line-clamp-1">
						{download.title}
					</h1>
					<div>
						{#if !hasFocus}
							{#if download.status === 'downloading'}
								{formatSize((download.size || 0) - (download.sizeleft || 0))}/{formatSize(
									download.size || 0
								)}
							{:else}
								{download.status}
							{/if}
						{:else}
							<div class="flex items-center">
								Cancel
								<ChevronRight size={19} class="ml-1" />
							</div>
						{/if}
					</div>
				</div>
			</Button>
		{:else}
			<h1 class="text-sm text-zinc-400">No downloads found</h1>
		{/each}
	{/await}
</div>
