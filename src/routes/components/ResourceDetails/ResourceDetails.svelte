<script lang="ts">
	import type { MovieResource } from '$lib/types';
	import { ChevronDown, Clock } from 'radix-icons-svelte';
	import { onMount } from 'svelte';
	import classNames from 'classnames';
	import { fade } from 'svelte/transition';

	export let resource: MovieResource;
	export let trailer = true;
	export let remoteResource: any;

	let video: any = remoteResource.videos.filter(
		(v) => v.site === 'YouTube' && v.type === 'Trailer'
	)?.[0];

	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];
	const releaseDate = new Date(remoteResource.release_date);

	let showTrailer = false;
	let focusTrailer = false;
	let trailerStartTime = 0;

	function openTrailer() {
		window
			.open(
				'https://www.youtube.com/watch?v=' +
					video.key +
					'&autoplay=1&t=' +
					(trailerStartTime === 0 ? 0 : Math.floor((Date.now() - trailerStartTime) / 1000)),
				'_blank'
			)
			.focus();
	}

	let opacityStyle;

	const transitionStyle = 'transition: opacity 0.3s ease-in-out;';
	$: opacityStyle = (focusTrailer ? 'opacity: 0;' : 'opacity: 100;') + transitionStyle;

	onMount(() => {
		setTimeout(() => {
			if (trailer) {
				showTrailer = true;
				trailerStartTime = Date.now();
			}
		}, 2500);
	});
</script>

<div
	class="h-screen w-screen bg-center bg-cover relative overflow-hidden"
	style={"background-image: url('https://www.themoviedb.org/t/p/original" +
		remoteResource.backdrop_path +
		"')"}
>
	<div class="youtube-container absolute h-full scale-[150%] hidden sm:block">
		{#if video.key}
			<iframe
				class={classNames('transition-opacity', {
					'opacity-100': showTrailer,
					'opacity-0': !showTrailer
				})}
				transition:fade
				src={'https://www.youtube.com/embed/' +
					video.key +
					'?autoplay=1&mute=1&loop=1&color=white&controls=0&modestbranding=1&playsinline=1&rel=0&enablejsapi=1'}
				title="YouTube video player"
				frameborder="0"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowfullscreen
			/>
		{/if}
	</div>
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
			'h-full w-full px-16 pb-8 pt-32',
			'grid grid-cols-[1fr_max-content] grid-rows-[1fr_min-content] gap-x-16 gap-y-8 relative z-[2]',
			'transition-colors',
			{
				'bg-darken': !focusTrailer,
				'bg-transparent': focusTrailer
			}
		)}
	>
		<div class="flex flex-col justify-self-start min-w-0 row-span-full">
			<div class="relative" style={opacityStyle}>
				<h2 class="text-zinc-300 text-sm self-end">
					<span class="font-bold uppercase tracking-wider"
						>{monthNames[releaseDate.getMonth()]}</span
					>
					{releaseDate.getFullYear()}
				</h2>
				<h2
					class="tracking-wider font-display font-extrabold text-amber-300 absolute opacity-10 text-8xl -ml-6 mt-8"
				>
					<slot name="reason">Popular Now</slot>
				</h2>
				<h1 class="uppercase text-8xl font-bold font-display z-[1] relative">
					{remoteResource.original_title}
				</h1>
			</div>

			<div class="mt-auto max-w-3xl flex flex-col gap-4" style={opacityStyle}>
				<div class="text-xl font-semibold tracking-wider">{remoteResource.tagline}</div>
				<div
					class="tracking-wider text-zinc-200 font-light leading-6 pl-4 border-l-2 border-zinc-300"
				>
					{remoteResource.overview}
				</div>
			</div>
			<div class="flex gap-6 mt-10">
				<div class="flex gap-1">
					<button
						class="bg-white border-2 border-white hover:bg-amber-400 hover:border-amber-400 transition-colors text-zinc-900 px-8 py-3.5 uppercase tracking-widest font-extrabold cursor-pointer text-xs"
						style={opacityStyle}>Stream</button
					>
					<div
						class="hidden items-center justify-center border-2 border-white w-10 cursor-pointer hover:bg-white hover:text-zinc-900 transition-colors"
					>
						<ChevronDown size="20" />
					</div>
				</div>
				<button
					on:mouseover={() => (focusTrailer = trailer)}
					on:mouseleave={() => (focusTrailer = false)}
					on:click={openTrailer}
					class="border-2 border-white cursor-pointer transition-colors px-8 py-3.5 uppercase tracking-widest font-semibold text-xs hover:bg-white hover:text-black opacity-100"
					>Watch Trailer</button
				>
			</div>
		</div>
		<div class="flex flex-col gap-6 max-w-[14rem] row-span-full" style={opacityStyle}>
			<h3 class="text-xs tracking-wide uppercase">Details</h3>
			<div class="flex flex-col gap-1">
				<div class="tracking-widest font-extralight text-sm">
					{remoteResource.genres
						.map((g) => g.name.charAt(0).toUpperCase() + g.name.slice(1))
						.join(', ')}
				</div>
				<div class="flex gap-1.5 items-center">
					<Clock size="14" />
					<div class="tracking-widest font-extralight text-sm">
						{Math.floor(remoteResource.runtime / 60)}h {remoteResource.runtime % 60}m
					</div>
				</div>
				<div class="tracking-widest font-extralight text-sm">Currently <b>Streaming</b></div>
				<div class="tracking-widest font-extralight text-sm">
					<b>{remoteResource.vote_average}</b> TMDB
				</div>
				<div class="flex mt-4">
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
			<h3 class="text-xs tracking-wide uppercase">Starring</h3>
			<div class="flex flex-col gap-1">
				{#each remoteResource.credits.slice(0, 5) as a}
					<div class="tracking-widest font-extralight text-sm">{a.name}</div>
				{/each}
			</div>
		</div>
		<slot name="page-controls" />
	</div>
</div>

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
