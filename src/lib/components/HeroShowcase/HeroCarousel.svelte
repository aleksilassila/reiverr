<script lang="ts">
	import Container from '../Container.svelte';
	import {
		focusGlobalBackground,
		toggleFocusGlobalBackground
	} from '../GlobalBackground/BackgroundStack';
	import HeroContainer from './HeroContainer.svelte';
</script>

<HeroContainer>
	<Container />
	<Container
		class="flex flex-col justify-end flex-1 z-10"
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
