<script lang="ts">
	import ButtonGhost from '../Ghosts/ButtonGhost.svelte';
	import Button from '../Button.svelte';
	import { formatSize } from '../../utils';
	import { ChevronRight } from 'radix-icons-svelte';
	import type { Download } from '../../apis/combined-types';
	import Container from '../../../Container.svelte';

	export let downloads: Promise<Download[]>;
	export let cancelDownload: (downloadId: number) => Promise<any>;
</script>

<Container class="flex flex-col -my-2">
	{#await downloads}
		{#each new Array(5) as _, index}
			<div class="flex-1 my-2">
				<ButtonGhost />
			</div>
		{/each}
	{:then downloads}
		{#each downloads as download, index}
			<div class="my-2">
				<Button on:clickOrSelect={() => cancelDownload(download.id || -1)} let:hasFocus>
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
			</div>
		{:else}
			<h1 class="text-sm text-zinc-400">No downloads found</h1>
		{/each}
	{/await}
</Container>
