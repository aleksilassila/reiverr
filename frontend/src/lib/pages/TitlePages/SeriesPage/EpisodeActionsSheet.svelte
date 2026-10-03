<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import Container from '$lib/components/Container.svelte';
	import { backgroundContext } from '$lib/components/GlobalBackground/background-stack.store';
	import { Sheet } from '$lib/components/Sheet';
	import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';
	import { getEpisodeRequestStatus, useSeriesContext } from '$lib/stores/data/series-data.store';
	import { Check, Play } from 'radix-icons-svelte';
	import { readable } from 'svelte/store';
	import { playEpisode } from '../play-episode';

	export let tmdbId: string;
	export let season: number;
	export let episode: number;
	export let name: string;
	export let seriesName: string;

	const componentStack = useComponentStack();
	const { playMedia } = backgroundContext.getContext();
	const seriesData = useSeriesContext(tmdbId).getContext();
	const requests = seriesData.requestsData?.data ?? readable(undefined);
	const episodesData = seriesData.episodesData ?? readable(undefined);

	$: userData = $episodesData?.episodes.find((e) => e.season === season && e.episode === episode);
	$: status = getEpisodeRequestStatus($requests, season, episode);
	$: onDisk = status.onDisk;

	async function play() {
		componentStack.close();

		await playEpisode({
			tmdbId,
			season,
			episode,
			title: name,
			subtitle: `${seriesName} · Season ${season} Episode ${episode}`,
			progress: userData?.progress,
			playMedia: (props) => playMedia?.(props),
			onProgressSaved: seriesData.setStale
		});
	}

	async function setWatched(watched: boolean) {
		await seriesData.setEpisodeWatched?.(season, episode, watched);
		componentStack.close();
	}
</script>

<Sheet size="lg" on:close={() => componentStack.close()}>
	<div class="text-secondary-400 font-medium text-lg">Season {season} Episode {episode}</div>
	<h1 class="h3 mb-2">{name}</h1>
	<p class="body mb-8">{status.label ?? 'Not requested'}</p>

	<Container class="flex flex-col space-y-4">
		{#if onDisk}
			<Button icon={Play} action={play} focusOnMount>Play</Button>
		{/if}
		{#if userData?.watched}
			<Button icon={Check} action={() => setWatched(false)} focusOnMount={!onDisk}>
				Mark as Unwatched
			</Button>
		{:else}
			<Button icon={Check} action={() => setWatched(true)} focusOnMount={!onDisk}>
				Mark as Watched
			</Button>
		{/if}
	</Container>
</Sheet>
