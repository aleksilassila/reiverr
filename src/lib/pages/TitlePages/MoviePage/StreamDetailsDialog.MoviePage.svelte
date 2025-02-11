<script lang="ts">
	import { Play, Trash } from 'radix-icons-svelte';
	import Container from '$components/Container.svelte';
	import type { VideoStreamCandidateDto } from '../../../apis/reiverr/reiverr.openapi';
	import Button from '../../../components/Button.svelte';
	import Dialog from '../../../components/Dialog/Dialog.svelte';

	export let stream: VideoStreamCandidateDto;

	// export let file: FileResource;
	// export let title = '';
	// export let subtitle = '';
	export let backgroundUrl: string;
	export let streamMovie: () => Promise<any>;
	export let onDelete: () => void;

	async function handleDeleteFile() {
		// return sonarrApi.deleteSonarrEpisode(file.id || -1).then(() => onDelete());
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
		<h1 class="h3">{stream.title}</h1>
		<h2 class="h4 mb-4">{stream.key}</h2>
		<div
			class="grid grid-cols-[1fr_auto] font-medium mb-16
    [&>*:nth-child(odd)]:text-secondary-300 [&>*:nth-child(even)]:text-right [&>*:nth-child(even)]:text-secondary-100 *:py-2
    [&>*:nth-child(odd):not(:nth-last-child(-n+2))]:border-b [&>*:nth-child(odd):not(:nth-last-child(-n+2))]:border-secondary-600
    [&>*:nth-child(even):not(:nth-last-child(-n+2))]:border-b [&>*:nth-child(even):not(:nth-last-child(-n+2))]:border-secondary-600"
		>
			{#each stream.properties as property}
				<span class="pr-8">{property.label}</span>
				<span class="truncate" title={property.formatted ?? property.value.toString()}>
					{property.formatted ?? property.value}
				</span>
			{/each}
			<!-- <span class="border-b border-secondary-600">Runtime</span>
			<span class="border-b border-secondary-600">{file.mediaInfo?.runTime}</span>
			<span class="border-b border-secondary-600">Size on Disk</span>
			<span class="border-b border-secondary-600">{formatSize(file.size || 0)}</span>
			<span>Quality</span>
			<span>{file.quality?.quality?.name}</span> -->
		</div>

		<Container class="flex flex-col space-y-4">
			<Button type="secondary" icon={Play} action={streamMovie}>Play</Button>
			<Button type="secondary" confirmDanger action={handleDeleteFile} disabled={true}>
				<Trash size={19} slot="icon" />
				Delete File
			</Button>
		</Container>
	</div>
</Dialog>
