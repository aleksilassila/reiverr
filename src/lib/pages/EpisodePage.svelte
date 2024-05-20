<script lang="ts">
	import Container from '../../Container.svelte';
	import { tmdbApi } from '../apis/tmdb/tmdb-api';
	import DetachedPage from '../components/DetachedPage/DetachedPage.svelte';
	import { useActionRequest, useDependantRequest, useRequest } from '../stores/data.store';
	import { PLATFORM_WEB, TMDB_IMAGES_ORIGINAL } from '../constants';
	import classNames from 'classnames';
	import {
		Check,
		DotFilled,
		Download,
		ExternalLink,
		File,
		Play,
		Plus,
		Trash
	} from 'radix-icons-svelte';
	import HeroInfoTitle from '../components/HeroInfo/HeroInfoTitle.svelte';
	import Button from '../components/Button.svelte';
	import { jellyfinApi } from '../apis/jellyfin/jellyfin-api';
	import { playerState } from '../components/VideoPlayer/VideoPlayer';
	import { formatSize, timeout } from '../utils';
	import { tick } from 'svelte';
	import { createModal, openEpisodeMediaManager } from '../components/Modal/modal.store';
	import ButtonGhost from '../components/Ghosts/ButtonGhost.svelte';
	import {
		type EpisodeFileResource,
		sonarrApi,
		type SonarrEpisode,
		type SonarrSeries
	} from '../apis/sonarr/sonarr-api';
	import MMAddToSonarrDialog from '../components/MediaManagerModal/MMAddToSonarrDialog.svelte';
	import SeasonMediaManagerModal from '../components/MediaManagerModal/SeasonMediaManagerModal.svelte';
	import ConfirmDialog from '../components/Dialog/ConfirmDialog.svelte';

	export let id: string; // Series ID
	export let season: string;
	export let episode: string;

	let isWatched = false;

	const tmdbEpisode = tmdbApi.getEpisode(Number(id), Number(season), Number(episode));
	let sonarrItem = sonarrApi.getSeriesByTmdbId(Number(id));
	$: sonarrEpisode = getSonarrEpisode(sonarrItem);
	let sonarrFiles = getFiles(sonarrItem, sonarrEpisode);

	const jellyfinSeries = jellyfinApi.getLibraryItemFromTmdbId(id);
	let jellyfinEpisode = jellyfinSeries.then((series) =>
		jellyfinApi.getEpisode(series?.Id || '', Number(season), Number(episode))
	);

	const { send: toggleMarkAs, isFetching: markAsLoading } = useActionRequest(async () => {
		const episode = await jellyfinEpisode;

		const jellyfinId = episode?.Id;
		if (!jellyfinId) return;

		if (isWatched) {
			return jellyfinApi.markAsUnwatched(jellyfinId).then((ok) => (isWatched = !ok));
		} else {
			return jellyfinApi.markAsWatched(jellyfinId).then((ok) => (isWatched = ok));
		}
	});

	jellyfinEpisode.then((e) => {
		isWatched = e?.UserData?.Played || false;
	});

	async function getSonarrEpisode(sonarrItem: Promise<SonarrSeries | undefined>) {
		return sonarrItem.then((sonarrItem) => {
			if (!sonarrItem?.id) return;

			return sonarrApi
				.getEpisodes(sonarrItem.id, Number(season))
				.then((episodes) => episodes.find((e) => e.episodeNumber === Number(episode)));
		});
	}

	function handleRequestEpisode() {
		return Promise.all([sonarrEpisode, tmdbEpisode]).then(([sonarrEpisode, tmdbEpisode]) => {
			if (sonarrEpisode) {
				createModal(SeasonMediaManagerModal, {
					sonarrItem: sonarrEpisode,
					onGrabRelease: () => {} // TODO
				});
			} else if (tmdbEpisode) {
				createModal(MMAddToSonarrDialog, {
					tmdbId: Number(id),
					backdropUri: tmdbEpisode.still_path || '',
					title: tmdbEpisode.name || '',
					onComplete: () => (sonarrItem = sonarrApi.getSeriesByTmdbId(Number(id)))
				});
			} else {
				console.error('No series found');
			}
		});
	}

	function createConfirmDeleteFiles(files: EpisodeFileResource[]) {
		createModal(ConfirmDialog, {
			header: 'Delete Season Files?',
			body: `Are you sure you want to delete all ${files.length} file(s)?`,
			confirm: () =>
				sonarrApi
					.deleteSonarrEpisodes(files.map((f) => f.id || -1))
					.then(() => (sonarrFiles = getFiles(sonarrItem, sonarrEpisode)))
		});
	}

	function getFiles(
		sonarrItem: Promise<SonarrSeries | undefined>,
		sonarrEpisode: Promise<SonarrEpisode | undefined>
	) {
		return Promise.all([sonarrItem, sonarrEpisode]).then(([sonarrItem, sonarrEpisode]) => {
			if (!sonarrItem?.id) return [];
			return sonarrApi
				.getFilesBySeriesId(sonarrItem.id)
				.then((files) => files.filter((f) => sonarrEpisode?.episodeFileId === f.id));
		});
	}
</script>

<DetachedPage let:handleGoBack let:registrar>
	{#await tmdbEpisode then tmdbEpisode}
		<div
			class="bg-center bg-cover absolute inset-x-0 h-screen -z-10"
			style={`background-image: url('${TMDB_IMAGES_ORIGINAL + tmdbEpisode?.still_path}')`}
		/>
		<div class="absolute inset-0 flex flex-col -z-10">
			<div class="h-screen bg-gradient-to-b from-transparent to-secondary-900" />
			<div class="flex-1 bg-secondary-500" />
		</div>

		<!-- <HeroCarousel /> -->

		<Container
			on:back={handleGoBack}
			on:mount={registrar}
			focusOnMount
			class="h-screen flex flex-col justify-end mx-32 py-16"
		>
			<div class="mt-2 text-zinc-200 font-medium text-lg tracking-wider">
				Season {tmdbEpisode?.season_number} Episode {tmdbEpisode?.episode_number}
			</div>
			<HeroInfoTitle title={tmdbEpisode?.name} />
			<div
				class="flex items-center gap-1 uppercase text-zinc-300 font-semibold tracking-wider mt-2 text-lg"
			>
				<!--				<p class="flex-shrink-0">-->
				<!--{#if series.status !== 'Ended'}-->
				<!--	Since {new Date(series.first_air_date || Date.now())?.getFullYear()}-->
				<!--{:else}-->
				<!--	Ended {new Date(series.last_air_date || Date.now())?.getFullYear()}-->
				<!--{/if}-->
				<!--				</p>-->
				<!-- <DotFilled /> -->
				<p class="flex-shrink-0">
					<a href={'https://www.themoviedb.org/movie/' + tmdbEpisode?.id}>
						{tmdbEpisode?.vote_average} TMDB
					</a>
				</p>
				<DotFilled />
				<p class="flex-shrink-0">{tmdbEpisode?.runtime} Minutes</p>

				{#await jellyfinEpisode then episode}
					{#if episode?.MediaSources?.[0]?.Size}
						<DotFilled />
						<p class="flex-shrink-0">{formatSize(episode?.MediaSources?.[0]?.Size)}</p>
					{/if}
					{#if episode?.MediaSources?.[0]?.MediaStreams?.[0]?.DisplayTitle}
						<DotFilled />
						<p class="flex-shrink-0">
							{episode?.MediaSources?.[0]?.MediaStreams?.[0]?.DisplayTitle}
						</p>
					{/if}
				{/await}
			</div>
			<div class="text-stone-300 font-medium line-clamp-3 opacity-75 max-w-4xl mt-4">
				{tmdbEpisode?.overview}
			</div>
			<Container direction="horizontal" class="flex mt-8 space-x-4">
				{#await Promise.all([jellyfinEpisode, sonarrEpisode])}
					<ButtonGhost>Play</ButtonGhost>
					<ButtonGhost>Manage Media</ButtonGhost>
					<ButtonGhost>Delete Files</ButtonGhost>
				{:then [jellyfinEpisode]}
					{#if jellyfinEpisode?.MediaSources?.length}
						<Button
							on:clickOrSelect={() =>
								jellyfinEpisode?.Id && playerState.streamJellyfinId(jellyfinEpisode.Id)}
						>
							Play
							<Play size={19} slot="icon" />
						</Button>
						<Button disabled={$markAsLoading} on:clickOrSelect={toggleMarkAs}>
							{#if isWatched}
								Mark as Unwatched
							{:else}
								Mark as Watched
							{/if}
							<Check slot="icon" size={19} />
						</Button>
					{:else}
						<Button action={handleRequestEpisode}>
							Request
							<Plus size={19} slot="icon" />
						</Button>
					{/if}
				{/await}
				<!--				<Button-->
				<!--					on:clickOrSelect={() =>-->
				<!--						openEpisodeMediaManager(Number(id), Number(season), Number(episode))}-->
				<!--					>Manage Media <File slot="icon" size={19} /></Button-->
				<!--				>-->
				{#await sonarrFiles then files}
					{#if files?.length}
						<Button on:clickOrSelect={() => createConfirmDeleteFiles(files)}
							>Delete Files <Trash slot="icon" size={19} /></Button
						>
					{/if}
				{/await}

				{#if PLATFORM_WEB}
					<Button>
						Open In TMDB
						<ExternalLink size={19} slot="icon-after" />
					</Button>
					<Button>
						Open In Jellyfin
						<ExternalLink size={19} slot="icon-after" />
					</Button>
				{/if}
			</Container>
		</Container>
	{/await}
</DetachedPage>
