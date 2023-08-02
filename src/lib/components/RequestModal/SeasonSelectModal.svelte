<script lang="ts">
	import type { SonarrSeries } from '$lib/apis/sonarr/sonarrApi';
	import { createModalProps, type ModalProps } from '../Modal/Modal';
	import Modal from '../Modal/Modal.svelte';
	import ModalContainer from '../Modal/ModalContainer.svelte';
	import ModalContent from '../Modal/ModalContent.svelte';
	import ModalHeader from '../Modal/ModalHeader.svelte';

	export let modalProps: ModalProps;
	export let sonarrId: number;
	export let sonarrSeries: SonarrSeries;

	// let selectedEpisode: SonarrEpisode | undefined;
	let requestModalProps = createModalProps(() => {
		modalProps.close();
		// selectedEpisode = undefined;
	});

	// async function fetchEpisodes(sonarrId: number) {
	// 	return fetchSonarrEpisodes(sonarrId).then((episodes) => {
	// 		// Group episodes by season
	// 		const seasons: SonarrEpisode[][] = [];
	// 		episodes.forEach((episode) => {
	// 			if (!episode.seasonNumber) {
	// 				return;
	// 			}

	// 			if (!seasons[episode.seasonNumber - 1]) {
	// 				seasons[episode.seasonNumber - 1] = [];
	// 			}
	// 			seasons[episode.seasonNumber - 1].push(episode);
	// 		});

	// 		return seasons;
	// 	});
	// }

	async function fetchSeasons() {}
</script>

<Modal {...modalProps}>
	<ModalContainer>
		<ModalHeader {...modalProps} text="Seasons" />
		<ModalContent>
			<div class="flex flex-col divide-y divide-zinc-700">
				{#each sonarrSeries.seasons || [] as season}
					<div>{season.seasonNumber}</div>
				{/each}
			</div>
		</ModalContent>
	</ModalContainer>
</Modal>

{console.log(sonarrSeries)}

<!-- {#if selectedEpisode?.id}
	<RequestModal
		modalProps={requestModalProps}
		sonarrEpisodeId={selectedEpisode.id}
		title={selectedEpisode.title || undefined}
	/>
{/if} -->
