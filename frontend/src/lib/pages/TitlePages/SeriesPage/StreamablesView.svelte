<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import Scrollable from '$lib/components/Carousel/Scrollable.svelte';
	import Container from '$lib/components/Container.svelte';
	import { backgroundContext } from '$lib/components/GlobalBackground/background-stack.store';
	import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';
	import { useTabs } from '$lib/components/Tab/Tab';
	import Tab from '$lib/components/Tab/Tab.svelte';
	import TabContainer from '$lib/components/Tab/TabContainer.svelte';
	import { TMDB_BACKDROP_SMALLEST } from '$lib/constants';
	import TabItem from '$lib/pages/LibraryPage/TabItem.svelte';
	import { scrollElementIntoView } from '$lib/scroll-into-view';
	import { scrollIntoView } from '$lib/selectable';
	import { breadcrumbsContext } from '$lib/stores/breadcrumbs.store';
	import { useMovieContext } from '$lib/stores/data/movie-data.store';
	import { useSeriesContext } from '$lib/stores/data/series-data.store';
	import { reiverrApi, user } from '$lib/stores/user.store';
	import { capitalize } from '$lib/utils';
	import classNames from 'classnames';
	import { Trash } from 'radix-icons-svelte';
	import { derived, get, readable } from 'svelte/store';
	import HeroTitleInfo from '../HeroTitleInfo.svelte';

	export let tmdbId: string;
	export let season: number | undefined = undefined;
	export let episode: number | undefined = undefined;
	export let progress = 0;
	export let name = '';

	const componentStack = useComponentStack();
	const { background, playMedia } = backgroundContext.getContext();
	// playableDataContext.createContext({ tmdbId, season, episode });
	const { setStale: setSeriesStale, ...seriesData } = useSeriesContext(tmdbId).getContext();
	const { setStale: setMovieStale, ...movieData } = useMovieContext(tmdbId).getContext();
	const requestsData = seriesData.requestsData?.data ?? readable(undefined);
	const requests = derived(requestsData, ($requestsData) => {
		if (season !== undefined && episode !== undefined) {
			return $requestsData?.episodeRequests.get(`${season}-${episode}`);
		}
		return undefined;
	});

	if (name) breadcrumbsContext.createContext(name);

	const tab = useTabs(0);
	let tabSubheading = 'Available';

	const groups = reiverrApi.media.getStreamables({ tmdbId, season, episode });

	const handleProgressUpdate = (progress: number) => {
		const userId = get(user)?.id;

		if (userId && season !== undefined && episode !== undefined) {
			reiverrApi.users
				.updateEpisodePlayStateByTmdbId(userId, tmdbId, season, episode, {
					progress,
					...(progress > 0.9 && { watched: true })
				})
				.finally(() => setSeriesStale?.());
		} else if (userId) {
			reiverrApi.users
				.updateMoviePlayStateByTmdbId(userId, tmdbId, {
					progress,
					...(progress > 0.9 && { watched: true })
				})
				.finally(() => setMovieStale?.());
		}
	};
</script>

<div class="fixed inset-0 scale-110 z-[-1]">
	<div
		class="absolute inset-0 bg-center bg-cover bg-no-repeat blur-md brightness-[0.2] saturate-50"
		style={$background?.backdropUri
			? `background-image: url('${TMDB_BACKDROP_SMALLEST}${$background?.backdropUri}');`
			: ''}
	/>
</div>

<Container
	class={classNames('flex flex-col min-h-screen bg-primary-900/50 h-screen')}
	on:back={({ detail }) => {
		componentStack.close();
		detail.stopPropagation();
	}}
>
	<Container class="mx-32 mt-16">
		<HeroTitleInfo title="Episode 1" overview="" properties={[]}></HeroTitleInfo>

		<!-- Divider -->
		<div class="h-px w-full bg-secondary-700 mt-4"></div>
	</Container>

	<!-- <div class="mx-32 mt-8 font-semibold text-secondary-500 mb-1">
		{tabSubheading}
	</div>
	<Scrollable
		class="mb-4 px-32 flex items-center space-x-6"
		on:blur={({ detail: selectable }) => {
			selectable.activateChild($tab);
		}}
	>
		<TabItem
			class="text-4xl"
			selected={$tab === 0}
			on:select={() => tab.set(0)}
			on:enter={(opts) => {
				tabSubheading = 'Available';
				scrollIntoView({ left: 128 })(opts);
			}}
		>
			Streams
		</TabItem>
		{#each $requests ?? [] as request, index (request.id)}
			<div>
				<TabItem
					class="text-4xl"
					selected={$tab === index + 2}
					on:select={() => tab.set(index + 2)}
					on:enter={(opts) => {
						tabSubheading = `Request Options`;
						scrollIntoView({ left: 128 })(opts);
					}}
				>
					{request.profile.label}
				</TabItem>
			</div>
		{/each}
		<TabItem
			class="text-4xl flex items-center w-screen"
			selected={$tab === 1}
			on:select={() => tab.set(1)}
			on:enter={(opts) => {
				tabSubheading = 'Add Request';
				scrollIntoView({ left: 128 })(opts);
			}}
		>
			Add request
		</TabItem>
	</Scrollable> -->
	<div
		class="overflow-y-auto overflow-x-hidden scrollbar-hide pb-16 mx-32"
		style="backface-visibility: hidden"
	>
		{#await groups}
			Loading...
		{:then view}
			{#each view.data.items as group}
				<div class="text-lg font-semibold text-secondary-300">
					{capitalize(group.label)}
				</div>
				{#each group.streamables as row, index}
					<Container
						on:enter={({ detail }) => {
							const el =
								detail.selectable.getSibling(-1)?.getHtmlElement() ??
								detail.selectable?.getHtmlElement();

							if (el) scrollElementIntoView(el, { top: 32 });
						}}
						on:clickOrSelect={() => {
							playMedia?.({
								title: name,
								subtitle: `${capitalize(group.label)} - ${capitalize(row.label)}`,
								pluginId: group.pluginId,
								streamId: row.id,
								sourceName: group.label,
								progress,
								handleProgressUpdate
							});
							componentStack.close();
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
										'text-primary-500': hasFocus
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
