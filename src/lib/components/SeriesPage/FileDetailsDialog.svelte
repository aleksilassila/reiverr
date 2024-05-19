<script lang="ts">
	import Dialog from '../Dialog/Dialog.svelte';
	import type { EpisodeFileResource, SonarrEpisode } from '../../apis/sonarr/sonarr-api';
	import Button from '../Button.svelte';
	import Container from '../../../Container.svelte';
	import { formatSize } from '../../utils';
	import { Trash } from 'radix-icons-svelte';

	export let file: EpisodeFileResource;
	export let episode: SonarrEpisode | undefined;
	$: backgroundUrl = episode?.images?.[0]?.remoteUrl;
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
		<h1 class="header2">{episode?.title}</h1>
		<h2 class="header1 mb-4">Season {episode?.seasonNumber} Episode {episode?.episodeNumber}</h2>
		<div
			class="grid grid-cols-[1fr_min-content] font-medium mb-16
			[&>*:nth-child(odd)]:text-secondary-300 [&>*:nth-child(even)]:text-right [&>*:nth-child(even)]:text-secondary-100 *:py-1"
		>
			<span class="border-b border-secondary-600">Runtime</span>
			<span class="border-b border-secondary-600">{file.mediaInfo?.runTime}</span>
			<span class="border-b border-secondary-600">Size on Disk</span>
			<span class="border-b border-secondary-600">{formatSize(file.size || 0)}</span>
			<span>Quality</span>
			<span>{file.quality?.quality?.name}</span>
			<!--			<span>Asd</span>-->
			<!--			<span>Asd</span>-->
		</div>

		<Container class="flex flex-col space-y-4">
			<Button type="secondary">
				<Trash size={19} slot="icon" />
				Delete
			</Button>
		</Container>
	</div>
</Dialog>
