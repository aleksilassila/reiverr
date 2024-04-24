<script lang="ts">
	import ButtonGhost from '../Ghosts/ButtonGhost.svelte';
	import Button from '../Button.svelte';
	import { ChevronRight } from 'radix-icons-svelte';
	import { formatSize } from '../../utils.js';
	import type { FileResource } from '../../apis/combined-types';
	import { scrollIntoView } from '../../selectable';
	import Container from '../../../Container.svelte';

	export let files: Promise<FileResource[]>;
	export let handleSelectFile: (file: FileResource) => void;
</script>

<Container class="flex flex-col -my-2">
	{#await files}
		{#each new Array(5) as _, index}
			<div class="flex-1 my-2">
				<ButtonGhost />
			</div>
		{/each}
	{:then files}
		{#each files as file, index}
			<div class="flex-1 my-2">
				<Button
					on:clickOrSelect={() => handleSelectFile(file)}
					let:hasFocus
					on:enter={scrollIntoView({ vertical: 64 })}
				>
					<div class="flex items-center w-full">
						<div class="flex-1">
							{file.relativePath}
						</div>
						{#if hasFocus}
							<div class="flex items-center">
								Details
								<ChevronRight size={19} class="ml-1" />
							</div>
						{:else}
							<div class="flex items-center text-zinc-400">
								{formatSize(file.size || 0)}
							</div>
						{/if}
					</div>
				</Button>
			</div>
		{:else}
			<div class="text-sm text-zinc-400">No local files found</div>
		{/each}
	{/await}
</Container>
