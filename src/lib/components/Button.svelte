<script lang="ts">
	import Container from './Container.svelte';
	import type { Readable } from 'svelte/store';
	import classNames from 'classnames';
	import AnimatedSelection from './AnimateScale.svelte';
	import { type ComponentType, createEventDispatcher } from 'svelte';
	import type { Selectable } from '../selectable';
	import { DotsVertical } from 'radix-icons-svelte';
	import type { ContainerProps } from './Container.type';

	type $$Props = {
		disabled?: boolean;
		focusOnMount?: boolean;
		focusedChild?: boolean;
		type?: 'primary' | 'secondary' | 'primary-dark';
		confirmDanger?: boolean;
		action?: (() => Promise<any>) | null;
		secondaryAction?: (() => Promise<any> | any) | null;
		icon?: ComponentType;
		iconAfter?: ComponentType;
		iconAbsolute?: ComponentType;
	} & ContainerProps;

	const dispatch = createEventDispatcher<{ clickOrSelect: null }>();

	export let disabled: Required<$$Props>['disabled'] = false;
	export let focusOnMount: Required<$$Props>['focusOnMount'] = false;
	export let focusedChild: Required<$$Props>['focusedChild'] = false;
	export let type: Required<$$Props>['type'] = 'primary';
	export let confirmDanger: Required<$$Props>['confirmDanger'] = false;
	export let action: Required<$$Props>['action'] = null;
	export let secondaryAction: Required<$$Props>['secondaryAction'] = null;
	export let icon: $$Props['icon'] = undefined;
	export let iconAfter: $$Props['iconAfter'] = undefined;
	export let iconAbsolute: $$Props['iconAbsolute'] = undefined;

	let actionIsFetching = false;
	$: _disabled = disabled || actionIsFetching;
	let armed = false;
	let hasFocus: Readable<boolean>;
	let hasSecondaryFocus: Readable<boolean>;
	$: if (!$hasFocus && armed) armed = false;

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
			'h-12 flex-1 flex items-center group',
			secondaryAction ? 'rounded-l-xl' : 'rounded-xl',
			(type === 'primary' || type === 'primary-dark') && (secondaryAction ? 'pl-6 pr-5' : 'px-6'),
			_disabled ? 'cursor-not-allowed pointer-events-none opacity-40' : 'cursor-pointer',
			{
				'bg-secondary-800 selectable': type === 'primary',
				'bg-primary-900 selectable': type === 'primary-dark',
				'border-2 p-1 hover:border-primary-500': type === 'secondary',
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
	>
		<div
			class={classNames({
				contents: type === 'primary' || type === 'primary-dark',
				'border-2 border-transparent h-full w-full rounded-lg flex items-center px-6':
					type === 'secondary',
				'bg-primary-500 text-secondary-950': type === 'secondary' && $hasFocus,
				'group-hover:bg-primary-500 group-hover:text-secondary-950': type === 'secondary',
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
						<svelte:component this={icon} size={19} />
					</div>
				{/if}
				<slot {hasFocus} />
				{#if $$slots['icon-after']}
					<div class="ml-2">
						<slot name="icon-after" />
					</div>
				{/if}
				{#if iconAfter}
					<div class="ml-2">
						<svelte:component this={iconAfter} size={19} />
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
						<svelte:component this={iconAbsolute} size={19} />
					</div>
				{/if}
			</div>
		</div>
	</Container>
	{#if secondaryAction !== null}
		<div class="w-0.5 h-full bg-secondary-700" />
		<Container
			bind:hasFocus={hasSecondaryFocus}
			class={classNames('rounded-r-xl h-12 flex items-center group cursor-pointer', {
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
