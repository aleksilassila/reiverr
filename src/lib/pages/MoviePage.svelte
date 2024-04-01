<script lang="ts">
	import Container from '../../Container.svelte';
	import HeroCarousel from '../components/HeroCarousel/HeroCarousel.svelte';
	import { tmdbApi } from '../apis/tmdb/tmdb-api';
	import { PLATFORM_WEB, TMDB_IMAGES_ORIGINAL } from '../constants';
	import classNames from 'classnames';
	import { DotFilled, Download, ExternalLink, Play, Plus } from 'radix-icons-svelte';
	import Button from '../components/Button.svelte';
	import { jellyfinApi } from '../apis/jellyfin/jellyfin-api';
	import VideoPlayer from '../components/VideoPlayer/VideoPlayer.svelte';
	import { radarrApi } from '../apis/radarr/radarr-api';
	import { useActionRequests, useRequest } from '../stores/data.store';
	import DetachedPage from '../components/DetachedPage/DetachedPage.svelte';
	import { modalStack } from '../components/Modal/modal.store';
	import RequestModal from '../components/RequestModal/RadarrRequestModal.svelte';

	export let id: string;

	const { promise: movieDataP } = useRequest(tmdbApi.getTmdbMovie, Number(id));
	const { promise: jellyfinItemP } = useRequest(
		(id: string) => jellyfinApi.getLibraryItemFromTmdbId(id),
		id
	);
	const { promise: radarrItemP, refresh: refreshRadarrItem } = useRequest(
		radarrApi.getMovieByTmdbId,
		Number(id)
	);

	let playbackId: string = '';

	let heroIndex: number;

	const { requests, isFetching, data } = useActionRequests({
		handleAddToRadarr: (id: number) =>
			radarrApi.addMovieToRadarr(id).finally(() => refreshRadarrItem(Number(id)))
	});
</script>

<DetachedPage>
	<div class="h-screen flex flex-col">
		<HeroCarousel
			bind:index={heroIndex}
			urls={$movieDataP.then(
				(movie) =>
					movie?.images.backdrops
						?.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
						?.map((bd) => TMDB_IMAGES_ORIGINAL + bd.file_path || '')
						.slice(0, 5) || []
			)}
		>
			<div class="h-full flex flex-col justify-end">
				{#await $movieDataP then movie}
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
									>{movie.vote_average} TMDB</a
								>
							</p>
						</div>
						<div class="text-stone-300 font-medium line-clamp-3 opacity-75 max-w-4xl mt-4">
							{movie.overview}
						</div>
					{/if}
				{/await}
				{#await Promise.all([$jellyfinItemP, $radarrItemP]) then [jellyfinItem, radarrItem]}
					<Container direction="horizontal" class="flex mt-8 gap-2">
						{#if jellyfinItem}
							<Button on:click={() => (playbackId = jellyfinItem.Id || '')}>
								Play
								<Play size={19} slot="icon" />
							</Button>
						{:else if radarrItem}
							<Button on:click={() => modalStack.create(RequestModal, { id: radarrItem.id })}>
								Request
								<Download size={19} slot="icon" />
							</Button>
						{:else}
							<Button
								on:click={() => requests.handleAddToRadarr(Number(id))}
								inactive={$isFetching.handleAddToRadarr}
							>
								Add to Radarr
								<Plus slot="icon" size={19} />
							</Button>
						{/if}
						{#if jellyfinItem && radarrItem}
							<Button on:click={() => modalStack.create(RequestModal, { id: radarrItem.id })}>
								Manage Files
								<Download size={19} slot="icon" />
							</Button>
						{/if}
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
				{/await}
			</div>
		</HeroCarousel>
	</div>
	<div>
		{#if playbackId}
			<VideoPlayer jellyfinId={playbackId} />
		{/if}
	</div>
</DetachedPage>
