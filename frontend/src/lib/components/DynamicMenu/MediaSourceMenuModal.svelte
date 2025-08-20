<script lang="ts">
	import Container from '$components/Container.svelte';
	import DynamicListView from '$lib/components/Menu/ListMenu.svelte';
	import { reiverrApi, user } from '$lib/stores/user.store';
	import { capitalize } from '$lib/utils';
	import classNames from 'classnames';
	import { ChevronRight } from 'radix-icons-svelte';
	import type { MediaSourceDto, ViewProviderDto } from '../../apis/reiverr/reiverr.openapi';
	import { mediaSourceContext } from '../../pages/TitlePages/media-source.context';
	import Modal from '../Modal/Modal.svelte';
	import ComponentStackProvider from '../ComponentStack/ComponentStackProvider.svelte';

	type ViewItem = {
		label: string;
		handleClick: () => void;
	};

	export let tmdbId: string;
	export let season: number | undefined = undefined;
	export let episode: number | undefined = undefined;
	export let playStream: (mediaSource: MediaSourceDto, streamId: string) => void;

	const { componentStack } = mediaSourceContext.createContext({ playStream });

	const views = getViews();
	let mediaSourceOptions: ViewItem[] | undefined = undefined;

	async function getViews(): Promise<ViewItem[]> {
		const { viewGroups } = await reiverrApi.sources
			.getMediaSourceViewGroups({ tmdbId, season, episode })
			.then((r) => r.data);

		const mediaSources = $user?.mediaSources;

		if (!mediaSources) return [];

		const views: ViewItem[] = [];

		for (const group of viewGroups) {
			if (!group.viewProviders.length) continue;

			views.push({
				label: group.label,
				handleClick: () => {
					const openView = (viewProvider: ViewProviderDto) => {
						const mediaSource = mediaSources.find((source) => source.id === viewProvider.sourceId);

						if (!mediaSource) return;

						if (viewProvider.view.type === 'list-with-details') {
							componentStack.create(DynamicListView, {
								viewBase: viewProvider.view,
								source: mediaSource,
								tmdbId,
								season,
								episode
							});
						}
					};

					if (group.viewProviders.length > 1) {
						mediaSourceOptions = group.viewProviders.map((viewProvider) => ({
							label: viewProvider.sourceId,
							handleClick: () => {
								mediaSourceOptions = undefined;
								openView(viewProvider);
							}
						}));
					} else {
						const viewProvider = group.viewProviders[0];
						if (!viewProvider) return;
						openView(viewProvider);
					}
				}
			});
		}

		return views;
	}
</script>

<Modal let:close>
	<Container
		class="h-screen py-16 px-32 bg-primary-800 space-y-8 overflow-y-auto flex flex-col"
		on:back={({ detail }) => {
			if (!$componentStack.length) {
				close();
			} else {
				componentStack.pop();
				detail.stopPropagation();
			}
		}}
	>
		{#if !$componentStack.length}
			{#await views then views}
				{#each views as view}
					<Container on:clickOrSelect={view.handleClick} let:hasFocus class="cursor-pointer">
						<span
							class={classNames('text-3xl font-semibold flex items-center', {
								'text-secondary-400': !hasFocus,
								'text-primary-100': hasFocus
							})}
						>
							{capitalize(view.label)}
							{#if hasFocus}
								<ChevronRight class="w-8 h-8 ml-4" />
							{/if}
						</span>
					</Container>
				{/each}
			{/await}
		{:else}
			<ComponentStackProvider {componentStack} />
		{/if}
	</Container>
</Modal>
