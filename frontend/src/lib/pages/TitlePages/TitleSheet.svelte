<script lang="ts">
	import type { TmdbEpisode, TmdbSeries } from '$lib/apis/tmdb/tmdb-api';
	import Button from '$lib/components/Button/Button.svelte';
	import LazyImg from '$lib/components/LazyImg.svelte';
	import { Sheet } from '$lib/components/Sheet';
	import { TMDB_BACKDROP_SMALL } from '$lib/constants';
	import { componentStackContext } from '$lib/stores/component-stack.store';
	import { useIsWatched } from '$lib/stores/user-data/is-watched.store';
	import {
		type EpisodeUserData,
		TITLE_USER_DATA_CONTEXT,
		type TitleUserData
	} from '$lib/stores/user-data/title-user-data.store';
	import { reiverrApi } from '$lib/stores/user.store';
	import { Check, Cross1, Gear, Play } from 'radix-icons-svelte';
	import { getContext } from 'svelte';
	import { writable } from 'svelte/store';
	import StreamListMenu from './ActionsPage/StreamListMenu.svelte';
	import ButtonSpinner from '$lib/components/Button/ButtonSpinner.svelte';

	export let series: TmdbSeries;
	export let episode: TmdbEpisode;

	export let handleClose: () => void;
	// export let handleStream: (opts: { series: TmdbSeries; episode: TmdbEpisode }) => Promise<void>;
	export let handleMarkAsWatched: (opts: {
		series: TmdbSeries;
		episode: TmdbEpisode;
	}) => Promise<void>;

	const componentStack = componentStackContext.getContext();

	// export let imgUrl: string;

	// export let title: string;
	// export let subtitle: string;

	const { episodesUserData } = getContext<TitleUserData>(TITLE_USER_DATA_CONTEXT);
	const episodeUserData = writable<EpisodeUserData | undefined>();
	$: {
		episodeUserData.set(
			$episodesUserData.find(
				(e) => e.season === episode.season_number && e.episode === episode.episode_number
			)
		);
	}

	const { isWatched, toggleIsWatched } = useIsWatched({
		userData: episodeUserData,
		toggleFn: (userId, watched) =>
			reiverrApi.users
				.updateEpisodePlayStateByTmdbId(
					userId,
					String(series.id),
					episode.season_number ?? 0,
					episode.episode_number ?? 0,
					{
						watched
					}
				)
				.finally(() => {
					episodesUserData.update((eds) => {
						const ed = eds.find(
							(e) => e.season === episode.season_number && e.episode === episode.episode_number
						);
						if (ed) ed.watched = watched;

						return eds;
					});
				})
	});

	$: imgUrl =
		episode.still_path || series.backdrop_path
			? TMDB_BACKDROP_SMALL + (episode.still_path || series.backdrop_path)
			: '';

	// export let handleStream: () => Promise<void>;

	// function handleClose() {
	// 	modalStack.closeTopmost();
	// }

	async function handleStream() {
		console.log('Stream clicked');
		const { data } = await reiverrApi.sources.getTmdbEpisodeMedia({
			tmdbId: `${series.id}`,
			season: episode.season_number ?? 0,
			episode: episode.episode_number ?? 0
		});

		componentStack.push({
			component: StreamListMenu,
			props: { items: data.items, series, episode }
		});
	}
</script>

<Sheet on:close={handleClose} size="md">
	<div class="space-y-6">
		<div class="rounded-xl overflow-hidden">
			<LazyImg src={imgUrl} />
		</div>

		<div>
			<h2 class="h3">{episode.name ?? series.name ?? ''}</h2>
			<p class="body">{`Season ${episode.season_number} Episode ${episode.episode_number}`}</p>
		</div>

		<div class="flex flex-col space-y-2">
			<Button
				type="primary-dark"
				action={async () => {
					await handleStream();
					handleClose();
				}}
				let:loading
			>
				<ButtonSpinner {loading} class="mr-1">
					<Play size={24} />
				</ButtonSpinner>
				Stream
			</Button>

			<Button type="primary-dark" action={() => toggleIsWatched()} let:loading>
				{#if $isWatched}
					<ButtonSpinner {loading} class="mr-1">
						<Cross1 size={24} />
					</ButtonSpinner>
					Mark as Unwatched
				{:else}
					<ButtonSpinner {loading} class="mr-1">
						<Check size={24} />
					</ButtonSpinner>
					Mark as Watched
				{/if}
			</Button>

			<Button type="primary-dark" action={() => handleMarkAsWatched({ series, episode })} disabled>
				<Gear size={24} class="mr-1" />
				Manage
			</Button>
		</div>
	</div>
</Sheet>
