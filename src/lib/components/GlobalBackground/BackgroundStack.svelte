<script lang="ts">
	import Container from '$lib/components/Container.svelte';
	import {
		destroyBackgroundVideo,
		globalBackground,
		globalBackgroundStack,
		globalVideo,
		unfocusGlobalBackground,
		type Background
	} from '$lib/components/GlobalBackground/BackgroundStack';
	import classNames from 'classnames';
	import { derived, get, writable, type Readable } from 'svelte/store';
	import BackgroundCarousel from './BackgroundCarousel.svelte';
	import BackgroundPage from './BackgroundPage.svelte';
	import { localSettings } from '$lib/stores/localstorage.store';
	import { Cross1 } from 'radix-icons-svelte';
	import FloatingIconButton from '../FloatingIconButton.svelte';
	import { fade } from 'svelte/transition';

	let carouselIndex = 0;
	let hasFocus: Readable<boolean>;
	const topPage = derived(globalBackgroundStack, ($stack) => $stack[$stack.length - 1]);
	const topBackgrounds = writable<Background[]>([]);

	let loadDelay = true;
	let loadDelayTimeout: ReturnType<typeof setTimeout> | undefined;

	let unsub: (() => void) | undefined;
	topPage.subscribe((page) => {
		unsub?.();
		unsub = page?.backgrounds.subscribe((backgrounds) => {
			topBackgrounds.set(backgrounds);
		});
	});

	let uiHidden = true;
	let hiddenTimeout: ReturnType<typeof setTimeout>;

	$: {
		if ($globalVideo) {
			loadDelay = true;
			clearTimeout(loadDelayTimeout);

			loadDelayTimeout = setTimeout(() => {
				loadDelay = false;
			}, 2000);
		}
	}

	$: {
		if ($hasFocus) {
			show();
		}
	}
	function show() {
		uiHidden = false;
		clearTimeout(hiddenTimeout);

		hiddenTimeout = setTimeout(() => {
			uiHidden = true;
		}, 2500);
	}
</script>

{@debug $globalBackgroundStack}

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	on:mousemove={show}
	on:wheel={() => {
		// show();
		unfocusGlobalBackground();
	}}
	on:click={() => {
		unfocusGlobalBackground();
	}}
>
	<div class="absolute inset-0 bg-secondary-900" />

	{#each $globalBackgroundStack as page, i (page.id)}
		{@const next = $globalBackgroundStack[i + 1]}
		<BackgroundPage {page} hasFocus={$hasFocus} nextPage={next} />
		<!-- {#each page.backgrounds as background}
			<div
				class="fixed inset-0 bg-center bg-cover"
				style={`background-image: url("https://www.themoviedb.org/t/p/w342/cIfGAkpvWD2zxHrXzhv3uptYbyV.jpg")`}
			/>
		{/each} -->
	{/each}

	<!-- <div class="absolute inset-0" /> -->

	<Container
		bind:hasFocusWithin={hasFocus}
		class="contents"
		on:navigate={({ detail }) => {
			if (detail.direction === 'down') {
				unfocusGlobalBackground();
				detail.preventNavigation();
				detail.stopPropagation();
			}
		}}
		on:mount={globalBackground.registrar}
	>
		{#if $globalVideo}
			<!-- <div out:fade={{ duration: 200, delay: 50 }} in:fade={{ duration: 200 }}> -->
			<Container
				class={classNames('absolute inset-0 transition-opacity duration-500', {
					'pointer-events-none': !$hasFocus
				})}
				on:click={({ detail: e }) => e.stopPropagation()}
				on:back={() => destroyBackgroundVideo()}
			>
				<svelte:component
					this={$globalVideo.component}
					{...$globalVideo.props}
					paused={!$hasFocus && !$localSettings.autoplayTrailers}
					muted={!$hasFocus}
					hasFocus={$hasFocus}
					load={$hasFocus || !loadDelay}
				/>
				<FloatingIconButton
					class={classNames('absolute top-12 right-16 transition-opacity', {
						'opacity-0': uiHidden || !$hasFocus
					})}
					on:click={() => destroyBackgroundVideo()}
				>
					<Cross1 size={32} />
				</FloatingIconButton>
			</Container>
			<!-- </div> -->
		{:else}
			<Container
				on:back={() => unfocusGlobalBackground()}
				on:wheel={(e) => e.stopPropagation()}
				on:click={({ detail: e }) => e.stopPropagation()}
				on:navigate={({ detail }) => {
					const top = get(topPage);
					const topIndex = top?.index;
					const topBackgrounds = top?.backgrounds;

					if (topIndex && topBackgrounds) {
						const index = get(topIndex);
						const length = get(topBackgrounds)?.length ?? 1;

						show();

						if (detail.direction === 'left') {
							carouselIndex = (index - 1 + length) % length;
							topIndex.set(carouselIndex);
							detail.preventNavigation();
							detail.stopPropagation();
						} else if (detail.direction === 'right') {
							carouselIndex = (index + 1) % length;
							topIndex.set(carouselIndex);
							detail.preventNavigation();
							detail.stopPropagation();
						}
					}
				}}
				class={classNames(
					'absolute inset-x-0 bottom-0 z-20 transition-opacity duration-500 flex flex-col justify-end bg-gradient-to-b from-transparent to-secondary-900',
					{
						'pointer-events-none': !$hasFocus,
						'opacity-0': !$hasFocus || uiHidden
					}
				)}
			>
				<BackgroundCarousel
					backgrounds={$topBackgrounds}
					focusIndex={carouselIndex}
					on:jumpTo={({ detail: index }) => {
						const topIndex = get(topPage)?.index;

						if (topIndex) {
							carouselIndex = index;
							topIndex.set(index);
						}
					}}
				/>
			</Container>
			<FloatingIconButton
				class={classNames('absolute top-12 right-16 transition-opacity', {
					'opacity-0': uiHidden || !$hasFocus
				})}
				on:click={() => unfocusGlobalBackground()}
			>
				<Cross1 size={32} />
			</FloatingIconButton>
		{/if}
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
