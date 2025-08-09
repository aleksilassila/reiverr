<script lang="ts">
	import { onMount } from 'svelte';
	import Container from '$components/Container.svelte';
	import type { Readable } from 'svelte/store';
	import classNames from 'classnames';

	let hasFocusWithin: Readable<boolean>;

	onMount(() => {
		console.log('Hello world! onMount testElement');
	});
</script>

<Container bind:hasFocusWithin>
	<h1
		class={classNames({
			'bg-red-500': $hasFocusWithin
		})}
	>
		Hello world!
	</h1>
</Container>
