<script lang="ts">
	import { ChevronRight } from 'radix-icons-svelte';
	import Button from '../Button.svelte';
	import { modalStack } from '../../stores/modal.store';
	import ModalContainer from '../Modal/ModalContainer.svelte';
	import ModalContent from '../Modal/ModalContent.svelte';
	import ModalHeader from '../Modal/ModalHeader.svelte';
	import EpisodeSelectModal from './EpisodeSelectModal.svelte';
	import RequestModal from './RequestModal.svelte';

	export let modalId: symbol;
	export let sonarrId: number;
	export let seasons: number;
	export let heading = 'Seasons';

	function selectSeasonPack(seasonNumber: number) {
		modalStack.create(
			RequestModal,
			{
				seasonPack: {
					sonarrId,
					seasonNumber
				},
				groupId: modalId
			},
			modalId
		);
	}

	function selectSeason(seasonNumber: number) {
		modalStack.create(
			EpisodeSelectModal,
			{
				seasonNumber,
				sonarrId,
				groupId: modalId
			},
			modalId
		);
	}
</script>

<ModalContainer>
	<ModalHeader close={() => modalStack.close(modalId)} back={undefined} text={heading} />
	<ModalContent>
		<div class="flex flex-col divide-y divide-zinc-700">
			{#each [...Array(seasons).keys()].map((i) => i + 1) as seasonNumber}
				<div
					class="px-4 py-3 flex justify-between items-center text-zinc-300 group-hover:text-zinc-300"
				>
					<div class="font-medium">
						Season {seasonNumber}
					</div>
					<div class="flex gap-2">
						<Button size="sm" type="tertiary" on:click={() => selectSeasonPack(seasonNumber)}>
							<span>Season Packs</span><ChevronRight size={20} />
						</Button>
						<Button size="sm" type="tertiary" on:click={() => selectSeason(seasonNumber)}>
							<span>Episodes</span><ChevronRight size={20} />
						</Button>
					</div>
				</div>
			{/each}
		</div>
	</ModalContent>
</ModalContainer>
