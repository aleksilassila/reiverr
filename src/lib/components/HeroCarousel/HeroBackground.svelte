<script lang="ts">
	import { PLATFORM_TV } from '../../constants';
	import classNames from 'classnames';
	import { onDestroy } from 'svelte';
	import { isFirefox } from '../../utils/browser-detection';
    import YouTubeBackground from '../YouTubeBackground.svelte';

	export let urls: Promise<{ trailerUrl: string; backdropUrl: string; }[]>;
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
    {#await urls then urlArray}
        {#if !isFirefox()}
            {#each urlArray as { trailerUrl, backdropUrl }, i}
                {#if i === index}
                    {#if trailerUrl}
                        <YouTubeBackground videoId={trailerUrl} backgroundUrl={backdropUrl} />
                    {:else}
                        <div
                            class={classNames('absolute inset-0 bg-center bg-cover', {
                                'opacity-100': visibleIndex === i,
                                'opacity-0': visibleIndex !== i,
                                'scale-110': !hasFocus
                            })}
                            style={`background-image: url('${backdropUrl}'); transition: opacity 500ms, transform 500ms;`}
                        />
                    {/if}
                {/if}
            {/each}
        {:else}
            <div class={classNames('flex overflow-hidden h-full w-full transition-transform duration-500', { 'scale-110': !hasFocus })}
                 style="perspective: 1px; -webkit-perspective: 1px;">
                {#each urlArray as { backdropUrl }, i}
                    <div class="w-full h-full flex-shrink-0 relative"
                         style="transform-style: preserve-3d; -webkit-transform-style: preserve-3d; overflow: hidden;"
                         bind:this={htmlElements[i]}>
                        <div 
                        class={classNames('absolute inset-0 bg-center bg-cover', {
                            'opacity-100': visibleIndex === i,
                            'opacity-0': visibleIndex !== i,
                            'scale-110': !hasFocus
                        })}
                        style={`background-image: url('${backdropUrl}'); ${
                                !PLATFORM_TV &&
                                'transform: translateZ(-5px) scale(6); -webkit-transform: translateZ(-5px) scale(6);'
                             }`}
                        />
                    </div>
                {/each}
            </div>
        {/if}
    {/await}
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
