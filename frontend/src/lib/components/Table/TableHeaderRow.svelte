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

<Container
	direction="horizontal"
	{onEnter}
	class="*:sticky *:top-0 *:bg-primary-800 row-wrapper contents"
>
	<!--	<div class="absolute -inset-y-2 -inset-x-8 -z-10 bg-secondary-900" />-->
	{@render children?.()}
</Container>
