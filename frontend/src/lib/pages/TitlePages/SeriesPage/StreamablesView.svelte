<script lang="ts">
	import type { StreamableDto } from '$lib/apis/reiverr/reiverr.openapi';
	import Container from '$lib/components/Container.svelte';
	import { getBackgroundPage } from '$lib/components/GlobalBackground/BackgroundStack';
	import Marquee from '$lib/components/Marquee.svelte';
	import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';
	import { TMDB_BACKDROP_SMALLEST } from '$lib/constants';
	import { scrollElementIntoView } from '$lib/scroll-into-view';
	import { reiverrApi } from '$lib/stores/user.store';
	import { capitalize } from '$lib/utils';
	import classNames from 'classnames';
	import { TriangleRight } from 'radix-icons-svelte';
	import { breadcrumbsContext, playableDataContext } from '../ActionsPage/actions-page';

	export let tmdbId: string;
	export let season: number | undefined = undefined;
	export let episode: number | undefined = undefined;
	export let openStream: (opts: { id: string; pluginId: string }) => Promise<void>;
	export let name = '';

	playableDataContext.createContext({ tmdbId, season, episode });
	const background = getBackgroundPage();
	// const { componentStack } = titlePageContext.getContext();
	const componentStack = useComponentStack();

	if (name) breadcrumbsContext.createContext(name);

	const groups = reiverrApi.media.getStreamables({ tmdbId, season, episode });

	let selectedRow: StreamableDto;
	let selectedActionIndex = 0;
	const actions = [
		{ action: 'stream', disabled: false, type: 'action', label: 'Play' },
		{ action: 'offline-dl', disabled: true, type: 'action', label: 'Download offline' }
	];
</script>

<div class="fixed inset-0 scale-110 z-[21]">
	<div
		class="absolute inset-0 bg-center bg-cover bg-no-repeat blur-md brightness-[0.2] saturate-50"
		style={$background?.backdropUri
			? `background-image: url('${TMDB_BACKDROP_SMALLEST}${$background?.backdropUri}');`
			: ''}
	/>
</div>

<Container
	class={classNames('pt-16 flex flex-col min-h-screen bg-primary-900/50', 'h-screen')}
	on:back={({ detail }) => {
		componentStack.close();
		detail.stopPropagation();
	}}
>
	{#if selectedRow}
		<div
			class="space-y-4 rounded-2xl h-52 flex-shrink-0 flex flex-col justify-between bg-primary-200/10 p-8 mx-24"
		>
			<div>
				{#key selectedRow.label}
					<Marquee class="text-3xl font-semibold text-primary-100">
						{capitalize(selectedRow.label)}
					</Marquee>
				{/key}

				<!-- <span class="text-secondary-200 line-clamp-2">
						{selectedRow.properties?.map((p) => `${p.label}: ${p.formatted || p.value}`).join(', ')}
					</span> -->
			</div>
			<div class="flex space-x-4">
				<!-- {#each selectedRow.actions as action, index} -->
				{#each actions as action, index}
					{@const selected = index === selectedActionIndex}
					<div
						class={classNames(
							'inline-flex items-center font-medium tracking-wide h-12 ',
							'group rounded-xl px-6 bg-primary-900',
							'border-2 p-1 hover:border-primary-500',
							{
								'text-primary-100 border-transparent': !selected,
								'text-primary-100 border-primary-400': selected,
								'cursor-pointer': !(action.type === 'action' && action.disabled)
							}
						)}
					>
						{#if action.type === 'action' && action.action === 'stream'}
							<TriangleRight size={28} class="-ml-2 mr-1" />
						{/if}

						{action.label}
					</div>
				{/each}
			</div>
		</div>
	{/if}
	<div
		class="overflow-y-auto overflow-x-hidden scrollbar-hide pb-16 mx-32"
		style="backface-visibility: hidden"
	>
		{#await groups}
			Loading...
		{:then view}
			{#each view.data.items as group}
				{#each group.streamables as row, index}
					<Container
						on:enter={({ detail }) => {
							selectedRow = row;
							selectedActionIndex = 0;

							const el =
								detail.selectable.getSibling(-1)?.getHtmlElement() ??
								detail.selectable?.getHtmlElement();

							if (el) scrollElementIntoView(el, { top: 32 });
						}}
						on:select={() => {}}
						on:click={() => {
							selectedRow = row;
							selectedActionIndex = 0;
						}}
						on:navigate={({ detail }) => {
							if (detail.direction === 'left') {
								selectedActionIndex = Math.max(0, selectedActionIndex - 1);
							} else if (detail.direction === 'right') {
								selectedActionIndex = 0;
								// selectedActionIndex = Math.min(row.actions.length - 1, selectedActionIndex + 1);
							}
						}}
						focusOnClick
						let:hasFocus
					>
						<div class={classNames('cursor-pointer my-8 rounded-xl', {})}>
							<span
								class={classNames(
									'text-3xl font-semibold flex items-center',
									// 'text-secondary-200',
									{
										'text-secondary-500': !hasFocus,
										'text-secondary-100': hasFocus
									}
								)}
							>
								<span class="line-clamp-1">
									{capitalize(row.label)}
								</span>
								<!-- {#if hasFocus}
								<Play class="w-8 h-8 ml-4" />
							{/if} -->
							</span>
							<!-- <span class="text-secondary-200">
								{row.properties?.map((p) => `${p.label}: ${p.formatted || p.value}`).join(', ')}
							</span> -->
						</div>
					</Container>

					<!-- <div class="h-[1px] w-full my-2 bg-secondary-400" /> -->
				{:else}
					<div class="h-ghost m-auto">No streams available</div>
				{/each}
			{/each}
		{/await}
	</div>
</Container>
