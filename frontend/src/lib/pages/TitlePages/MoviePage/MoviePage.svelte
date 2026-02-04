<script lang="ts">
	import ComponentStack from '$lib/components/ComponentStack/ComponentStack.svelte';
	import { createBackgroundPage } from '$lib/components/GlobalBackground/BackgroundStack';
	import { movieUserDataContext } from '$lib/stores/user-data/title-user-data.store';
	import { onDestroy } from 'svelte';
	import { titlePageContext } from '../ActionsPage/actions-page';
	import MoviePageDetails from './MoviePageDetails.svelte';

	export let id: string;

	const background = createBackgroundPage({ backgroundMediaId: id, videoMediaId: id });
	const { tmdbMovie, unsubscribe } = movieUserDataContext.createContext(id);
	const { componentStack } = titlePageContext.createContext();

	componentStack.push({ component: MoviePageDetails, props: {} });

	$tmdbMovie.then(async (movie) => {
		const backgrounds =
			movie?.images?.backdrops
				?.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
				?.map((bd, i) => ({
					backdropUri: `${bd.file_path}`,
					mediaId: id
				}))
				.filter((bd) => bd.backdropUri && bd.backdropUri !== movie?.backdrop_path)
				.slice(0, 4) || [];

		background.setBackgrounds([
			{
				backdropUri: `${movie?.backdrop_path}`,
				mediaId: id
			},
			...backgrounds
		]);
	});

	onDestroy(() => {
		unsubscribe();
	});
</script>

<ComponentStack {componentStack} />
