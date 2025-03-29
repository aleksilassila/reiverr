<script lang="ts">
	import TmdbCard from '$lib/components/Card/TmdbCard.svelte';
	import CardGrid from '$lib/components/CardGrid.svelte';
	import Container from '$lib/components/Container.svelte';
	import FloatingHeader from '$lib/components/FloatingHeader.svelte';
	import { createBackgroundPage } from '$lib/components/GlobalBackground/BackgroundStack';
	import { getStackRouterControls } from '$lib/components/StackRouter/StackRouter';
	import TitleText from '$lib/components/TitleText.svelte';
	import { scrollIntoView } from '$lib/selectable';
	import { setScrollContext } from '$lib/stores/scroll.store';
	import type { ComponentProps } from 'svelte';

	export let title: string;
	export let subtitle = '';
	export let items: ComponentProps<TmdbCard>['item'][];
	export let loading = false;
	const { registrar } = getStackRouterControls();

	const background = createBackgroundPage();
	const { registrar: registerScroll, topVisible } = setScrollContext();
</script>

<Container class="py-16 *:px-32 flex flex-col h-screen overflow-y-auto overflow-x-hidden">
	<slot name="header">
		<div class="pt-8">
			<h2 class="uppercase text-zinc-300 font-semibold tracking-wider">{subtitle}</h2>
			<TitleText {title} />
		</div>
	</slot>

	<slot name="header-compact">
		<FloatingHeader visible={$topVisible}>
			<h2 class="uppercase text-zinc-300 font-semibold tracking-wider text-base">{subtitle}</h2>
			<TitleText {title} size="sm" />
		</FloatingHeader>
	</slot>

	<div class="pt-16" use:registerScroll>
		{#if loading && !items.length}
			Loading...
		{:else if items.length}
			<CardGrid let:columns on:mount={registrar}>
				{#each items as item, index}
					<TmdbCard
						on:enter={(e) => {
							if (index < columns) {
								scrollIntoView({ top: 500 })(e);
							} else {
								scrollIntoView({ top: 192 })(e);
							}
						}}
						{item}
					/>
				{/each}
			</CardGrid>
		{:else}
			<div class="flex flex-col items-center justify-center h-full">
				<h2 class="text-2xl text-zinc-300 font-semibold tracking-wider">No results found</h2>
				<p class="text-zinc-400 text-sm">Try a different search</p>
			</div>
		{/if}
	</div>

	<slot name="footer" />
</Container>
