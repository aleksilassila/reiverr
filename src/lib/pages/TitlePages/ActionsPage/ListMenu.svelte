<script lang="ts">
	import type {
		ListWithDetailsViewDto,
		MediaSourceDto,
		ViewBaseDto
	} from '$lib/apis/reiverr/reiverr.openapi';
	import { scrollIntoView } from '$lib/selectable';
	import { capitalize } from '$lib/utils';
	import classNames from 'classnames';
	import Container from '../../../components/Container.svelte';
	import { reiverrApi } from '$lib/stores/user.store';
	import { playableDataContext } from '$lib/pages/TitlePages/ActionsPage/actions-page';
	import ActionsMenuContainer from './ActionsMenuContainer.svelte';

	type Row = ListWithDetailsViewDto['items'][number];

	export let viewBase: ViewBaseDto;
	export let source: MediaSourceDto;

	const { tmdbId, season, episode, playStream, handleAction, handleOpenView } =
		playableDataContext.getContext();

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
			playStream(source, row.id);
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

<ActionsMenuContainer>
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
			<div class="mb-8">
				<h1>
					{capitalize(selectedRow.label)}
				</h1>

				<div class="flex space-x-4">
					{#each selectedRow.actions as action, index}
						{@const selected = index === selectedActionIndex}
						<div
							class={classNames('text-3xl font-semibold flex items-center', {
								'text-secondary-400': !selected,
								'text-primary-100': selected,
								'cursor-pointer': !(action.type === 'action' && action.disabled)
							})}
						>
							{action.label}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
	<div>
		{#await view}
			Loading...
		{:then view}
			{#each view.items as row}
				<Container
					on:enter={(e) => {
						selectedRow = row;
						selectedActionIndex = 0;
						scrollIntoView({ vertical: 64 })(e);
					}}
					on:clickOrSelect={() => handleItemAction(row)}
					let:hasFocus
					class="cursor-pointer"
				>
					<span
						class={classNames('text-3xl font-semibold flex items-center', {
							'text-secondary-400': !hasFocus,
							'text-primary-100': hasFocus
						})}
					>
						{capitalize(row.label)}
						<!-- {#if hasFocus}
								<Play class="w-8 h-8 ml-4" />
							{/if} -->
					</span>
					<span class="text-secondary-400">
						{row.properties?.map((p) => `${p.label}: ${p.formatted || p.value}`).join(', ')}
					</span>
				</Container>
			{:else}
				<div class="h-ghost m-auto">No streams available</div>
			{/each}
		{/await}
	</div>
</ActionsMenuContainer>
