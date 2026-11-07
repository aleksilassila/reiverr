<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ContainerProps } from '$lib/components/Container.type';
	import classNames from 'classnames';
	import { getCardDimensions } from '../utils';
	import Container from './Container.svelte';

	type Props = Omit<ContainerProps, 'children'> & {
		orientation?: 'portrait' | 'landscape';
		children?: Snippet<[{ columns: number }]>;
	};

	let { orientation = 'portrait', children, ...rest }: Props = $props();

	let cols = $state(
		getCardDimensions({
			viewportWidth: window.innerWidth,
			orientation
		}).columns
	);
</script>

<svelte:window
	onresize={(e) =>
		(cols = getCardDimensions({
			viewportWidth: e.currentTarget.innerWidth,
			orientation
		}).columns)}
/>

<Container
	{...rest}
	direction="grid"
	gridCols={cols}
	class={classNames('grid gap-x-8 gap-y-8', rest.class)}
	style={`grid-template-columns: repeat(${cols}, minmax(0, 1fr));`}
>
	{@render children?.({ columns: cols })}
</Container>

<!--<svelte:window onresize={calculateRows} />-->
