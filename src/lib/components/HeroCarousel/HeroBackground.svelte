<script lang="ts">
	import { PLATFORM_TV } from '../../constants';
	import classNames from 'classnames';
	import { onDestroy } from 'svelte';
	import { isFirefox } from '../../utils/browser-detection';

	export let urls: Promise<string[]>;
	export let index: number;
	export let hasFocus = true;
	export let hideInterface = false;
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

<div class="fixed inset-0 -z-10" style="-webkit-transform: translate3d(0,0,0);">
	{#if !isFirefox()}
		{#await urls then urls}
			{#each urls as url, i}
				<div
					class={classNames('absolute inset-0 bg-center bg-cover', {
						'opacity-100': visibleIndex === i,
						'opacity-0': visibleIndex !== i,
						'scale-110': !hasFocus
					})}
					style={`background-image: url('${url}'); transition: opacity 500ms, transform 500ms;`}
				/>
			{/each}
		{/await}
	{:else}
		<div
			class={classNames('flex overflow-hidden h-full w-full transition-transform duration-500', {
				'scale-110': !hasFocus
			})}
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
	{/if}
</div>
<div
	class={classNames('absolute inset-0 flex flex-col -z-10 transition-opacity', {
		'opacity-0': hideInterface
	})}
	style="-webkit-transform: translate3d(0,0,0);"
>
	<div class="h-screen bg-gradient-to-b from-transparent to-secondary-900" />
	<div class="flex-1 bg-secondary-900" />
</div>
