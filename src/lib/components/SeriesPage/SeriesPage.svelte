<script lang="ts">
	import Container from '../../../Container.svelte';
	import HeroCarousel from '../HeroCarousel/HeroCarousel.svelte';
	import DetachedPage from '../DetachedPage/DetachedPage.svelte';
	import { useActionRequest, useDependantRequest, useRequest } from '../../stores/data.store';
	import { tmdbApi, type TmdbEpisode } from '../../apis/tmdb/tmdb-api';
	import { PLATFORM_WEB, TMDB_IMAGES_ORIGINAL } from '../../constants';
	import classNames from 'classnames';
	import { DotFilled, Download, ExternalLink, File, Play, Plus } from 'radix-icons-svelte';
	import { jellyfinApi } from '../../apis/jellyfin/jellyfin-api';
	import { sonarrApi } from '../../apis/sonarr/sonarr-api';
	import Button from '../Button.svelte';
	import { playerState } from '../VideoPlayer/VideoPlayer';
	import { modalStack } from '../Modal/modal.store';
	import ManageMediaModal from '../ManageMedia/RadarrMediaMangerModal.svelte';
	import { derived } from 'svelte/store';
	import EpisodeCarousel from './EpisodeCarousel.svelte';
	import { scrollIntoView, Selectable } from '../../selectable';
	import ScrollHelper from '../ScrollHelper.svelte';
	import SonarrMediaMangerModal from '../ManageMedia/SonarrMediaMangerModal.svelte';

	export let id: string;

	const { promise: tmdbSeries, data: tmdbSeriesData } = useRequest(
		tmdbApi.getTmdbSeries,
		Number(id)
	);
	const { promise: sonarrItem, data: sonarrItemData } = useRequest(
		sonarrApi.getSeriesByTmdbId,
		Number(id)
	);
	const { promise: jellyfinItem, data: jellyfinItemData } = useRequest(
		(id: string) => jellyfinApi.getLibraryItemFromTmdbId(id),
		id
	);
	const { data: jellyfinEpisodes } = useDependantRequest(
		jellyfinApi.getJellyfinEpisodes,
		jellyfinItemData,
		(data) => (data?.Id ? ([data.Id] as const) : undefined)
	);
	const nextJellyfinEpisode = derived(jellyfinEpisodes, ($items) =>
		($items || []).find((i) => i.UserData?.Played === false)
	);

	const { send: addSeriesToSonarr, isFetching: addSeriesToSonarrFetching } = useActionRequest(
		sonarrApi.addSeriesToSonarr
	);

	let selectedTmdbEpisode: TmdbEpisode | undefined;
	let episodesSelectable: Selectable;

	let scrollTop: number;
	$: showEpisodeInfo = scrollTop > 140;
</script>

<DetachedPage>
	<ScrollHelper bind:scrollTop />
	<Container
		class="h-screen flex flex-col py-12 px-20 relative"
		on:enter={scrollIntoView({ top: 0 })}
		handleNavigateOut={{
			down: () => episodesSelectable?.focusChildren(1)
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
			<div class="h-full flex-1 flex flex-col justify-end">
				{#await $tmdbSeries then series}
					{#if showEpisodeInfo && selectedTmdbEpisode}
						{@const episode = selectedTmdbEpisode}
						<div
							class={classNames(
								'text-left font-medium tracking-wider text-stone-200 hover:text-amber-200 mt-2',
								{
									'text-4xl sm:text-5xl 2xl:text-6xl': episode.name?.length || 0 < 15,
									'text-3xl sm:text-4xl 2xl:text-5xl': episode?.name?.length || 0 >= 15
								}
							)}
						>
							{episode.name}
						</div>
						<div
							class="flex items-center gap-1 uppercase text-zinc-300 font-semibold tracking-wider mt-2 text-lg"
						>
							<p class="flex-shrink-0">
								{episode.runtime} Minutes
							</p>
							<!-- <DotFilled />
								<p class="flex-shrink-0">{movie.runtime}</p> -->
							<DotFilled />
							<p class="flex-shrink-0">
								<a href={`https://www.themoviedb.org/movie/${series?.id}/episode/${episode.id}`}
									>{episode.vote_average} TMDB</a
								>
							</p>
						</div>
						<div class="text-stone-300 font-medium line-clamp-3 opacity-75 max-w-4xl mt-4">
							{episode.overview}
						</div>
					{:else if series}
						<div
							class={classNames(
								'text-left font-medium tracking-wider text-stone-200 hover:text-amber-200 mt-2',
								{
									'text-4xl sm:text-5xl 2xl:text-6xl': series.name?.length || 0 < 15,
									'text-3xl sm:text-4xl 2xl:text-5xl': series?.name?.length || 0 >= 15
								}
							)}
						>
							{series?.name}
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
						<div class="text-stone-300 font-medium line-clamp-3 opacity-75 max-w-4xl mt-4">
							{series.overview}
						</div>
					{/if}
				{/await}
				{#await Promise.all([$jellyfinItem, $sonarrItem]) then [jellyfinItem, sonarrItem]}
					<Container direction="horizontal" class="flex mt-8" focusOnMount>
						{#if $nextJellyfinEpisode}
							<Button
								class="mr-2"
								on:clickOrSelect={() =>
									$nextJellyfinEpisode?.Id && playerState.streamJellyfinId($nextJellyfinEpisode.Id)}
							>
								Play Season {$nextJellyfinEpisode?.ParentIndexNumber} Episode
								{$nextJellyfinEpisode?.IndexNumber}
								<Play size={19} slot="icon" />
							</Button>
						{/if}
						{#if sonarrItem}
							<Button
								class="mr-2"
								on:clickOrSelect={() =>
									modalStack.create(SonarrMediaMangerModal, { id: sonarrItem.id || -1 })}
							>
								{#if jellyfinItem}
									Manage Files
								{:else}
									Request
								{/if}
								<svelte:component this={jellyfinItem ? File : Download} size={19} slot="icon" />
							</Button>
						{:else}
							<Button
								class="mr-2"
								on:clickOrSelect={() => addSeriesToSonarr(Number(id))}
								inactive={$addSeriesToSonarrFetching}
							>
								Add to Sonarr
								<Plus slot="icon" size={19} />
							</Button>
						{/if}
						{#if PLATFORM_WEB}
							<Button class="mr-2">
								Open In TMDB
								<ExternalLink size={19} slot="icon-after" />
							</Button>
							<Button class="mr-2">
								Open In Jellyfin
								<ExternalLink size={19} slot="icon-after" />
							</Button>
						{/if}
					</Container>
				{/await}
			</div>
		</HeroCarousel>
	</Container>
	<Container on:enter={scrollIntoView({ vertical: 64 })} bind:container={episodesSelectable}>
		<EpisodeCarousel
			id={Number(id)}
			tmdbSeries={tmdbSeriesData}
			{jellyfinEpisodes}
			{nextJellyfinEpisode}
			bind:selectedTmdbEpisode
		/>
	</Container>
</DetachedPage>
