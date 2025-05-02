<script lang="ts">
	import type {
		MediaSourceDto,
		ViewBaseDto,
		ViewProviderDto
	} from '$lib/apis/reiverr/reiverr.openapi';
	import { getBackgroundPage } from '$lib/components/GlobalBackground/BackgroundStack';
	import { TMDB_BACKDROP_SMALLEST } from '$lib/constants';
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
	const background = getBackgroundPage();

	const views = getViews();

	function getProvidersWithSources(providers: ViewProviderDto[]) {
		return providers
			.map((p) => ({
				...p,
				source: $user?.mediaSources.find((source) => source.id === p.sourceId) as MediaSourceDto
			}))
			.filter((p) => p.source);
	}

	function createView(source: MediaSourceDto, view: ViewBaseDto) {
		if (view.type === 'list-with-details') {
			componentStack.create(ListMenu, {
				viewBase: view,
				source,
				name: source.name
			});
		}
	}

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
							items: Promise.resolve(items),
							name: 'Sources'
						});
					} else {
						const viewProvider = providersWithSources[0];
						if (!viewProvider) return;

						createView(viewProvider.source, viewProvider.view);
					}
				}
			});
		}

		views.push({
			label: 'Mark as watched',
			handleClick: () => {}
		});

		return views;
	}
</script>

<!-- This is because of the limited support for css backdrop blur and performance cost of blurring 4k backdrop -->
<div class="fixed inset-0 scale-110 z-[21]">
	<div
		class="absolute inset-0 bg-center bg-cover bg-no-repeat blur-md brightness-[0.2] saturate-50"
		style={$background?.backdropUri
			? `background-image: url('${TMDB_BACKDROP_SMALLEST}${$background?.backdropUri}');`
			: ''}
	/>
</div>
<ActionListMenu items={views} name={tmdbId} />
