<script lang="ts">
	import { PLATFORM_TV, TMDB_IMAGES_ORIGINAL } from '$lib/constants';
	import { useTimeoutStore } from '$lib/utils';
	import { fade } from 'svelte/transition';

	const TIMEOUT = 500;

	export let visible: boolean;
	export let backdropUri: string;
	export let hasFocus: boolean;

	const visibleTimeout = useTimeoutStore(TIMEOUT, visible);
	$: if (visible) {
		visibleTimeout.reset();
	}
</script>

{#if visible}
	<div
		class="absolute inset-0 bg-center bg-cover"
		class:opacity-0={$visibleTimeout}
		class:opacity-100={!$visibleTimeout}
		class:scale-110={!hasFocus}
		style={`background-image: url('${TMDB_IMAGES_ORIGINAL}${backdropUri}'); transition: opacity 200ms, transform 200ms;`}
		in:fade|global={{ duration: 0, delay: TIMEOUT / 2 }}
		out:fade|global={{ duration: 200 }}
	/>
{/if}
