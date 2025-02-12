<script lang="ts">
	import Container from './Container.svelte';
	import { ArrowRight } from 'radix-icons-svelte';
	import classNames from 'classnames';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{ clickOrSelect: null }>();

	export let color: 'secondary' | 'primary' = 'secondary';
	export let value: string = '';
	export let disabled: boolean = false;
	export let action: (() => Promise<any>) | undefined = undefined;

	let actionIsFetching = false;
	$: _disabled = disabled || actionIsFetching;

	function handleClickOrSelect() {
		if (actionIsFetching || _disabled) return;

		if (action) {
			actionIsFetching = true;
			action().then(() => (actionIsFetching = false));
		}

		dispatch('clickOrSelect');
	}
</script>

<Container
	class={classNames(
		'flex items-center justify-between rounded-xl px-6 py-2.5 font-medium',
		'border-2 border-transparent focus:border-primary-500 hover:border-primary-500 group',
		{
			'cursor-pointer': !_disabled,
			'cursor-not-allowed pointer-events-none opacity-40': _disabled,
			'bg-primary-900': color === 'secondary',
			'bg-secondary-800': color === 'primary'
		},
		$$restProps.class
	)}
	on:clickOrSelect={handleClickOrSelect}
	let:hasFocus
>
	<div>
		{#if !$$slots.content}
			<h1 class="text-secondary-300 font-semibold tracking-wide text-sm">
				<slot />
			</h1>
			<span>
				{value}
			</span>
		{:else}
			<slot name="content" />
		{/if}
	</div>
	<slot
		name="icon"
		size={24}
		iconClass={classNames('group-hover:text-primary-500 group-hover:scale-110', {
			'text-primary-500 scale-110': hasFocus
		})}
	>
		<ArrowRight
			class={classNames('transition-transform', {
				'text-primary-500 translate-x-0.5 scale-110': hasFocus,
				'group-hover:text-primary-500 group-hover:translate-x-0.5 group-hover:scale-110': true
			})}
			size={24}
		/>
	</slot>
</Container>
