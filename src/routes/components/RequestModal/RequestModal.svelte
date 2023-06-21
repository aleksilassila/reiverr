<script lang="ts">
	import Modal from '../Modal/Modal.svelte';
	import ModalContent from '../Modal/ModalContent.svelte';
	import { formatMinutesToTime, formatSize } from '$lib/utils';
	import IconButton from '../IconButton.svelte';
	import { DotFilled, Download, Plus } from 'radix-icons-svelte';
	import { createEventDispatcher } from 'svelte';
	import ModalHeader from '../Modal/ModalHeader.svelte';
	import { log } from '$lib/utils.js';
	import HeightHider from '../HeightHider.svelte';

	const dispatch = createEventDispatcher();

	export let visible = true; // FIXME
	function close() {
		visible = false;
		downloadFetching = false;
		downloadingGuid = null;
	}

	export let radarrId;

	let releasesResponse;
	$: if (visible) {
		releasesResponse = fetch(`/movie/${radarrId}/releases`).then((res) => log(res.json()));
	}

	let downloadFetching;
	let downloadingGuid;
	function handleDownload(guid) {
		downloadFetching = guid;
		fetch('/movie/0/releases', {
			method: 'POST',
			body: JSON.stringify({ guid })
		}).then((res) => {
			dispatch('download');
			downloadFetching = false;
			if (res.ok) {
				downloadingGuid = guid;
			}
		});
	}

	let showAllReleases = false;
	function toggleShowAll() {
		showAllReleases = !showAllReleases;
	}

	let showDetailsId;
	function toggleShowDetails(id) {
		if (showDetailsId === id) {
			showDetailsId = null;
		} else {
			showDetailsId = id;
		}
	}
</script>

<Modal {visible} {close}>
	<ModalContent>
		<ModalHeader {close} text="Releases" />
		{#await releasesResponse}
			<div class="text-sm text-zinc-200 opacity-50 font-light p-4">Loading...</div>
		{:then data}
			{#if showAllReleases ? data?.allReleases?.length : data?.filtered?.length}
				<div class="flex flex-col py-2 divide-y divide-zinc-700 max-h-[60vh] overflow-y-scroll">
					{#each showAllReleases ? data.allReleases : data.filtered as release}
						<div>
							<div
								class="flex px-4 py-2 gap-4 hover:bg-highlight-dim items-center justify-between cursor-pointer text-sm"
								on:click={() => toggleShowDetails(release.guid)}
							>
								<div class="flex gap-4">
									<div class="tracking-wide font-medium">{release.indexer}</div>
									<div class="text-zinc-400">{release.quality.quality.name}</div>
									<div class="text-zinc-400">{release.seeders} seeders</div>
								</div>
								<div class="flex gap-2 items-center">
									<div class="text-zinc-400">{formatSize(release.size)}</div>
									{#if release.guid !== downloadingGuid}
										<IconButton
											on:click={() => handleDownload(release.guid)}
											disabled={downloadFetching === release.guid}
										>
											<Plus size="20" />
										</IconButton>
									{:else}
										<div class="p-1">
											<Download size="20" />
										</div>
									{/if}
								</div>
							</div>
							<HeightHider visible={showDetailsId === release.guid}>
								<div class="flex gap-1 text-xs text-zinc-400 px-4 py-2 items-center flex-wrap">
									<div>
										{release.title}
									</div>
									<DotFilled size="15" />
									<div>{formatMinutesToTime(release.ageMinutes)} old</div>
									<DotFilled size="15" />
									<div><b>{release.seeders} seeders</b> / {release.leechers} leechers</div>
									<DotFilled size="15" />
									{#if release.seeders}
										<div>
											{formatSize(release.size / release.seeders)} per seeder
										</div>
									{/if}
								</div>
							</HeightHider>
						</div>
					{/each}
				</div>
				{#if data?.releasesSkipped > 0}
					<div
						class="text-sm text-zinc-200 opacity-50 font-light px-4 py-2 hover:underline cursor-pointer"
						on:click={toggleShowAll}
					>
						{showAllReleases ? 'Show less' : `Show all ${data.releasesSkipped} releases`}
					</div>
				{/if}
			{:else}
				<div class="text-sm text-zinc-200 opacity-50 font-light p-4">No releases found.</div>
			{/if}
		{/await}
	</ModalContent>
</Modal>
