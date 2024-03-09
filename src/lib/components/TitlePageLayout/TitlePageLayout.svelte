<script lang="ts">
	import { TMDB_IMAGES_ORIGINAL, TMDB_POSTER_SMALL } from '$lib/constants';
	import type { TitleId, TitleType } from '$lib/types';
	import classNames from 'classnames';
	import { ChevronLeft, Cross2, DotFilled, ExternalLink } from 'radix-icons-svelte';
	import Carousel from '../Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '../Carousel/CarouselPlaceholderItems.svelte';
	import IconButton from '../IconButton.svelte';
	import LazyImg from '../LazyImg.svelte';
	import TruncatedText from '../TruncatedText.svelte';

	export let isModal = false;
	export let handleCloseModal: () => void = () => {};

	export let titleInformation:
		| {
				tmdbId: number;
				type: TitleType;
				title: string;
				tagline: string;
				overview: string;
				backdropUriCandidates: string[];
				posterPath: string;
		  }
		| undefined = undefined;

	let topHeight: number;
	let bottomHeight: number;
	let windowHeight: number;
	let imageHeight: number;
	$: imageHeight = isModal && topHeight ? topHeight : windowHeight - bottomHeight * 0.3;

	function getBackdropUri(uris: string[]) {
		return uris[Math.max(2, Math.floor(uris.length / 8))] || uris[uris.length - 1] || '';
	}
</script>

<svelte:window bind:outerHeight={windowHeight} />

<!-- Desktop -->
<div
	style={'height: ' + imageHeight.toFixed() + 'px'}
	class={classNames('hidden sm:block inset-x-0 bg-center bg-cover bg-stone-950', {
		absolute: isModal,
		fixed: !isModal
	})}
>
	{#if titleInformation}
		<LazyImg
			src={TMDB_IMAGES_ORIGINAL + getBackdropUri(titleInformation.backdropUriCandidates)}
			class="h-full"
		>
			<div class="absolute inset-0 bg-darken" />
		</LazyImg>
	{/if}
</div>

<!-- Mobile -->
<div
	style={'height: ' + imageHeight.toFixed() + 'px'}
	class="sm:hidden fixed inset-x-0 bg-center bg-cover bg-stone-950"
>
	{#if titleInformation}
		<LazyImg src={TMDB_IMAGES_ORIGINAL + titleInformation.posterPath} class="h-full">
			<div class="absolute inset-0 bg-darken" />
		</LazyImg>
	{/if}
</div>

<div class="flex flex-col min-h-screen">
	<div
		class={classNames('flex flex-col relative z-[1]', {
			'h-[85vh] sm:h-screen': !isModal,
			'': isModal
		})}
	>
		<div
			class={classNames('flex-1 relative flex pt-24 px-2 sm:px-4 lg:px-8 pb-6', {
				'min-h-[60vh]': isModal
			})}
			bind:clientHeight={topHeight}
		>
			{#if isModal}
				{#if titleInformation}
					<a
						href={`/${titleInformation.type}/${titleInformation.tmdbId}`}
						class="absolute top-8 right-4 sm:right-8 z-10"
					>
						<IconButton>
							<ExternalLink size={20} />
						</IconButton>
					</a>
				{/if}
				<div class="absolute top-8 left-4 sm:left-8 z-10">
					<button class="flex items-center sm:hidden font-medium" on:click={handleCloseModal}>
						<ChevronLeft size={20} />
						Back
					</button>
					<div class="hidden sm:block">
						<IconButton on:click={handleCloseModal}>
							<Cross2 size={20} />
						</IconButton>
					</div>
				</div>
			{/if}
			<div class="absolute inset-0 bg-gradient-to-t from-stone-950 to-30%" />
			<div class="z-[1] flex-1 flex justify-end gap-8 items-end max-w-screen-2xl mx-auto">
				{#if titleInformation}
					<div
						class="aspect-[2/3] w-52 bg-center bg-cover rounded-md hidden sm:block"
						style={"background-image: url('" +
							TMDB_POSTER_SMALL +
							titleInformation.posterPath +
							"')"}
					/>
				{:else}
					<div
						class="aspect-[2/3] w-52 bg-center bg-cover rounded-md hidden sm:block placeholder"
					/>
				{/if}
				<div class="flex-1 flex gap-4 justify-between flex-col lg:flex-row lg:items-end">
					<div>
						<div class="text-zinc-300 text-sm uppercase font-semibold flex items-center gap-1">
							<slot name="title-info">
								<div class="placeholder-text">Placeholder Long</div>
							</slot>
						</div>
						{#if titleInformation}
							<h1 class="text-4xl sm:text-5xl md:text-6xl font-semibold">
								{titleInformation.title}
							</h1>
						{:else}
							<h1 class="text-4xl sm:text-5xl md:text-6xl placeholder-text mt-2">Placeholder</h1>
						{/if}
					</div>
					<div class="flex-shrink-0">
						<slot name="title-right" />
					</div>
				</div>
			</div>
		</div>
		<div bind:clientHeight={bottomHeight} class="pb-6 bg-stone-950">
			<div class="max-w-screen-2xl mx-auto">
				<slot name="episodes-carousel" />
			</div>
		</div>
	</div>

	<div
		class={classNames(
			'flex-1 flex flex-col gap-6 bg-stone-950 px-2 sm:px-4 lg:px-8 pb-6 relative',
			{
				'2xl:px-0': !isModal
			}
		)}
	>
		<div
			class="grid grid-cols-4 sm:grid-cols-6 gap-4 sm:gap-x-8 rounded-xl py-4 max-w-screen-2xl 2xl:mx-auto"
		>
			<slot name="info-description">
				<div
					class="flex flex-col gap-3 max-w-5xl row-span-3 col-span-4 sm:col-span-6 lg:col-span-3 mb-4 lg:mr-8"
				>
					{#if titleInformation}
						<div class="flex gap-4 justify-between">
							<h1 class="font-semibold text-xl sm:text-2xl">{titleInformation.tagline}</h1>
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
						<TruncatedText
							class="pl-4 border-l-2 text-sm sm:text-base text-zinc-300"
							text={titleInformation.overview}
						/>
					{:else}
						<div class="flex gap-4 justify-between">
							<h1 class="font-semibold text-xl sm:text-2xl placeholder-text">Placeholder</h1>
						</div>
						<div class="flex">
							<div class="mr-4 placeholder w-1 flex-shrink-0 rounded" />
							<p class="text-sm sm:text-base placeholder-text">
								Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur sit amet sem eget
								dolor lobortis mollis. Aliquam semper imperdiet mi nec viverra. Praesent ac ligula
								congue, aliquam diam nec, ullamcorper libero. Nunc mattis rhoncus justo, ac pretium
								urna vehicula et.
							</p>
						</div>
					{/if}
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
		<div class="flex flex-col gap-6 max-w-screen-2xl 2xl:mx-auto">
			<!-- TODO: Remove mx-auto as it's bugged when in modal and on firefox -->
			<slot name="carousels" />
		</div>
	</div>
</div>
