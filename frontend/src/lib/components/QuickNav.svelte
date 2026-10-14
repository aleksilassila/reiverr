<script lang="ts">
	import classNames from 'classnames';
	import { createEventDispatcher } from 'svelte';
	import Container from './Container.svelte';
	import TabItem from './Tab/TabItem.svelte';

	export let items: string[];
	/** The item the content is at; it stays highlighted while the focus moves between the others */
	export let selected = 0;

	const dispatch = createEventDispatcher<{ select: number }>();
</script>

<!-- Moving the focus does not jump, selecting an item does; the focus comes back to the highlighted item -->
<Container
	class={classNames('flex flex-col space-y-2', $$restProps.class)}
	on:blur={({ detail: selectable }) => selectable.activateChild(selected)}
>
	{#each items as item, index (item)}
		<TabItem selected={selected === index} on:select={() => dispatch('select', index)}>
			{item}
		</TabItem>
	{/each}
</Container>
