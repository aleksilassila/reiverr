<script lang="ts">
	import Container from '../../../Container.svelte';
	import HeroCarousel from '../HeroCarousel/HeroCarousel.svelte';
	import DetachedPage from '../DetachedPage/DetachedPage.svelte';
	import { useActionRequest, useDependantRequest, useRequest } from '../../stores/data.store';
	import { tmdbApi, type TmdbSeasonEpisode } from '../../apis/tmdb/tmdb-api';
	import { PLATFORM_WEB, TMDB_IMAGES_ORIGINAL } from '../../constants';
	import classNames from 'classnames';
	import { DotFilled, Download, ExternalLink, File, Play, Plus, Trash } from 'radix-icons-svelte';
	import { jellyfinApi } from '../../apis/jellyfin/jellyfin-api';
	import { type EpisodeFileResource, sonarrApi } from '../../apis/sonarr/sonarr-api';
	import Button from '../Button.svelte';
	import { playerState } from '../VideoPlayer/VideoPlayer';
	import { createModal, modalStack } from '../Modal/modal.store';
	import { derived, get, writable } from 'svelte/store';
	import { scrollIntoView, useRegistrar } from '../../selectable';
	import ScrollHelper from '../ScrollHelper.svelte';
	import Carousel from '../Carousel/Carousel.svelte';
	import TmdbPersonCard from '../PersonCard/TmdbPersonCard.svelte';
	import TmdbCard from '../Card/TmdbCard.svelte';
	import EpisodeGrid from './EpisodeGrid.svelte';
	import { formatSize } from '../../utils';
	import FileDetailsDialog from './FileDetailsDialog.svelte';
	import ConfirmDeleteSeasonDialog from './ConfirmDeleteSeasonDialog.svelte';
	import SeasonMediaManagerModal from '../MediaManagerModal/SeasonMediaManagerModal.svelte';
	import MMAddToSonarrDialog from '../MediaManagerModal/MMAddToSonarrDialog.svelte';

	export let id: string;

	const { promise: tmdbSeries, data: tmdbSeriesData } = useRequest(
		tmdbApi.getTmdbSeries,
		Number(id)
	);
	let sonarrItem = sonarrApi.getSeriesByTmdbId(Number(id));
	const { promise: recommendations } = useRequest(tmdbApi.getSeriesRecommendations, Number(id));

	// @ts-ignore
	$: localFilesP = sonarrItem && getLocalFiles();
	$: localFileSeasons = localFilesP.then((files) => [
		...new Set(files.map((item) => item.seasonNumber || -1))
	]);
	$: sonarrEpisodes = Promise.all([sonarrItem, localFileSeasons])
		.then(([item, seasons]) =>
			Promise.all(seasons.map((s) => sonarrApi.getEpisodes(item?.id || -1, s)))
		)
		.then((items) => items.flat());
	$: localFilesP.then(console.log);
	$: sonarrEpisodes.then(console.log);
	$: sonarrItem.then(console.log);
	$: localFileSeasons.then(console.log);

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

	function getLocalFiles() {
		return sonarrItem.then((item) =>
			item ? sonarrApi.getFilesBySeriesId(item?.id || -1) : Promise.resolve([])
		);
	}

	function handleAddedToSonarr() {
		sonarrItem = sonarrApi.getSeriesByTmdbId(Number(id));
		sonarrItem.then(
			(sonarrItem) =>
				sonarrItem &&
				createModal(SeasonMediaManagerModal, {
					season: 1,
					sonarrItem
				})
		);
	}

	async function handleRequestSeason(season: number) {
		return sonarrItem.then((sonarrItem) => {
			const tmdbSeries = get(tmdbSeriesData);
			if (sonarrItem) {
				createModal(SeasonMediaManagerModal, {
					season,
					sonarrItem
				});
			} else if (tmdbSeries) {
				createModal(MMAddToSonarrDialog, {
					series: tmdbSeries,
					onComplete: handleAddedToSonarr
				});
			} else {
				console.error('No series found');
			}
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
										Since {new Date(series.first_air_date || Date.now())?.getFullYear()}
									{:else}
										Ended {new Date(series.last_air_date || Date.now())?.getFullYear()}
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
									Play Season {nextJellyfinEpisode?.ParentIndexNumber} Episode
									{nextJellyfinEpisode?.IndexNumber}
									<Play size={19} slot="icon" />
								</Button>
							{:else}
								<Button class="mr-4" action={() => handleRequestSeason(1)}>
									Request
									<Plus size={19} slot="icon" />
								</Button>
							{/if}

							{#if PLATFORM_WEB}
								<Button class="mr-4">
									Open In TMDB
									<ExternalLink size={19} slot="icon-after" />
								</Button>
								<Button class="mr-4">
									Open In Jellyfin
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
						<div slot="header">Show Cast</div>
						{#each series?.aggregate_credits?.cast?.slice(0, 15) || [] as credit}
							<TmdbPersonCard on:enter={scrollIntoView({ horizontal: 128 })} tmdbCredit={credit} />
						{/each}
					</Carousel>
				{/await}
				{#await $recommendations then recommendations}
					<Carousel scrollClass="px-32" class="mb-8">
						<div slot="header">Recommendations</div>
						{#each recommendations || [] as recommendation}
							<TmdbCard item={recommendation} on:enter={scrollIntoView({ horizontal: 128 })} />
						{/each}
					</Carousel>
				{/await}
			</Container>
			{#await $tmdbSeries then series}
				<Container class="flex-1 bg-secondary-950 pt-8 px-32" on:enter={scrollIntoView({ top: 0 })}>
					<h1 class="font-medium tracking-wide text-2xl text-zinc-300 mb-8">More Information</h1>
					<div class="text-zinc-300 font-medium text-lg flex flex-wrap">
						<div class="flex-1">
							<div class="mb-8">
								<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Created By</h2>
								{#each series?.created_by || [] as creator}
									<div>{creator.name}</div>
								{/each}
							</div>
							<div class="mb-8">
								<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Network</h2>
								<div>{series?.networks?.[0]?.name}</div>
							</div>
						</div>
						<div class="flex-1">
							<div class="mb-8">
								<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Language</h2>
								<div>{series?.spoken_languages?.[0]?.name}</div>
							</div>
							<div class="mb-8">
								<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Last Air Date</h2>
								<div>{series?.last_air_date}</div>
							</div>
						</div>
					</div>
				</Container>
			{/await}
			{#await Promise.all( [localFilesP, localFileSeasons, sonarrEpisodes] ) then [localFiles, seasons, episodes]}
				{#if localFiles?.length}
					<Container
						class="flex-1 bg-secondary-950 pt-8 pb-16 px-32 flex flex-col"
						on:enter={scrollIntoView({ top: 0 })}
					>
						<!--						<h1 class="font-medium tracking-wide text-2xl text-zinc-300 mb-8">Local Files</h1>-->
						<div class="space-y-16">
							{#each seasons as season}
								{@const files = localFiles.filter((f) => f.seasonNumber === season)}
								<div class="">
									<div class="flex justify-between">
										<h2 class="font-medium tracking-wide text-2xl text-zinc-300 mb-8">
											Season {season} Files
										</h2>
										<!--										<Checkbox-->
										<!--											checked={Object.keys(selectedFiles).length-->
										<!--												? Object.values(selectedFiles).every(({ file, selected }) => {-->
										<!--														return file.seasonNumber === season ? selected : true;-->
										<!--												  })-->
										<!--												: false}-->
										<!--											on:change={({ detail }) => {-->
										<!--												selectedFiles = Object.fromEntries(-->
										<!--													Object.entries(selectedFiles).map(([key, value]) => {-->
										<!--														if (value.file.seasonNumber === season) {-->
										<!--															value.selected = detail;-->
										<!--														}-->
										<!--														return [key, value];-->
										<!--													})-->
										<!--												);-->
										<!--											}}-->
										<!--										/>-->
									</div>

									<div class="grid grid-cols-2 gap-8">
										{#each files as file}
											{@const episode = episodes.find(
												(e) => e.episodeFileId !== undefined && e.episodeFileId === file.id
											)}

											<Container
												class={classNames(
													'flex space-x-8  items-center text-zinc-300 font-medium',
													'px-8 py-4 border-2 border-transparent rounded-xl',
													{
														'bg-secondary-800 focus-within:bg-primary-700 focus-within:border-primary-500': true,
														'hover:bg-primary-700 hover:border-primary-500 cursor-pointer': true
														// 'bg-primary-700 focus-within:border-primary-500': selected,
														// 'bg-secondary-800 focus-within:border-zinc-300': !selected
													}
												)}
												on:clickOrSelect={() =>
													modalStack.create(FileDetailsDialog, { file, episode })}
												focusOnClick
											>
												<div class="flex-1">
													<h1 class="text-lg">
														{episode?.episodeNumber}. {episode?.title}
													</h1>
												</div>
												<div>
													{file.mediaInfo?.runTime}
												</div>
												<div>
													{formatSize(file.size || 0)}
												</div>
												<div>
													{file.quality?.quality?.name}
												</div>
											</Container>
										{/each}
									</div>
									<Container direction="horizontal" class="flex mt-8">
										<Button
											on:clickOrSelect={() =>
												createModal(ConfirmDeleteSeasonDialog, {
													files: files,
													onComplete: () => (localFilesP = getLocalFiles())
												})}
										>
											<Trash size={19} slot="icon" />
											Delete Season Files
										</Button>
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
