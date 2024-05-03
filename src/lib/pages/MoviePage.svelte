<script lang="ts">
	import Container from '../../Container.svelte';
	import HeroCarousel from '../components/HeroCarousel/HeroCarousel.svelte';
	import { tmdbApi } from '../apis/tmdb/tmdb-api';
	import { PLATFORM_WEB, TMDB_IMAGES_ORIGINAL } from '../constants';
	import classNames from 'classnames';
	import { DotFilled, Download, ExternalLink, File, Play, Plus } from 'radix-icons-svelte';
	import Button from '../components/Button.svelte';
	import { jellyfinApi } from '../apis/jellyfin/jellyfin-api';
	import { radarrApi } from '../apis/radarr/radarr-api';
	import { useActionRequests, useRequest } from '../stores/data.store';
	import DetachedPage from '../components/DetachedPage/DetachedPage.svelte';
	import { modalStack, openMovieMediaManager } from '../components/Modal/modal.store';
	import { playerState } from '../components/VideoPlayer/VideoPlayer';
	import ManageMediaModal from '../components/MediaManager/radarr/RadarrMediaMangerModal.svelte';

	export let id: string;

	const { promise: movieDataP } = useRequest(tmdbApi.getTmdbMovie, Number(id));
	const { promise: jellyfinItemP } = useRequest(
		(id: string) => jellyfinApi.getLibraryItemFromTmdbId(id),
		id
	);
	const { promise: radarrItemP, send: refreshRadarrItem } = useRequest(
		radarrApi.getMovieByTmdbId,
		Number(id)
	);

	const { requests, isFetching, data } = useActionRequests({
		handleAddToRadarr: (id: number) =>
			radarrApi.addMovieToRadarr(id).finally(() => refreshRadarrItem(Number(id)))
	});
</script>

<DetachedPage let:handleGoBack let:registrar>
	<div class="min-h-screen flex flex-col py-12 px-20 relative">
		<HeroCarousel
			urls={$movieDataP.then(
				(movie) =>
					movie?.images.backdrops
						?.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
						?.map((bd) => TMDB_IMAGES_ORIGINAL + bd.file_path || '')
						.slice(0, 5) || []
			)}
		>
			<Container />
			<div class="h-full flex-1 flex flex-col justify-end">
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
						on:navigate={handleGoBack}
						on:back={handleGoBack}
						{registrar}
					>
						{#if jellyfinItem}
							<Button
								class="mr-4"
								on:clickOrSelect={() =>
									jellyfinItem.Id && playerState.streamJellyfinId(jellyfinItem.Id)}
							>
								Play
								<Play size={19} slot="icon" />
							</Button>
						{/if}
						{#if radarrItem}
							<Button class="mr-4" on:clickOrSelect={() => openMovieMediaManager(Number(id))}>
								{#if jellyfinItem}
									Manage Media
								{:else}
									Request
								{/if}
								<svelte:component this={jellyfinItem ? File : Download} size={19} slot="icon" />
							</Button>
						{:else}
							<Button
								class="mr-4"
								on:clickOrSelect={() => requests.handleAddToRadarr(Number(id))}
								disabled={$isFetching.handleAddToRadarr}
							>
								Add to Radarr
								<Plus slot="icon" size={19} />
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
	</div>
</DetachedPage>
