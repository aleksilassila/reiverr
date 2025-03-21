<script lang="ts">
	import TmdbCard from '$lib/components/Card/TmdbCard.svelte';
	import CardGrid from '$lib/components/CardGrid.svelte';
	import Container from '$lib/components/Container.svelte';
	import { createBackgroundPage } from '$lib/components/GlobalBackground/BackgroundStack';
	import type { StackRouterPageProps } from '$lib/components/StackRouter/StackRouterPage.type';
	import { scrollIntoView } from '$lib/selectable';
	import { setScrollContext } from '$lib/stores/scroll.store';
	import classNames from 'classnames';
	import type { ComponentProps } from 'svelte';

	export let title: string;
	export let subtitle = '';
	export let items: Promise<ComponentProps<TmdbCard>['item'][]>;
	export let registrar: StackRouterPageProps['registrar'];
	export let handleGoBack: StackRouterPageProps['handleGoBack'];

	const background = createBackgroundPage();
	const { registerScroll } = setScrollContext();

</script>

<Container
	on:back={handleGoBack}
	on:mount={registrar}
	class="*:px-32 flex flex-col h-screen relative"
>
	<div
		class="pt-16 pb-8 absolute top-0 inset-x-0 z-10 bg-gradient-to-b from-100% from-secondary-900/75 to-transparent"
	>
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
	<div class="py-48 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
		{#await items}
			Loading...
		{:then items}
			<CardGrid>
				{#each items as item}
					<TmdbCard on:enter={scrollIntoView({ top: 192 })} {item} />
				{/each}
			</CardGrid>
		{/await}
	</div>
</Container>
