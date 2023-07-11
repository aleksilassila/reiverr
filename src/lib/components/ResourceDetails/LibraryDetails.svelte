<script lang="ts">
	import { onMount } from 'svelte';
	import { formatMinutesToTime, formatSize } from '$lib/utils';
	import Button from '$lib/components/Button.svelte';
	import { DotFilled, Minus, Plus, Trash, Update } from 'radix-icons-svelte';
	import RequestModal from '../RequestModal/RequestModal.svelte';
	import IconButton from '../IconButton.svelte';
	import classNames from 'classnames';
	import { log } from '$lib/utils.js';

	let isRequestModalVisible = false;
	export let tmdbId: number;
	export let jellyfinStreamDisabled: boolean;
	export let openJellyfinStream: () => void;

	let response: Promise<any>;

	const headerStyle = 'uppercase tracking-widest font-bold';

	let refetchTimeout: NodeJS.Timeout;
	let isRefetching = false;
	async function refetch() {
		console.log('refetching...');
		isRefetching = true;
		const req = fetch(`/movie/${tmdbId}`)
			.then((res) => log(res.json()))
			.then((res: any) => {
				if (res?.radarrDownloads?.length) {
					clearTimeout(refetchTimeout);
					refetchTimeout = setTimeout(() => refetch(), 10000);
				}
				return res;
			})
			.finally(() => (isRefetching = false));

		if (!response) response = req;
		else response = await req;
	}

	let addToRadarrLoading = false;
	function addToRadarr() {
		if (!tmdbId || addToRadarrLoading) return;

		addToRadarrLoading = true;

		fetch(`/movie/${tmdbId}/radarr`, {
			method: 'POST'
		})
			.then((res) => {
				console.log('res', res);
				if (res.ok) {
					refetch();
				}
			})
			.finally(() => (addToRadarrLoading = false));
	}

	let cancelDownloadFetching = false;
	function cancelDownload(downloadId: number) {
		if (cancelDownloadFetching) return;
		cancelDownloadFetching = true;
		fetch(`/movie/${downloadId}/releases`, {
			method: 'DELETE'
		})
			.then((res) => {
				if (res.ok) refetch();
			})
			.finally(() => (cancelDownloadFetching = false));
	}

	let deleteMovieFetching = false;
	function deleteFile(movieId: number) {
		deleteMovieFetching = true;
		fetch(`/movie/${movieId}/file`, {
			method: 'DELETE'
		})
			.then((res) => {
				if (res.ok) refetch();
			})
			.finally(() => (deleteMovieFetching = false));
	}

	function openRequestModal() {
		isRequestModalVisible = true;
	}

	onMount(() => {
		refetch();
	});
</script>

{#await response then data}
	{#if data}
		<div class="flex flex-col gap-8 p-8">
			{#if !data.canStream && !data.isDownloading}
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

			{#if data.isAdded && data.radarrMovie}
				<div class="flex flex-col gap-2">
					<div class="flex items-center gap-2">
						<div class={headerStyle}>Local Library</div>
						<IconButton on:click={openRequestModal}>
							<Plus size={20} />
						</IconButton>
						<IconButton>
							<Trash size={20} />
						</IconButton>
						<IconButton disabled={isRefetching} on:click={refetch}>
							<Update size={15} />
						</IconButton>
					</div>
					{#each data.radarrDownloads || [] as downloadingFile}
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
					{/each}
					{#if data?.radarrMovie?.movieFile}
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
									on:click={() => openJellyfinStream()}
									disabled={jellyfinStreamDisabled}>Stream</Button
								>
							</div>
						</div>
					{:else if !data?.radarrMovie?.movieFile && !data?.radarrDownloads?.length}
						<div class="text-zinc-400 text-sm font-light">Click + to add files</div>
					{/if}
				</div>
			{/if}
		</div>

		<div class="flex gap-4 items-center bg-black p-8 py-4 empty:hidden">
			{#if !data.isAdded || data.hasLocalFiles}
				{#if !data.isAdded}
					<Button on:click={() => addToRadarr()} disabled={addToRadarrLoading}>Add to Radarr</Button
					>
				{/if}
				<!--{#if data.hasLocalFiles}-->
				<!--	<Button type="secondary">Manage Local Files</Button>-->
				<!--{/if}-->
			{/if}
		</div>

		{#if data.isAdded && data.radarrMovie}
			<RequestModal
				bind:visible={isRequestModalVisible}
				radarrId={data.radarrMovie.id}
				on:download={() => setTimeout(refetch, 5000)}
			/>
		{/if}
	{:else}
		no data
	{/if}
{:catch err}
	Could not load local movie data.
	{JSON.stringify(err)}
{/await}
