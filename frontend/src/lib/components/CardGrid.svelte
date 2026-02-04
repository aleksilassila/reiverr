<script lang="ts">
	import classNames from 'classnames';
	import { getCardDimensions } from '../utils';
	import Container from './Container.svelte';

	export let orientation: 'portrait' | 'landscape' = 'portrait';

	let cols = getCardDimensions({
		viewportWidth: window.innerWidth,
		orientation
	}).columns;
</script>

<svelte:window
	on:resize={(e) =>
		(cols = getCardDimensions({
			viewportWidth: e.currentTarget.innerWidth,
			orientation
		}).columns)}
/>

<Container
	{...$$restProps}
	direction="grid"
	gridCols={cols}
	class={classNames('grid gap-x-8 gap-y-8', $$restProps.class)}
	style={`grid-template-columns: repeat(${cols}, minmax(0, 1fr));`}
	on:mount
	on:back
>
	<slot columns={cols} />
</Container>

<!--<svelte:window on:resize={calculateRows} />-->
