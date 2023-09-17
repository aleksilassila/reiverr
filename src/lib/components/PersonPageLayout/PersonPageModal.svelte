<script lang="ts">
	import type { TitleId } from '$lib/types';
	import { fly } from 'svelte/transition';
	import PersonPage from '../../../routes/person/[id]/PersonPage.svelte';
	import { modalStack } from '../../stores/modal.store';

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
		<PersonPage tmdbId={titleId.id} isModal={true} {handleCloseModal} />
	</div>
</div>
