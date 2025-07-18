<script lang="ts">
	import type {
		ListWithDetailsViewDto,
		MediaSourceDto,
		ViewBaseDto
	} from '$lib/apis/reiverr/reiverr.openapi';
	import { scrollIntoView } from '$lib/selectable';
	import { capitalize } from '$lib/utils';
	import classNames from 'classnames';
	import Container from '../Container.svelte';
	import { reiverrApi } from '$lib/stores/user.store';
	import {
		breadcrumbsContext,
		playableDataContext
	} from '$lib/pages/TitlePages/ActionsPage/actions-page';
	import ActionsMenuContainer from '../../pages/TitlePages/ActionsPage/ActionsMenuContainer.svelte';
	import { DividerHorizontal, Play, TriangleRight } from 'radix-icons-svelte';
	import { scrollElementIntoView } from '$lib/scroll-into-view';
	import Marquee from '$lib/components/Marquee.svelte';
	import ActionPageTitle from '../../pages/TitlePages/ActionsPage/ActionPageTitle.svelte';

	type Row = ListWithDetailsViewDto['items'][number];

	export let viewBase: ViewBaseDto;
	export let source: MediaSourceDto;
	export let name = '';

	const { tmdbId, season, episode, playStream, handleAction, handleOpenView } =
		playableDataContext.getContext();
	if (name) breadcrumbsContext.createContext(name);

	if (viewBase.type !== 'list-with-details') {
		throw new Error('Invalid view type');
	}

	let view = reiverrApi.sources
		.getView(source.id, viewBase.id, {
			tmdbId,
			season,
			episode
		})
		.then((r) => r.data.view as ListWithDetailsViewDto);

	let selectedRow: Row;
	let selectedActionIndex = 0;
	let actionsLoading = false;

	function handleItemAction(row: Row) {
		const action = row.actions[selectedActionIndex];

		if (action?.type === 'action' && action.action === 'stream') {
			playStream({ source: source, streamId: row.id });
		} else if (action?.type === 'action' && !action.disabled) {
			handleAction(source, row.id, action.action);
		} else if (action?.type === 'open-view') {
			handleOpenView(source, action.viewId, row.id);
		}

		// if (action.action === 'stream') {
		// 	playStream?.(source, row.id);
		// } else {
		// 	actionsLoading = true;

		// 	reiverrApi.sources.handleMediaSourceAction(source.id, row.id, action.action).finally(() => {
		// 		actionsLoading = false;
		// 	});
		// }
	}
</script>

<ActionsMenuContainer class="h-screen !px-0 [&>*:first-child]:px-32">
	{#if selectedRow}
		<!-- <div>
			<h1>{selectedRow.label}</h1>
			<div>
				{#each selectedRow.actions as action, index}
				{@const selected = selectedActionIndex === index}
					<div>A: {action.label}</div>
				{/each}
			</div>
		</div> -->

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

					<span class="text-secondary-200 line-clamp-2">
						{selectedRow.properties?.map((p) => `${p.label}: ${p.formatted || p.value}`).join(', ')}
					</span>
				</div>
				<div class="flex space-x-4">
					{#each selectedRow.actions as action, index}
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
	{/if}
	<div
		class="overflow-y-auto overflow-x-hidden scrollbar-hide pb-16 mx-32"
		style="backface-visibility: hidden"
	>
		{#await view}
			Loading...
		{:then view}
			{#each view.items as row, index}
				<Container
					on:enter={({ detail }) => {
						selectedRow = row;
						selectedActionIndex = 0;

						const el =
							detail.selectable.getSibling(-1)?.getHtmlElement() ??
							detail.selectable?.getHtmlElement();

						if (el) scrollElementIntoView(el, { top: 32 });
					}}
					on:select={() => handleItemAction(row)}
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
		{/await}
	</div>
</ActionsMenuContainer>
