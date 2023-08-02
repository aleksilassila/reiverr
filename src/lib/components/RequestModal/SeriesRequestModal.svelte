<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { createModalProps, type ModalProps } from '../Modal/Modal';
	import Modal from '../Modal/Modal.svelte';
	import ModalContainer from '../Modal/ModalContainer.svelte';
	import ModalContent from '../Modal/ModalContent.svelte';
	import ModalHeader from '../Modal/ModalHeader.svelte';
	import RoundedButton from '../RoundedButton.svelte';
	import EpisodeSelectModal from './EpisodeSelectModal.svelte';
	import RequestModal from './RequestModal.svelte';
	import type { SonarrEpisode } from '$lib/apis/sonarr/sonarrApi';

	export let modalProps: ModalProps;
	export let sonarrId: number;
	export let seasons: number;

	let episodeSelectProps: Omit<ComponentProps<EpisodeSelectModal>, 'modalProps'> | undefined =
		undefined;
	let episodeSelectModalProps = createModalProps(
		() => {
			episodeSelectProps = undefined;
			modalProps.close();
		},
		() => {
			episodeSelectProps = undefined;
		}
	);

	let requestProps: Omit<ComponentProps<RequestModal>, 'modalProps'> | undefined = undefined;
	let requestModalProps = createModalProps(
		() => {
			requestProps = undefined;
			episodeSelectModalProps.close();
		},
		() => {
			requestProps = undefined;
		}
	);

	function selectSeasonPack(seasonNumber: number) {
		requestProps = {
			seasonPack: {
				sonarrId,
				seasonNumber
			}
		};
	}

	function selectSeason(seasonNumber: number) {
		episodeSelectProps = {
			seasonNumber,
			selectEpisode,
			sonarrId
		};
	}

	function selectEpisode(episode: SonarrEpisode) {
		requestProps = {
			sonarrEpisodeId: episode.id,
			title: episode.title || 'Episode'
		};
	}
</script>

<Modal {...modalProps}>
	<ModalContainer>
		<ModalHeader {...modalProps} back={undefined} text="Seasons" />
		<ModalContent>
			<div class="flex flex-col divide-y divide-zinc-700">
				{#each [...Array(seasons).keys()].map((i) => i + 1) as seasonNumber}
					<div
						class="px-4 py-3 flex justify-between items-center text-zinc-300 group-hover:text-zinc-300"
					>
						<div class="uppercase font-bold text-sm">
							Season {seasonNumber}
						</div>
						<div class="flex gap-2">
							<RoundedButton on:click={() => selectSeasonPack(seasonNumber)}
								>Season Packs</RoundedButton
							>
							<RoundedButton on:click={() => selectSeason(seasonNumber)}>Episodes</RoundedButton>
						</div>
					</div>
				{/each}
			</div>
		</ModalContent>
	</ModalContainer>
</Modal>

{#if episodeSelectProps}
	<EpisodeSelectModal modalProps={episodeSelectModalProps} {...episodeSelectProps} />
{/if}

{#if requestProps}
	<RequestModal modalProps={requestModalProps} {...requestProps} />
{/if}
