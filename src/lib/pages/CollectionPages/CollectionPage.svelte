<script lang="ts">
	import TmdbCard from '$lib/components/Card/TmdbCard.svelte';
	import CardGrid from '$lib/components/CardGrid.svelte';
	import Container from '$lib/components/Container.svelte';
	import FloatingHeader from '$lib/components/FloatingHeader.svelte';
	import { createBackgroundPage } from '$lib/components/GlobalBackground/BackgroundStack';
	import { getStackRouterControls } from '$lib/components/StackRouter/StackRouter';
	import { scrollIntoView } from '$lib/selectable';
	import { setScrollContext } from '$lib/stores/scroll.store';
	import classNames from 'classnames';
	import type { ComponentProps } from 'svelte';

	export let title: string;
	export let subtitle = '';
	export let items: Promise<ComponentProps<TmdbCard>['item'][]>;
	const { registrar } = getStackRouterControls();

	const background = createBackgroundPage();
	const { registrar: registerScroll, topVisible } = setScrollContext();
</script>

<Container class="py-16 *:px-32 flex flex-col h-screen overflow-y-auto overflow-x-hidden">
	<slot name="header">
		<div class="pt-8">
			<h2 class="uppercase text-zinc-300 font-semibold tracking-wider">{subtitle}</h2>
			<h1
				class={classNames('text-left font-semibold tracking-wider text-stone-200 mt-1', {
					'text-4xl sm:text-5xl 2xl:text-6xl': title.length || 0 < 15,
					'text-3xl sm:text-4xl 2xl:text-5xl': title.length || 0 >= 15
				})}
			>
				{title}
			</h1>
		</div>
	</slot>

	<slot name="header-compact">
		<FloatingHeader visible={$topVisible}>
			<h2 class="uppercase text-zinc-300 font-semibold tracking-wider">{subtitle}</h2>
			<h1
				class={classNames('text-left font-semibold tracking-wider text-stone-200 mt-1', {
					'text-3xl sm:text-4xl 2xl:text-5xl': title.length || 0 < 15,
					'text-2xl sm:text-3xl 2xl:text-4xl': title.length || 0 >= 15
				})}
			>
				{title}
			</h1>
		</FloatingHeader>
	</slot>

	<div class="pt-16" use:registerScroll>
		{#await items}
			Loading...
		{:then items}
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
		{/await}
	</div>
</Container>
