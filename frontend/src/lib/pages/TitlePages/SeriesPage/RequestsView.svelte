<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import Container from '$lib/components/Container.svelte';
	import { backgroundContext } from '$lib/components/GlobalBackground/background-stack.store';
	import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';
	import { TMDB_BACKDROP_SMALLEST } from '$lib/constants';
	import { useMovieContext } from '$lib/stores/data/movie-data.store';
	import { useSeriesContext } from '$lib/stores/data/series-data.store';
	import classNames from 'classnames';
	import { Pencil1, Reload } from 'radix-icons-svelte';
	import { readable, writable } from 'svelte/store';
	import HeroTitleInfo from '../HeroTitleInfo.svelte';
	import EditRequests from './EditRequests.svelte';
	import SeasonItem from './SeasonItem.svelte';
	import { reiverrApi } from '$lib/stores/user.store';

	export let tmdbId: string;

	const componentStack = useComponentStack();
	const { background, playMedia } = backgroundContext.getContext();
	const { setStale: setSeriesStale, ...seriesData } = useSeriesContext(tmdbId).getContext();
	const { setStale: setMovieStale, ...movieData } = useMovieContext(tmdbId).getContext();
	const requestsData = seriesData.requestsData?.data ?? readable(undefined);
	const tmdbSeries = seriesData.seriesData?.data ?? readable(undefined);
	const tmdbSeriesLoading = seriesData.seriesData?.isLoading ?? readable(false);

	const selecting = writable(false);
	const episodeSelections = writable(new Set<string>());
	// const requests = derived(requestsData, ($requestsData) => {
	// 	if (season !== undefined && episode !== undefined) {
	// 		return $requestsData?.episodeRequests.get(`${season}-${episode}`);
	// 	}
	// 	return undefined;
	// });

	// const groups = reiverrApi.media.getStreamables({ tmdbId, season, episode });

	async function synchronize() {
		return reiverrApi.requests
			.syncWatchStatuses({ tmdbId, type: 'series' })
			.then(() => seriesData.requestsData?.update());
	}
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
		<div class="flex items-center justify-between">
			<HeroTitleInfo title="Requests" overview="" properties={[]}></HeroTitleInfo>
			<Container direction="horizontal" class="flex items-center space-x-4">
				<Button type="secondary" icon={Reload} action={synchronize}>
					Syncrhonize & Enable All
				</Button>
				<Button
					type="secondary"
					icon={Pencil1}
					on:clickOrSelect={() => {
						selecting.update((v) => !v);
						if (!$selecting) episodeSelections.set(new Set());
					}}
				>
					{$selecting ? 'Done' : 'Edit'}
				</Button>
			</Container>
		</div>

		<!-- Divider -->
		<div class="h-px w-full bg-secondary-700 mt-4"></div>
	</Container>

	<div
		class="overflow-y-auto overflow-x-hidden scrollbar-hide pb-16 mx-32"
		style="backface-visibility: hidden"
	>
		{#each $tmdbSeries?.seasons ?? [] as season}
			<SeasonItem
				{season}
				episodeRequests={$requestsData?.episodeRequests}
				selecting={$selecting}
				{episodeSelections}
			/>
		{:else}
			<div class="h-ghost m-auto">
				{#if $tmdbSeriesLoading}
					Loading...
				{:else}
					Could not load series.
				{/if}
			</div>
		{/each}

		{#if $selecting}
			<EditRequests
				profiles={$requestsData?.profiles ?? []}
				requests={$requestsData?.episodeRequests ?? new Map()}
				selectedEpisodes={$episodeSelections}
				{tmdbId}
				cb={async () => {
					await seriesData.requestsData?.update();
					episodeSelections.set(new Set());
				}}
			/>
		{/if}
	</div>
</Container>
