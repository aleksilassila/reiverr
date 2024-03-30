<script lang="ts">
	import Container from '../../Container.svelte';
	import HeroCarousel from '../components/HeroCarousel/HeroCarousel.svelte';
	import { tmdbApi } from '../apis/tmdb/tmdb-api';
	import { TMDB_IMAGES_ORIGINAL } from '../constants';
	import classNames from 'classnames';
	import { DotFilled } from 'radix-icons-svelte';
	import Button from '../components/Button.svelte';
	import { jellyfinApi } from '../apis/jellyfin/jellyfin-api';
	import VideoPlayer from '../components/VideoPlayer/VideoPlayer.svelte';

	export let id: string;

	const movieDataP = tmdbApi.getTmdbMovie(Number(id));
	const jellyfinItem = jellyfinApi.getLibraryItemFromTmdbId(id);

	let playbackId: string = '';

	let heroIndex: number;
</script>

<Container focusOnMount>
	<div class="h-screen flex flex-col">
		<HeroCarousel
			bind:index={heroIndex}
			urls={movieDataP.then(
				(movie) =>
					movie?.images.backdrops
						?.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
						?.map((bd) => TMDB_IMAGES_ORIGINAL + bd.file_path || '')
						.slice(0, 5) || []
			)}
		>
			<div class="h-full flex flex-col justify-end">
				{#await movieDataP then movie}
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
							class="flex items-center gap-1 uppercase text-zinc-300 font-semibold tracking-wider mt-2"
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
				{#await jellyfinItem then item}
					{#if item}
						<div class="flex mt-4">
							<Button on:click={() => (playbackId = item.Id || '')}>Play</Button>
						</div>
					{/if}
				{/await}
			</div>
		</HeroCarousel>
	</div>
	<div>
		{#if playbackId}
			<VideoPlayer jellyfinId={playbackId} />
		{/if}
	</div>
</Container>
