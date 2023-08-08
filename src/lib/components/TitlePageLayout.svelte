<script lang="ts">
	import { TMDB_IMAGES_ORIGINAL, TMDB_POSTER_SMALL } from '$lib/constants';
	import { DotFilled } from 'radix-icons-svelte';
	import { fade } from 'svelte/transition';
	import Carousel from './Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from './Carousel/CarouselPlaceholderItems.svelte';

	export let backdropUriCandidates: string[];
	export let posterPath: string;
	export let title: string;

	export let tagline: string;
	export let overview: string;

	let bottomHeight: number;
	let windowHeight: number;
	let imageHeight: number;
	$: imageHeight = windowHeight - bottomHeight * 0.3;

	function getBackdropUri(uris: string[]) {
		return uris[Math.max(2, Math.floor(uris.length / 8))] || uris[uris.length - 1] || '';
	}
</script>

<svelte:window bind:innerHeight={windowHeight} />

<div
	style={"background-image: url('" +
		TMDB_IMAGES_ORIGINAL +
		getBackdropUri(backdropUriCandidates) +
		"'); height: " +
		imageHeight.toFixed() +
		'px'}
	class="fixed inset-x-0 bg-center bg-cover z-[-10]"
>
	<div class="absolute inset-0 bg-darken" />
</div>

<div class="flex flex-col h-screen" transition:fade>
	<div class="flex-1 relative flex pt-24 px-4 sm:px-8">
		<div class="absolute inset-0 bg-gradient-to-t from-stone-950 to-30%" />
		<div class="z-[1] flex-1 flex justify-end gap-8 items-end max-w-screen-2xl mx-auto">
			<div
				class="aspect-[2/3] w-52 bg-center bg-cover rounded-md hidden sm:block"
				style={"background-image: url('" + TMDB_POSTER_SMALL + posterPath + "')"}
			/>
			<div class="flex-1 flex gap-4 justify-between flex-col lg:flex-row lg:items-end">
				<div>
					<div class="text-zinc-300 text-sm uppercase font-semibold flex items-center gap-1">
						<p class="flex-shrink-0">
							<slot name="title-info-1" />
						</p>
						<DotFilled />
						<p class="flex-shrink-0">
							<slot name="title-info-2" />
						</p>
						<DotFilled />
						<p class="flex-shrink-0"><slot name="title-info-3" /></p>
						<!-- <DotFilled />
							<p class="line-clamp-1">{series?.genres?.map((g) => g.name).join(', ')}</p> -->
					</div>
					<h1 class="text-4xl sm:text-5xl md:text-6xl font-semibold">{title}</h1>
				</div>
				<div class="flex-shrink-0">
					<slot name="title-right" />
				</div>
			</div>
		</div>
	</div>
	<div bind:clientHeight={bottomHeight} class="py-6 bg-stone-950">
		<div class="max-w-screen-2xl mx-auto">
			<div class="2xl:-mx-8">
				<slot name="episodes-carousel" />
			</div>
		</div>
	</div>
</div>

<div class="flex flex-col gap-6 bg-stone-950">
	<div
		class="mx-4 sm:mx-8 grid grid-cols-4 sm:grid-cols-6 gap-4 sm:gap-x-8 rounded-xl py-6 max-w-screen-2xl 2xl:mx-auto"
	>
		<slot name="info-description">
			<div
				class="flex flex-col gap-3 max-w-5xl row-span-3 col-span-4 sm:col-span-6 lg:col-span-3 mb-4 lg:mr-8"
			>
				<div class="flex gap-4 justify-between">
					<h1 class="font-semibold text-xl sm:text-2xl">{tagline}</h1>
					<!-- <div class="flex items-center gap-4">
						<a
							target="_blank"
							href={'https://www.themoviedb.org/tv/' + tmdbId}
							class="opacity-60 hover:opacity-100"
						>
							<img src="/tmdb.svg" alt="tmdb" width="25px" />
						</a>
						{#if $itemStore.item?.sonarrSeries?.titleSlug}
							<a
								target="_blank"
								href={PUBLIC_SONARR_BASE_URL +
									'/series/' +
									$itemStore.item?.sonarrSeries?.titleSlug}
								class="opacity-60 hover:opacity-100"
							>
								<img src="/sonarr.svg" alt="sonarr" width="15px" />
							</a>
						{/if}
						{#if series?.homepage}
							<a
								target="_blank"
								href={series.homepage}
								class="flex gap-1 items-center opacity-60 hover:opacity-100"
							>
								<Globe size={15} />
							</a>
						{/if} -->
				</div>
				<p class="pl-4 border-l-2 text-sm sm:text-base">{overview}</p>
			</div>
		</slot>
		<slot name="info-components" />
		<slot name="servarr-components">
			<div class="flex gap-4 flex-wrap col-span-4 sm:col-span-6 mt-4">
				<div class="placeholder h-10 w-40 rounded-xl" />
				<div class="placeholder h-10 w-40 rounded-xl" />
			</div>
		</slot>
	</div>
	<div class="max-w-screen-2xl 2xl:mx-auto">
		<div class="2xl:-mx-8">
			<Carousel gradientFromColor="from-stone-950">
				<slot name="cast-crew-carousel-title" slot="title" />
				<slot name="cast-crew-carousel">
					<CarouselPlaceholderItems />
				</slot>
			</Carousel>
		</div>
	</div>
	<div class="max-w-screen-2xl 2xl:mx-auto">
		<div class="2xl:-mx-8">
			<Carousel gradientFromColor="from-stone-950">
				<slot name="recommendations-carousel-title" slot="title" />
				<slot name="recommendations-carousel">
					<CarouselPlaceholderItems />
				</slot>
			</Carousel>
		</div>
	</div>
	<div class="max-w-screen-2xl 2xl:mx-auto">
		<div class="2xl:-mx-8">
			<Carousel gradientFromColor="from-stone-950">
				<slot name="similar-carousel-title" slot="title" />
				<slot name="similar-carousel">
					<CarouselPlaceholderItems />
				</slot>
			</Carousel>
		</div>
	</div>
</div>
