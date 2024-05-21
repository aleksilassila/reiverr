<script lang="ts">
	import type { TitleId } from '$lib/types';
	import { fly } from 'svelte/transition';
	import MoviePage from '../../../routes/movie/[id]/MoviePage.svelte';
	import SeriesPage from '../../../routes/series/[id]/SeriesPage.svelte';
	import { modalStack } from '../../stores/modal.store';
	import PersonPage from '../../../routes/person/[id]/PersonPage.svelte';

	export let titleId: TitleId;
	export let modalId: symbol;

	function handleCloseModal() {
		modalStack.close(modalId);
	}
</script>

<div
	class="max-w-screen-2xl overflow-x-hidden overflow-y-scroll h-screen sm:mx-4 lg:mx-12 xl:mx-16 scrollbar-hide"
>
	<div
		class="relative overflow-hidden"
		in:fly|global={{ y: 20, duration: 200, delay: 200 }}
		out:fly|global={{ y: 20, duration: 200 }}
	>
		{#if titleId.type === 'movie'}
			<MoviePage tmdbId={titleId.id} isModal={true} {handleCloseModal} />
		{:else if titleId.type === 'series'}
			<SeriesPage {titleId} isModal={true} {handleCloseModal} />
		{:else if titleId.type === 'person'}
			<PersonPage tmdbId={titleId.id} isModal={true} {handleCloseModal} />
		{/if}
	</div>
</div>
