<script lang="ts">
	import { fetchSonarrEpisodes, type SonarrEpisode } from '$lib/apis/sonarr/sonarrApi';
	import { modalStack } from '../Modal/Modal';
	import ModalContainer from '../Modal/ModalContainer.svelte';
	import ModalContent from '../Modal/ModalContent.svelte';
	import ModalHeader from '../Modal/ModalHeader.svelte';
	import RequestModal from './RequestModal.svelte';

	export let modalId: symbol;
	export let groupId: symbol;

	export let sonarrId: number;
	export let seasonNumber: number;

	async function fetchEpisodes(sonarrId: number, seasonNumber: number) {
		return fetchSonarrEpisodes(sonarrId).then((episodes) =>
			episodes.filter((episode) => episode.seasonNumber === seasonNumber)
		);
	}

	function selectEpisode(episode: SonarrEpisode) {
		modalStack.create(
			RequestModal,
			{
				sonarrEpisodeId: episode.id,
				// sonarrId,
				groupId
			},
			groupId
		);
	}
</script>

<ModalContainer>
	<ModalHeader
		close={() => modalStack.closeGroup(groupId)}
		back={() => modalStack.close(modalId)}
		text="Seasons"
	/>
	<ModalContent>
		<div class="flex flex-col divide-y divide-zinc-700">
			{#await fetchEpisodes(sonarrId, seasonNumber)}
				Loading...
			{:then episodes}
				{#if episodes.length === 0}
					<div class="px-4 py-1 text-xs text-gray-400">No episodes</div>
				{:else}
					{#each episodes as episode}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<div
							class="px-4 py-1 flex flex-row items-center justify-between cursor-pointer hover:bg-lighten"
							on:click={() => selectEpisode(episode)}
						>
							<div class="flex flex-col gap-1">
								<div class="text-sm font-medium">{episode.title}</div>
								<div class="text-xs text-gray-400">
									{episode.episodeNumber ? `Episode ${episode.episodeNumber}` : 'Special'}
								</div>
							</div>
							<div class="text-xs text-gray-400">
								{new Date(episode.airDate || Date.now()).toLocaleDateString('en', {
									year: 'numeric',
									month: 'short',
									day: 'numeric'
								})}
							</div>
						</div>
					{/each}
				{/if}
			{/await}
		</div>
	</ModalContent>
</ModalContainer>
