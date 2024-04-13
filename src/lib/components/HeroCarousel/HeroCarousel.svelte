<script lang="ts">
	import Container from '../../../Container.svelte';
	import HeroShowcaseBackground from './HeroBackground.svelte';
	import { scrollIntoView, Selectable } from '../../selectable';
	import IconButton from '../IconButton.svelte';
	import { ChevronRight } from 'radix-icons-svelte';
	import PageDots from '../HeroShowcase/PageDots.svelte';
	import SidebarMargin from '../SidebarMargin.svelte';

	export let urls: Promise<string[]>;

	export let index = 0;
	let length = 0;

	$: urls.then((urls) => (length = urls.length));

	function onNext() {
		if (index === length - 1) {
			return false;
		} else {
			index = (index + 1) % length;
		}

		return true;
	}

	function onPrevious() {
		if (index === 0) {
			return false;
		} else {
			index = (index - 1 + length) % length;
		}
		return true;
	}

	function onJump(i: number) {
		index = i;
		return true;
	}
</script>

<Container class="flex-1 flex">
	<HeroShowcaseBackground {urls} {index} />
	<Container
		on:navigate={({ detail }) => {
			if (detail.options.direction === 'right') {
				if (onNext()) detail.preventNavigation();
			} else if (detail.options.direction === 'left') {
				if (onPrevious()) detail.preventNavigation();
			} else if (detail.options.direction === 'up') {
				Selectable.giveFocus('left', false);
				detail.preventNavigation();
			}
		}}
	/>
	<div class="flex flex-1 z-10">
		<slot />
		<div class="flex flex-col justify-end ml-4">
			<div class="flex flex-1 justify-end items-center">
				<IconButton on:click={onNext}>
					<ChevronRight size={38} />
				</IconButton>
			</div>
			<PageDots {index} {length} {onJump} {onPrevious} {onNext} />
		</div>
	</div>
</Container>
