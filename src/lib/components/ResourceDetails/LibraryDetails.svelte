<script lang="ts">
	import { getJellyfinItemByTmdbId } from '$lib/apis/jellyfin/jellyfinApi';
	import {
		addMovieToRadarr,
		cancelDownloadRadarrMovie,
		deleteRadarrMovie,
		getRadarrDownloadsById,
		getRadarrMovieByTmdbId,
		removeFromRadarr
	} from '$lib/apis/radarr/radarrApi';
	import {
		addSeriesToSonarr,
		cancelDownloadSonarrEpisode,
		deleteSonarrEpisode,
		getSonarrDownloadsById,
		getSonarrEpisodes,
		getSonarrSeriesByTvdbId,
		removeFromSonarr
	} from '$lib/apis/sonarr/sonarrApi';
	import Button from '$lib/components/Button.svelte';
	import { ChevronDown, Plus, Trash, Update } from 'radix-icons-svelte';
	import { getContext, onMount, type ComponentProps } from 'svelte';
	import IconButton from '../IconButton.svelte';
	import type { PlayerState } from '../VideoPlayer/VideoPlayer';
	import LibraryDetailsFile from './LibraryDetailsFile.svelte';
	import { getTmdbSeries } from '$lib/apis/tmdb/tmdbApi';

	export let tmdbId: number;
	export let type: 'movie' | 'tv';

	const headerStyle = 'uppercase tracking-widest font-bold';

	let servarrId: number | undefined = undefined;
	let jellyfinId: string | undefined;
	let { streamJellyfinId } = getContext<PlayerState>('player');

	let isRequestModalVisible = false;

	let downloadProps: ComponentProps<LibraryDetailsFile>[] = [];
	let movieFileProps: ComponentProps<LibraryDetailsFile>[] = [];
	let seasonFileProps: ComponentProps<LibraryDetailsFile>[][] = [];

	async function fetchData(): Promise<{ isAdded: boolean }> {
		if (type === 'movie') {
			const jellyfinItemPromise = getJellyfinItemByTmdbId(String(tmdbId));
			const radarrMoviePromise = getRadarrMovieByTmdbId(String(tmdbId));
			const radarrMovieQueuedPromise = radarrMoviePromise.then((movie) =>
				movie?.id ? getRadarrDownloadsById(movie.id) : undefined
			);

			const radarrMovie = await radarrMoviePromise;
			const radarrDownloads = await radarrMovieQueuedPromise;
			const jellyfinItem = await jellyfinItemPromise;

			servarrId = radarrMovie?.id;

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
			}

			return {
				isAdded: !!radarrMovie
			};
		} else {
			const tvdbId = await getTmdbSeries(tmdbId).then((series) => series?.external_ids?.tvdb_id);
			if (!tvdbId) throw new Error("Couldn't find tvdb id");

			const jellyfinItemPromise = getJellyfinItemByTmdbId(String(tmdbId));
			const sonarrSeriesPromise = getSonarrSeriesByTvdbId(tvdbId);
			const sonarrDownloadsPromise = sonarrSeriesPromise.then((series) =>
				series?.id ? getSonarrDownloadsById(series.id) : undefined
			);
			const sonarrEpisodePromises = sonarrSeriesPromise.then((series) =>
				series ? getSonarrEpisodes(series.id) : undefined
			);

			const sonarrSeries = await sonarrSeriesPromise;
			const sonarrDownloads = await sonarrDownloadsPromise;
			const jellyfinItem = await jellyfinItemPromise;
			const sonarrEpisodes = await sonarrEpisodePromises.then((episodes) =>
				episodes?.filter((episode) => episode.episode.absoluteEpisodeNumber !== undefined)
			);

			sonarrEpisodes?.sort((a, b) => {
				if (!a.episode.absoluteEpisodeNumber || !b.episode.absoluteEpisodeNumber) return -1;
				return a.episode.absoluteEpisodeNumber - b.episode.absoluteEpisodeNumber;
			});

			if (sonarrDownloads) {
			}

			if (sonarrEpisodes) {
				seasonFileProps = [];
				for (const episode of sonarrEpisodes) {
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
								jellyfinStreamDisabled: !jellyfinItem,
								openJellyfinStream: () => {
									if (jellyfinItem?.Id) streamJellyfinId(jellyfinItem.Id);
								}
							}
						];
					}
				}
			}

			servarrId = sonarrSeries?.id;

			return {
				isAdded: !!sonarrSeries
			};
		}

		// const jellyfinItemPromise = getJellyfinItemByTmdbId(String(tmdbId));
		// const radarrMoviePromise = getRadarrMovieByTmdbId(tmdbId);
		// const radarrMovieQueuedPromise = radarrMoviePromise.then((movie) =>
		// 	movie?.id ? getRadarrDownloadsById(movie.id) : undefined
		// );

		// const [jellyfinItem, radarrMovie, radarrDownloads] = await Promise.all([
		// 	jellyfinMoviePromise,
		// 	radarrMoviePromise,
		// 	radarrMovieQueuedPromise
		// ]);

		// return json({
		// 	canStream: !!jellyfinItem,
		// 	hasLocalFiles: radarrMovie?.hasFile || !!jellyfinItem,
		// 	isAdded: !!radarrMovie,
		// 	isDownloading: !!radarrDownloads?.length,

		// 	jellyfinItem,
		// 	radarrMovie,
		// 	radarrDownloads
		// });
	}

	// let response: Promise<any>;

	// let refetchTimeout: NodeJS.Timeout;
	// let isRefetching = false;
	// async function refetch() {
	// 	console.log('refetching...');
	// 	isRefetching = true;
	// 	const req = fetch(`/movie/${tmdbId}`)
	// 		.then((res) => log(res.json()))
	// 		.then((res: any) => {
	// 			if (res?.radarrDownloads?.length) {
	// 				clearTimeout(refetchTimeout);
	// 				refetchTimeout = setTimeout(() => refetch(), 10000);
	// 			}
	// 			return res;
	// 		})
	// 		.finally(() => (isRefetching = false));

	// 	if (!response) response = req;
	// 	else response = await req;
	// }

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

	let dataPromise = fetchData();

	let isRefetching = false;
	const refetch = async () => {
		if (isRefetching) return;
		isRefetching = true;
		const newDataPromise = fetchData();
		newDataPromise.finally(() => (isRefetching = false));

		dataPromise = Promise.resolve(await newDataPromise);
	};

	onMount(() => {
		let interval: NodeJS.Timer;
		dataPromise.then(() => (interval = setInterval(async () => refetch(), 10000)));
		return () => clearInterval(interval);
	});
</script>

{#await dataPromise then data}
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

		{#if data.isAdded}
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
				<!-- {#each data.radarrDownloads || [] as downloadingFile}
						<div
							class={classNames('border-l-2 p-1 px-4 flex justify-between items-center py-1', {
								'border-purple-400': downloadingFile.status === 'downloading',
								'border-amber-400': downloadingFile.status !== 'downloading'
							})}
						>
							<div class="flex gap-1 items-center">
								<b class="">{downloadingFile.quality.quality.resolution}p</b>
								<DotFilled class="text-zinc-300" />
								<h2 class="text-zinc-200 text-sm">{formatSize(downloadingFile.size)} on disk</h2>
								<DotFilled class="text-zinc-300" />
								<h2 class="uppercase text-zinc-200 text-sm">
									{downloadingFile.quality.quality.source}
								</h2>
								<DotFilled class="text-zinc-300" />
								{#if downloadingFile.timeleft}
									<h2 class="text-zinc-200 text-sm">
										Completed in {formatMinutesToTime(
											(new Date(downloadingFile.estimatedCompletionTime).getTime() - Date.now()) /
												1000 /
												60
										)}
									</h2>
								{:else if downloadingFile.status === 'queued'}
									<h2 class="text-zinc-200 text-sm">Download starting</h2>
								{:else}
									<h2 class="text-orange-300 text-sm">Download Stalled</h2>
								{/if}
							</div>
							<div class="flex gap-2">
								<Button
									size="sm"
									type="secondary"
									disabled={downloadingFile.status === 'importing' || cancelDownloadFetching}
									on:click={() => cancelDownload(downloadingFile.id)}>Cancel Download</Button
								>
							</div>
						</div>
					{/each} -->
				{#if downloadProps.length}
					<div class="flex justify-between items-center mt-3 mb-1 cursor-pointer group">
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
					<div class="flex justify-between items-center mt-3 mb-1 cursor-pointer group">
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
					<div class="flex justify-between items-center mt-3 mb-1 cursor-pointer group">
						<div class="uppercase font-bold text-sm text-zinc-300 group-hover:text-zinc-200">
							Season {i + 1}
						</div>
						<ChevronDown size={20} />
					</div>
					{#each seasonProps as props}
						<LibraryDetailsFile {...props} />
					{/each}
				{/each}

				<!-- {#if data?.radarrMovie?.movieFile}
						<div class="border-l-2 border-zinc-200 p-1 px-4 flex justify-between items-center my-1">
							<div class="flex gap-1 items-center">
								<b class="">{data.radarrMovie.movieFile.quality.quality.resolution}p</b>
								<DotFilled class="text-zinc-300" />
								<h2 class="text-zinc-200 text-sm">
									{formatSize(data.radarrMovie.movieFile.size)} on disk
								</h2>
								<DotFilled class="text-zinc-300" />
								<h2 class="uppercase text-zinc-200 text-sm">
									{data.radarrMovie.movieFile.quality.quality.source}
								</h2>
								<DotFilled class="text-zinc-300" />
								<h2 class="uppercase text-zinc-200 text-sm">
									{data.radarrMovie.movieFile.mediaInfo.videoCodec}
								</h2>
							</div>
							<div class="flex gap-2">
								<Button
									type="secondary"
									on:click={() => deleteFile(data.radarrMovie.movieFile.id)}
									disabled={deleteMovieFetching}>Delete File</Button
								>
								<Button
									size="sm"
									on:click={() => jellyfinId && streamJellyfinId(jellyfinId)}
									disabled={!jellyfinId}>Stream</Button
								>
							</div>
						</div> -->
				{#if !downloadProps.length && !seasonFileProps.length && !movieFileProps.length}
					<div class="text-zinc-400 text-sm font-light">Click + to add files</div>
				{/if}
			</div>
		{/if}
	</div>

	<div class="flex gap-4 items-center bg-black p-8 py-4 empty:hidden">
		{#if !data.isAdded || false}
			{#if !data.isAdded}
				<Button on:click={() => addToServarr()} disabled={addToServarrLoading}
					>Add to {type === 'movie' ? 'Radarr' : 'Sonarr'}</Button
				>
			{/if}
			<!--{#if data.hasLocalFiles}-->
			<!--	<Button type="secondary">Manage Local Files</Button>-->
			<!--{/if}-->
		{/if}
	</div>

	<!-- {#if data.isAdded && data.radarrMovie}
		<RequestModal
			bind:visible={isRequestModalVisible}
			radarrId={data.radarrMovie.id}
			on:download={() => setTimeout(refetch, 5000)}
		/>
	{/if} -->
{:catch err}
	Could not load local movie data.
	{console.error(err)}
{/await}
