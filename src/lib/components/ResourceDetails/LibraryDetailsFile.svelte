<script lang="ts">
	import { formatMinutesToTime, formatSize } from '$lib/utils';
	import classNames from 'classnames';
	import { DotFilled } from 'radix-icons-svelte';
	import Button from '../Button.svelte';
	import UiCarousel from '../Carousel/UICarousel.svelte';

	export let status: 'downloading' | 'importing' | 'stalled' | 'queued' | 'ready' = 'ready';
	export let resolution: number;
	export let sizeOnDisk: number;
	export let qualityType: string;
	export let videoCodec: string;
	export let episodeNumber: number | undefined = undefined;

	export let downloadEta: Date | undefined = undefined;

	export let deleteButtonDisabled = false;
	export let deleteFile: (() => void) | undefined = undefined;
	export let jellyfinStreamDisabled = false;
	export let openJellyfinStream: (() => void) | undefined = undefined;
	export let cancelDownloadDisabled = false;
	export let cancelDownload: (() => void) | undefined = undefined;
</script>

<div
	class={classNames('border-l-2 p-1 pl-4 gap-4 flex justify-between items-center py-1', {
		'border-purple-400': status === 'downloading',
		'border-amber-400': status === 'importing',
		'border-zinc-200': status === 'ready',
		'border-red-400': status === 'stalled'
	})}
>
	<UiCarousel>
		<div class="flex gap-1 items-center w-max">
			{#if episodeNumber}
				<div class="font-bold">
					Episode {episodeNumber}
				</div>
				<DotFilled class="text-zinc-300" />
			{/if}
			<div class={episodeNumber ? '' : 'font-bold'}>{resolution}p</div>
			<DotFilled class="text-zinc-300" />
			<h2 class="text-zinc-200 text-sm">
				{formatSize(sizeOnDisk)} on disk
			</h2>
			<DotFilled class="text-zinc-300" />
			<h2 class="uppercase text-zinc-200 text-sm">
				{qualityType}
			</h2>
			<DotFilled class="text-zinc-300" />
			{#if downloadEta}
				<h2 class="text-zinc-200 text-sm">
					Completed in {formatMinutesToTime((downloadEta.getTime() - Date.now()) / 1000 / 60)}
				</h2>
			{:else if status === 'queued'}
				<h2 class="text-zinc-200 text-sm">Download starting</h2>
			{:else if status === 'stalled'}
				<h2 class="text-orange-300 text-sm">Download Stalled</h2>
			{:else}
				<h2 class="uppercase text-zinc-200 text-sm">
					{videoCodec}
				</h2>
			{/if}
		</div></UiCarousel
	>
	<div class="flex gap-2">
		{#if deleteFile}
			<Button
				size="sm"
				type="secondary"
				on:click={() => deleteFile?.()}
				disabled={deleteButtonDisabled}>Delete File</Button
			>
		{:else if cancelDownload}
			<Button
				size="sm"
				type="secondary"
				disabled={status === 'importing' || cancelDownloadDisabled}
				on:click={() => cancelDownload?.()}>Cancel Download</Button
			>
		{/if}
		{#if status === 'ready' && openJellyfinStream}
			<Button size="sm" on:click={() => openJellyfinStream?.()} disabled={jellyfinStreamDisabled}
				>Stream</Button
			>
		{/if}
	</div>
</div>
