<script lang="ts">
	import { getJellyfinItemByTmdbId } from '$lib/apis/jellyfin/jellyfinApi';
	import type { CastMember, Video } from '$lib/apis/tmdb/tmdbApi';
	import Button from '$lib/components/Button.svelte';
	import { TMDB_IMAGES } from '$lib/constants';
	import { formatMinutesToTime } from '$lib/utils';
	import classNames from 'classnames';
	import { ChevronDown, Clock, Play, TriangleRight } from 'radix-icons-svelte';
	import { getContext, type ComponentProps } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import HeightHider from '../HeightHider.svelte';
	import type { PlayerState } from '../VideoPlayer/VideoPlayer';
	import LibraryDetails from './LibraryDetails.svelte';
	import IconButton from '../IconButton.svelte';
	import SeasonsDetails from './SeasonsDetails.svelte';
	import EpisodeCard from '../EpisodeCard/EpisodeCard.svelte';

	export let tmdbId: number;
	export let type: 'movie' | 'tv';

	export let title: string;
	export let reason = 'Popular Now';
	export let releaseDate: Date | undefined = undefined;
	export let endDate: Date | undefined = undefined;
	export let seasons: number = 0;
	export let tagline: string;
	export let overview: string;
	export let backdropPath: string;

	export let genres: string[];
	export let runtime: number;
	export let tmdbRating: number;
	export let starring: CastMember[];

	export let lastEpisode: ComponentProps<EpisodeCard> | undefined = undefined;

	export let videos: Video[];
	export let showDetails = false;
	export let trailer = true;

	let showTrailer = false;
	let focusTrailer = false;
	let trailerStartTime = 0;
	let detailsVisible = showDetails;
	let streamButtonDisabled = true;
	let jellyfinId: string;

	let video: Video | undefined;
	$: video = videos?.find((v) => v.site === 'YouTube' && v.type === 'Trailer');

	let opacityStyle: string;
	$: opacityStyle =
		(focusTrailer ? 'opacity: 0;' : 'opacity: 100;') + 'transition: opacity 0.3s ease-in-out;';

	// Transitions
	const duration = 200;
	const { playerState, close, streamJellyfinId } = getContext<PlayerState>('player');

	function openTrailer() {
		if (!video) return;
		window
			?.open(
				'https://www.youtube.com/watch?v=' +
					video.key +
					'&autoplay=1&t=' +
					(trailerStartTime === 0 ? 0 : Math.floor((Date.now() - trailerStartTime) / 1000)),
				'_blank'
			)
			?.focus();
	}

	let fadeIndex = -1;
	const getFade = () => {
		fadeIndex += 1;
		return { duration: 200, delay: 500 + fadeIndex * 50 };
	};

	let timeout: NodeJS.Timeout;
	$: {
		fadeIndex = 0;
		streamButtonDisabled = true;
		if (tmdbId) {
			showTrailer = false;
			if (timeout) clearTimeout(timeout);

			timeout = setTimeout(() => {
				if (trailer) {
					showTrailer = true;
					trailerStartTime = Date.now();
				}
			}, 2500);

			getJellyfinItemByTmdbId(String(tmdbId)).then((r) => {
				if (!r) return;
				streamButtonDisabled = !r;
				if (r.Id) jellyfinId = r.Id;
			});
		}
	}

	let localDetailsTop: HTMLElement;
</script>

<div class="grid">
	<div
		class="min-h-max h-screen w-screen overflow-hidden row-start-1 col-start-1 relative"
		out:fade={{ duration }}
		in:fade={{ delay: duration, duration }}
	>
		{#key (video?.key || '') + tmdbId}
			<div
				class="absolute inset-0 bg-center bg-cover transition-[background-image] duration-500 delay-500"
				style={"background-image: url('" + TMDB_IMAGES + backdropPath + "');"}
				transition:fade
			/>
			<div class="youtube-container absolute h-full scale-[150%] hidden sm:block" transition:fade>
				{#if video?.key}
					<iframe
						class={classNames('transition-opacity', {
							'opacity-100': showTrailer,
							'opacity-0': !showTrailer
						})}
						src={'https://www.youtube.com/embed/' +
							video.key +
							'?autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&playsinline=1&rel=0&enablejsapi=1'}
						title="YouTube video player"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen
					/>
				{/if}
			</div>
		{/key}
		{#key tmdbId}
			<div
				class={classNames(
					'bg-gradient-to-b from-darken via-20% via-transparent transition-opacity absolute inset-0 z-[1]',
					{
						'opacity-100': focusTrailer,
						'opacity-0': !focusTrailer
					}
				)}
			/>
			<div
				class={classNames(
					'h-full w-full px-8 lg:px-16 pb-8 pt-32',
					'grid grid-cols-[1fr_max-content] grid-rows-[1fr_min-content] gap-x-16 gap-y-8 relative z-[2]',
					'transition-colors',
					{
						'bg-darken': !focusTrailer,
						'bg-transparent': focusTrailer
					}
				)}
			>
				<div class="flex flex-col justify-self-start min-w-0 row-span-full">
					<div class="relative" style={opacityStyle} in:fly={{ x: -20, duration, delay: 400 }}>
						<h2 class="text-zinc-300 text-sm self-end uppercase">
							{#if seasons}
								{#if endDate}
									<span class="font-medium">Ended</span>
									<span class="font-bold">{endDate.getFullYear()}</span>
								{:else if releaseDate}
									<span class="font-medium">Since</span>
									<span class="font-bold">{releaseDate.getFullYear()}</span>
								{/if}
							{:else if releaseDate}
								<span class="font-bold uppercase tracking-wider"
									>{releaseDate.toLocaleString('en', { month: 'long' })}</span
								>
								{releaseDate.getFullYear()}
							{/if}
						</h2>
						<h2
							class="tracking-wider font-display font-extrabold text-amber-300 absolute opacity-10 text-8xl -ml-6 mt-8"
						>
							<slot name="reason">{reason}</slot>
						</h2>
						<h1 class="uppercase text-8xl font-bold font-display z-[1] relative">
							{title}
						</h1>
					</div>
					<div
						class="mt-auto max-w-3xl flex flex-col gap-4"
						style={opacityStyle}
						in:fly={{ x: -20, duration, delay: 600 }}
					>
						<div class="text-xl font-semibold tracking-wider">{tagline}</div>
						<div
							class="tracking-wider text-zinc-200 font-light leading-6 pl-4 border-l-2 border-zinc-300"
						>
							{overview}
						</div>
					</div>
					<div class="flex gap-6 mt-10" in:fly={{ x: -20, duration, delay: 600 }}>
						<div class="flex gap-1">
							<div style={opacityStyle}>
								<Button
									disabled={streamButtonDisabled}
									size="lg"
									on:click={() => jellyfinId && streamJellyfinId(jellyfinId)}>Stream</Button
								>
							</div>
							<div
								class="hidden items-center justify-center border-2 border-white w-10 cursor-pointer hover:bg-white hover:text-zinc-900 transition-colors"
							>
								<ChevronDown size={20} />
							</div>
						</div>
						<div style={opacityStyle} class:hidden={showDetails}>
							<Button
								size="lg"
								type="secondary"
								on:click={() => {
									detailsVisible = true;
									localDetailsTop?.scrollIntoView({ behavior: 'smooth' });
								}}>Details</Button
							>
						</div>
						<Button
							size="lg"
							type="secondary"
							on:mouseover={() => (focusTrailer = trailer)}
							on:mouseleave={() => (focusTrailer = false)}
							on:click={openTrailer}>Watch Trailer</Button
						>
					</div>
				</div>
				<div
					class="flex flex-col gap-6 justify-between 2xl:w-96 xl:w-80 lg:w-64 w-52 row-span-full"
					style={opacityStyle}
				>
					<div class="flex flex-col gap-6 self-end">
						<h3 class="text-xs tracking-wide uppercase" in:fade={getFade()}>Details</h3>
						<div class="flex flex-col gap-1 text-sm tracking-widest font-extralight">
							<div in:fade={getFade()}>
								{genres.map((g) => g.charAt(0).toUpperCase() + g.slice(1)).join(', ')}
							</div>
							{#if seasons}
								<a href={`https://www.themoviedb.org/tv/${tmdbId}/seasons`} target="_blank"
									>{seasons} Season{seasons > 1 ? 's' : ''}</a
								>
							{/if}
							{#if runtime}
								<div class="flex gap-1.5 items-center" in:fade={getFade()}>
									<Clock size={14} />
									<div>
										{formatMinutesToTime(runtime)}
									</div>
								</div>
							{/if}
							<div in:fade={getFade()}>
								Currently <b>Streaming</b>
							</div>
							<a
								href={`https://www.themoviedb.org/${type}/${tmdbId}`}
								target="_blank"
								in:fade={getFade()}
							>
								<b>{tmdbRating.toFixed(1)}</b> TMDB
							</a>
							<div class="flex mt-4" in:fade={getFade()}>
								<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="text-white w-4"
									><g
										><path d="M0 0h24v24H0z" fill="none" /><path
											d="M11.29 3.814l2.02 5.707.395 1.116.007-4.81.01-4.818h4.27L18 11.871c.003 5.98-.003 10.89-.015 10.9-.012.009-.209 0-.436-.027-.989-.118-2.29-.236-3.34-.282a14.57 14.57 0 0 1-.636-.038c-.003-.004-.273-.762-.776-2.184v-.004l-2.144-6.061-.34-.954-.008 4.586c-.006 4.365-.01 4.61-.057 4.61-.163 0-1.57.09-2.04.136-.308.027-.926.09-1.37.145-.446.051-.816.085-.823.078C6.006 22.77 6 17.867 6 11.883V1.002h.005V1h4.288l.028.08c.007.016.065.176.157.437l.641 1.778.173.496-.001.023z"
											fill-rule="evenodd"
											fill="currentColor"
										/></g
									></svg
								>
							</div>
						</div>
						{#if starring?.length > 0}
							<h3 class="text-xs tracking-wide uppercase" in:fade={getFade()}>Starring</h3>
							<div class="flex flex-col gap-1 text-sm tracking-widest font-extralight">
								{#each starring.slice(0, 5) as a}
									<a
										href={'https://www.themoviedb.org/person/' + a.id}
										target="_blank"
										in:fade={getFade()}>{a.name}</a
									>
								{/each}
								<a
									href={`https://www.themoviedb.org/${type}/${tmdbId}/cast`}
									target="_blank"
									in:fade={getFade()}>View all...</a
								>
							</div>
						{/if}
					</div>
					{#if lastEpisode}
						<div class="w-full aspect-video">
							<EpisodeCard size="dynamic" {...lastEpisode} />
						</div>
					{/if}
				</div>
				<slot name="page-controls" />
			</div>
		{/key}
	</div>
</div>

<HeightHider duration={1000} visible={detailsVisible}>
	{#key tmdbId}
		{#if type === 'tv' && seasons > 0}
			<SeasonsDetails {tmdbId} totalSeasons={seasons} />
		{/if}
	{/key}
	<div bind:this={localDetailsTop} />
	{#key tmdbId}
		<LibraryDetails
			openJellyfinStream={() => jellyfinId && streamJellyfinId(jellyfinId)}
			jellyfinStreamDisabled={streamButtonDisabled}
			{tmdbId}
		/>
	{/key}
</HeightHider>

<style>
	.youtube-container {
		overflow: hidden;
		width: 100%;
		aspect-ratio: 16/9;
		pointer-events: none;
	}

	.youtube-container iframe {
		width: 300%;
		height: 100%;
		margin-left: -100%;
	}
</style>
