<script lang="ts">
	import Container from './Container.svelte';
	import { onMount } from 'svelte';
	import classNames from 'classnames';
	import { getCardDimensions } from '../utils';

	// export let direction: 'horizontal' | 'vertical' = 'vertical';
	export let type: 'portrait' | 'landscape' = 'portrait';

	let cols = getCardDimensions(window.innerWidth, type).columns;

	// let cols: number = 1;
	// const calculateRows = () => {
	// 	const width = window.innerWidth;
	// 	if (direction === 'vertical') {
	// 		if (width >= 1536) {
	// 			cols = 6;
	// 		} else if (width >= 1280) {
	// 			cols = 5;
	// 		} else if (width >= 768) {
	// 			cols = 4;
	// 		} else {
	// 			cols = 3;
	// 		}
	// 	} else {
	// 		// if (width >= 1920) {
	// 		// 	cols = 4;
	// 		// } else
	// 		if (width >= 1536) {
	// 			cols = 3;
	// 		} else if (width >= 1280) {
	// 			cols = 2;
	// 		} else if (width >= 768) {
	// 			cols = 1;
	// 		} else {
	// 			cols = 1;
	// 		}
	// 	}
	// };

	// onMount(() => {
	// 	calculateRows();
	// });
</script>

<svelte:window
	on:resize={(e) => (cols = getCardDimensions(e.currentTarget.innerWidth, type).columns)}
/>

<Container
	{...$$restProps}
	direction="grid"
	gridCols={cols}
	class={classNames(
		'grid gap-x-8 gap-y-8',
		{
			// 'grid-cols-1 md:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4':
			// 	direction === 'horizontal'
			// 'grid-cols-4 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6': direction === 'vertical'
		},

		$$restProps.class
	)}
	style={`grid-template-columns: repeat(${cols}, minmax(0, 1fr));`}
	on:mount
>
	<slot />
</Container>

<!--<svelte:window on:resize={calculateRows} />-->
