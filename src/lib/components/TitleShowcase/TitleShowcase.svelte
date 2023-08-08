<script lang="ts">
	import { TMDB_IMAGES_ORIGINAL, TMDB_POSTER_SMALL } from '$lib/constants';
	import classNames from 'classnames';
	import { ChevronLeft, ChevronRight, DotFilled } from 'radix-icons-svelte';
	import Button from '../Button.svelte';
	import IconButton from '../IconButton.svelte';
	import { formatMinutesToTime } from '$lib/utils';
	import YoutubePlayer from '../YoutubePlayer.svelte';
	import { settings } from '$lib/stores/settings.store';
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	const TRAILER_TIMEOUT = 3000;
	const TRAILER_LOAD_TIME = 1000;
	const ANIMATION_DURATION = 150;

	export let tmdbId: number;
	export let type: 'movie' | 'series';

	export let title: string;
	export let genres: string[];
	export let runtime: number;
	export let releaseDate: Date;
	export let tmdbRating: number;

	export let trailerId: string | undefined = undefined;
	export let director: string | undefined = undefined;

	export let backdropUri: string;
	export let posterUri: string;

	export let showcaseIndex: number;
	export let showcaseLength: number;
	export let onPrevious: () => void;
	export let onNext: () => void;

	let trailerMounted = false;
	let trailerMountedTime = 0;
	let trailerVisible = false;
	let focusTrailer = false;
	let UIVisible = true;
	$: UIVisible = !(focusTrailer && trailerVisible);

	let tmdbUrl = `https://www.themoviedb.org/${type}/${tmdbId}`;
	let youtubeUrl = `https://www.youtube.com/watch?v=${trailerId}`;

	let timeout: NodeJS.Timeout;
	$: {
		tmdbId;
		trailerMounted = false;
		trailerMountedTime = 0;
		trailerVisible = false;
		UIVisible = true;

		timeout = setTimeout(() => {
			trailerMounted = true;
			trailerMountedTime = Date.now();

			timeout = setTimeout(() => {
				trailerVisible = true;
			}, TRAILER_LOAD_TIME);
		}, TRAILER_TIMEOUT - TRAILER_LOAD_TIME);
	}

	onMount(() => {
		return () => clearTimeout(timeout);
	});
</script>

<div class="h-screen relative pt-24 flex">
	<div class="relative z-[1] px-16 py-8 flex-1 grid grid-cols-6">
		{#if UIVisible}
			<div class="flex flex-col justify-center col-span-3 gap-6 max-w-screen-md -mt-20">
				<div class="flex flex-col gap-1">
					<div
						class="flex items-center gap-1 uppercase text-sm text-zinc-300 font-semibold tracking-wider"
						in:fly|global={{ y: -5, delay: ANIMATION_DURATION, duration: ANIMATION_DURATION }}
						out:fly|global={{ y: 5, duration: ANIMATION_DURATION }}
					>
						<p class="flex-shrink-0">{releaseDate.getFullYear()}</p>
						<DotFilled />
						<p class="flex-shrink-0">{formatMinutesToTime(runtime)}</p>
						<DotFilled />
						<p class="flex-shrink-0"><a href={tmdbUrl}>{tmdbRating.toFixed(1)} TMDB</a></p>
					</div>
					<h1
						class={classNames('font-medium tracking-wider text-stone-200', {
							'text-6xl': title.length < 15,
							'text-5xl': title.length >= 15
						})}
						in:fly|global={{ y: -10, delay: ANIMATION_DURATION, duration: ANIMATION_DURATION }}
						out:fly|global={{ y: 10, duration: ANIMATION_DURATION }}
					>
						{title}
					</h1>
				</div>
				<div
					class="flex items-center gap-4"
					in:fly|global={{ y: -5, delay: ANIMATION_DURATION, duration: ANIMATION_DURATION }}
					out:fly|global={{ y: 5, duration: ANIMATION_DURATION }}
				>
					{#each genres.slice(0, 3) as genre}
						<span
							class="backdrop-blur-lg rounded-full bg-zinc-400 bg-opacity-20 p-1.5 px-4 font-medium text-sm flex-grow-0"
						>
							{genre}
						</span>
					{/each}
				</div>
				<!-- <div
					class="flex gap-4"
					in:fly|global={{ y: -5, delay: ANIMATION_DURATION, duration: ANIMATION_DURATION }}
					out:fly|global={{ y: 5, duration: ANIMATION_DURATION }}
				>
					<Button type="primary" href={`/${type}/${tmdbId}`}>
						<span>Details</span><ChevronRight size={20} />
					</Button>
					{#if trailerId}
						<Button
							type="secondary"
							href={youtubeUrl}
							on:mouseover={() => (focusTrailer = true)}
							on:mouseleave={() => (focusTrailer = false)}
						>
							<span>Watch Trailer</span><ChevronRight size={20} />
						</Button>
					{/if}
				</div> -->
			</div>
			<div
				class="flex-1 flex flex-col gap-6 justify-end col-span-2 col-start-1"
				in:fade|global={{ delay: ANIMATION_DURATION, duration: ANIMATION_DURATION }}
				out:fade|global={{ duration: ANIMATION_DURATION }}
			>
				<div class="flex gap-4 items-center">
					<Button size="lg" type="primary" href={`/${type}/${tmdbId}`}>
						<span>Details</span><ChevronRight size={20} />
					</Button>
					{#if trailerId}
						<Button
							size="lg"
							type="secondary"
							href={youtubeUrl}
							on:mouseover={() => (focusTrailer = true)}
							on:mouseleave={() => (focusTrailer = false)}
						>
							<span>Watch Trailer</span><ChevronRight size={20} />
						</Button>
					{/if}
					<!-- <div
						style={"background-image: url('" + TMDB_POSTER_SMALL + posterUri + "');"}
						class="w-24 aspect-[2/3] rounded-lg bg-center bg-cover flex-shrink-0 shadow-lg"
					/>
					<div class="flex-1 flex gap-8 flex-wrap py-2 items-end">
						<div>
							<p class="text-zinc-400 text-sm font-medium">Release Date</p>
							<h2 class="font-semibold">
								{releaseDate.toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'long',
									day: 'numeric'
								})}
							</h2>
						</div>
						{#if director}
							<div>
								<p class="text-zinc-400 text-sm font-medium">Directed By</p>
								<h2 class="font-semibold">{director}</h2>
							</div>
						{/if}
					</div> -->
				</div>
				<!-- <div class="flex gap-8">
					<div
						style={"background-image: url('" + TMDB_POSTER_SMALL + posterUri + "');"}
						class="w-32 aspect-[2/3] rounded-lg bg-center bg-cover flex-shrink-0 shadow-lg"
					/>
					<div class="flex flex-col gap-6">
						<div class="flex-1 flex gap-6 flex-wrap items-end">
							<div>
								<p class="text-zinc-400 text-sm font-medium">Release Date</p>
								<h2 class="font-semibold">
									{releaseDate.toLocaleDateString('en-US', {
										year: 'numeric',
										month: 'long',
										day: 'numeric'
									})}
								</h2>
							</div>
							{#if director}
								<div>
									<p class="text-zinc-400 text-sm font-medium">Directed By</p>
									<h2 class="font-semibold">{director}</h2>
								</div>
							{/if}
						</div>

						<div class="flex gap-4">
							<Button size="lg" type="primary" href={`/${type}/${tmdbId}`}>
								<span>Details</span><ChevronRight size={20} />
							</Button>
							{#if trailerId}
								<Button
									size="lg"
									type="secondary"
									href={youtubeUrl}
									on:mouseover={() => (focusTrailer = true)}
									on:mouseleave={() => (focusTrailer = false)}
								>
									<span>Watch Trailer</span><ChevronRight size={20} />
								</Button>
							{/if}
						</div>
					</div>
				</div> -->
			</div>
		{/if}
		<div class="row-start-2 col-start-4 col-span-3 flex items-end justify-end">
			<div class="flex gap-6 items-center">
				<div>
					<p class="text-zinc-400 text-sm font-medium">Release Date</p>
					<h2 class="font-semibold">
						{releaseDate.toLocaleDateString('en-US', {
							year: 'numeric',
							month: 'long',
							day: 'numeric'
						})}
					</h2>
				</div>
				{#if director}
					<div>
						<p class="text-zinc-400 text-sm font-medium">Directed By</p>
						<h2 class="font-semibold">{director}</h2>
					</div>
				{/if}
				<div
					style={"background-image: url('" + TMDB_POSTER_SMALL + posterUri + "');"}
					class="w-20 aspect-[2/3] rounded-lg bg-center bg-cover flex-shrink-0 shadow-lg"
				/>
			</div>
		</div>
	</div>
	{#if !trailerVisible}
		<div
			style={"background-image: url('" + TMDB_IMAGES_ORIGINAL + backdropUri + "');"}
			class={classNames('absolute inset-0 bg-cover bg-center')}
			in:fade|global={{ delay: ANIMATION_DURATION, duration: ANIMATION_DURATION }}
			out:fade|global={{ duration: ANIMATION_DURATION }}
		/>
	{/if}
	{#if trailerId && $settings.autoplayTrailers && trailerMounted}
		<div
			class={classNames('absolute inset-0 transition-opacity', {
				'opacity-100': trailerVisible,
				'opacity-0': !trailerVisible
			})}
			out:fade|global={{ duration: ANIMATION_DURATION }}
		>
			<YoutubePlayer videoId={trailerId} />
		</div>
	{/if}
	{#if UIVisible}
		<div
			class="absolute inset-0 bg-gradient-to-t from-stone-950 via-darken via-[30%] to-darken opacity-50"
			in:fade={{ duration: ANIMATION_DURATION }}
			out:fade={{ duration: ANIMATION_DURATION }}
		/>
	{:else if !UIVisible}
		<div
			class="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-darken opacity-50"
			in:fade={{ duration: ANIMATION_DURATION }}
			out:fade={{ duration: ANIMATION_DURATION }}
		/>
	{/if}
	<div class="absolute inset-y-0 left-0 px-3 flex justify-start w-[10vw]">
		<div class="peer relaitve z-[1] flex justify-start">
			<IconButton on:click={onPrevious}>
				<ChevronLeft size={20} />
			</IconButton>
		</div>
		<div
			class="opacity-0 peer-hover:opacity-20 transition-opacity bg-gradient-to-r from-darken absolute inset-0"
		/>
	</div>
	<div class="absolute inset-y-0 right-0 px-3 flex justify-end w-[10vw]">
		<div class="peer relaitve z-[1] flex justify-end">
			<IconButton on:click={onNext}>
				<ChevronRight size={20} />
			</IconButton>
		</div>
		<div
			class="opacity-0 peer-hover:opacity-20 transition-opacity bg-gradient-to-l from-darken absolute inset-0"
		/>
	</div>
	{#if UIVisible}
		<div
			class="absolute inset-x-0 bottom-8 flex justify-center opacity-70 gap-3"
			in:fade={{ delay: ANIMATION_DURATION, duration: ANIMATION_DURATION }}
			out:fade={{ duration: ANIMATION_DURATION }}
		>
			{#each Array.from({ length: showcaseLength }, (_, i) => i) as i}
				{#if i === showcaseIndex}
					<DotFilled size={15} class="opacity-100" />
				{:else}
					<DotFilled size={15} class="opacity-20" />
				{/if}
			{/each}
		</div>
	{/if}
</div>
