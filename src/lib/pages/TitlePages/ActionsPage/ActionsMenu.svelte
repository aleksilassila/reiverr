<script lang="ts">
	import type {
		MediaSourceDto,
		ViewBaseDto,
		ViewProviderDto
	} from '$lib/apis/reiverr/reiverr.openapi';
	import ListMenu from '$lib/pages/TitlePages/ActionsPage/ListMenu.svelte';
	import { reiverrApi, user } from '$lib/stores/user.store';
	import ActionListMenu from './ActionListMenu.svelte';
	import { playableDataContext, titlePageContext } from './actions-page';

	export let tmdbId: string;
	export let season: number | undefined = undefined;
	export let episode: number | undefined = undefined;

	type ViewItem = {
		label: string;
		handleClick: () => void;
	};

	const { componentStack } = titlePageContext.getContext();
	const {} = playableDataContext.createContext({ tmdbId, season, episode });

	const views = getViews();

	async function getViews(): Promise<ViewItem[]> {
		const { viewGroups } = await reiverrApi.sources
			.getMediaSourceViewGroups({ tmdbId, season, episode })
			.then((r) => r.data);

		const views: ViewItem[] = [];

		for (const group of viewGroups) {
			const providersWithSources = getProvidersWithSources(group.viewProviders);

			if (!providersWithSources.length) continue;

			views.push({
				label: group.label,
				handleClick: () => {
					if (providersWithSources.length > 1) {
						const items: ViewItem[] = providersWithSources.map((p) => ({
							label: p.source.name,
							handleClick: () => {
								createView(p.source, p.view);
							}
						}));

						componentStack.create(ActionListMenu, {
							items: Promise.resolve(items)
						});
					} else {
						const viewProvider = providersWithSources[0];
						if (!viewProvider) return;

						createView(viewProvider.source, viewProvider.view);
					}
				}
			});
		}

		return views;
	}

	function createView(source: MediaSourceDto, view: ViewBaseDto) {
		if (view.type === 'list-with-details') {
			componentStack.create(ListMenu, {
				viewBase: view,
				source
			});
		}
	}

	function getProvidersWithSources(providers: ViewProviderDto[]) {
		return providers
			.map((p) => ({
				...p,
				source: $user?.mediaSources.find((source) => source.id === p.sourceId) as MediaSourceDto
			}))
			.filter((p) => p.source);
	}
</script>

<ActionListMenu items={views} />
