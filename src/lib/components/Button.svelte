<script lang="ts">
	import Container from '../../Container.svelte';
	import type { Readable } from 'svelte/store';
	import classNames from 'classnames';
	import AnimatedSelection from './AnimateScale.svelte';
	import { type ComponentType, createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{ clickOrSelect: null }>();

	export let disabled: boolean = false;
	export let focusOnMount: boolean = false;
	export let focusedChild = false;
	export let type: 'primary' | 'secondary' | 'primary-dark' = 'primary';
	export let confirmDanger = false;
	export let action: (() => Promise<any>) | null = null;
	export let icon: ComponentType | undefined = undefined;
	export let iconAfter: ComponentType | undefined = undefined;
	export let iconAbsolute: ComponentType | undefined = undefined;

	let actionIsFetching = false;
	$: _disabled = disabled || actionIsFetching;
	let armed = false;
	let hasFocus: Readable<boolean>;
	$: if (!$hasFocus && armed) armed = false;

	function handleClickOrSelect() {
		if (actionIsFetching || _disabled) return;

		if (confirmDanger && !armed) {
			armed = true;
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

<AnimatedSelection hasFocus={$hasFocus}>
	<Container
		bind:hasFocus
		class={classNames(
			'h-12 rounded-xl font-medium tracking-wide flex items-center group',
			{
				'bg-secondary-800': type === 'primary',
				'bg-primary-900': type === 'primary-dark',
				'selectable px-6': type === 'primary' || type === 'primary-dark',
				'border-2 p-1 hover:border-primary-500': type === 'secondary',
				'border-primary-500': type === 'secondary' && $hasFocus,
				'!border-red-500': confirmDanger && armed,
				'cursor-pointer': !_disabled,
				'cursor-not-allowed pointer-events-none opacity-40': _disabled
			},
			$$restProps.class
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
</AnimatedSelection>
