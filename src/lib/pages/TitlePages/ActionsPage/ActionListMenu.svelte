<script lang="ts">
	import Container from '$lib/components/Container.svelte';
	import { capitalize } from '$lib/utils';
	import classNames from 'classnames';
	import { ChevronRight } from 'radix-icons-svelte';
	import ActionsMenuContainer from './ActionsMenuContainer.svelte';

	type ViewItem = {
		label: string;
		handleClick: () => void;
	};

	export let items: Promise<ViewItem[]>;
</script>

<ActionsMenuContainer class="space-y-4">
	{#await items}
		Loading...
	{:then items}
		{#each items as item}
			<Container on:clickOrSelect={item.handleClick} let:hasFocus>
				<span
					class={classNames(
						'px-8 py-4 rounded-xl',
						'cursor-pointer text-3xl font-semibold flex justify-between items-center',
						{
							'text-secondary-400 border-transparent': !hasFocus,
							'text-primary-100 bg-primary-200/10 border-primary-400': hasFocus
						}
					)}
				>
					{capitalize(item.label)}
					{#if hasFocus}
						<ChevronRight class="w-8 h-8 ml-4" />
					{/if}
				</span>
			</Container>
		{/each}
	{/await}
</ActionsMenuContainer>
