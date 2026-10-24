<script lang="ts">
	import Container from './Container.svelte';
	import classNames from 'classnames';
	import type { ComponentType } from 'svelte';

	export let icon: ComponentType;
	export let type: 'primary' | 'primary-dark' = 'primary';
</script>

<Container
	class={classNames(
		'selectable flex items-center justify-center h-11 w-11 rounded-lg cursor-pointer',
		{
			'bg-secondary-800': type === 'primary',
			'bg-primary-900': type === 'primary-dark'
		}
	)}
	on:clickOrSelect
>
	<svelte:component this={icon} size={19} />
</Container>
