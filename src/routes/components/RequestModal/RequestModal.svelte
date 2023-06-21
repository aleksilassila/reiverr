<script lang="ts">
	import Modal from '../Modal/Modal.svelte';
	import ModalContent from '../Modal/ModalContent.svelte';
	import { requestRadarrReleases, requestQueueRadarrRelease } from '$lib/radarr/radarr';
	import { formatSize } from '$lib/utils';
	import IconButton from '../IconButton.svelte';
	import { Download } from 'radix-icons-svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let visible = false;
	function close() {
		visible = false;
	}

	export let radarrId;

	const { data: releases, load: loadReleases, didLoad: didLoadReleases } = requestRadarrReleases();
	const { data, load: downloadRelease } = requestQueueRadarrRelease();

	$: if (visible) loadReleases(radarrId);

	let releasesFiltered = [];
	let releasesSkipped = 0;
	releases.subscribe((releases: any[]) => {
		if (!releases) return;
		releasesFiltered = releases
			.filter((release) => {
				if (release.seeders < 5) return false;
				else return true;
			})
			.sort((a, b) => b.size - a.size)
			.slice(0, 5);
		releasesSkipped = releases.length - releasesFiltered.length;
	});

	function handleDownload(guid) {
		downloadRelease(guid).then(() => {
			dispatch('download');
		});
	}
</script>

<Modal {visible} {close}>
	<ModalContent>
		{#if releasesFiltered?.length}
			Releases:
			<div class="flex flex-col">
				{#each releasesFiltered as release}
					<div class="flex items-center justify-between">
						<div>{formatSize(release.size)}</div>
						<IconButton on:click={() => handleDownload(release.guid)}>
							<Download size="20" />
						</IconButton>
					</div>
				{/each}
			</div>
			{#if releasesSkipped > 0}
				<div>{releasesSkipped} releases hidden</div>
			{/if}
		{:else if !$didLoadReleases}
			Loading...
		{:else}
			No releases found
		{/if}
	</ModalContent>
</Modal>
