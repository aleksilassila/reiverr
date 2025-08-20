<script lang="ts">
	import ComponentStackProvider from '$lib/components/ComponentStack/ComponentStackProvider.svelte';
	import { createBackgroundPage } from '$lib/components/GlobalBackground/BackgroundStack';
	import { TMDB_BACKDROP_SMALLEST } from '$lib/constants';
	import { seriesUserDataContext as seriesDataContext } from '$lib/stores/user-data/title-user-data.store';
	import { onDestroy } from 'svelte';
	import { titlePageContext } from '../ActionsPage/actions-page';
	import SeriesPageDetails from './SeriesPageDetails.svelte';

	export let id: string;

	const background = createBackgroundPage({ backgroundMediaId: id, videoMediaId: id });
	const { tmdbSeries, unsubscribe } = seriesDataContext.createContext(id);
	const { componentStack } = titlePageContext.createContext();

	componentStack.push({ component: SeriesPageDetails, props: {} });

	$tmdbSeries.then((series) => {
		const backgrounds =
			series?.images.backdrops
				?.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
				?.map((bd, i) => ({
					backdropUri: `${bd.file_path}`,
					mediaId: id
				}))
				.filter((bd) => bd.backdropUri && bd.backdropUri !== series?.backdrop_path)
				.slice(0, 4) || [];
		background.setBackgrounds([
			{
				backdropUri: `${series?.backdrop_path}`,
				mediaId: id
			},
			...backgrounds
		]);
	});

	onDestroy(() => {
		unsubscribe();
	});
</script>

<!-- Prefetching blurred background -->
{#if $background?.backdropUri}
	<!-- <link
		rel="prefetch"
		as="image"
		href={`${TMDB_BACKDROP_SMALLEST}${$background.backdropUri}`}
		type="image/jpeg"
	/> -->
	<img
		src={`${TMDB_BACKDROP_SMALLEST}${$background.backdropUri}`}
		alt="Background"
		loading="lazy"
		class="absolute opacity-0"
	/>
{/if}

<ComponentStackProvider {componentStack} />
