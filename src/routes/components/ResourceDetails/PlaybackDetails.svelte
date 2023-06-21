<script lang="ts">
	import { onMount } from 'svelte';
	import { formatSize } from '$lib/utils';
	import Button from '../Ui/Button.svelte';
	import { DotFilled, Plus } from 'radix-icons-svelte';
	import RequestModal from '../RequestModal/RequestModal.svelte';
	import IconButton from '../IconButton.svelte';
	import classNames from 'classnames';
	import VideoPlayer from '../VideoPlayer/VideoPlayer.svelte';

	let isRequestModalVisible = false;
	export let tmdbId: string;
	export let jellyfinStreamDisabled;
	export let openJellyfinStream;

	let response;

	const headerStyle = 'uppercase tracking-widest font-bold';

	function refetch() {
		response = fetch(`/movie/${tmdbId}`).then((res) => res.json());
	}

	let addToRadarrLoading = false;
	function addToRadarr() {
		if (!tmdbId || addToRadarrLoading) return;

		addToRadarrLoading = true;

		fetch(`/movie/${tmdbId}/addToRadarr`, {
			method: 'POST'
		})
			.then((res) => {
				if (res.ok) refetch();
			})
			.finally(() => (addToRadarrLoading = false));
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
							<Plus size="20" />
						</IconButton>
					</div>
					{#each data.radarrDownload || [] as downloadingFile}
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
								<h2 class="text-zinc-200 text-sm">
									Completed in {downloadingFile.timeleft}
								</h2>
							</div>
							<Button size="sm" disabled={true}
								>{downloadingFile.status === 'downloding'
									? 'Downloading...'
									: 'Importing...'}</Button
							>
						</div>
					{/each}
					{#each data?.radarrMovie?.movieFile ? [data.radarrMovie.movieFile] : [] as movieFile (movieFile.id)}
						<div class="border-l-2 border-zinc-200 p-1 px-4 flex justify-between items-center my-1">
							<div class="flex gap-1 items-center">
								<b class="">{movieFile.quality.quality.resolution}p</b>
								<DotFilled class="text-zinc-300" />
								<h2 class="text-zinc-200 text-sm">{formatSize(movieFile.size)} on disk</h2>
								<DotFilled class="text-zinc-300" />
								<h2 class="uppercase text-zinc-200 text-sm">
									{movieFile.quality.quality.source}
								</h2>
								<DotFilled class="text-zinc-300" />
								<h2 class="uppercase text-zinc-200 text-sm">
									{movieFile.mediaInfo.videoCodec}
								</h2>
							</div>
							<Button
								size="sm"
								on:click={() => openJellyfinStream()}
								disabled={jellyfinStreamDisabled}>Stream</Button
							>
						</div>
					{/each}
					{#if !data?.radarrMovie?.movieFile && !data.radarrDownload}
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
				{#if data.hasLocalFiles}
					<Button type="secondary">Manage Local Files</Button>
				{/if}
			{/if}
		</div>

		{#if data.isAdded && data.radarrMovie}
			<RequestModal
				bind:visible={isRequestModalVisible}
				radarrId={data.radarrMovie.id}
				on:download={() => refetch()}
			/>
		{/if}
	{:else}
		no data
	{/if}
{:catch err}
	Could not load local movie data.
	{JSON.stringify(err)}
{/await}
