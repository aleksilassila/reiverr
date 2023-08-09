<script lang="ts">
	import { fly } from 'svelte/transition';
	import MoviePage from '../../../routes/movie/[id]/MoviePage.svelte';
	import SeriesPage from '../../../routes/series/[id]/SeriesPage.svelte';
	import { createModalProps } from '../Modal/Modal';
	import Modal from '../Modal/Modal.svelte';
	import { titlePageModal } from './TitlePageModal';
	import { onMount } from 'svelte';

	const modalProps = createModalProps(() => {
		titlePageModal.close();
	});

	function handleCloseModal() {
		modalProps.close();
	}

	onMount(() => {
		console.log('modal mounted');

		return () => modalProps.close();
	});
</script>

{#if $titlePageModal.tmdbId}
	{@const tmdbId = $titlePageModal.tmdbId}
	<Modal {...modalProps}>
		<div
			class="max-w-screen-2xl overflow-x-hidden overflow-y-scroll h-screen sm:mx-4 lg:mx-12 xl:mx-16 scrollbar-hide"
		>
			<div
				class="relative overflow-hidden"
				in:fly|global={{ y: 20, duration: 200, delay: 200 }}
				out:fly|global={{ y: 20, duration: 200 }}
			>
				{#if $titlePageModal.type === 'movie'}
					<MoviePage {tmdbId} isModal={true} {handleCloseModal} />
				{:else}
					<SeriesPage {tmdbId} isModal={true} {handleCloseModal} />
				{/if}
			</div>
		</div>
	</Modal>
{/if}
