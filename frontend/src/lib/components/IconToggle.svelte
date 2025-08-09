<script lang="ts">
	import Container from './Container.svelte';
	import classNames from 'classnames';
	import type { Readable } from 'svelte/store';
	import type { ComponentType } from 'svelte';

	export let icon: ComponentType;
	let hasFocus: Readable<boolean>;
</script>

<Container
	bind:hasFocus
	class={classNames(
		'bg-primary-900 flex items-center justify-center h-11 w-11 rounded-lg cursor-pointer',
		{
			selected: $hasFocus,
			unselected: !$hasFocus
		}
	)}
	on:clickOrSelect
>
	<svelte:component this={icon} size={19} />
</Container>
