<script lang="ts">
	import Container from '../../Container.svelte';
	import { onMount } from 'svelte';

	let cols: number = 1;
	const calculateRows = () => {
		const width = window.innerWidth;
		if (width >= 1536) {
			cols = 5;
		} else if (width >= 1280) {
			cols = 4;
		} else if (width >= 768) {
			cols = 3;
		} else {
			cols = 2;
		}
	};

	$: console.log('cols', cols);

	onMount(() => {
		calculateRows();
	});
</script>

<Container
	direction="grid"
	gridCols={cols}
	class="grid gap-x-4 gap-y-8 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
>
	<slot />
</Container>

<svelte:window on:resize={calculateRows} />
