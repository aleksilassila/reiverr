<script lang="ts">
	import Container from '../Container.svelte';
	import classNames from 'classnames';
	import { ChevronDown, ChevronUp } from 'radix-icons-svelte';
	import type { Readable } from 'svelte/store';
	import TableHeaderCell from './TableHeaderCell.svelte';

	export let icon: undefined | 'asc' | 'desc' = undefined;
	let hasFocus: Readable<boolean>;
</script>

<TableHeaderCell>
	<Container
		bind:hasFocus
		on:clickOrSelect
		focusOnClick
		class={classNames(
			'flex items-center rounded-full py-1 cursor-pointer select-none font-semibold float-left',
			{
				'bg-primary-500 text-secondary-800 px-3': $hasFocus
			}
		)}
	>
		<slot />
		{#if icon}
			<svelte:component this={icon === 'desc' ? ChevronDown : ChevronUp} size={19} class="ml-2" />
		{/if}
	</Container>
</TableHeaderCell>
