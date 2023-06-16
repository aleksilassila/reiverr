<script lang="ts">
	import { onMount } from 'svelte';
	import { formatSize } from '$lib/utils';
	import Button from '../Ui/Button.svelte';
	import { DotFilled, Plus } from 'radix-icons-svelte';
	import RequestModal from '../RequestModal/RequestModal.svelte';
	import { addRadarrMovie, getQueuedById, getRadarrMovie } from '$lib/radarr/radarr';
	import IconButton from '../IconButton.svelte';
	import { formatMinutes } from '$lib/utils.js';
	import classNames from 'classnames';

	let isRequestModalVisible = false;
	export let tmdbId: string;

	const { data: localResource, load, didLoad } = getRadarrMovie();
	const { data: queueResponse, load: loadQueued } = getQueuedById();
	const { data: addMovieResponse, loading: addMovieLoading, load: addToRadarr } = addRadarrMovie();

	function refreshRadarrMovie() {
		if (tmdbId) load(tmdbId);
	}

	onMount(() => {
		refreshRadarrMovie();
	});

	addMovieResponse.subscribe(() => {
		if ($addMovieResponse) refreshRadarrMovie();
	});

	const headerStyle = 'uppercase tracking-widest font-bold';

	function openRequestModal() {
		if ($localResource) isRequestModalVisible = true;
	}

	localResource.subscribe((resource) => {
		if (resource?.id) loadQueued(resource.id);
	});
</script>

<div class="flex flex-col gap-8 p-8">
	{#if !$didLoad}
		Loading...
	{:else if !$localResource?.movieFile}
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
	{#if $localResource}
		<div class="">
			<div class="flex items-center gap-2 mb-4">
				<div class={headerStyle}>Local Library</div>
				<IconButton on:click={openRequestModal}>
					<Plus size="20" />
				</IconButton>
			</div>
			{#each $queueResponse || [] as downloadingFile}
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
						>{downloadingFile.status === 'downloding' ? 'Downloading...' : 'Importing...'}</Button
					>
				</div>
			{/each}
			{#each $localResource?.movieFile ? [$localResource.movieFile] : [] as movieFile (movieFile.id)}
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
					<Button size="sm">Stream</Button>
				</div>
			{/each}
		</div>
	{/if}
</div>
<div class="flex gap-4 items-center bg-black p-8 py-4 empty:hidden">
	{#if !$localResource && $didLoad && tmdbId}
		<Button on:click={() => addToRadarr(tmdbId)} disabled={$addMovieLoading}>Add to Radarr</Button>
	{/if}
	{#if $localResource?.movieFile}
		<Button type="secondary">Manage Local Files</Button>
	{/if}
</div>
{#if $localResource?.id}
	<RequestModal
		bind:visible={isRequestModalVisible}
		radarrId={$localResource.id}
		on:download={() => refreshRadarrMovie()}
	/>
{/if}
