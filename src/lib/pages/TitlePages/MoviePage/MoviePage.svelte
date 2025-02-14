<script lang="ts">
	import Container from '$components/Container.svelte';
	import { jellyfinApi } from '$lib/apis/jellyfin/jellyfin-api';
	import { radarrApi } from '$lib/apis/radarr/radarr-api';
	import { tmdbApi } from '$lib/apis/tmdb/tmdb-api';
	import Button from '$lib/components/Button.svelte';
	import TmdbCard from '$lib/components/Card/TmdbCard.svelte';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import DetachedPage from '$lib/components/DetachedPage/DetachedPage.svelte';
	import HeroCarousel from '$lib/components/HeroCarousel/HeroCarousel.svelte';
	import MMAddToRadarrDialog from '$lib/components/MediaManagerModal/MMAddToRadarrDialog.svelte';
	import MovieMediaManagerModal from '$lib/components/MediaManagerModal/RadarrMediaManagerModal.svelte';
	import { createModal } from '$lib/components/Modal/modal.store';
	import TmdbPersonCard from '$lib/components/PersonCard/TmdbPersonCard.svelte';
	import { PLATFORM_WEB, TMDB_IMAGES_ORIGINAL } from '$lib/constants';
	import { scrollIntoView } from '$lib/selectable';
	import { tmdbMovieDataStore, useRequest } from '$lib/stores/data.store';
	import { useMovieUserData } from '$lib/stores/media-user-data.store';
	import { reiverrApiNew, user } from '$lib/stores/user.store';
	import { formatMinutesToTime, formatThousands } from '$lib/utils';
	import classNames from 'classnames';
	import { Bookmark, Check, DotFilled, ExternalLink, Minus, Play, Plus } from 'radix-icons-svelte';
	import { writable } from 'svelte/store';
	import HeroTitleInfo from '../HeroTitleInfo.svelte';
	import { onDestroy } from 'svelte';

	export let id: string;
	const tmdbId = Number(id);

	// const movie = reiverrApiNew.movies.getMovieByTmdbId(id).then((r) => r.data);
	// const streams = getStreams();

	// const availableForStreaming = writable(false);

	const {
		inLibrary,
		progress,
		handleAddToLibrary,
		handleRemoveFromLibrary,
		handleAutoplay,
		handleOpenStreamSelector,
		canStream,
		isWatched,
		toggleIsWatched,
		unsubscribe
	} = useMovieUserData(id);

	// streams.forEach((p) =>
	// 	p.streams.then((s) => availableForStreaming.update((p) => p || s.length > 0))
	// );

	const { promise: tmdbMovie } = tmdbMovieDataStore.subscribe(tmdbId);
	$: recommendations = tmdbApi.getMovieRecommendations(tmdbId);
	// const { promise: jellyfinItemP } = useRequest(
	// 	(id: string) => jellyfinApi.getLibraryItemFromTmdbId(id),
	// 	id
	// );

	// function getStreams() {
	// 	const out: { source: MediaSource; streams: Promise<VideoStreamCandidateDto[]> }[] = [];

	// 	for (const source of get(sources)) {
	// 		out.push({
	// 			source: source.source,
	// 			streams: reiverrApiNew.sources
	// 				.getMovieStreams(id, source.source.id)
	// 				.then((r) => r.data?.streams ?? [])
	// 		});
	// 	}

	// 	return out;
	// }

	// const { promise: radarrItemP, send: refreshRadarrItem } = useRequest(
	// 	radarrApi.getMovieByTmdbId,
	// 	tmdbId
	// );

	// let radarrItem = radarrApi.getMovieByTmdbId(tmdbId);
	// $: radarrDownloads = getDownloads(radarrItem);
	// $: radarrFiles = getFiles(radarrItem);

	// const { requests, isFetching, data } = useActionRequests({
	// 	handleAddToRadarr: (id: number) =>
	// 		radarrApi.addMovieToRadarr(id).finally(() => refreshRadarrItem(tmdbId))
	// });

	// async function getFiles(item: typeof radarrItem) {
	// 	return item.then((item) => (item ? radarrApi.getFilesByMovieId(item?.id || -1) : []));
	// }

	let titleProperties: { href?: string; label: string }[] = [];
	$: {
		$tmdbMovie.then((movie) => {
			if (movie?.runtime) {
				titleProperties.push({
					label: formatMinutesToTime(movie.runtime)
				});
			}

			if (movie?.vote_average) {
				titleProperties.push({
					label: `${movie.vote_average.toFixed(1)} TMDB (${formatThousands(
						movie.vote_count ?? 0
					)})`,
					href: `https://www.themoviedb.org/movie/${movie.id}`
				});
			}

			if (movie?.genres) {
				titleProperties.push({
					label: movie.genres.map((g) => g.name).join(', ')
				});
			}
		});
	}

	// async function getDownloads(item: typeof radarrItem) {
	// 	return item.then((item) => (item ? radarrApi.getDownloadsById(item?.id || -1) : []));
	// }

	// function handleAddedToRadarr() {
	// 	radarrItem = radarrApi.getMovieByTmdbId(tmdbId);
	// 	radarrItem.then(
	// 		(radarrItem) =>
	// 			radarrItem && createModal(MovieMediaManagerModal, { radarrItem, onGrabRelease })
	// 	);
	// }

	// const onGrabRelease = () => setTimeout(() => (radarrDownloads = getDownloads(radarrItem)), 8000);

	// async function handleRequest() {
	// 	return radarrItem.then((radarrItem) => {
	// 		if (radarrItem) createModal(MovieMediaManagerModal, { radarrItem, onGrabRelease });
	// 		else
	// 			return $tmdbMovie.then((tmdbMovie) => {
	// 				createModal(MMAddToRadarrDialog, {
	// 					title: tmdbMovie?.title || '',
	// 					tmdbId,
	// 					backdropUri: tmdbMovie?.backdrop_path || '',
	// 					onComplete: handleAddedToRadarr
	// 				});
	// 			});
	// 	});
	// }

	// function createConfirmDeleteSeasonDialog(files: MovieFileResource[]) {
	// 	createModal(ConfirmDialog, {
	// 		header: 'Delete Season Files?',
	// 		body: `Are you sure you want to delete all ${files.length} file(s)?`, // TODO: These messages  could be better, for series too
	// 		confirm: () =>
	// 			radarrApi
	// 				.deleteFiles(files.map((f) => f.id || -1))
	// 				.then(() => (radarrFiles = getFiles(radarrItem)))
	// 	});
	// }

	// function createConfirmCancelDownloadsDialog(downloads: MovieDownload[]) {
	// 	createModal(ConfirmDialog, {
	// 		header: 'Cancel Season Downloads?',
	// 		body: `Are you sure you want to cancel all ${downloads.length} download(s)?`, // TODO: These messages  could be better, for series too
	// 		confirm: () =>
	// 			radarrApi
	// 				.cancelDownloads(downloads.map((f) => f.id || -1))
	// 				.then(() => (radarrDownloads = getDownloads(radarrItem)))
	// 	});
	// }

	// async function createStreamDetailsDialog(source: MediaSource, stream: VideoStreamCandidateDto) {
	// 	const movie = await tmdbMovie;
	// 	modalStack.create(StreamDetailsDialog, {
	// 		stream,
	// 		// title: movie?.title || '',
	// 		// subtitle: file.relativePath || '',
	// 		backgroundUrl: TMDB_BACKDROP_SMALL + movie?.backdrop_path || '',
	// 		streamMovie: () =>
	// 			movieUserData.then((userData) =>
	// 				playerState.streamMovie(id, { userData, sourceId: source.id, key: stream.key })
	// 			),
	// 		onDelete: () => (radarrFiles = getFiles(radarrItem))
	// 	});
	// }

	// async function handlePlay() {
	// 	const awaited = await Promise.all(
	// 		streams.map(async (p) => ({ ...p, streams: await p.streams }))
	// 	);

	// 	const numberOfStreams = awaited.reduce((acc, p) => acc + p.streams.length, 0);

	// 	// If more than 1 stream
	// 	if (numberOfStreams > 1) {
	// 		modalStack.create(SelectDialog, {
	// 			title: 'Select Media Source',
	// 			subtitle: 'Select the media source you want to use',
	// 			options: awaited.map((p) => p.source.id),
	// 			handleSelectOption: (sourceId) => {
	// 				const key = awaited.find((p) => p.source.id === sourceId)?.streams[0]?.key;
	// 				movieUserData.then((userData) =>
	// 					playerState.streamMovie(id, { userData, sourceId, key })
	// 				);
	// 			}
	// 		});
	// 	} else if (numberOfStreams === 1) {
	// 		const asd = awaited.find((p) => p.streams.length > 0);
	// 		const sourceId = asd?.source.id;
	// 		const key = asd?.streams[0]?.key;

	// 		movieUserData.then((userData) => playerState.streamMovie(id, { userData, sourceId, key }));
	// 	}
	// }

	onDestroy(() => {
		unsubscribe();
	});
</script>

<DetachedPage let:handleGoBack let:registrar>
	<div class="relative">
		<Container
			class="h-[calc(100vh-4rem)] flex flex-col py-16 px-32"
			on:enter={scrollIntoView({ top: 999 })}
		>
			<HeroCarousel
				urls={$tmdbMovie.then(
					(movie) =>
						movie?.images.backdrops
							?.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
							?.map((bd) => TMDB_IMAGES_ORIGINAL + bd.file_path || '')
							.slice(0, 5) || []
				)}
			>
				<Container />
				<div class="h-full flex-1 flex flex-col justify-end">
					{#await $tmdbMovie then movie}
						{#if movie}
							<!-- <div
								class={classNames(
									'text-left font-medium tracking-wider text-stone-200 hover:text-amber-200 mt-2',
									{
										'text-4xl sm:text-5xl 2xl:text-6xl': movie.title?.length || 0 < 15,
										'text-3xl sm:text-4xl 2xl:text-5xl': movie?.title?.length || 0 >= 15
									}
								)}
							>
								{movie?.title}
							</div> -->
							<HeroTitleInfo
								title={`${movie.title} (${new Date(movie.release_date ?? 0).getFullYear()})`}
								properties={titleProperties}
								overview={movie.overview ?? ''}
							/>
							<!-- <div
								class="flex items-center gap-1 uppercase text-zinc-300 font-semibold tracking-wider mt-2 text-lg"
							>
								<p class="flex-shrink-0">
									{new Date(movie.release_date || Date.now())?.getFullYear()}
								</p>
								<DotFilled />
								<p class="flex-shrink-0">
									<a href={'https://www.themoviedb.org/movie/' + movie.id}>
										{movie.vote_average?.toFixed(1)} TMDB ({formatThousands(movie.vote_count ?? 0)})
									</a>
								</p>
								<DotFilled />
								<p class="flex-shrink-0">
									{movie.genres?.map((g) => g.name).join(', ')}
								</p>
							</div> -->
							<!-- <div class="text-stone-300 font-medium line-clamp-3 opacity-75 max-w-4xl mt-4">
								{movie.overview}
							</div> -->
						{/if}
					{/await}
					<!-- {#await Promise.all([$jellyfinItemP, $radarrItemP]) then [jellyfinItem, radarrItem]} -->
					<Container
						direction="horizontal"
						class="flex mt-8"
						focusOnMount
						on:back={handleGoBack}
						on:mount={registrar}
					>
						<Button
							class="mr-4"
							action={handleAutoplay}
							secondaryAction={handleOpenStreamSelector}
							disabled={!$canStream}
						>
							Play
							<Play size={19} slot="icon" />
						</Button>
						<Button class="mr-4" on:clickOrSelect={toggleIsWatched}>
							{#if $isWatched}
								Mark as Unwatched
							{:else}
								Mark as Watched
							{/if}
							<Check slot="icon" size={19} />
						</Button>

						{#if !$inLibrary}
							<Button class="mr-4" action={handleAddToLibrary} icon={Bookmark}>
								Add to Library
							</Button>
						{:else}
							<Button class="mr-4" action={handleRemoveFromLibrary} icon={Minus}>
								Remove from Library
							</Button>
						{/if}
						<!-- <Button class="mr-4" action={handleRequest} disabled={$inLibrary === undefined}>
							Request
							<Plus size={19} slot="icon" />
						</Button> -->
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
							<Button
								class="mr-4"
								on:clickOrSelect={() =>
									window.open('https://www.themoviedb.org/movie/' + tmdbId, '_blank')}
							>
								Open In TMDB
								<ExternalLink size={19} slot="icon-after" />
							</Button>
							<Button class="mr-4">
								Open In Jellyfin
								<ExternalLink size={19} slot="icon-after" />
							</Button>
						{/if}
					</Container>
					<!-- {/await} -->
				</div>
			</HeroCarousel>
		</Container>
		<div class="relative z-10">
			<Container on:enter={scrollIntoView({ top: 0 })} class="">
				{#await $tmdbMovie then movie}
					<Carousel scrollClass="px-32" class="mb-8">
						<div slot="header">Show Cast</div>
						{#each movie?.credits?.cast?.slice(0, 15) || [] as credit}
							<TmdbPersonCard on:enter={scrollIntoView({ horizontal: 128 })} tmdbCredit={credit} />
						{/each}
					</Carousel>
				{/await}
				{#await recommendations then recommendations}
					<Carousel scrollClass="px-32" class="mb-8">
						<div slot="header">Recommendations</div>
						{#each recommendations || [] as recommendation}
							<TmdbCard item={recommendation} on:enter={scrollIntoView({ horizontal: 128 })} />
						{/each}
					</Carousel>
				{/await}
			</Container>
			{#await $tmdbMovie then movie}
				<Container class="flex-1 bg-secondary-950 pt-8 px-32" on:enter={scrollIntoView({ top: 0 })}>
					<h1 class="font-medium tracking-wide text-2xl text-zinc-300 mb-8">More Information</h1>
					<div class="text-zinc-300 font-medium text-lg flex flex-wrap">
						<div class="flex-1">
							<div class="mb-8">
								<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Directed By</h2>
								<div>
									{movie?.credits.crew
										?.filter((c) => c.job === 'Director')
										?.map((c) => c.name)
										.join(', ')}
								</div>
							</div>
							<div class="mb-8">
								<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Written By</h2>
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
								<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Languages</h2>
								<div>
									{movie?.spoken_languages?.map((language) => language.name).join(', ')}
								</div>
							</div>
							<div class="mb-8">
								<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Release Date</h2>
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

			<!-- {#if streams.length}
			<MovieStreams sources={streams} {createStreamDetailsDialog} />
		{/if} -->

			<!-- {#await Promise.all([tmdbMovie, radarrFiles, radarrDownloads]) then [movie, files, downloads]}
			{#if files?.length || downloads?.length}
				<Container
					class="flex-1 bg-secondary-950 pt-8 pb-16 px-32 flex flex-col"
					on:enter={scrollIntoView({ top: 32 })}
				>
					<h1 class="font-medium tracking-wide text-2xl text-zinc-300 mb-8">Local Files</h1>
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
											// 'bg-primary-700 focus-within:border-primary-500': selected,
											// 'bg-secondary-800 focus-within:border-zinc-300': !selected
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
											// 'bg-primary-700 focus-within:border-primary-500': selected,
											// 'bg-secondary-800 focus-within:border-zinc-300': !selected
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
									Delete All Files
								</Button>
							{/if}
							{#if downloads?.length}
								<Button on:clickOrSelect={() => createConfirmCancelDownloadsDialog(downloads)}>
									<Cross1 size={19} slot="icon" />
									Cancel All Downloads
								</Button>
							{/if}
						</Container>
					</div>
				</Container>
			{/if}
		{/await} -->
		</div>
	</div>
</DetachedPage>
