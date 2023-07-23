<script lang="ts">
	import { fetchRadarrReleases } from '$lib/apis/radarr/radarrApi';
	import { fetchSonarrReleases } from '$lib/apis/sonarr/sonarrApi';
	import { formatMinutesToTime, formatSize } from '$lib/utils';
	import { DotFilled, Download, Plus } from 'radix-icons-svelte';
	import { createEventDispatcher } from 'svelte';
	import HeightHider from '../HeightHider.svelte';
	import IconButton from '../IconButton.svelte';
	import Modal from '../Modal/Modal.svelte';
	import ModalContent from '../Modal/ModalContent.svelte';
	import ModalHeader from '../Modal/ModalHeader.svelte';

	const dispatch = createEventDispatcher();

	// TODO: Switch to grid
	export let visible = true; // FIXME
	export let radarrId: number | undefined = undefined;
	export let sonarrEpisodeId: number | undefined = undefined;

	let showAllReleases = false;
	let showDetailsId: string | null = null;
	let downloadFetchingGuid: string | undefined;
	let downloadingGuid: string | undefined;

	let releasesResponse: ReturnType<typeof fetchReleases>;

	$: if (visible && !releasesResponse) {
		releasesResponse = fetchReleases();
	}

	async function fetchReleases() {
		if (!radarrId && !sonarrEpisodeId) {
			return {
				releases: [],
				filtered: [],
				releasesSkipped: 0
			};
		}

		const releases = radarrId
			? await fetchRadarrReleases(radarrId)
			: await fetchSonarrReleases(sonarrEpisodeId as number);

		let filtered = releases.slice();

		filtered.sort((a, b) => (b.seeders || 0) - (a.seeders || 0));
		filtered = (filtered as any)
			.filter((release: any) => release?.quality?.quality?.resolution > 720)
			.slice(0, 5);

		const releasesSkipped = releases.length - filtered.length;

		releases.sort((a, b) => (b.size || 0) - (a.size || 0));
		filtered.sort((a, b) => (b.size || 0) - (a.size || 0));

		return {
			releases,
			filtered,
			releasesSkipped
		};
	}

	function handleDownload(guid: string) {
		downloadFetchingGuid = guid;
		fetch('/movie/0/releases', {
			method: 'POST',
			body: JSON.stringify({ guid })
		}).then((res) => {
			dispatch('download');
			downloadFetchingGuid = undefined;
			if (res.ok) {
				downloadingGuid = guid;
			}
		});
	}

	function toggleShowAll() {
		showAllReleases = !showAllReleases;
	}

	function toggleShowDetails(id: string | null) {
		if (showDetailsId === id) {
			showDetailsId = null;
		} else {
			showDetailsId = id;
		}
	}

	function close() {
		visible = false;
		downloadFetchingGuid = undefined;
		downloadingGuid = undefined;
	}
</script>

<Modal {visible} {close}>
	<ModalContent>
		<ModalHeader {close} text="Releases" />
		{#await releasesResponse}
			<div class="text-sm text-zinc-200 opacity-50 font-light p-4">Loading...</div>
		{:then { releases, filtered, releasesSkipped }}
			{#if showAllReleases ? releases?.length : filtered?.length}
				<div class="flex flex-col py-2 divide-y divide-zinc-700 max-h-[60vh] overflow-y-scroll">
					{#each showAllReleases ? releases : filtered as release}
						<div>
							<!-- svelte-ignore a11y-click-events-have-key-events -->
							<!-- svelte-ignore a11y-no-static-element-interactions -->
							<div
								class="flex px-4 py-2 gap-4 hover:bg-lighten items-center justify-between cursor-pointer text-sm"
								on:click={() => toggleShowDetails(release.guid || null)}
							>
								<div class="flex gap-4">
									<div class="tracking-wide font-medium">{release.indexer}</div>
									<div class="text-zinc-400">{release?.quality?.quality?.name}</div>
									<div class="text-zinc-400">{release.seeders} seeders</div>
								</div>
								<div class="flex gap-2 items-center">
									<div class="text-zinc-400">{formatSize(release?.size || 0)}</div>
									{#if release.guid !== downloadingGuid}
										<IconButton
											on:click={() => release.guid && handleDownload(release.guid)}
											disabled={downloadFetchingGuid === release.guid}
										>
											<Plus size={20} />
										</IconButton>
									{:else}
										<div class="p-1">
											<Download size={20} />
										</div>
									{/if}
								</div>
							</div>
							<HeightHider visible={showDetailsId === release.guid}>
								<div class="flex gap-1 text-xs text-zinc-400 px-4 py-2 items-center flex-wrap">
									<div>
										{release.title}
									</div>
									<DotFilled size={15} />
									<div>{formatMinutesToTime(release.ageMinutes || 0)} old</div>
									<DotFilled size={15} />
									<div><b>{release.seeders} seeders</b> / {release.leechers} leechers</div>
									<DotFilled size={15} />
									{#if release.seeders}
										<div>
											{formatSize((release.size || 0) / release.seeders)} per seeder
										</div>
									{/if}
								</div>
							</HeightHider>
						</div>
					{/each}
				</div>
				{#if releasesSkipped > 0}
					<div
						class="text-sm text-zinc-200 opacity-50 font-light px-4 py-2 hover:underline cursor-pointer"
						on:click={toggleShowAll}
					>
						{showAllReleases ? 'Show less' : `Show all ${releasesSkipped} releases`}
					</div>
				{/if}
			{:else}
				<div class="text-sm text-zinc-200 opacity-50 font-light p-4">No releases found.</div>
			{/if}
		{/await}
	</ModalContent>
</Modal>