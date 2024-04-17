<script lang="ts">
	import Container from '../../Container.svelte';
	import { onMount } from 'svelte';
	import classNames from 'classnames';

	export let direction: 'horizontal' | 'vertical' = 'vertical';

	let cols: number = 1;
	const calculateRows = () => {
		const width = window.innerWidth;
		if (direction === 'vertical') {
			if (width >= 1536) {
				cols = 6;
			} else if (width >= 1280) {
				cols = 5;
			} else if (width >= 768) {
				cols = 4;
			} else {
				cols = 3;
			}
		} else {
			if (width >= 1536) {
				cols = 4;
			} else if (width >= 1280) {
				cols = 3;
			} else if (width >= 768) {
				cols = 2;
			} else {
				cols = 1;
			}
		}
	};

	onMount(() => {
		calculateRows();
	});
</script>

<Container
	direction="grid"
	gridCols={cols}
	class={classNames(
		'grid gap-x-4 gap-y-8',
		{
			'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4': direction === 'horizontal',
			'grid-cols-4 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6': direction === 'vertical'
		},

		$$restProps.class
	)}
	on:mount
>
	<slot />
</Container>

<svelte:window on:resize={calculateRows} />
