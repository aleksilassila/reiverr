<script lang="ts">
	import { onMount } from 'svelte';
	import { Selectable } from '../selectable';
	import classNames from 'classnames';
	import type { ContainerProps } from './Container.type';

	/**
	 * The basis for d-pad navigation. It's a mess, but it works™️
	 */

	let {
		name = '',
		direction = 'vertical',
		gridCols = 0,
		focusOnMount = false,
		trapFocus = false,
		debugOutline = false,
		focusOnClick = false,
		focusedChild = false,
		index = undefined,
		onLongPress = undefined,
		disabled = false,
		selectable: givenSelectable,
		tag = 'div',
		onEnter,
		onNavigate,
		onSelect,
		onClickOrSelect,
		onBack,
		onPlayPause,
		onMounted,
		onBlur,
		onclick,
		children,
		...rest
	}: ContainerProps = $props();

	// Not the default of the prop: Svelte evaluates a default again when what it reads (the name) may
	// have changed, and the cleanup of an unmounting container would get a selectable that is not in
	// the tree
	const selectable = givenSelectable ?? new Selectable(name);

	selectable
		.setDirection(direction === 'grid' ? 'horizontal' : direction)
		.setGridColumns(gridCols)
		.setTrapFocus(trapFocus)
		.setOnFocus((selectable, options) => {
			function stopPropagation() {
				options.propagate = false;
			}

			onEnter?.({ selectable, options, stopPropagation });
		})
		.setOnNavigate((selectable, options, willLeaveContainer) => {
			function preventNavigation() {
				options.preventNavigation = true;
			}

			function stopPropagation() {
				options.propagate = false;
			}

			onNavigate?.({
				selectable,
				options,
				willLeaveContainer,
				preventNavigation,
				stopPropagation,
				direction: options.direction
			});

			if (willLeaveContainer) {
				onBlur?.(selectable);
			}
		})
		.setOnSelect(() => {
			onSelect?.();
			onClickOrSelect?.(selectable);
		})
		.setOnBack((selectable, options) => {
			function stopPropagation() {
				options.propagate = false;
			}

			function bubble() {
				options.propagate = true;
			}

			onBack?.({ selectable, options, stopPropagation, bubble });
		})
		.setOnPlayPause((selectable, options) => {
			function stopPropagation() {
				options.propagate = false;
			}

			function bubble() {
				options.propagate = true;
			}

			onPlayPause?.({ selectable, options, stopPropagation, bubble });
		})
		.setAsFocusedChild(focusedChild);

	const hasFocus = selectable.hasFocus;
	const hasFocusWithin = selectable.hasFocusWithin;
	const focusIndex = selectable.focusIndex;
	const registerer = selectable.createRegisterer();

	// Before the DOM update, as `$:` ran: the selectable is configured before it mounts
	$effect.pre(() => {
		if (index !== undefined) selectable.updateIndex(index);
	});
	$effect.pre(() => {
		selectable.setIsDisabled(disabled);
	});
	$effect.pre(() => {
		selectable.setOnLongPress(onLongPress);
	});
	$effect.pre(() => {
		selectable.setGridColumns(gridCols);
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

<svelte:element
	this={tag}
	onclick={handleClick}
	tabindex={disabled ? -1 : 0}
	{...rest}
	class={classNames(rest.class, {
		'outline-none': debugOutline === false
	})}
	use:registerer
>
	{@render children?.({
		hasFocus: $hasFocus,
		hasFocusWithin: $hasFocusWithin,
		focusIndex: $focusIndex,
		selectable
	})}
</svelte:element>
