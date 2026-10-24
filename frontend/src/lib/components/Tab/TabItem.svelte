<script lang="ts">
	import Container from '$lib/components/Container.svelte';
	import classNames from 'classnames';
	import { createEventDispatcher } from 'svelte';

	export let selected = false;
	export let disabled = false;
	export let size: 'sm' | 'md' = 'md';

	const dispatch = createEventDispatcher<{ select: null }>();
</script>

<Container
	class={classNames(
		'group',
		disabled ? 'cursor-not-allowed pointer-events-none opacity-40' : 'cursor-pointer'
	)}
	{disabled}
	let:hasFocus
	on:clickOrSelect={() => dispatch('select')}
	on:enter
	focusOnClick
>
	<span
		class={classNames(
			'font-semibold group-focus-within:text-primary-500',
			size === 'sm' ? 'text-lg' : 'text-2xl',
			{
				'text-secondary-50': selected && !hasFocus,
				'text-secondary-400': !hasFocus && !selected
			},
			$$restProps.class
		)}
	>
		<slot />
	</span>
</Container>
