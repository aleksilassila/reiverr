<script lang="ts">
	import { fetchSonarrEpisodes, type SonarrEpisode } from '$lib/apis/sonarr/sonarrApi';
	import Modal from '../Modal/Modal.svelte';
	import ModalContent from '../Modal/ModalContent.svelte';
	import ModalHeader from '../Modal/ModalHeader.svelte';

	export let visible = false;
	export let sonarrId: number;

	let episodesPromise: ReturnType<typeof fetchEpisodes>;

	$: if (visible && !episodesPromise) {
		episodesPromise = fetchEpisodes(sonarrId);
	}

	function close() {
		visible = false;
	}

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

<Modal {visible} {close}>
	<ModalContent>
		<ModalHeader {close} text="Seasons" />
		<div class="flex flex-col gap-2 sm:gap-4">
			{#await episodesPromise then seasons}
				{console.log('saesons', seasons)}
				{#each seasons as episodes, i}
					{#if i > 0}
						<div class="border-t border-gray-200" />
					{/if}

					{#each episodes as episode}
						<div class="flex flex-row items-center justify-between">
							<div class="flex flex-row items-center gap-2">
								<div class="flex flex-col">
									<div class="text-sm font-medium text-gray-900">
										{episode.episodeNumber}. {episode.title}
									</div>
									<div class="text-sm text-gray-500">
										{episode.airDate}
									</div>
								</div>
							</div>
							<div class="flex flex-row items-center gap-2">
								<div class="flex flex-col">
									<div class="text-sm font-medium text-gray-900">
										{episode.episodeNumber}. {episode.title}
									</div>
									<div class="text-sm text-gray-500">
										{episode.airDate}
									</div>
								</div>
							</div>
						</div>
					{/each}
				{/each}
			{/await}
		</div>
	</ModalContent>
</Modal>
