<script lang="ts">
	import { PLATFORM_TV } from '../../constants';
	import { fade } from 'svelte/transition';
	import { cubicIn, cubicOut } from 'svelte/easing';

	export let urls: Promise<string[]>;
	export let index: number;

	let htmlElements: HTMLDivElement[] = [];
	$: {
		if (htmlElements[index]) {
			htmlElements[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}
</script>

<div class="absolute inset-0">
	{#if PLATFORM_TV}
		{#await urls then urls}
			{#key index}
				<div
					class="absolute inset-0 bg-center bg-cover"
					style={`background-image: url('${urls[index]}');`}
					in:fade={{ delay: 700, duration: 500, easing: cubicIn }}
					out:fade={{ delay: 0, duration: 500, easing: cubicOut }}
				/>
				<div class="bg-gradient-to-t from-stone-950 to-transparent absolute inset-0" />
			{/key}
		{/await}
	{:else}
		<div
			class="flex overflow-hidden h-full w-full"
			style="perspective: 1px; -webkit-perspective: 1px;"
		>
			{#await urls then urls}
				{#each urls as url, i}
					<div
						class="w-full h-full flex-shrink-0 basis-auto relative"
						style="transform-style: preserve-3d; -webkit-transform-style: preserve-3d; overflow: hidden;"
						bind:this={htmlElements[i]}
					>
						<div
							class="w-full h-full flex-shrink-0 basis-auto bg-center bg-cover absolute inset-0"
							style={`background-image: url('${url}'); ${
								!PLATFORM_TV &&
								'transform: translateZ(-5px) scale(6); -webkit-transform: translateZ(-5px) scale(6);'
							}`}
						/>
					</div>
				{/each}
			{/await}
		</div>
		<div class="bg-gradient-to-t from-stone-950 to-transparent absolute inset-0" />
	{/if}
</div>
