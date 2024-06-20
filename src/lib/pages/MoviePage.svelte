<script lang="ts">
	import Container from '../../Container.svelte';
	import HeroCarousel from '../components/HeroCarousel/HeroCarousel.svelte';
	import { tmdbApi } from '../apis/tmdb/tmdb-api';
	import { PLATFORM_WEB, TMDB_IMAGES_ORIGINAL } from '../constants';
	import classNames from 'classnames';
	import {
		Cross1,
		DotFilled,
		Download,
		ExternalLink,
		File,
		Play,
		Plus,
		Trash
	} from 'radix-icons-svelte';
	import Button from '../components/Button.svelte';
	import { jellyfinApi } from '../apis/jellyfin/jellyfin-api';
	import { type MovieDownload, type MovieFileResource, radarrApi } from '../apis/radarr/radarr-api';
	import { useActionRequests, useRequest } from '../stores/data.store';
	import DetachedPage from '../components/DetachedPage/DetachedPage.svelte';
	import { createModal, modalStack } from '../components/Modal/modal.store';
	import { playerState } from '../components/VideoPlayer/VideoPlayer';
	import { scrollIntoView } from '../selectable';
	import Carousel from '../components/Carousel/Carousel.svelte';
	import TmdbPersonCard from '../components/PersonCard/TmdbPersonCard.svelte';
	import TmdbCard from '../components/Card/TmdbCard.svelte';
	import MovieMediaManagerModal from '../components/MediaManagerModal/RadarrMediaManagerModal.svelte';
	import MMAddToRadarrDialog from '../components/MediaManagerModal/MMAddToRadarrDialog.svelte';
	import FileDetailsDialog from '../components/SeriesPage/FileDetailsDialog.svelte';
	import DownloadDetailsDialog from '../components/SeriesPage/DownloadDetailsDialog.svelte';
	import { capitalize, formatSize } from '../utils';
	import ConfirmDialog from '../components/Dialog/ConfirmDialog.svelte';
	import { TMDB_BACKDROP_SMALL } from '../constants.js';
	import { _ } from 'svelte-i18n';

	export let id: string;
	const tmdbId = Number(id);

	const tmdbMovie = tmdbApi.getTmdbMovie(tmdbId);
	$: recommendations = tmdbApi.getMovieRecommendations(tmdbId);
	const { promise: jellyfinItemP } = useRequest(
		(id: string) => jellyfinApi.getLibraryItemFromTmdbId(id),
		id
	);
	const { promise: radarrItemP, send: refreshRadarrItem } = useRequest(
		radarrApi.getMovieByTmdbId,
		tmdbId
	);

	let radarrItem = radarrApi.getMovieByTmdbId(tmdbId);
	$: radarrDownloads = getDownloads(radarrItem);
	$: radarrFiles = getFiles(radarrItem);

	const { requests, isFetching, data } = useActionRequests({
		handleAddToRadarr: (id: number) =>
			radarrApi.addMovieToRadarr(id).finally(() => refreshRadarrItem(tmdbId))
	});

	async function getFiles(item: typeof radarrItem) {
		return item.then((item) => (item ? radarrApi.getFilesByMovieId(item?.id || -1) : []));
	}

	async function getDownloads(item: typeof radarrItem) {
		return item.then((item) => (item ? radarrApi.getDownloadsById(item?.id || -1) : []));
	}

	function handleAddedToRadarr() {
		radarrItem = radarrApi.getMovieByTmdbId(tmdbId);
		radarrItem.then(
			(radarrItem) =>
				radarrItem && createModal(MovieMediaManagerModal, { radarrItem, onGrabRelease })
		);
	}

	const onGrabRelease = () => setTimeout(() => (radarrDownloads = getDownloads(radarrItem)), 8000);

	async function handleRequest() {
		return radarrItem.then((radarrItem) => {
			if (radarrItem) createModal(MovieMediaManagerModal, { radarrItem, onGrabRelease });
			else
				return tmdbMovie.then((tmdbMovie) => {
					createModal(MMAddToRadarrDialog, {
						title: tmdbMovie?.title || '',
						tmdbId,
						backdropUri: tmdbMovie?.backdrop_path || '',
						onComplete: handleAddedToRadarr
					});
				});
		});
	}

	function createConfirmDeleteSeasonDialog(files: MovieFileResource[]) {
		createModal(ConfirmDialog, {
			header: $_('library.content.confirmDeleteSeasonHeader'),
			body: $_('library.content.confirmDeleteSeasonBody', { count: files.length }),
			confirm: () =>
				radarrApi
					.deleteFiles(files.map((f) => f.id || -1))
					.then(() => (radarrFiles = getFiles(radarrItem)))
		});
	}

	function createConfirmCancelDownloadsDialog(downloads: MovieDownload[]) {
		createModal(ConfirmDialog, {
			header: $_('library.content.confirmCancelDownloadsHeader'),
			body: $_('library.content.confirmCancelDownloadsBody', { count: downloads.length }),
			confirm: () =>
				radarrApi
					.cancelDownloads(downloads.map((f) => f.id || -1))
					.then(() => (radarrDownloads = getDownloads(radarrItem)))
		});
	}
</script>

<DetachedPage let:handleGoBack let:registrar>
	<div class="relative">
		<Container
			class="h-[calc(100vh-4rem)] flex flex-col py-16 px-32"
			on:enter={scrollIntoView({ top: 999 })}
		>
			<HeroCarousel
				urls={tmdbMovie.then(
					(movie) =>
						movie?.images.backdrops
							?.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
							?.map((bd) => TMDB_IMAGES_ORIGINAL + bd.file_path || '')
							.slice(0, 5) || []
				)}
			>
				<Container />
				<div class="h-full flex-1 flex flex-col justify-end">
					{#await tmdbMovie then movie}
						{#if movie}
							<div
								class={classNames(
									'text-left font-medium tracking-wider text-stone-200 hover:text-amber-200 mt-2',
									{
										'text-4xl sm:text-5xl 2xl:text-6xl': movie.title?.length || 0 < 15,
										'text-3xl sm:text-4xl 2xl:text-5xl': movie?.title?.length || 0 >= 15
									}
								)}
							>
								{movie?.title}
							</div>
							<div
								class="flex items-center gap-1 uppercase text-zinc-300 font-semibold tracking-wider mt-2 text-lg"
							>
								<p class="flex-shrink-0">
									{new Date(movie.release_date || Date.now())?.getFullYear()}
								</p>
								<!-- <DotFilled />
								<p class="flex-shrink-0">{movie.runtime}</p> -->
								<DotFilled />
								<p class="flex-shrink-0">
									<a href={'https://www.themoviedb.org/movie/' + movie.id}
										>{movie.vote_average?.toFixed(1)} TMDB</a
									>
								</p>
							</div>
							<div class="text-stone-300 font-medium line-clamp-3 opacity-75 max-w-4xl mt-4">
								{movie.overview}
							</div>
						{/if}
					{/await}
					{#await Promise.all([$jellyfinItemP, $radarrItemP]) then [jellyfinItem, radarrItem]}
						<Container
							direction="horizontal"
							class="flex mt-8"
							focusOnMount
							on:back={handleGoBack}
							on:mount={registrar}
						>
							{#if jellyfinItem}
								<Button
									class="mr-4"
									on:clickOrSelect={() =>
										jellyfinItem.Id && playerState.streamJellyfinId(jellyfinItem.Id)}
								>
									{$_('library.content.play')}
									<Play size={19} slot="icon" />
								</Button>
							{/if}
							<Button class="mr-4" action={handleRequest}>
								{$_('library.content.requestContent')}
								<Plus size={19} slot="icon" />
							</Button>
								<!--{#if radarrItem}-->
							<!--	<Button class="mr-4" on:clickOrSelect={() => openMovieMediaManager(Number(id))}>-->
							<!--		{#if jellyfinItem}-->
							<!--			Manage Media-->
							<!--		{:else}-->
							<!--			Request-->
							<!--		{/if}-->
							<!--		<svelte:component this={jellyfinItem ? File : Download} size={19} slot="icon" />-->
							<!--	</Button>-->
							<!--{:else}-->
							<!--	<Button-->
							<!--		class="mr-4"-->
							<!--		on:clickOrSelect={() => requests.handleAddToRadarr(Number(id))}-->
							<!--		disabled={$isFetching.handleAddToRadarr}-->
							<!--	>-->
							<!--		Add to Radarr-->
							<!--		<Plus slot="icon" size={19} />-->
							<!--	</Button>-->
							<!--{/if}-->
							{#if PLATFORM_WEB}
								<Button class="mr-4">
									{$_('library.content.openInTMDB')}
									<ExternalLink size={19} slot="icon-after" />
								</Button>
								<Button class="mr-4">
									{$_('library.content.openInJellyfin')}
									<ExternalLink size={19} slot="icon-after" />
								</Button>
							{/if}
						</Container>
					{/await}
				</div>
			</HeroCarousel>
		</Container>
		<Container on:enter={scrollIntoView({ top: 0 })} class="">
			{#await tmdbMovie then movie}
				<Carousel scrollClass="px-32" class="mb-8">
					<div slot="header">{$_('library.content.castAndCrew')}</div>
					{#each movie?.credits?.cast?.slice(0, 15) || [] as credit}
						<TmdbPersonCard on:enter={scrollIntoView({ horizontal: 128 })} tmdbCredit={credit} />
					{/each}
				</Carousel>
			{/await}
			{#await recommendations then recommendations}
				<Carousel scrollClass="px-32" class="mb-8">
					<div slot="header">{$_('library.content.recommendations')}</div>
					{#each recommendations || [] as recommendation}
						<TmdbCard item={recommendation} on:enter={scrollIntoView({ horizontal: 128 })} />
					{/each}
				</Carousel>
			{/await}
		</Container>
		{#await tmdbMovie then movie}
			<Container class="flex-1 bg-secondary-950 pt-8 px-32" on:enter={scrollIntoView({ top: 0 })}>
				<h1 class="font-medium tracking-wide text-2xl text-zinc-300 mb-8">{$_('library.content.moreInformation')}</h1>
				<div class="text-zinc-300 font-medium text-lg flex flex-wrap">
					<div class="flex-1">
						<div class="mb-8">
							<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">{$_('library.content.directedBy')}</h2>
							<div>
								{movie?.credits.crew
									?.filter((c) => c.job === 'Director')
									?.map((c) => c.name)
									.join(', ')}
							</div>
						</div>
						<div class="mb-8">
							<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">{$_('library.content.writtenBy')}</h2>
							<div>
								{movie?.credits.crew
									?.filter((c) => c.job === 'Writer')
									?.map((c) => c.name)
									.join(', ')}
							</div>
						</div>
					</div>
					<div class="flex-1">
						<div class="mb-8">
							<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">{$_('library.content.languages')}</h2>
							<div>
								{movie?.spoken_languages?.map((language) => language.name).join(', ')}
							</div>
						</div>
						<div class="mb-8">
							<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">{$_('library.content.releaseDate')}</h2>
							<div>
								{new Date(movie?.release_date || 0).toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'short',
									day: 'numeric'
								})}
							</div>
						</div>
					</div>
				</div>
			</Container>
		{/await}
		{#await Promise.all([tmdbMovie, radarrFiles, radarrDownloads]) then [movie, files, downloads]}
			{#if files?.length || downloads?.length}
				<Container
					class="flex-1 bg-secondary-950 pt-8 pb-16 px-32 flex flex-col"
					on:enter={scrollIntoView({ top: 32 })}
				>
					<h1 class="font-medium tracking-wide text-2xl text-zinc-300 mb-8">{$_('library.content.localFiles')}</h1>
					<div class="space-y-8">
						<Container direction="grid" gridCols={2} class="grid grid-cols-2 gap-8">
							{#each downloads as download}
								<Container
									class={classNames(
										'flex space-x-8 items-center text-zinc-300 font-medium relative overflow-hidden',
										'px-8 py-4 border-2 border-transparent rounded-xl',
										{
											'bg-secondary-800 focus-within:bg-primary-700 focus-within:border-primary-500': true,
											'hover:bg-primary-700 hover:border-primary-500 cursor-pointer': true
										}
									)}
									on:clickOrSelect={() =>
										modalStack.create(DownloadDetailsDialog, {
											download,
											title: movie?.title || '',
											subtitle: download.title || '',
											backgroundUrl: TMDB_BACKDROP_SMALL + movie?.backdrop_path || '',
											onCancel: () => (radarrDownloads = getDownloads(radarrItem))
										})}
									on:enter={scrollIntoView({ vertical: 128 })}
									focusOnClick
								>
									<div
										class="absolute inset-0 bg-secondary-50/10"
										style={`width: ${
											(((download.size || 0) - (download.sizeleft || 0)) / (download.size || 1)) *
											100
										}%`}
									/>
									<div class="flex-1">
										<h1 class="text-lg">
											{capitalize(download.status || movie?.title || '')}
										</h1>
									</div>

									<div>
										{formatSize((download?.size || 0) - (download?.sizeleft || 1))} / {formatSize(
											download?.size || 0
										)}
									</div>
									<div>
										{download?.quality?.quality?.name}
									</div>
								</Container>
							{/each}
							{#each files as file}
								<Container
									class={classNames(
										'flex space-x-8 items-center text-zinc-300 font-medium relative overflow-hidden',
										'px-8 py-4 border-2 border-transparent rounded-xl',
										{
											'bg-secondary-800 focus-within:bg-primary-700 focus-within:border-primary-500': true,
											'hover:bg-primary-700 hover:border-primary-500 cursor-pointer': true
										}
									)}
									on:clickOrSelect={() =>
										modalStack.create(FileDetailsDialog, {
											file,
											title: movie?.title || '',
											subtitle: file.relativePath || '',
											backgroundUrl: TMDB_BACKDROP_SMALL + movie?.backdrop_path || '',
											onDelete: () => (radarrFiles = getFiles(radarrItem))
										})}
									on:enter={scrollIntoView({ vertical: 128 })}
									focusOnClick
								>
									<div class="flex-1">
										<h1 class="text-lg">
											{file?.quality?.quality?.name}
										</h1>
									</div>
									<div>
										{file?.mediaInfo?.runTime}
									</div>
									<div>
										{formatSize(file?.size || 0)}
									</div>
								</Container>
							{/each}
						</Container>
						<Container direction="horizontal" class="flex mt-0">
							{#if files?.length}
								<Button on:clickOrSelect={() => createConfirmDeleteSeasonDialog(files)}>
									<Trash size={19} slot="icon" />
									{$_('library.content.deleteAllFiles')}
								</Button>
							{/if}
							{#if downloads?.length}
								<Button on:clickOrSelect={() => createConfirmCancelDownloadsDialog(downloads)}>
									<Cross1 size={19} slot="icon" />
									{$_('library.content.cancelAllDownloads')}
								</Button>
							{/if}
						</Container>
					</div>
				</Container>
			{/if}
		{/await}
	</div>
</DetachedPage>
