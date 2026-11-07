<script lang="ts">
	import TmdbCard from '$lib/components/Card/TmdbCard.svelte';
	import CardGrid from '$lib/components/CardGrid.svelte';
	import Container from '$lib/components/Container.svelte';
	import FloatingHeader from '$lib/components/FloatingHeader.svelte';
	import { backgroundContext } from '$lib/components/GlobalBackground/background-stack.store';
	import TitleText from '$lib/components/TitleText.svelte';
	import { scrollIntoView } from '$lib/selectable';
	import { setScrollContext } from '$lib/stores/scroll.store';
	import type { ComponentProps, Snippet } from 'svelte';

	interface Props {
		title: string;
		subtitle?: string;
		items: ComponentProps<typeof TmdbCard>['item'][];
		loading?: boolean;
		header?: Snippet;
		headerCompact?: Snippet;
		footer?: Snippet;
	}

	let {
		title,
		subtitle = '',
		items,
		loading = false,
		header,
		headerCompact,
		footer
	}: Props = $props();

	backgroundContext.createContext();
	const { registrar: registerScroll, topVisible } = setScrollContext();
</script>

<Container class="py-16 *:px-32 flex flex-col h-screen overflow-y-auto overflow-x-hidden">
	{#if header}{@render header()}{:else}
		<div class="pt-8">
			<h2 class="uppercase text-zinc-300 font-semibold tracking-wider">{subtitle}</h2>
			<TitleText {title} />
		</div>
	{/if}

	{#if headerCompact}{@render headerCompact()}{:else}
		<FloatingHeader visible={$topVisible}>
			<h2 class="uppercase text-zinc-300 font-semibold tracking-wider text-base">{subtitle}</h2>
			<TitleText {title} size="sm" />
		</FloatingHeader>
	{/if}

	<div class="flex-1 pt-16" use:registerScroll>
		{#if loading && !items.length}
			<div class="flex flex-col items-center justify-center h-full">
				<h2 class="h-ghost">Loading...</h2>
			</div>
		{:else if items.length}
			<CardGrid>
				{#snippet children({ columns })}
					{#each items as item, index}
						<TmdbCard
							onEnter={(e) => {
								if (index < columns) {
									scrollIntoView({ top: 500 })(e);
								} else {
									scrollIntoView({ top: 192 })(e);
								}
							}}
							{item}
						/>
					{/each}
				{/snippet}
			</CardGrid>
		{:else}
			<div class="flex flex-col items-center justify-center h-full">
				<h2 class="h-ghost">No results found</h2>
			</div>
		{/if}
	</div>

	{@render footer?.()}
</Container>
