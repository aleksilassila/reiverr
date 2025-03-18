<script lang="ts">
	import Container from '$lib/components/Container.svelte';
	import {
		globalBackground,
		unfocusGlobalBackground,
		visibleBackgrounds
	} from '$lib/components/GlobalBackground/BackgroundStack';
	import { PLATFORM_TV } from '$lib/constants';
	import { localSettings } from '$lib/stores/localstorage.store';
	import { isUserInactive } from '$lib/stores/user-activity.store';
	import classNames from 'classnames';
	import { Cross1 } from 'radix-icons-svelte';
	import { type Readable } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import FloatingIconButton from '../FloatingIconButton.svelte';
	import BackgroundCarousel from './BackgroundCarousel.svelte';

	let hasFocus: Readable<boolean>;

	let autoplayVideo = false;
	let loadDelayTimeout: ReturnType<typeof setTimeout> | undefined;

	$: {
		if ($visibleBackgrounds.video) {
			autoplayVideo = false;
			clearTimeout(loadDelayTimeout);

			loadDelayTimeout = setTimeout(() => {
				autoplayVideo = true;
			}, 2000);
		}
	}

	// $: if ($hasFocus) {
	// 	registerUserActivity();
	// }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	on:wheel={() => {
		// show();
		unfocusGlobalBackground();
	}}
	on:click={() => {
		unfocusGlobalBackground();
	}}
>
	<div class="absolute inset-0 bg-secondary-900" />

	{#each $visibleBackgrounds.backgrounds as { backdropUrl, visible }, index (backdropUrl)}
		<div
			class="absolute inset-0 bg-center bg-cover"
			class:opacity-0={!visible}
			class:opacity-100={visible}
			class:scale-110={!hasFocus && !PLATFORM_TV}
			style={`background-image: url('${backdropUrl}'); transition: opacity 200ms, transform 200ms;`}
			in:fade|global={{ duration: 200, delay: 200 }}
		/>
	{/each}

	<!-- {#each $backgroundPagesStack as page, i (page.id)}
		{@const next = $backgroundPagesStack[i + 1]}
		<BackgroundPage {page} hasFocus={$hasFocus} nextPage={next} />
	{/each} -->

	<Container class="contents">
		<Container
			bind:hasFocusWithin={hasFocus}
			class="contents"
			on:navigate={({ detail }) => {
				console.log(detail);
				if (detail.direction === 'down' && detail.willLeaveContainer) {
					unfocusGlobalBackground();
					detail.preventNavigation();
					detail.stopPropagation();
				}
			}}
			on:mount={globalBackground.registrar}
		>
			{#if $visibleBackgrounds.video}
				{@const video = $visibleBackgrounds.video}
				<!-- <div out:fade={{ duration: 200, delay: 50 }} in:fade={{ duration: 200 }}> -->
				<Container
					class={classNames('absolute inset-0 transition-opacity duration-500', {
						'pointer-events-none': !$hasFocus
					})}
					on:click={({ detail: e }) => e.stopPropagation()}
					on:back={() => visibleBackgrounds.destroyVideo()}
				>
					{#key video.mediaId || video.id}
						<svelte:component
							this={video.component}
							{...video.props}
							paused={!$hasFocus && !$localSettings.autoplayTrailers}
							muted={!$hasFocus}
							load={$localSettings.autoplayTrailers ? $hasFocus || autoplayVideo : true}
						/>
					{/key}
				</Container>
				<!-- </div> -->
			{:else}
				<Container
					on:back={() => unfocusGlobalBackground()}
					on:wheel={(e) => e.stopPropagation()}
					on:click={({ detail: e }) => e.stopPropagation()}
					on:navigate={({ detail }) => {
						// showUI();
						if (detail.direction === 'left') {
							visibleBackgrounds.previousBackground();
							detail.preventNavigation();
							detail.stopPropagation();
						} else if (detail.direction === 'right') {
							visibleBackgrounds.nextBackground();
							detail.preventNavigation();
							detail.stopPropagation();
						}
					}}
					class={classNames(
						'absolute inset-x-0 bottom-0 z-20 transition-opacity duration-500 flex flex-col justify-end bg-gradient-to-b from-transparent to-secondary-900',
						{
							'pointer-events-none': !$hasFocus,
							'opacity-0': !$hasFocus || $isUserInactive
						}
					)}
				>
					<BackgroundCarousel
						backgrounds={$visibleBackgrounds.backgrounds}
						focusIndex={$visibleBackgrounds.index}
						on:jumpTo={({ detail: index }) => {
							visibleBackgrounds.jumpToBackground(index);
						}}
					/>
				</Container>
				<FloatingIconButton
					class={classNames('absolute top-12 right-16 transition-opacity', {
						'opacity-0': !$hasFocus || $isUserInactive
					})}
					on:click={() => unfocusGlobalBackground()}
				>
					<Cross1 size={32} />
				</FloatingIconButton>
			{/if}
		</Container>
		<!-- For willLeaveContainer -->
		<Container />
	</Container>

	<div
		class="transition-opacity duration-300"
		class:opacity-0={$hasFocus}
		class:pointer-events-none={$hasFocus}
		on:click={(e) => e.stopPropagation()}
	>
		<slot />
	</div>
</div>
