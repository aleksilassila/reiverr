<script lang="ts">
	import Container from '$lib/components/Container.svelte';
	import {
		globalBackgroundRegistrar,
		globalBackgroundStack,
		unfocusGlobalBackground
	} from '$lib/components/GlobalBackground/BackgroundStack';
	import { get, type Readable } from 'svelte/store';
	import BackgroundPage from './BackgroundPage.svelte';

	let hasFocus: Readable<boolean>;
</script>

<Container
	bind:hasFocus
	on:back={() => unfocusGlobalBackground()}
	on:mount={globalBackgroundRegistrar.registrar}
	on:navigate={({ detail }) => {
		const stack = get(globalBackgroundStack);
		const top = stack[stack.length - 1];
		const topIndex = top?.index;
		const topBackgrounds = top?.backgrounds;

		if (detail.direction === 'down') {
			unfocusGlobalBackground();
			detail.preventNavigation();
			detail.stopPropagation();
		} else if (topIndex && topBackgrounds) {
			const index = get(topIndex);
			const length = get(topBackgrounds)?.length ?? 1;

			if (detail.direction === 'left') {
				topIndex.set((index - 1 + length) % length);
				detail.preventNavigation();
				detail.stopPropagation();
			} else if (detail.direction === 'right') {
				topIndex.set((index + 1) % length);
				detail.preventNavigation();
				detail.stopPropagation();
			}
		}
	}}
/>

<div>
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

	<div class="transition-opacity duration-300" class:opacity-0={$hasFocus}>
		<slot />
	</div>
</div>
