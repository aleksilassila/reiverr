<script lang="ts">
	import Container from '../../../Container.svelte';
	import PageDots from './PageDots.svelte';
	import type { ShowcaseItemProps } from './HeroShowcase';
	import HeroShowcaseBackground from './HeroShowcaseBackground.svelte';
	import { Selectable } from '../../selectable';

	export let items: Promise<ShowcaseItemProps[]> = Promise.resolve([]);

	let showcaseIndex = 0;
	let showcaseLength = 0;
	$: items.then((i) => (showcaseLength = i?.length || 0));

	function onNext() {
		if (showcaseIndex === showcaseLength - 1) {
			Selectable.focusRight();
		} else {
			showcaseIndex = (showcaseIndex + 1) % showcaseLength;
		}
		return true;
	}

	function onPrevious() {
		if (showcaseIndex === 0) {
			Selectable.focusLeft();
		} else {
			showcaseIndex = (showcaseIndex - 1 + showcaseLength) % showcaseLength;
		}
		return true;
	}

	function onJump(index: number) {
		showcaseIndex = index;
		return true;
	}
</script>

<Container class="h-screen pl-16 flex flex-col relative">
	<HeroShowcaseBackground {items} index={showcaseIndex} />
	<Container
		class="flex-1 p-2 flex overflow-hidden"
		navigationActions={{
			right: onNext,
			left: onPrevious,
			up: () => Selectable.focusLeft()
		}}
	>
		<!--{#await items}-->
		<!--		<div class="flex placeholder flex-1 rounded-2xl">-->
		<!--			{showcaseIndex}-->
		<!--			<div />-->
		<!--		</div>-->
		<!--{:then items}-->
		<!--	{#each items as item}-->
		<!--		<div class="flex flex-col items-center justify-center w-full h-full">-->
		<!--			<img src={item.posterUrl} alt={item.title} class="w-48 h-72" />-->
		<!--			<h2 class="text-lg font-bold">{item.title}</h2>-->
		<!--			<p>{item.year}</p>-->
		<!--			<p>{item.runtime}</p>-->
		<!--			<p>{item.rating}</p>-->
		<!--			<p>{item.ratingSource}</p>-->
		<!--			<p>{item.genres.join(', ')}</p>-->
		<!--		</div>-->
		<!--	{/each}-->
		<PageDots index={showcaseIndex} length={showcaseLength} {onJump} {onPrevious} {onNext} />
		<!--{:catch error}-->
		<!--	<p>{error.message}</p>-->
		<!--{/await}-->
	</Container>
	<Container>
		<slot />
	</Container>
</Container>
