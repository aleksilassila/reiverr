<script lang="ts">
	import Container from '$lib/components/Container.svelte';
	import {
		globalBackgroundRegistrar,
		globalBackgroundStack,
		unfocusGlobalBackground,
		type Background
	} from '$lib/components/GlobalBackground/BackgroundStack';
	import classNames from 'classnames';
	import { derived, get, writable, type Readable } from 'svelte/store';
	import BackgroundCarousel from './BackgroundCarousel.svelte';
	import BackgroundPage from './BackgroundPage.svelte';

	let carouselIndex = 0;
	let hasFocus: Readable<boolean>;
	const topPage = derived(globalBackgroundStack, ($stack) => $stack[$stack.length - 1]);
	const topBackgrounds = writable<Background[]>([]);

	let unsub: (() => void) | undefined;
	topPage.subscribe((page) => {
		unsub?.();
		unsub = page?.backgrounds.subscribe((backgrounds) => {
			topBackgrounds.set(backgrounds);
		});
	});

	let hidden = true;
	let hiddenTimeout: ReturnType<typeof setTimeout>;

	$: {
		if ($hasFocus) {
			show();
		}
	}
	function show() {
		hidden = false;
		clearTimeout(hiddenTimeout);

		hiddenTimeout = setTimeout(() => {
			hidden = true;
		}, 2500);
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div on:mousemove={show} on:wheel={show} on:click={() => unfocusGlobalBackground()}>
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

	<Container
		bind:hasFocusWithin={hasFocus}
		on:click={(e) => e.detail.stopPropagation()}
		on:back={() => unfocusGlobalBackground()}
		on:mount={globalBackgroundRegistrar.registrar}
		on:navigate={({ detail }) => {
			const top = get(topPage);
			const topIndex = top?.index;
			const topBackgrounds = top?.backgrounds;

			if (detail.direction === 'down') {
				unfocusGlobalBackground();
				detail.preventNavigation();
				detail.stopPropagation();
			} else if (topIndex && topBackgrounds) {
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
				'opacity-0': !$hasFocus || hidden
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

	<div
		class="transition-opacity duration-300"
		class:opacity-0={$hasFocus}
		class:pointer-events-none={$hasFocus}
		on:click={(e) => e.stopPropagation()}
	>
		<slot />
	</div>
</div>
