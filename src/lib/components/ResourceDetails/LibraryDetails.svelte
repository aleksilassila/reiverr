<script lang="ts">
	import { getJellyfinEpisodes } from '$lib/apis/jellyfin/jellyfinApi';
	import {
		addMovieToRadarr,
		cancelDownloadRadarrMovie,
		deleteRadarrMovie,
		removeFromRadarr
	} from '$lib/apis/radarr/radarrApi';
	import {
		addSeriesToSonarr,
		cancelDownloadSonarrEpisode,
		deleteSonarrEpisode,
		getSonarrEpisodes,
		removeFromSonarr
	} from '$lib/apis/sonarr/sonarrApi';
	import Button from '$lib/components/Button.svelte';
	import { library } from '$lib/stores/library.store';
	import { ChevronDown, Plus, Trash, Update } from 'radix-icons-svelte';
	import { getContext, onMount, type ComponentProps } from 'svelte';
	import IconButton from '../IconButton.svelte';
	import RequestModal from '../RequestModal/RequestModal.svelte';
	import type { PlayerState } from '../VideoPlayer/VideoPlayer';
	import LibraryDetailsFile from './LibraryDetailsFile.svelte';
	import SeriesRequestModal from '../RequestModal/SeriesRequestModal.svelte';

	export let tmdbId: number;
	export let type: 'movie' | 'tv';

	let { streamJellyfinId } = getContext<PlayerState>('player');

	let servarrId: number | undefined = undefined;
	let isAdded = false;
	let isRequestModalVisible = false;

	let downloadProps: ComponentProps<LibraryDetailsFile>[] = [];
	let movieFileProps: ComponentProps<LibraryDetailsFile>[] = [];
	let seasonFileProps: (ComponentProps<LibraryDetailsFile>[] | undefined)[] = [];

	library.subscribe(async (libraryPromise) => {
		const libraryData = await libraryPromise;

		const item = libraryData.items[tmdbId];
		if (!item) return;

		const sonarrEpisodesPromise = item.sonarrSeries?.id
			? getSonarrEpisodes(item.sonarrSeries?.id)
			: undefined;
		const jellyfinEpisodesPromise =
			item.jellyfinItem?.Id && item.sonarrSeries?.id
				? getJellyfinEpisodes(item.jellyfinItem?.Id)
				: undefined;

		const sonarrEpisodes = await sonarrEpisodesPromise;
		const jellyfinEpisodes = await jellyfinEpisodesPromise;

		const radarrDownloads = item.radarrDownloads;
		const sonarrDownloads = item.sonarrDownloads;
		const radarrMovie = item.radarrMovie;
		const sonarrSeries = item.sonarrSeries;
		const jellyfinItem = item.jellyfinItem;

		downloadProps = [];
		movieFileProps = [];
		seasonFileProps = [];

		sonarrEpisodes?.sort((a, b) => {
			if (!a.episode.absoluteEpisodeNumber || !b.episode.absoluteEpisodeNumber) return -1;
			return a.episode.absoluteEpisodeNumber - b.episode.absoluteEpisodeNumber;
		});

		if (radarrDownloads) {
			downloadProps = radarrDownloads.map((download) => ({
				status: 'downloading',
				resolution: download.quality?.quality?.resolution || 0,
				sizeOnDisk: download.size || 0,
				qualityType: download.quality?.quality?.source || 'Unknown',
				videoCodec: 'Unknown',
				downloadEta: new Date(download.estimatedCompletionTime || Date.now()),
				cancelDownload: () => {
					if (download.id && !cancelDownloadFetching) cancelDownload(download.id);
				}
			}));
		} else if (sonarrDownloads) {
			downloadProps = sonarrDownloads.map((download) => ({
				status: 'downloading',
				resolution: download.quality?.quality?.resolution || 0,
				sizeOnDisk: download.size || 0,
				qualityType: download.quality?.quality?.source || 'Unknown',
				videoCodec: 'Unknown',
				downloadEta: new Date(download.estimatedCompletionTime || Date.now()),
				cancelDownload: () => {
					if (download.id && !cancelDownloadFetching) cancelDownload(download.id);
				}
			}));
		}

		if (radarrMovie?.movieFile) {
			movieFileProps = [
				{
					status: 'ready',
					resolution: radarrMovie.movieFile.quality?.quality?.resolution || 0,
					sizeOnDisk: radarrMovie.movieFile.size || 0,
					qualityType: radarrMovie.movieFile.quality?.quality?.source || 'Unknown',
					videoCodec: radarrMovie.movieFile.mediaInfo?.videoCodec || 'Unknown',
					downloadEta: undefined,
					deleteFile: () => {
						if (radarrMovie?.movieFile?.id && !deleteMovieFetching)
							deleteFile(radarrMovie.movieFile.id);
					},
					jellyfinStreamDisabled: !jellyfinItem,
					openJellyfinStream: () => {
						if (jellyfinItem?.Id) streamJellyfinId(jellyfinItem.Id);
					}
				}
			];
		} else if (sonarrEpisodes) {
			seasonFileProps = [];
			for (const episode of sonarrEpisodes) {
				const jellyfinEpisode = jellyfinEpisodes?.find(
					(e) =>
						e?.IndexNumber === episode.episode.episodeNumber &&
						e?.ParentIndexNumber === episode.episode.seasonNumber
				);
				if (episode.episodeFile) {
					seasonFileProps[(episode.episode.seasonNumber || 1) - 1] = [
						...(seasonFileProps[(episode.episode.seasonNumber || 1) - 1] || []),
						{
							episodeNumber: episode.episode.episodeNumber,
							status: 'ready',
							resolution: episode.episodeFile.quality?.quality?.resolution || 0,
							sizeOnDisk: episode.episodeFile.size || 0,
							qualityType: episode.episodeFile.quality?.quality?.source || 'Unknown',
							videoCodec: episode.episodeFile.mediaInfo?.videoCodec || 'Unknown',
							downloadEta: undefined,
							deleteFile: () => {
								if (episode?.episodeFile?.id && !deleteMovieFetching)
									deleteFile(episode.episodeFile.id);
							},
							jellyfinStreamDisabled: !jellyfinEpisode,
							openJellyfinStream: () => {
								if (jellyfinEpisode?.Id) streamJellyfinId(jellyfinEpisode.Id);
							}
						}
					];
				}
			}
		}

		isAdded = !!radarrMovie || !!sonarrSeries;
		servarrId = radarrMovie?.id || sonarrSeries?.id;
	});

	let addToServarrLoading = false;
	function addToServarr() {
		if (addToServarrLoading) return;
		addToServarrLoading = true;
		isRefetching = true;

		if (type === 'movie')
			addMovieToRadarr(tmdbId)
				.then(() => refetch())
				.finally(() => (addToServarrLoading = false));
		else
			addSeriesToSonarr(tmdbId)
				.then(() => refetch())
				.finally(() => (addToServarrLoading = false));
	}

	let cancelDownloadFetching = false;
	function cancelDownload(downloadId: number) {
		if (cancelDownloadFetching) return;
		cancelDownloadFetching = true;
		isRefetching = true;

		if (type === 'movie')
			cancelDownloadRadarrMovie(downloadId)
				.then(() => refetch())
				.finally(() => (cancelDownloadFetching = false));
		else
			cancelDownloadSonarrEpisode(downloadId)
				.then(() => refetch())
				.finally(() => (cancelDownloadFetching = false));
	}

	let deleteMovieFetching = false;
	function deleteFile(servarrId: number) {
		if (deleteMovieFetching) return;
		deleteMovieFetching = true;
		isRefetching = true;

		if (type === 'movie')
			deleteRadarrMovie(servarrId)
				.then((res) => refetch())
				.finally(() => (deleteMovieFetching = false));
		else
			deleteSonarrEpisode(servarrId)
				.then((res) => refetch())
				.finally(() => (deleteMovieFetching = false));
	}

	let removeFromServarrLoading = false;
	function removeFromServarr(servarrId: number) {
		if (removeFromServarrLoading) return;
		removeFromServarrLoading = true;
		isRefetching = true;

		if (type === 'movie')
			removeFromRadarr(servarrId)
				.then(() => refetch())
				.finally(() => (removeFromServarrLoading = false));
		else
			removeFromSonarr(servarrId)
				.then(() => refetch())
				.finally(() => (removeFromServarrLoading = false));
	}

	function openRequestModal() {
		isRequestModalVisible = true;
	}

	let isRefetching = false;
	const refetch = async () => {
		if (isRefetching) return;
		isRefetching = true;
		library.refresh().finally(() => (isRefetching = false));
	};

	onMount(() => {
		// let interval = setInterval(async () => refetch(), 10000);
		// return () => clearInterval(interval);
	});

	const headerStyle = 'uppercase tracking-widest font-bold';
</script>

<div class="flex flex-col gap-8 p-8">
	{#if !downloadProps.length && !seasonFileProps.length && !movieFileProps.length}
		<div>
			<h1 class="text-lg mb-1 font-medium tracking-wide">No sources found</h1>
			<p class="text-zinc-300">
				No local or remote sources found for this title. You can configure your sources on the <a
					href="/sources"
					class="text-amber-200 hover:text-amber-100">sources</a
				> page.
			</p>
		</div>
	{/if}

	{#if isAdded}
		<div class="flex flex-col gap-2">
			<div class="flex items-center gap-2">
				<div class={headerStyle}>Local Library</div>
				<IconButton on:click={openRequestModal}>
					<Plus size={20} />
				</IconButton>
				<IconButton
					disabled={removeFromServarrLoading && !!servarrId}
					on:click={() => servarrId && removeFromServarr(servarrId)}
				>
					<Trash size={20} />
				</IconButton>
				<div class={isRefetching ? 'animate-spin' : ''}>
					<IconButton disabled={isRefetching} on:click={refetch}>
						<Update size={15} />
					</IconButton>
				</div>
			</div>
			{#if downloadProps.length}
				<div
					class="flex justify-between items-center mt-3 mb-1 cursor-pointer group border-b-zinc-500 border-b-2 py-3"
				>
					<div class="uppercase font-bold text-sm text-zinc-300 group-hover:text-zinc-200">
						Downloading
					</div>
					<ChevronDown size={20} />
				</div>
			{/if}
			{#each downloadProps as props}
				<LibraryDetailsFile {...props} />
			{/each}
			{#if movieFileProps.length}
				<div
					class="flex justify-between items-center mt-3 mb-1 cursor-pointer group border-b-zinc-500 border-b-2 py-3"
				>
					<div class="uppercase font-bold text-sm text-zinc-300 group-hover:text-zinc-200">
						Available
					</div>
					<ChevronDown size={20} />
				</div>
			{/if}
			{#each movieFileProps as props}
				<LibraryDetailsFile {...props} />
			{/each}
			{#each seasonFileProps as seasonProps, i}
				{#if seasonProps?.length}
					<div
						class="flex justify-between items-center mt-3 mb-1 cursor-pointer group border-b-zinc-500 border-b-2 py-3"
					>
						<div class="uppercase font-bold text-sm text-zinc-300 group-hover:text-zinc-200">
							Season {i + 1}
						</div>
						<ChevronDown size={20} />
					</div>
					{#each seasonProps as props}
						<LibraryDetailsFile {...props} />
					{/each}
				{/if}
			{/each}
			{#if !downloadProps.length && !seasonFileProps.length && !movieFileProps.length}
				<div class="text-zinc-400 text-sm font-light">Click + to add files</div>
			{/if}
		</div>
	{/if}
</div>

<div class="flex gap-4 items-center bg-black p-8 py-4 empty:hidden">
	{#if !isAdded || false}
		{#if !isAdded}
			<Button on:click={() => addToServarr()} disabled={addToServarrLoading}
				>Add to {type === 'movie' ? 'Radarr' : 'Sonarr'}</Button
			>
		{/if}
		<!--{#if data.hasLocalFiles}-->
		<!--	<Button type="secondary">Manage Local Files</Button>-->
		<!--{/if}-->
	{/if}
</div>

{#if isAdded && servarrId && type === 'movie'}
	<RequestModal
		bind:visible={isRequestModalVisible}
		radarrId={servarrId}
		on:download={() => setTimeout(refetch, 5000)}
	/>
{:else if isAdded && servarrId && type === 'tv'}
	<SeriesRequestModal bind:visible={isRequestModalVisible} sonarrId={servarrId} />
{:else}
	<div>NO CONTENT</div>
	{console.log('NO CONTENT')}
{/if}
