<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		progress?: number;
		/** Share of the bar after the progress filled in red, for what passed a limit */
		excess?: number;
	}

	let { progress = 0, excess = 0 }: Props = $props();
	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});
</script>

<div class="h-1 bg-zinc-200 bg-opacity-20 rounded-full overflow-hidden flex">
	<div
		style={'max-width: ' + (mounted ? progress * 100 : 0) + '%'}
		class="h-full w-full bg-zinc-200 bg-opacity-80 transition-[max-width] delay-200 duration-500"
	></div>
	{#if excess > 0}
		<div
			style={'max-width: ' + (mounted ? excess * 100 : 0) + '%'}
			class="h-full w-full bg-red-500 transition-[max-width] delay-200 duration-500"
		></div>
	{/if}
</div>
