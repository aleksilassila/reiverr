<script lang="ts">
	import Container from '../Container.svelte';
	import classNames from 'classnames';
	import AnimatedSelection from '../AnimateScale.svelte';
	import type { Snippet } from 'svelte';
	import { Selectable } from '../../selectable';
	import { DotsVertical } from 'radix-icons-svelte';
	import type { ContainerProps } from '../Container.type';
	import type { IconComponent } from '../icon.type';

	type Props = {
		disabled?: boolean;
		focusOnMount?: boolean;
		focusedChild?: boolean;
		type?: 'primary' | 'secondary' | 'primary-dark';
		size?: 'md' | 'sm';
		/** The first select arms the button, the second runs the action */
		confirmDanger?: boolean;
		/** Awaited with the button disabled while it runs */
		action?: (() => Promise<any>) | null;
		/** Adds a second button with a dots icon that runs this */
		secondaryAction?: (() => Promise<any> | any) | null;
		icon?: IconComponent;
		/** Which side of the label the icon is on */
		iconPosition?: 'before' | 'after';
		selectableDisabled?: boolean;
		class?: ContainerProps['class'];
		onclick?: ContainerProps['onclick'];
		onSelect?: ContainerProps['onSelect'];
		onEnter?: ContainerProps['onEnter'];
		onMounted?: ContainerProps['onMounted'];
		onClickOrSelect?: () => void;
		children?: Snippet<[{ hasFocus: boolean; loading: boolean }]>;
	};

	let {
		disabled = false,
		focusOnMount = false,
		focusedChild = false,
		type = 'primary',
		size = 'md',
		confirmDanger = false,
		action = null,
		secondaryAction = null,
		icon: Icon = undefined,
		iconPosition = 'before',
		selectableDisabled = false,
		class: className = undefined,
		onclick,
		onSelect,
		onEnter,
		onMounted,
		onClickOrSelect,
		children
	}: Props = $props();

	const selectable = new Selectable();
	const hasFocus = selectable.hasFocus;
	const secondarySelectable = new Selectable();
	const hasSecondaryFocus = secondarySelectable.hasFocus;

	let actionIsFetching = $state(false);
	let _disabled = $derived(disabled || actionIsFetching);
	let armed = $state(false);
	$effect(() => {
		if (!$hasFocus && armed) armed = false;
	});
	let iconSize = $derived(size === 'md' ? 19 : 16);

	function handleClickOrSelect(selectable: Selectable) {
		if (actionIsFetching || _disabled) return;

		if (confirmDanger && !armed) {
			armed = true;
			selectable.focus();
			return;
		}

		if (action) {
			actionIsFetching = true;
			action().then(() => (actionIsFetching = false));
		}

		onClickOrSelect?.();
		armed = false;
	}
</script>

<AnimatedSelection
	hasFocus={$hasFocus || $hasSecondaryFocus}
	enabled={!disabled}
	class={classNames('inline-flex items-center font-medium tracking-wide ', {}, className)}
>
	<Container
		{selectable}
		class={classNames(
			'flex-1 flex items-center group/button',
			size === 'md' && 'h-12',
			size === 'sm' && 'h-9 text-base',
			size === 'md' && (secondaryAction ? 'rounded-l-xl' : 'rounded-xl'),
			size === 'sm' && (secondaryAction ? 'rounded-l-lg' : 'rounded-lg'),
			(type === 'primary' || type === 'primary-dark') &&
				size === 'md' &&
				(secondaryAction ? 'pl-6 pr-5' : 'px-6'),
			(type === 'primary' || type === 'primary-dark') &&
				size === 'sm' &&
				(secondaryAction ? 'pl-4 pr-3' : 'px-4'),
			_disabled ? 'cursor-not-allowed pointer-events-none opacity-40' : 'cursor-pointer',
			{
				'bg-secondary-800 selectable': type === 'primary',
				'bg-primary-900 selectable': type === 'primary-dark',
				'border-2 hover:border-primary-500': type === 'secondary',
				'p-1': type === 'secondary' && size === 'md',
				'p-0.5': type === 'secondary' && size === 'sm',
				'border-primary-500': type === 'secondary' && $hasFocus,
				'!border-red-500': confirmDanger && armed
			}
		)}
		{onclick}
		{onSelect}
		onClickOrSelect={handleClickOrSelect}
		{onEnter}
		{onMounted}
		{focusOnMount}
		{focusedChild}
		disabled={selectableDisabled}
	>
		<div
			class={classNames({
				contents: type === 'primary' || type === 'primary-dark',
				'border-2 border-transparent h-full w-full flex items-center': type === 'secondary',
				'rounded-lg px-6': type === 'secondary' && size === 'md',
				'rounded-md px-4': type === 'secondary' && size === 'sm',
				'bg-primary-500 text-secondary-950': type === 'secondary' && $hasFocus,
				'group-hover/button:bg-primary-500 group-hover/button:text-secondary-950':
					type === 'secondary',
				'!bg-red-500': confirmDanger && armed
			})}
		>
			<div class="flex-1 text-center text-nowrap flex items-center justify-center">
				{#if Icon && iconPosition === 'before'}
					<div class="mr-2">
						<Icon size={iconSize} />
					</div>
				{/if}
				{@render children?.({ hasFocus: $hasFocus, loading: actionIsFetching })}
				{#if Icon && iconPosition === 'after'}
					<div class="ml-2">
						<Icon size={iconSize} />
					</div>
				{/if}
			</div>
		</div>
	</Container>
	{#if secondaryAction !== null}
		<div class="w-0.5 h-full bg-secondary-700"></div>
		<Container
			selectable={secondarySelectable}
			class={classNames('flex items-center group cursor-pointer', {
				'rounded-r-xl h-12': size === 'md',
				'rounded-r-lg h-9': size === 'sm',
				'bg-secondary-800 selectable pl-2 pr-2': type === 'primary',
				'bg-primary-900 selectable pl-2 pr-2': type === 'primary-dark',
				'border-2 p-1 hover:border-primary-500 cursor-pointer': type === 'secondary' && !_disabled,
				'border-primary-500': type === 'secondary' && $hasFocus,
				'!border-red-500': confirmDanger && armed,
				'cursor-not-allowed pointer-events-none opacity-40': _disabled
			})}
			onClickOrSelect={secondaryAction}
		>
			<DotsVertical size={18} class="" />
		</Container>
	{/if}
</AnimatedSelection>
