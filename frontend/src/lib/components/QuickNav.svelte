<script lang="ts">
	import { scrollElementIntoView } from '$lib/scroll-into-view';
	import { mouseMode, scrollIntoView, type Selectable } from '$lib/selectable';
	import classNames from 'classnames';

	import Scrollable from './Carousel/Scrollable.svelte';
	import TabItem from './Tab/TabItem.svelte';

	interface Props {
		onSelect?: (detail: number) => void;
		items: string[];
		/** The item the content is at, highlighted while the focus moves between the others; -1 when at none */
		selected?: number;
		size?: 'sm' | 'md';
		class?: string;
	}

	let { items, selected = 0, size = 'md', onSelect, class: className }: Props = $props();

	/**
	 * The focus has left: the navigation is entered at the highlighted item again, which is scrolled
	 * back into view as its focus would, unless the focus follows the mouse
	 */
	function returnToSelected(navigation: Selectable) {
		navigation.setFocusIndex(selected);
		const element = navigation.getChildren()[selected]?.getHtmlElement();
		if (element && !mouseMode) scrollElementIntoView(element, { vertical: 'center' });
	}
</script>

<!-- Moving the focus does not jump, selecting an item does; the focus comes back to the highlighted item.
     The items scroll within the box when they are taller than it, the focused one in the middle -->
<div class={classNames('flex flex-col py-8', className)}>
	<Scrollable
		direction="vertical"
		class={classNames(
			'max-h-full flex flex-col items-center',
			size === 'sm' ? 'space-y-1' : 'space-y-2'
		)}
		onBlur={returnToSelected}
	>
		{#each items as item, index (item)}
			<TabItem
				{size}
				selected={selected === index}
				onSelect={() => onSelect?.(index)}
				onEnter={scrollIntoView({ vertical: 'center' })}
			>
				{item}
			</TabItem>
		{/each}
	</Scrollable>
</div>
