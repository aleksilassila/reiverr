<script lang="ts">
	import classNames from 'classnames';
	import Container from './Container.svelte';

	export let selected = false;
</script>

<Container
	class={classNames(
		'rounded-full px-4 py-1 border-2 cursor-pointer select-none font-semibold text-lg',
		selected
			? 'bg-secondary-100 text-secondary-950 border-secondary-100 focus:bg-primary-500 focus:border-primary-500'
			: 'bg-secondary-800 text-secondary-300 border-transparent focus:border-primary-500 hover:border-primary-500',
		$$restProps.class
	)}
	on:clickOrSelect
	on:enter
	focusOnClick
>
	<slot />
</Container>
