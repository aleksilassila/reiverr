<script lang="ts">
	import Dialog from '../Dialog/Dialog.svelte';
	import {
		type EpisodeDownload,
		sonarrApi,
		type SonarrEpisode
	} from '../../apis/sonarr/sonarr-api';
	import Button from '../Button.svelte';
	import Container from '../../../Container.svelte';
	import { formatSize } from '../../utils';
	import { Cross1 } from 'radix-icons-svelte';
	import { capitalize } from '../../utils.js';

	export let download: EpisodeDownload;
	export let episode: SonarrEpisode | undefined;
	export let onCancel: () => void;
	$: backgroundUrl = episode?.images?.[0]?.remoteUrl;
	console.log(download);

	function handleCancelDownload() {
		return sonarrApi.cancelDownload(download.id || -1).then(() => onCancel());
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
		<h1 class="header2">{episode?.title}</h1>
		<h2 class="header1 mb-4">Season {episode?.seasonNumber} Episode {episode?.episodeNumber}</h2>
		<div
			class="grid grid-cols-[1fr_max-content] font-medium mb-16
			[&>*:nth-child(odd)]:text-secondary-300 [&>*:nth-child(even)]:text-right [&>*:nth-child(even)]:text-secondary-100 *:py-1"
		>
			<span class="border-b border-secondary-600">Status</span>
			<span class="border-b border-secondary-600">{capitalize(download.status || '')}</span>

			<span class="border-b border-secondary-600">Progress</span>
			<span class="border-b border-secondary-600"
				>{formatSize((download?.size || 0) - (download?.sizeleft || 1))} / {formatSize(
					download?.size || 0
				)}</span
			>
			<span class="border-b border-secondary-600">Estimated Time Left</span>
			<span class="border-b border-secondary-600">{download.timeleft}</span>
			<span class="border-b border-secondary-600">Source</span>
			<span class="border-b border-secondary-600">{download.indexer}</span>
			<span>Quality</span>
			<span>{download.quality?.quality?.name}</span>
		</div>

		<Container class="flex flex-col space-y-4">
			<Button type="secondary" confirmDanger action={handleCancelDownload}>
				<Cross1 size={19} slot="icon" />
				Cancel Downloads
			</Button>
		</Container>
	</div>
</Dialog>
