<script lang="ts">
	import { sonarrApi } from '../../../apis/sonarr/sonarr-api';
	import Container from '$components/Container.svelte';
	import { formatSize } from '../../../utils';
	import { Trash } from 'radix-icons-svelte';
	import type { FileResource } from '../../../apis/combined-types';
	import Dialog from '../../../components/Dialog/Dialog.svelte';
	import Button from '../../../components/Button.svelte';

	export let file: FileResource;
	export let title = '';
	export let subtitle = '';
	export let backgroundUrl: string;
	export let onDelete: () => void;

	function handleDeleteFile() {
		return sonarrApi.deleteSonarrEpisode(file.id || -1).then(() => onDelete());
	}
</script>

<Dialog class="flex flex-col relative">
	{#if backgroundUrl}
		<div
			class="absolute inset-0 bg-cover bg-center h-52"
			style="background-image: url({backgroundUrl}); -webkit-mask-image: radial-gradient(at 90% 10%, hsla(0,0%,0%,1) 0px, transparent 70%);"
		/>
	{/if}
	<div class="z-10">
		{#if backgroundUrl}
			<div class="h-24" />
		{/if}
		<h1 class="h3">{title}</h1>
		<h2 class="h4 mb-4">{subtitle}</h2>
		<div
			class="grid grid-cols-[1fr_max-content] font-medium mb-16
			[&>*:nth-child(odd)]:text-secondary-300 [&>*:nth-child(even)]:text-right [&>*:nth-child(even)]:text-secondary-100 *:py-1"
		>
			<span class="border-b border-secondary-600">Runtime</span>
			<span class="border-b border-secondary-600">{file.mediaInfo?.runTime}</span>
			<span class="border-b border-secondary-600">Size on Disk</span>
			<span class="border-b border-secondary-600">{formatSize(file.size || 0)}</span>
			<span>Quality</span>
			<span>{file.quality?.quality?.name}</span>
		</div>

		<Container class="flex flex-col space-y-4">
			<Button type="secondary" confirmDanger action={handleDeleteFile}>
				<Trash size={19} slot="icon" />
				Delete File
			</Button>
		</Container>
	</div>
</Dialog>
