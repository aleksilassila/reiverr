<script lang="ts">
	import Container from '$lib/components/Container.svelte';
	import { backgroundContext } from '$lib/components/GlobalBackground/background-stack.store';
	import { createErrorNotification } from '$lib/components/Notifications/notification.store';
	import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';
	import { TMDB_BACKDROP_SMALLEST } from '$lib/constants';
	import { useSeriesContext } from '$lib/stores/data/series-data.store';
	import classNames from 'classnames';
	import { onDestroy } from 'svelte';
	import { readable } from 'svelte/store';
	import HeroTitleInfo from '../HeroTitleInfo.svelte';
	import SeasonItem from './SeasonItem.svelte';
	import TorrentsView from './TorrentsView.svelte';

	export let tmdbId: string;

	const REFRESH_INTERVAL = 5000;

	const componentStack = useComponentStack();
	const { background } = backgroundContext.getContext();
	const seriesData = useSeriesContext(tmdbId).getContext();
	const requests = seriesData.requestsData?.data ?? readable(undefined);
	const tmdbSeries = seriesData.seriesData?.data ?? readable(undefined);
	const tmdbSeriesLoading = seriesData.seriesData?.isLoading ?? readable(false);

	// Download progress changes without the user doing anything
	const refresh = setInterval(() => seriesData.requestsData?.update(), REFRESH_INTERVAL);
	onDestroy(() => clearInterval(refresh));
</script>

<div class="fixed inset-0 scale-110 z-[-1]">
	<div
		class="absolute inset-0 bg-secondary-900 bg-center bg-cover bg-no-repeat blur-md brightness-[0.2] saturate-50"
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
	<div class="mx-32 mt-16">
		<HeroTitleInfo
			title="Requests"
			overview=""
			properties={[{ label: 'Select to request' }, { label: 'Right to choose a torrent' }]}
		/>

		<!-- Divider -->
		<div class="h-px w-full bg-secondary-700 mt-4"></div>
	</div>

	<div
		class="overflow-y-auto overflow-x-hidden scrollbar-hide pb-16 mx-32"
		style="backface-visibility: hidden"
	>
		{#each $tmdbSeries?.seasons ?? [] as season (season.season_number)}
			<SeasonItem
				{season}
				requests={$requests}
				on:request={({ detail }) =>
					seriesData
						.setRequested?.(detail.episodes, detail.requested)
						.catch((e) =>
							createErrorNotification(
								'Could not update the request',
								e?.response?.data?.message ?? e?.message
							)
						)}
				on:torrents={({ detail }) =>
					componentStack.push({ component: TorrentsView, props: { tmdbId, ...detail } })}
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
	</div>
</Container>
