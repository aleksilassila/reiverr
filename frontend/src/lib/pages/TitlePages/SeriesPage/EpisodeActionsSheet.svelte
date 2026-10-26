<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import Container from '$lib/components/Container.svelte';
	import ConfirmDialog from '$lib/components/Dialog/ConfirmDialog.svelte';
	import { backgroundContext } from '$lib/components/GlobalBackground/background-stack.store';
	import { createModal } from '$lib/components/Modal/modal.store';
	import { Sheet } from '$lib/components/Sheet';
	import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';
	import { usePageQuery } from '$lib/queries/page-query';
	import {
		getEpisodeData,
		getEpisodeRequestStatus,
		seriesQueries,
		setEpisodesWatched,
		setEpisodeWatched
	} from '$lib/queries/series.queries';
	import { Check, Play } from 'radix-icons-svelte';
	import { playEpisode } from '../play-media';

	export let tmdbId: string;
	export let season: number;
	export let episode: number;
	export let name: string;
	export let seriesName: string;

	const componentStack = useComponentStack();
	const { playMedia } = backgroundContext.getContext();
	const tmdbSeries = usePageQuery(seriesQueries.metadata(tmdbId));
	const seriesUserData = usePageQuery(seriesQueries.userData(tmdbId));
	const status = usePageQuery(seriesQueries.status(tmdbId));

	$: episodesData = getEpisodeData($tmdbSeries.data, $seriesUserData.data);
	$: userData = episodesData.episodes.find((e) => e.season === season && e.episode === episode);
	$: seasonEpisodes = episodesData.episodes.filter((e) => e.season === season && !e.upcoming);
	$: seasonWatched = seasonEpisodes.length > 0 && seasonEpisodes.every((e) => e.watched);
	$: requestStatus = getEpisodeRequestStatus($status.data, season, episode);
	$: onDisk = requestStatus.onDisk;

	async function play() {
		componentStack.close();

		await playEpisode({
			tmdbId,
			season,
			episode,
			title: name,
			subtitle: `${seriesName} · Season ${season} Episode ${episode}`,
			progress: userData?.progress,
			playMedia: (props) => playMedia?.(props)
		});
	}

	async function setWatched(watched: boolean) {
		await setEpisodeWatched(tmdbId, season, episode, watched);
		componentStack.close();
	}

	/** The rules of the series act on what is watched, so the whole season asks first */
	function confirmSeasonWatched(watched: boolean) {
		const count = seasonEpisodes.length;
		const episodes = `${count} ${count === 1 ? 'episode' : 'episodes'}`;

		createModal(ConfirmDialog, {
			header: `Mark season ${season} as ${watched ? 'watched' : 'unwatched'}?`,
			body: watched
				? `${episodes} will be marked as watched. The request rules of the series follow the watched state: the next episodes may start downloading, and watched episodes the rules do not keep are unrequested.`
				: `${episodes} will be marked as unwatched. The request rules of the series follow the watched state: the episodes count as unwatched again for what is kept on disk and downloaded ahead.`,
			confirm: async () => {
				await setEpisodesWatched(
					tmdbId,
					seasonEpisodes.map((e) => ({ season: e.season, episode: e.episode, watched }))
				);
				componentStack.close();
			}
		});
	}
</script>

<Sheet size="lg" on:close={() => componentStack.close()}>
	<div class="text-secondary-400 font-medium text-lg">Season {season} Episode {episode}</div>
	<h1 class="h3 mb-2">{name}</h1>
	<p class="body mb-8">{requestStatus.label ?? 'Not requested'}</p>

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
		{#if seasonEpisodes.length}
			<Button icon={Check} on:clickOrSelect={() => confirmSeasonWatched(!seasonWatched)}>
				Mark Season as {seasonWatched ? 'Unwatched' : 'Watched'}
			</Button>
		{/if}
	</Container>
</Sheet>
