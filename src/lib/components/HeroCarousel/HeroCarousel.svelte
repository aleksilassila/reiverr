<script lang="ts">
	import Container from '../../../Container.svelte';
	import HeroShowcaseBackground from './HeroBackground.svelte';
	import { scrollWithOffset, Selectable } from '../../selectable';
	import IconButton from '../IconButton.svelte';
	import { ChevronRight } from 'radix-icons-svelte';
	import PageDots from '../HeroShowcase/PageDots.svelte';
	import SidebarMargin from '../SidebarMargin.svelte';

	export let urls: Promise<string[]>;

	export let index = 0;
	let length = 0;

	$: urls.then((urls) => (length = urls.length));

	function onNext() {
		index = (index + 1) % length;
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

<Container class="flex-1 flex relative">
	<HeroShowcaseBackground {urls} {index} />
	<Container
		revealStrategy={scrollWithOffset('up', 0)}
		navigationActions={{
			right: onNext,
			left: onPrevious,
			up: () => Selectable.giveFocus('left', true) || true
		}}
	/>
	<div class="flex flex-1 z-10 p-4">
		<SidebarMargin class="flex-1">
			<slot />
		</SidebarMargin>
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
