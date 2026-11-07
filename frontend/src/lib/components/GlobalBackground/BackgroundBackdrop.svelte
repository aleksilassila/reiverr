<script lang="ts">
	import { PLATFORM_TV, TMDB_IMAGES_ORIGINAL } from '$lib/constants';
	import { useTimeoutStore } from '$lib/utils';
	import { fade } from 'svelte/transition';

	const TIMEOUT = 500;

	interface Props {
		visible: boolean;
		backdropUri: string;
		hasFocus: boolean;
	}

	let { visible, backdropUri, hasFocus }: Props = $props();

	// Through a derived, so that the effect below re-runs when the value changes: the stack replaces
	// its background objects at every write, and an effect on the prop itself would re-run on each
	// of them and restart the fade in
	const isVisible = $derived(visible);
	const visibleTimeout = useTimeoutStore(TIMEOUT, visible);
	$effect(() => {
		if (isVisible) {
			visibleTimeout.reset();
		}
	});
</script>

{#if isVisible}
	<div
		class="absolute inset-0 bg-center bg-cover"
		class:opacity-0={$visibleTimeout}
		class:opacity-100={!$visibleTimeout}
		class:scale-110={!hasFocus}
		style={`background-image: url('${TMDB_IMAGES_ORIGINAL}${backdropUri}'); transition: opacity 200ms, transform 200ms;`}
		in:fade|global={{ duration: 0, delay: TIMEOUT / 2 }}
		out:fade|global={{ duration: 200 }}
	></div>
{/if}
