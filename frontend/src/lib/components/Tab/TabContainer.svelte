<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ContainerProps } from '$lib/components/Container.type';
	import classNames from 'classnames';
	import Container from '../Container.svelte';

	type Props = Omit<ContainerProps, 'children'> & {
		absolute?: boolean;
		children?: Snippet;
	};

	let { absolute = false, children, ...rest }: Props = $props();
</script>

<div class="w-full h-full flex flex-1">
	<Container
		{...rest}
		class={classNames(
			'flex-1 overflow-hidden',
			{
				'relative *:absolute -mx-4 *:inset-x-4 *:inset-y-0': absolute
			},
			rest.class
		)}
	>
		{@render children?.()}
	</Container>
</div>
