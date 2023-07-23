<script lang="ts">
	import { fetchSonarrEpisodes, type SonarrEpisode } from '$lib/apis/sonarr/sonarrApi';
	import { ChevronUp } from 'radix-icons-svelte';
	import IconButton from '../IconButton.svelte';
	import { createModalProps, type ModalProps } from '../Modal/Modal';
	import Modal from '../Modal/Modal.svelte';
	import ModalContainer from '../Modal/ModalContainer.svelte';
	import ModalHeader from '../Modal/ModalHeader.svelte';
	import RequestModal from './RequestModal.svelte';
	import ModalContent from '../Modal/ModalContent.svelte';

	export let modalProps: ModalProps;
	export let sonarrId: number;

	let selectedEpisode: SonarrEpisode | undefined;
	let requestModalProps = createModalProps(() => {
		modalProps.close();
		selectedEpisode = undefined;
	});

	async function fetchEpisodes(sonarrId: number) {
		return fetchSonarrEpisodes(sonarrId).then((episodes) => {
			// Group episodes by season
			const seasons: SonarrEpisode[][] = [];
			episodes.forEach((episode) => {
				if (!episode.seasonNumber) {
					return;
				}

				if (!seasons[episode.seasonNumber - 1]) {
					seasons[episode.seasonNumber - 1] = [];
				}
				seasons[episode.seasonNumber - 1].push(episode);
			});

			return seasons;
		});
	}
</script>

<Modal {...modalProps}>
	<ModalContainer>
		<ModalHeader {...modalProps} text="Seasons" />
		<ModalContent>
			<div class="flex flex-col divide-y divide-zinc-700">
				{#await fetchEpisodes(sonarrId)}
					Loading...
				{:then seasons}
					{#each seasons as episodes, i}
						<div class="pb-2">
							<div
								class="px-4 py-3 flex justify-between items-center cursor-pointer text-zinc-300 group-hover:text-zinc-300"
							>
								<div class="uppercase font-bold text-sm">
									Season {i + 1}
								</div>
								<ChevronUp size={20} />
							</div>
							<div class="flex flex-col gap-1">
								{#if episodes.length === 0}
									<div class="px-4 py-1 text-xs text-gray-400">No episodes</div>
								{:else}
									{#each episodes as episode}
										<!-- svelte-ignore a11y-click-events-have-key-events -->
										<!-- svelte-ignore a11y-no-static-element-interactions -->
										<div
											class="px-4 py-1 flex flex-row items-center justify-between cursor-pointer hover:bg-lighten"
											on:click={() => (selectedEpisode = episode)}
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
							</div>
						</div>
					{/each}
				{/await}
			</div>
		</ModalContent>
	</ModalContainer>
</Modal>

{#if selectedEpisode?.id}
	<RequestModal
		modalProps={requestModalProps}
		sonarrEpisodeId={selectedEpisode.id}
		title={selectedEpisode.title || undefined}
	/>
{/if}
