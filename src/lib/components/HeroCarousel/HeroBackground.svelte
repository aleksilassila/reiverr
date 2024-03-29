<script lang="ts">
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
						style={`background-image: url('${url}'); transform: translateZ(-5px) scale(6); -webkit-transform: translateZ(-5px) scale(6);`}
					/>
				</div>
			{/each}
		{/await}
	</div>
	<div class="bg-gradient-to-t from-stone-950 to-transparent absolute inset-0" />
</div>
