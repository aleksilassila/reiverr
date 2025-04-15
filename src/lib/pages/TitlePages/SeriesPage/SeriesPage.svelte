<script lang="ts">
	import ComponentStack from '$lib/components/ComponentStack/ComponentStack.svelte';
	import {
		createBackgroundPage,
		topBackground
	} from '$lib/components/GlobalBackground/BackgroundStack';
	import { seriesUserDataContext as seriesDataContext } from '$lib/stores/user-data/title-user-data.store';
	import { onDestroy } from 'svelte';
	import { titlePageContext } from '../ActionsPage/actions-page';
	import SeriesPageDetails from './SeriesPageDetails.svelte';
	import { TMDB_BACKDROP_SMALLEST } from '$lib/constants';

	export let id: string;

	const background = createBackgroundPage({ backgroundMediaId: id, videoMediaId: id });
	const { tmdbSeries, unsubscribe } = seriesDataContext.createContext(id);
	const { componentStack } = titlePageContext.createContext();

	componentStack.create(SeriesPageDetails, {});

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

<ComponentStack {componentStack} />
