<script lang="ts">
	import classNames from 'classnames';
	import Container from './Container.svelte';

	export let type: 'transparent' = 'transparent';
	export let focusOnMount = false;
</script>

<Container
	class={$$restProps.class}
	on:mount
	on:enter
	on:select
	on:click
	on:clickOrSelect
	on:navigate
	{focusOnMount}
	focusOnClick
	let:hasFocus
>
	<div
		class={classNames(
			'cursor-pointer select-none flex items-center rounded-xl px-6 py-2.5 border-2 group',
			{
				'border-transparent text-secondary-200 hover:border-secondary-700/50 hover:bg-secondary-700/50 hover:text-secondary-100':
					type === 'transparent' && !hasFocus,
				'border-secondary-700/50 bg-secondary-700/50 text-secondary-100':
					type === 'transparent' && hasFocus
			}
		)}
	>
		<slot {hasFocus} />
	</div>
</Container>
