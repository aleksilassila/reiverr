<script lang="ts">
	import FullScreenModal from '../../../Modal/FullScreenModal.svelte';
	import ManageMediaMenuLayout from '../../MediaManagerMenuLayout.svelte';
	import { sonarrApi, type SonarrEpisode } from '../../../../apis/sonarr/sonarr-api';
	import { useRequest } from '../../../../stores/data.store';
	import Button from '../../../Button.svelte';
	import { modalStack } from '../../../Modal/modal.store';
	import ReleaseListModal from '../../modals/ReleaseListModal.svelte';
	import ReleaseActionsModal from '../../modals/ReleaseActionsModal.svelte';
	import type { Release } from '../../../../apis/combined-types';

	export let modalId: symbol;
	export let groupId: symbol;
	export let hidden: boolean;
	export let seriesId: number;
	export let seasonNumber: number;
	export let grabRelease: (guid: string, indexerId: number) => Promise<boolean>;

	const { promise: episodes } = useRequest(sonarrApi.getEpisodes, seriesId, seasonNumber);

	const handleSelectRelease = (release: Release) => {
		modalStack.create(
			ReleaseActionsModal,
			{
				release,
				grabRelease: () => grabRelease(release.guid || '', release.indexerId || -1),
				status: undefined
			},
			groupId
		);
	};

	function handleSelectEpisode(episode: SonarrEpisode) {
		const id = episode.id;
		if (!id) return;
		modalStack.create(
			ReleaseListModal,
			{
				getReleases: () => sonarrApi.getEpisodeReleases(id),
				selectRelease: handleSelectRelease
			},
			groupId
		);
	}

	function handleSelectSeasonPacks() {
		modalStack.create(
			ReleaseListModal,
			{
				getReleases: () => sonarrApi.getSeasonReleases(seriesId, seasonNumber),
				selectRelease: handleSelectRelease
			},
			groupId
		);
	}
</script>

<FullScreenModal {modalId} {hidden}>
	<Button on:clickOrSelect={handleSelectSeasonPacks}>Season Packs</Button>
	<ManageMediaMenuLayout>
		<h1 slot="header">Episodes</h1>
		<div class="flex flex-col -my-1">
			{#await $episodes then episodes}
				{#each episodes as episode}
					<div class="my-1">
						<Button on:clickOrSelect={() => handleSelectEpisode(episode)}>
							<div class="flex items-center font-medium">
								<div class="mr-2 text-zinc-300">{episode.episodeNumber}.</div>
								<div>{episode.title}</div>
							</div>
						</Button>
					</div>
				{/each}
			{/await}
		</div>
	</ManageMediaMenuLayout>
</FullScreenModal>
