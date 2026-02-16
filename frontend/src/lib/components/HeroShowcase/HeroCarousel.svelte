<script lang="ts">
	import classNames from 'classnames';
	import Container from '../Container.svelte';
	import {
		focusGlobalBackground,
		toggleFocusGlobalBackground
	} from '../GlobalBackground/background-stack.store';
	import HeroContainer from './HeroContainer.svelte';
</script>

<HeroContainer>
	<Container />
	<Container
		class={classNames('flex flex-col justify-end flex-1 z-10', $$restProps.class)}
		on:enter
		on:click={({ detail: e }) => {
			if (e.target === e.currentTarget) {
				toggleFocusGlobalBackground();
				e.preventDefault();
			}
		}}
		on:navigate={({ detail }) => {
			if (detail.direction === 'up' && detail.willLeaveContainer) {
				focusGlobalBackground();
				detail.preventNavigation();
				detail.stopPropagation();
			}
		}}
	>
		<slot />
	</Container>
</HeroContainer>
