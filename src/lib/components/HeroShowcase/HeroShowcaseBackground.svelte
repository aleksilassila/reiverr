<script lang="ts">
	import { TMDB_IMAGES_ORIGINAL } from '../../constants';
	import type { ShowcaseItemProps } from './HeroShowcase';

	export let items: Promise<ShowcaseItemProps[]>;
	export let index: number;

	let htmlElements: HTMLDivElement[] = [];
	$: {
		if (htmlElements[index]) {
			htmlElements[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}
</script>

<div
	class="absolute inset-0 flex overflow-hidden h-full w-full"
	style="perspective: 1px; -webkit-perspective: 1px;"
>
	{#await items then items}
		{#each items as item, index}
			<div
				class="w-full h-full flex-shrink-0 basis-auto relative"
				style="transform-style: preserve-3d; -webkit-transform-style: preserve-3d; overflow: hidden;"
				bind:this={htmlElements[index]}
			>
				<div
					class="w-full h-full flex-shrink-0 basis-auto bg-center bg-cover absolute inset-0"
					style={`background-image: url('${TMDB_IMAGES_ORIGINAL}${item.backdropUrl}'); transform: translateZ(-5px) scale(6); -webkit-transform: translateZ(-5px) scale(6);`}
				/>
			</div>
		{/each}
	{/await}
</div>
