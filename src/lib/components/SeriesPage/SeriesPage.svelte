<script lang="ts">
	import Container from '../../../Container.svelte';
	import HeroCarousel from '../HeroCarousel/HeroCarousel.svelte';
	import DetachedPage from '../DetachedPage/DetachedPage.svelte';
	import { useRequest } from '../../stores/data.store';
	import { tmdbApi } from '../../apis/tmdb/tmdb-api';
	import { PLATFORM_WEB, TMDB_IMAGES_ORIGINAL } from '../../constants';
	import classNames from 'classnames';
	import { Cross1, DotFilled, ExternalLink, Play, Plus, Trash } from 'radix-icons-svelte';
	import { jellyfinApi } from '../../apis/jellyfin/jellyfin-api';
	import {
		type EpisodeDownload,
		type EpisodeFileResource,
		sonarrApi
	} from '../../apis/sonarr/sonarr-api';
	import Button from '../Button.svelte';
	import { playerState } from '../VideoPlayer/VideoPlayer';
	import { createModal, modalStack } from '../Modal/modal.store';
	import { get } from 'svelte/store';
	import { scrollIntoView, useRegistrar } from '../../selectable';
	import ScrollHelper from '../ScrollHelper.svelte';
	import Carousel from '../Carousel/Carousel.svelte';
	import TmdbPersonCard from '../PersonCard/TmdbPersonCard.svelte';
	import TmdbCard from '../Card/TmdbCard.svelte';
	import EpisodeGrid from './EpisodeGrid.svelte';
	import { formatSize } from '../../utils';
	import FileDetailsDialog from './FileDetailsDialog.svelte';
	import SonarrMediaManagerModal from '../MediaManagerModal/SonarrMediaManagerModal.svelte';
	import MMAddToSonarrDialog from '../MediaManagerModal/MMAddToSonarrDialog.svelte';
	import ConfirmDialog from '../Dialog/ConfirmDialog.svelte';
	import DownloadDetailsDialog from './DownloadDetailsDialog.svelte';
	import { _ } from 'svelte-i18n';

	export let id: string;

	const { promise: tmdbSeries, data: tmdbSeriesData } = useRequest(
		tmdbApi.getTmdbSeries,
		Number(id)
	);
	let sonarrItem = sonarrApi.getSeriesByTmdbId(Number(id));
	const { promise: recommendations } = useRequest(tmdbApi.getSeriesRecommendations, Number(id));

	$: sonarrDownloads = getDownloads(sonarrItem);
	$: sonarrFiles = getFiles(sonarrItem);
	$: sonarrSeasonNumbers = Promise.all([sonarrFiles, sonarrDownloads]).then(
		([files, downloads]) => [
			...new Set(files.map((item) => item.seasonNumber || -1)),
			...new Set(downloads.map((item) => item.seasonNumber || -1))
		]
	);
	$: sonarrEpisodes = Promise.all([sonarrItem, sonarrSeasonNumbers])
		.then(([item, seasons]) =>
			Promise.all(seasons.map((s) => sonarrApi.getEpisodes(item?.id || -1, s)))
		)
		.then((items) => items.flat());

	const jellyfinSeries = getJellyfinSeries(id);

	const jellyfinEpisodes = jellyfinSeries.then(
		(s) => (s && jellyfinApi.getJellyfinEpisodes(s.Id)) || []
	);

	const nextJellyfinEpisode = jellyfinEpisodes.then((items) =>
		items.find((i) => i.UserData?.Played === false)
	);

	const episodeCards = useRegistrar();
	let scrollTop: number;

	// let hideInterface = false;
	// modalStack.top.subscribe((modal) => {
	// 	hideInterface = !!modal;
	// });

	function getJellyfinSeries(id: string) {
		return jellyfinApi.getLibraryItemFromTmdbId(id);
	}

	const onGrabRelease = () => setTimeout(() => (sonarrDownloads = getDownloads(sonarrItem)), 8000);

	function handleAddedToSonarr() {
		sonarrItem = sonarrApi.getSeriesByTmdbId(Number(id));
		sonarrItem.then(
			(sonarrItem) =>
				sonarrItem &&
				createModal(SonarrMediaManagerModal, {
					season: 1,
					sonarrItem,
					onGrabRelease
				})
		);
	}

	async function handleRequestSeason(season: number) {
		return sonarrItem.then((sonarrItem) => {
			const tmdbSeries = get(tmdbSeriesData);
			if (sonarrItem) {
				createModal(SonarrMediaManagerModal, {
					season,
					sonarrItem,
					onGrabRelease
				});
			} else if (tmdbSeries) {
				createModal(MMAddToSonarrDialog, {
					title: tmdbSeries.name || '',
					tmdbId: tmdbSeries.id || -1,
					backdropUri: tmdbSeries.backdrop_path || '',
					onComplete: handleAddedToSonarr
				});
			} else {
				console.error('No series found');
			}
		});
	}

	async function getFiles(item: typeof sonarrItem) {
		return item.then((item) => (item ? sonarrApi.getFilesBySeriesId(item?.id || -1) : []));
	}

	async function getDownloads(item: typeof sonarrItem) {
		return item.then((item) => (item ? sonarrApi.getDownloadsBySeriesId(item?.id || -1) : []));
	}

	function createConfirmDeleteSeasonDialog(files: EpisodeFileResource[]) {
		createModal(ConfirmDialog, {
			header: 'Delete Season Files?',
			body: `Are you sure you want to delete all ${files.length} file(s) from season ${files[0]?.seasonNumber}?`,
			confirm: () =>
				sonarrApi
					.deleteSonarrEpisodes(files.map((f) => f.id || -1))
					.then(() => (sonarrFiles = getFiles(sonarrItem)))
		});
	}

	function createConfirmCancelDownloadsDialog(downloads: EpisodeDownload[]) {
		createModal(ConfirmDialog, {
			header: 'Cancel Season Downloads?',
			body: `Are you sure you want to cancel all ${downloads.length} download(s) from season ${downloads[0]?.seasonNumber}?`,
			confirm: () =>
				sonarrApi
					.cancelDownloads(downloads.map((f) => f.id || -1))
					.then(() => (sonarrDownloads = getDownloads(sonarrItem)))
		});
	}
</script>

<DetachedPage let:handleGoBack let:registrar>
	<ScrollHelper bind:scrollTop />
	<div class="relative">
		<Container
			class="h-[calc(100vh-4rem)] flex flex-col py-16 px-32"
			on:enter={scrollIntoView({ top: 0 })}
			on:navigate={({ detail }) => {
				if (detail.direction === 'down' && detail.willLeaveContainer) {
					$episodeCards?.focus();
					detail.preventNavigation();
				}
			}}
		>
			<HeroCarousel
				urls={$tmdbSeries.then(
					(series) =>
						series?.images.backdrops
							?.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
							?.map((i) => TMDB_IMAGES_ORIGINAL + i.file_path)
							.slice(0, 5) || []
				)}
			>
				<Container />
				<div class="h-full flex-1 flex flex-col justify-end">
					{#await $tmdbSeries then series}
						{#if series}
							<div
								class={classNames(
									'text-left font-medium tracking-wider text-stone-200 hover:text-amber-200 mt-2',
									{
										'text-4xl sm:text-5xl 2xl:text-6xl': series.name?.length || 0 < 15,
										'text-3xl sm:text-4xl 2xl:text-5xl': series.name?.length || 0 >= 15
									}
								)}
							>
								{series.name}
							</div>
							<div
								class="flex items-center gap-1 uppercase text-zinc-300 font-semibold tracking-wider mt-2 text-lg"
							>
								<p class="flex-shrink-0">
									{#if series.status !== 'Ended'}
									{$_('library.content.since')} {new Date(series.first_air_date || Date.now())?.getFullYear()}
									{:else}
									{$_('library.content.ended')} {new Date(series.last_air_date || Date.now())?.getFullYear()}
									{/if}
								</p>
								<!-- <DotFilled />
								<p class="flex-shrink-0">{movie.runtime}</p> -->
								<DotFilled />
								<p class="flex-shrink-0">
									<a href={'https://www.themoviedb.org/movie/' + series.id}
										>{series.vote_average} TMDB</a
									>
								</p>
							</div>
							<div
								class="text-stone-300 font-medium line-clamp-3 opacity-75 max-w-4xl mt-4 text-lg"
							>
								{series.overview}
							</div>
						{/if}
					{/await}
					{#await nextJellyfinEpisode then nextJellyfinEpisode}
						<Container
							direction="horizontal"
							class="flex mt-8"
							focusOnMount
							on:back={handleGoBack}
							on:mount={registrar}
						>
							{#if nextJellyfinEpisode}
								<Button
									class="mr-4"
									on:clickOrSelect={() =>
										nextJellyfinEpisode?.Id && playerState.streamJellyfinId(nextJellyfinEpisode.Id)}
								>
								{$_('library.LibraryItemContext.playSeason')}  {nextJellyfinEpisode?.ParentIndexNumber} Episode
									{nextJellyfinEpisode?.IndexNumber}
									<Play size={19} slot="icon" />
								</Button>
							{:else}
								<Button class="mr-4" action={() => handleRequestSeason(1)}>
									{$_('library.content.requestContent')}
									<Plus size={19} slot="icon" />
								</Button>
							{/if}

							{#if PLATFORM_WEB}
								<Button class="mr-4">
									{$_('library.LibraryItemContext.openTMDB')}
									<ExternalLink size={19} slot="icon-after" />
								</Button>
								<Button class="mr-4">
									{$_('library.LibraryItemContext.openJellyfin')}
									<ExternalLink size={19} slot="icon-after" />
								</Button>
							{/if}
						</Container>
					{/await}
				</div>
			</HeroCarousel>
		</Container>
		<div
			class={classNames('transition-opacity', {
				// 'opacity-0': hideInterface
			})}
		>
			<EpisodeGrid
				on:enter={scrollIntoView({ top: -32, bottom: 128 })}
				on:mount={episodeCards.registrar}
				id={Number(id)}
				tmdbSeries={tmdbSeriesData}
				{jellyfinEpisodes}
				currentJellyfinEpisode={nextJellyfinEpisode}
				{handleRequestSeason}
			/>
			<Container on:enter={scrollIntoView({ top: 0 })} class="pt-8">
				{#await $tmdbSeries then series}
					<Carousel scrollClass="px-32" class="mb-8">
						<div slot="header">{$_('library.content.castAndCrew')}</div>
						{#each series?.aggregate_credits?.cast?.slice(0, 15) || [] as credit}
							<TmdbPersonCard on:enter={scrollIntoView({ horizontal: 128 })} tmdbCredit={credit} />
						{/each}
					</Carousel>
				{/await}
				{#await $recommendations then recommendations}
					<Carousel scrollClass="px-32" class="mb-8">
						<div slot="header">{$_('library.content.recommendations')}</div>
						{#each recommendations || [] as recommendation}
							<TmdbCard item={recommendation} on:enter={scrollIntoView({ horizontal: 128 })} />
						{/each}
					</Carousel>
				{/await}
			</Container>
			{#await $tmdbSeries then series}
				<Container class="flex-1 bg-secondary-950 pt-8 px-32" on:enter={scrollIntoView({ top: 0 })}>
					<h1 class="font-medium tracking-wide text-2xl text-zinc-300 mb-8">{$_('library.content.moreInformations')}</h1>
					<div class="text-zinc-300 font-medium text-lg flex flex-wrap">
						<div class="flex-1">
							<div class="mb-8">
								<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">{$_('library.content.directedBy')}</h2>
								{#each series?.created_by || [] as creator}
									<div>{creator.name}</div>
								{/each}
							</div>
							<div class="mb-8">
								<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">{$_('library.content.networks')}</h2>
								<div>{series?.networks?.[0]?.name}</div>
							</div>
						</div>
						<div class="flex-1">
							<div class="mb-8">
								<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">{$_('library.content.languages')}</h2>
								<div>{series?.spoken_languages?.[0]?.name}</div>
							</div>
							<div class="mb-8">
								<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">{$_('library.content.lastAirDate')}</h2>
								<div>{series?.last_air_date}</div>
							</div>
						</div>
					</div>
				</Container>
			{/await}
			{#await Promise.all( [sonarrSeasonNumbers, sonarrFiles, sonarrEpisodes, sonarrDownloads] ) then [seasons, files, episodes, downloads]}
				{#if files?.length}
					<Container
						class="flex-1 bg-secondary-950 pt-8 pb-16 px-32 flex flex-col"
						on:enter={scrollIntoView({ top: 32 })}
					>
						<!--						<h1 class="font-medium tracking-wide text-2xl text-zinc-300 mb-8">Local Files</h1>-->
						<div class="space-y-16">
							{#each seasons as season}
								{@const seasonEpisodes = episodes.filter((e) => e.seasonNumber === season)}
								{@const seasonFiles = files.filter((f) => f.seasonNumber === season)}
								{@const seasonDownloads = downloads.filter((d) => d.seasonNumber === season)}

								<div>
									<div class="flex justify-between">
										<h2 class="font-medium tracking-wide text-2xl text-zinc-300 mb-8">
											{$_('library.content.filesSeason')} {season}
										</h2>
									</div>

									<Container direction="grid" gridCols={2} class="grid grid-cols-2 gap-8">
										{#each seasonEpisodes as episode}
											{@const file = seasonFiles.find((f) => f.id === episode.episodeFileId)}
											{@const download = seasonDownloads.find((d) => d.episodeId === episode.id)}

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
												on:clickOrSelect={() => {
													if (file)
														modalStack.create(FileDetailsDialog, {
															file,
															title: episode?.title || '',
															subtitle: `Season ${episode?.seasonNumber} Episode ${episode?.episodeNumber}`,
															backgroundUrl: episode?.images?.[0]?.remoteUrl || '',
															onDelete: () => (sonarrFiles = getFiles(sonarrItem))
														});
													else if (download)
														modalStack.create(DownloadDetailsDialog, {
															download,
															title: episode?.title || '',
															subtitle: `Season ${episode?.seasonNumber} Episode ${episode?.episodeNumber}`,
															backgroundUrl: episode?.images?.[0]?.remoteUrl || '',
															onCancel: () => (sonarrDownloads = getDownloads(sonarrItem))
														});
												}}
												on:enter={scrollIntoView({ vertical: 128 })}
												focusOnClick
											>
												{#if download}
													<div
														class="absolute inset-0 bg-secondary-50/10"
														style={`width: ${
															(((download.size || 0) - (download.sizeleft || 0)) /
																(download.size || 1)) *
															100
														}%`}
													/>
												{/if}
												<div class="flex-1">
													<h1 class="text-lg">
														{episode?.episodeNumber}. {episode?.title}
													</h1>
												</div>
												{#if file}
													<div>
														{file?.mediaInfo?.runTime}
													</div>
													<div>
														{formatSize(file?.size || 0)}
													</div>
													<div>
														{file?.quality?.quality?.name}
													</div>
												{:else if download}
													<div>
														{formatSize((download?.size || 0) - (download?.sizeleft || 1))} / {formatSize(
															download?.size || 0
														)}
													</div>
													<div>
														{download?.quality?.quality?.name}
													</div>
												{/if}
											</Container>
										{/each}
									</Container>
									<Container direction="horizontal" class="flex mt-8">
										{#if seasonFiles?.length}
											<Button on:clickOrSelect={() => createConfirmDeleteSeasonDialog(seasonFiles)}>
												<Trash size={19} slot="icon" />
												{$_('library.content.deleteFilesSeason')}
											</Button>
										{/if}
										{#if seasonDownloads?.length}
											<Button
												on:clickOrSelect={() => createConfirmCancelDownloadsDialog(seasonDownloads)}
											>
												<Cross1 size={19} slot="icon" />
												{$_('library.content.cancelFilesSeason')}
											</Button>
										{/if}
									</Container>
								</div>
							{/each}
						</div>
					</Container>
				{/if}
			{/await}
		</div>
	</div>
</DetachedPage>
