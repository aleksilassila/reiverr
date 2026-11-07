<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ContainerProps } from '$lib/components/Container.type';
	import Container from '../Container.svelte';
	interface Props {
		onEnter?: ContainerProps['onEnter'];
		children?: Snippet;
	}

	let { children, onEnter }: Props = $props();
</script>

<Container class="flex-1 flex" {onEnter}>
	<div class="absolute inset-0 flex flex-col" style="-webkit-transform: translate3d(0,0,0);">
		<div class="h-screen bg-gradient-to-b from-transparent to-secondary-900"></div>
		<div class="flex-1 bg-secondary-900"></div>
	</div>
	<div class="z-10 flex-1 flex">
		{@render children?.()}
	</div>
</Container>
