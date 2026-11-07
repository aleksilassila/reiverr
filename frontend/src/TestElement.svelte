<script lang="ts">
	import { Selectable } from '$lib/selectable';
	import { onMount } from 'svelte';
	import Container from '$components/Container.svelte';
	import classNames from 'classnames';

	const selectable = new Selectable();
	const hasFocusWithin = selectable.hasFocusWithin;

	onMount(() => {
		console.log('Hello world! onMount testElement');
	});
</script>

<Container {selectable}>
	<h1
		class={classNames({
			'bg-red-500': $hasFocusWithin
		})}
	>
		Hello world!
	</h1>
</Container>
