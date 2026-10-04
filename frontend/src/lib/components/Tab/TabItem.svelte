<script lang="ts">
	import Container from '$lib/components/Container.svelte';
	import classNames from 'classnames';
	import { createEventDispatcher } from 'svelte';

	export let selected = false;
	export let disabled = false;

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
			'font-semibold text-2xl group-focus-within:text-primary-500',
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
