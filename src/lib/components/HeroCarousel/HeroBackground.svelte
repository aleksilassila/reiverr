<script lang="ts">
	import { PLATFORM_TV } from '../../constants';
	import classNames from 'classnames';
	import { onDestroy } from 'svelte';

	export let urls: Promise<string[]>;
	export let index: number;
	let visibleIndex = -2;
	let visibleIndexTimeout: ReturnType<typeof setTimeout>;

	let htmlElements: HTMLDivElement[] = [];
	$: {
		if (htmlElements[index]) {
			htmlElements[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}

	function updateVisibleIndex(index: number) {
		if (visibleIndexTimeout) {
			clearTimeout(visibleIndexTimeout);
		}
		visibleIndexTimeout = setTimeout(
			() => {
				visibleIndex = index;
			},
			visibleIndex === -2 ? 1000 : 500
		);
		visibleIndex = -1;
	}
	$: updateVisibleIndex(index);

	onDestroy(() => visibleIndexTimeout && clearTimeout(visibleIndexTimeout));
</script>

<div class="absolute inset-0">
	{#if PLATFORM_TV}
		{#await urls then urls}
			{#each urls as url, i}
				<div
					class={classNames('absolute inset-0 bg-center bg-cover transition-opacity duration-500', {
						'opacity-100': visibleIndex === i,
						'opacity-0': visibleIndex !== i
					})}
					style={`background-image: url('${url}');`}
				/>
			{/each}
			<div class="bg-gradient-to-t from-stone-950 to-transparent absolute inset-0" />
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
