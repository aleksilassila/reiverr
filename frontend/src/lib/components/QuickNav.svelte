<script lang="ts">
	import { scrollIntoView } from '$lib/selectable';
	import classNames from 'classnames';
	import { createEventDispatcher } from 'svelte';
	import Scrollable from './Carousel/Scrollable.svelte';
	import TabItem from './Tab/TabItem.svelte';

	export let items: string[];
	/** The item the content is at, highlighted while the focus moves between the others; -1 when at none */
	export let selected = 0;
	export let size: 'sm' | 'md' = 'md';

	const dispatch = createEventDispatcher<{ select: number }>();
</script>

<!-- Moving the focus does not jump, selecting an item does; the focus comes back to the highlighted item.
     The items scroll within the box when they are taller than it, the focused one in the middle -->
<div class={classNames('flex flex-col py-8', $$restProps.class)}>
	<Scrollable
		direction="vertical"
		class={classNames(
			'max-h-full flex flex-col items-center',
			size === 'sm' ? 'space-y-1' : 'space-y-2'
		)}
		on:blur={({ detail: selectable }) => selectable.activateChild(selected)}
	>
		{#each items as item, index (item)}
			<TabItem
				{size}
				selected={selected === index}
				on:select={() => dispatch('select', index)}
				on:enter={scrollIntoView({ vertical: 'center' })}
			>
				{item}
			</TabItem>
		{/each}
	</Scrollable>
</div>
