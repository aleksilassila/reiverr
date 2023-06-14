<script lang="ts">
	import type { PageData } from './$types';
	import SmallHorizontalPoster from '../components/SmallHorizontalPoster/SmallHorizontalPoster.svelte';
	import type { TmdbMovieFull } from '$lib/tmdb-api';
	export let data: PageData;
	console.log(data);

	const allMovies: Record<string, TmdbMovieFull> = {};
	data.tmdbMovies.forEach((m) => (allMovies[m.id] = m));

	const tmdbIdToDownloading = {};
	(data.downloading as any).forEach((d) => (tmdbIdToDownloading[d.movie.tmdbId] = d));

	const tmdbIdToRadarrMovie = {};
	(data.radarrMovies as any).forEach((r) => (tmdbIdToRadarrMovie[r.tmdbId] = r));

	const downloading = data.tmdbMovies.filter((m) => tmdbIdToDownloading[m.id] !== undefined);
	const available = data.tmdbMovies.filter((m) => tmdbIdToDownloading[m.id] === undefined);
	const unavailable = data.tmdbMovies.filter(
		(m) => !tmdbIdToRadarrMovie[m.id]?.hasFile && !tmdbIdToDownloading[m.id]
	);
	const watched = [];

	const posterGridStyle = 'flex flex-wrap justify-center gap-x-4 gap-y-8';
	const headerStyle = 'uppercase tracking-widest font-bold text-center mt-2';
</script>

<div
	style="background-image: url('https://www.themoviedb.org/t/p/original/vvjYv7bSWerbsi0LsMjLnTVOX7c.jpg')"
>
	<div class="py-24 backdrop-blur-2xl bg-darken px-8 flex flex-col gap-4">
		<!--	Contains all the titles available locally, the ones already watched previously (greyed out at the-->
		<!--	bottom), and the ones that are in some sort of watchlist and not available via any source.-->

		<!--	<div>Library</div>-->

		{#if downloading.length > 0}
			<h1 class={headerStyle}>Downloading</h1>
			<div class={posterGridStyle}>
				{#each downloading as movie (movie.id)}
					<SmallHorizontalPoster
						progress={(tmdbIdToDownloading[movie.id].sizeleft /
							tmdbIdToDownloading[movie.id].size) *
							100}
						progressType="downloading"
						available={false}
						tmdbMovie={movie}
					/>
				{/each}
			</div>
		{/if}

		{#if available.length > 0}
			<h1 class={headerStyle}>Available</h1>
			<div class={posterGridStyle}>
				{#each available as movie (movie.id)}
					<SmallHorizontalPoster randomProgress={true} tmdbMovie={movie} />
				{/each}
			</div>
		{/if}

		{#if unavailable.length > 0}
			<h1 class={headerStyle}>Unavailable</h1>
			<div class={posterGridStyle}>
				{#each unavailable as movie (movie.id)}
					<SmallHorizontalPoster available={false} tmdbMovie={movie} />
				{/each}
			</div>
		{/if}

		{#if watched.length > 0}
			<h1 class={headerStyle}>Watched</h1>
		{/if}
	</div>
</div>
