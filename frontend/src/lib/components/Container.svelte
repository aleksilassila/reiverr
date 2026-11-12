<script lang="ts">
	import { onMount } from 'svelte';
	import { Selectable } from '../selectable';
	import classNames from 'classnames';
	import type { ContainerProps } from './Container.type';

	/**
	 * The basis for d-pad navigation. It's a mess, but it works™️
	 */

	let {
		name,
		direction,
		gridCols,
		trapFocus,
		disabled = false,
		focusedChild,
		focusOnMount = false,
		focusOnClick = false,
		index,
		selectable: givenSelectable,
		tag = 'div',
		onEnter,
		onNavigate,
		onBlur,
		onSelect,
		onLongPress,
		onBack,
		onClickOrSelect,
		onMounted,
		onclick,
		children,
		...rest
	}: ContainerProps = $props();

	// Not the default of the prop: Svelte evaluates a default again when what it reads may have
	// changed, and the cleanup of an unmounting container would get a selectable that is not in the
	// tree
	const selectable = givenSelectable ?? new Selectable();

	const hasFocus = selectable.hasFocus;
	const hasFocusWithin = selectable.hasFocusWithin;
	const focusIndex = selectable.focusIndex;
	const registerer = selectable.createRegisterer();

	// Before the DOM update, as `$:` ran: the selectable is configured before it mounts, and again
	// when a prop changes
	$effect.pre(() => {
		selectable.configure({
			name,
			direction,
			gridCols,
			trapFocus,
			disabled,
			focusedChild,
			onEnter,
			onNavigate,
			onBlur,
			onLongPress,
			onBack,
			onSelect: (selectable) => {
				onSelect?.(selectable);
				onClickOrSelect?.(selectable);
			}
		});
	});

	// A keyed list that is reordered moves the elements of its items, and nothing mounts. Their index
	// changes then, and the tree takes the order of the document again
	let sortedAtIndex = index;
	$effect(() => {
		if (index === sortedAtIndex) return;
		sortedAtIndex = index;
		selectable.sortSiblings();
	});

	function handleClick(e: MouseEvent & { currentTarget: EventTarget & HTMLElement }) {
		if (focusOnClick) {
			selectable.focus();
		}

		onclick?.(e as MouseEvent & { currentTarget: EventTarget & HTMLDivElement });
		onClickOrSelect?.(selectable);
	}

	onMount(() => {
		selectable._mountSelectable(focusOnMount);

		onMounted?.(selectable);

		return () => {
			selectable._unmountContainer();
		};
	});
</script>

<!-- Not a plain element: Svelte runs the action of a svelte:element before those of the containers
     inside it, which then find this one as their parent, and of a plain element after them -->
<svelte:element
	this={tag}
	onclick={handleClick}
	tabindex={disabled ? -1 : 0}
	{...rest}
	class={classNames(rest.class, 'outline-none')}
	use:registerer
>
	{@render children?.({
		hasFocus: $hasFocus,
		hasFocusWithin: $hasFocusWithin,
		focusIndex: $focusIndex,
		selectable
	})}
</svelte:element>
