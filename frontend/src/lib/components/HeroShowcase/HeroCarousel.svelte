<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ContainerProps } from '$lib/components/Container.type';
	import classNames from 'classnames';
	import Container from '../Container.svelte';
	import {
		focusGlobalBackground,
		toggleFocusGlobalBackground
	} from '../GlobalBackground/background-stack.store';
	import HeroContainer from './HeroContainer.svelte';
	interface Props {
		onEnter?: ContainerProps['onEnter'];
		children?: Snippet;
		class?: string;
	}

	let { children, onEnter, class: className }: Props = $props();
</script>

<HeroContainer>
	<Container />
	<Container
		class={classNames('flex flex-col justify-end flex-1 z-10', className)}
		{onEnter}
		onclick={(e) => {
			if (e.target === e.currentTarget) {
				toggleFocusGlobalBackground();
				e.preventDefault();
			}
		}}
		onNavigate={(e) => {
			if (e.direction === 'up' && e.willLeaveContainer) {
				focusGlobalBackground();
				e.preventNavigation();
				e.stopPropagation();
			}
		}}
	>
		{@render children?.()}
	</Container>
</HeroContainer>
