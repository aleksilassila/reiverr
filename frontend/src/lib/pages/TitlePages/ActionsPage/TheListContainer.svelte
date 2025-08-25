<script lang="ts">
	import type { ListWithDetailsItemDto, MediaSourceDto } from '$lib/apis/reiverr/reiverr.openapi';
	import Button from '$lib/components/Button/Button.svelte';
	import Container from '$lib/components/Container.svelte';
	import { breadcrumbsContext } from '$lib/pages/TitlePages/ActionsPage/actions-page';
	import { scrollElementIntoView } from '$lib/scroll-into-view';
	import { capitalize } from '$lib/utils';
	import type { MediaSourceProvider } from '@aleksilassila/reiverr-shared';
	import classNames from 'classnames';
	import ActionsMenuContainer from './ActionsMenuContainer.svelte';

	type Row = ListWithDetailsItemDto;
	type Items = {
		source: MediaSourceDto;
		streams: Row[];
	};

	export let items: Items[];

	// export let viewBase: ViewBaseDto;
	// export let source: MediaSourceDto;
	export let handleClickItem: (opts: { item: Row; source: MediaSourceDto }) => void | Promise<void>;
	export let handleShowAll: ({ source }: { source: MediaSourceDto }) => void | Promise<void>;
	export let name = '';

	// const { tmdbId, season, episode, playStream, handleAction, handleOpenView } =
	// 	playableDataContext.getContext();
	if (name) breadcrumbsContext.createContext(name);

	let selectedRow: Row;
	let selectedActionIndex = 0;
	// let actionsLoading = false;
</script>

<ActionsMenuContainer class="h-screen !px-0 [&>*:first-child]:px-32">
	<div
		class="overflow-y-auto overflow-x-hidden scrollbar-hide pb-16 mx-32"
		style="backface-visibility: hidden"
	>
		{#each items as { streams, source }}
			<div>
				<h1>{source.name}</h1>
			</div>

			{#each streams as row, index}
				<Container
					on:enter={({ detail }) => {
						selectedRow = row;
						selectedActionIndex = 0;

						const el =
							detail.selectable.getSibling(-1)?.getHtmlElement() ??
							detail.selectable?.getHtmlElement();

						if (el) scrollElementIntoView(el, { top: 32 });
					}}
					on:select={() => handleClickItem({ item: row, source })}
					on:click={() => {
						selectedRow = row;
						selectedActionIndex = 0;
					}}
					on:navigate={({ detail }) => {
						if (detail.direction === 'left') {
							selectedActionIndex = Math.max(0, selectedActionIndex - 1);
						} else if (detail.direction === 'right') {
							selectedActionIndex = Math.min(row.actions.length - 1, selectedActionIndex + 1);
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
						<span class="text-secondary-200">
							{row.properties?.map((p) => `${p.label}: ${p.formatted || p.value}`).join(', ')}
						</span>
					</div>
				</Container>

				<!-- <div class="h-[1px] w-full my-2 bg-secondary-400" /> -->
			{:else}
				<div class="h-ghost m-auto">No streams available</div>
			{/each}
			<Button on:clickOrSelect={() => handleShowAll({ source })}>View all</Button>
		{/each}
	</div>
</ActionsMenuContainer>
