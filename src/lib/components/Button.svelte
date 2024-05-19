<script lang="ts">
	import Container from '../../Container.svelte';
	import type { Readable } from 'svelte/store';
	import classNames from 'classnames';
	import AnimatedSelection from './AnimateScale.svelte';
	import { createEventDispatcher } from 'svelte';

	export let disabled: boolean = false;
	export let focusOnMount: boolean = false;
	export let type: 'primary' | 'secondary' | 'primary-dark' = 'primary';

	export let action: (() => Promise<any>) | null = null;
	let actionIsFetching = false;
	$: _disabled = disabled || actionIsFetching;

	let hasFocus: Readable<boolean>;

	const dispatch = createEventDispatcher<{ clickOrSelect: null }>();

	function handleClickOrSelect() {
		if (action) {
			actionIsFetching = true;
			action().then(() => (actionIsFetching = false));
		}

		dispatch('clickOrSelect');
	}
</script>

<AnimatedSelection hasFocus={$hasFocus}>
	<Container
		bind:hasFocus
		class={classNames(
			'h-12 rounded-lg font-medium tracking-wide flex items-center group',
			{
				'bg-secondary-800': type === 'primary',
				'bg-primary-900': type === 'primary-dark',
				'selectable px-6': type === 'primary' || type === 'primary-dark',
				'border-2 p-1 hover:border-primary-500': type === 'secondary',
				'border-primary-500': type === 'secondary' && $hasFocus,
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
	>
		<div
			class={classNames({
				contents: type === 'primary' || type === 'primary-dark',
				'border-2 border-transparent h-full w-full rounded-md flex items-center px-6':
					type === 'secondary',
				'bg-primary-500 text-secondary-950': type === 'secondary' && $hasFocus,
				'group-hover:bg-primary-500 group-hover:text-secondary-950': type === 'secondary'
			})}
		>
			<div class="flex-1 text-center text-nowrap flex items-center justify-center">
				{#if $$slots.icon}
					<div class="mr-2">
						<slot name="icon" />
					</div>
				{/if}
				<slot {hasFocus} />
				{#if $$slots['icon-after']}
					<div class="ml-2">
						<slot name="icon-after" />
					</div>
				{/if}
			</div>
		</div>
	</Container>
</AnimatedSelection>
