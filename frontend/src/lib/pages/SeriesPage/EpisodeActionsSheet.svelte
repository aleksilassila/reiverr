<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import Container from '$lib/components/Container.svelte';
	import ConfirmDialog from '$lib/components/Dialog/ConfirmDialog.svelte';
	import { backgroundContext } from '$lib/components/GlobalBackground/background-stack.store';
	import { createModal } from '$lib/components/Modal/modal.store';
	import { Sheet } from '$lib/components/Sheet';
	import StatusTags from '$lib/components/StatusTags.svelte';
	import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';
	import { playEpisode } from '$lib/play-media';
	import { downloadsQueries } from '$lib/queries/downloads.queries';
	import { libraryQueries } from '$lib/queries/library.queries';
	import { metadataQueries } from '$lib/queries/metadata.queries';
	import { usePageQuery } from '$lib/queries/page-query';
	import { requestsQueries } from '$lib/queries/requests.queries';
	import {
		setEpisodesWatched,
		setEpisodeWatched,
		userDataQueries
	} from '$lib/queries/user-data.queries';
	import { Check, Play } from 'radix-icons-svelte';
	import { getEpisodeData, getEpisodeRequestStatus } from './episode-status';

	export let tmdbId: string;
	export let season: number;
	export let episode: number;
	export let name: string;
	export let seriesName: string;

	const componentStack = useComponentStack();
	const { playMedia } = backgroundContext.getContext();
	const tmdbSeries = usePageQuery(metadataQueries.series(tmdbId));
	const seriesUserData = usePageQuery(userDataQueries.series(tmdbId));
	const requests = usePageQuery(requestsQueries.series(tmdbId));
	const status = usePageQuery(libraryQueries.seriesStatus(tmdbId));
	const torrents = usePageQuery(downloadsQueries.seriesTorrents(tmdbId));

	$: episodesData = getEpisodeData($tmdbSeries.data, $seriesUserData.data);
	$: userData = episodesData.episodes.find((e) => e.season === season && e.episode === episode);
	$: seasonEpisodes = episodesData.episodes.filter((e) => e.season === season && !e.upcoming);
	$: seasonWatched = seasonEpisodes.length > 0 && seasonEpisodes.every((e) => e.watched);
	$: requestStatus = getEpisodeRequestStatus(
		{ requests: $requests.data, status: $status.data, torrents: $torrents.data },
		season,
		episode
	);
	$: onDisk = requestStatus.onDisk;
	$: statusTags = requestStatus.tags;

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
	<div class="mb-8">
		{#if statusTags.primary || statusTags.secondary}
			<StatusTags tags={statusTags} />
			{#if statusTags.primary?.detail}
				<p class="body mt-2">{statusTags.primary.detail}</p>
			{/if}
		{:else}
			<p class="body">Not requested</p>
		{/if}
	</div>

	<Container class="flex flex-col space-y-4">
		{#if onDisk}
			<Button icon={Play} type="primary-dark" action={play} focusOnMount>Play</Button>
		{/if}
		{#if userData?.watched}
			<Button
				icon={Check}
				type="primary-dark"
				action={() => setWatched(false)}
				focusOnMount={!onDisk}
			>
				Mark as Unwatched
			</Button>
		{:else}
			<Button
				icon={Check}
				type="primary-dark"
				action={() => setWatched(true)}
				focusOnMount={!onDisk}
			>
				Mark as Watched
			</Button>
		{/if}
		{#if seasonEpisodes.length}
			<Button
				icon={Check}
				type="primary-dark"
				on:clickOrSelect={() => confirmSeasonWatched(!seasonWatched)}
			>
				Mark Season as {seasonWatched ? 'Unwatched' : 'Watched'}
			</Button>
		{/if}
	</Container>
</Sheet>
