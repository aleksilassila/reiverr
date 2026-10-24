<script lang="ts">
	import Container from '../Container.svelte';
	import type { Readable } from 'svelte/store';
	import classNames from 'classnames';
	import AnimatedSelection from '../AnimateScale.svelte';
	import { type ComponentType, createEventDispatcher } from 'svelte';
	import type { Selectable } from '../../selectable';
	import { DotsVertical } from 'radix-icons-svelte';
	import type { ContainerProps } from '../Container.type';

	type $$Props = {
		disabled?: boolean;
		focusOnMount?: boolean;
		focusedChild?: boolean;
		type?: 'primary' | 'secondary' | 'primary-dark';
		size?: 'md' | 'sm';
		confirmDanger?: boolean;
		action?: (() => Promise<any>) | null;
		secondaryAction?: (() => Promise<any> | any) | null;
		icon?: ComponentType;
		iconAfter?: ComponentType;
		iconAbsolute?: ComponentType;
		selectableDisabled?: boolean;
	} & ContainerProps;

	const dispatch = createEventDispatcher<{ clickOrSelect: null }>();

	export let disabled: Required<$$Props>['disabled'] = false;
	export let focusOnMount: Required<$$Props>['focusOnMount'] = false;
	export let focusedChild: Required<$$Props>['focusedChild'] = false;
	export let type: Required<$$Props>['type'] = 'primary';
	export let size: Required<$$Props>['size'] = 'md';
	export let confirmDanger: Required<$$Props>['confirmDanger'] = false;
	export let action: Required<$$Props>['action'] = null;
	export let secondaryAction: Required<$$Props>['secondaryAction'] = null;
	export let icon: $$Props['icon'] = undefined;
	export let iconAfter: $$Props['iconAfter'] = undefined;
	export let iconAbsolute: $$Props['iconAbsolute'] = undefined;
	export let selectableDisabled: Required<$$Props>['selectableDisabled'] = false;

	let actionIsFetching = false;
	$: _disabled = disabled || actionIsFetching;
	let armed = false;
	let hasFocus: Readable<boolean>;
	let hasSecondaryFocus: Readable<boolean>;
	$: if (!$hasFocus && armed) armed = false;
	$: iconSize = size === 'md' ? 19 : 16;

	function handleClickOrSelect({ detail: selectable }: { detail: Selectable }) {
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

		dispatch('clickOrSelect');
		armed = false;
	}
</script>

<AnimatedSelection
	hasFocus={$hasFocus || $hasSecondaryFocus}
	enabled={!disabled}
	class={classNames('inline-flex items-center font-medium tracking-wide ', {}, $$restProps.class)}
>
	<Container
		bind:hasFocus
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
		on:click
		on:select
		on:clickOrSelect={handleClickOrSelect}
		on:enter
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
			<div class="flex-1 text-center text-nowrap flex items-center justify-center relative">
				{#if $$slots.icon}
					<div class="mr-2">
						<slot name="icon" />
					</div>
				{/if}
				{#if icon}
					<div class="mr-2">
						<svelte:component this={icon} size={iconSize} />
					</div>
				{/if}
				<slot {hasFocus} loading={actionIsFetching} />
				{#if $$slots['icon-after']}
					<div class="ml-2">
						<slot name="icon-after" />
					</div>
				{/if}
				{#if iconAfter}
					<div class="ml-2">
						<svelte:component this={iconAfter} size={iconSize} />
					</div>
				{/if}
				{#if $$slots['icon-absolute']}
					<div class="absolute inset-y-0 right-0 flex items-center justify-center">
						<slot name="icon-absolute" />
					</div>
				{/if}
				{#if iconAbsolute}
					<div class="w-8" />
					<div class="absolute inset-y-0 right-0 flex items-center justify-center">
						<svelte:component this={iconAbsolute} size={iconSize} />
					</div>
				{/if}
			</div>
		</div>
	</Container>
	{#if secondaryAction !== null}
		<div class="w-0.5 h-full bg-secondary-700" />
		<Container
			bind:hasFocus={hasSecondaryFocus}
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
			on:clickOrSelect={secondaryAction}
		>
			<DotsVertical size={18} class="" />
		</Container>
	{/if}
</AnimatedSelection>
