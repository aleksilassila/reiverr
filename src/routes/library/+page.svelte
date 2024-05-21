<script lang="ts">
	import {
		getJellyfinBackdrop,
		getJellyfinPosterUrl,
		type JellyfinItem
	} from '$lib/apis/jellyfin/jellyfinApi';
	import Button from '$lib/components/Button.svelte';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import Poster from '$lib/components/Poster/Poster.svelte';
	import { playerState } from '$lib/components/VideoPlayer/VideoPlayer';
	import { PLACEHOLDER_BACKDROP } from '$lib/constants';
	import { jellyfinItemsStore, servarrDownloadsStore } from '$lib/stores/data.store';
	import { settings } from '$lib/stores/settings.store';
	import { ChevronRight } from 'radix-icons-svelte';
	import type { ComponentProps } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { fade } from 'svelte/transition';
	import LibraryItems from './LibraryItems.svelte';
	import { capitalize } from '$lib/utils';
	import LazyImg from '$lib/components/LazyImg.svelte';

	let openNextUpTab: 'downloading' | 'nextUp' = 'downloading';
	let noItems = false;

	let showcasePromise: Promise<JellyfinItem | undefined> = jellyfinItemsStore.promise.then(
		(items) =>
			items
				?.slice()
				?.sort((a, b) =>
					(a.DateCreated || a.DateLastMediaAdded || '') <
					(b.DateCreated || b.DateLastMediaAdded || '')
						? 1
						: -1
				)?.[3]
	);

	let downloadProps: ComponentProps<Poster>[] = [];
	$: {
		const sonarrProps: ComponentProps<Poster>[] =
			$servarrDownloadsStore.sonarrDownloads?.map((item) => ({
				tvdbId: item.series.tvdbId,
				title: item.series.title || '',
				subtitle:
					`S${item.episode?.seasonNumber}E${item.episode?.episodeNumber} • ` +
					capitalize(item.status || ''),
				type: 'series',
				progress: 100 * (((item.size || 0) - (item.sizeleft || 0)) / (item.size || 1)),
				backdropUrl: item.series.images?.find((i) => i.coverType === 'poster')?.url || '',
				orientation: 'portrait'
			})) || [];

		const radarrProps: ComponentProps<Poster>[] =
			$servarrDownloadsStore.radarrDownloads?.map((item) => ({
				tmdbId: item.movie.tmdbId,
				title: item.movie.title || '',
				subtitle: capitalize(item.status || ''),
				type: 'movie',
				backdropUrl: item.movie.images?.find((i) => i.coverType === 'poster')?.url || '',
				progress: 100 * (((item.size || 0) - (item.sizeleft || 0)) / (item.size || 1)),
				orientation: 'portrait'
			})) || [];

		downloadProps = [...(sonarrProps || []), ...(radarrProps || [])];
	}
</script>

{#if noItems}
	<div
		class="h-screen flex items-center justify-center text-zinc-500 p-8"
		in:fade|global={{
			duration: $settings.animationDuration,
			delay: $settings.animationDuration
		}}
		out:fade|global={{ duration: $settings.animationDuration }}
	>
		<h1>
			{$_('library.missingConfiguration')}
		</h1>
	</div>
{:else}
	<div
		in:fade|global={{
			duration: $settings.animationDuration,
			delay: $settings.animationDuration
		}}
		out:fade|global={{ duration: $settings.animationDuration }}
	>
		<div class="relative pt-24">
			{#await showcasePromise then showcase}
				<LazyImg
					src={(showcase && getJellyfinBackdrop(showcase)) || PLACEHOLDER_BACKDROP}
					class="absolute inset-0"
				/>
			{/await}
			<div class="absolute inset-0 bg-gradient-to-t from-stone-950 to-80% to-darken" />
			<div
				class="max-w-screen-2xl mx-auto relative z-[1] px-2 md:px-8 pt-32 xl:pt-56 pb-12 overflow-hidden"
			>
				<h1
					class="absolute font-bold uppercase text-amber-200 opacity-10 bottom-12 right-8 text-9xl hidden xl:block z-[-1]"
				>
					Library
				</h1>
				<div class="flex gap-4 items-end">
					{#await showcasePromise}
						<div class="w-32 aspect-[2/3] placeholder rounded-lg shadow-lg" />
						<div class="flex flex-col gap-2">
							<div class="placeholder-text w-20">Placeholder</div>
							<div class="placeholder-text w-[50vw] text-3xl sm:text-4xl md:text-5xl">
								Placeholder
							</div>
							<div class="flex gap-2 mt-2">
								<div class="placeholder-text w-28 h-10" />
								<div class="placeholder-text w-28 h-10" />
							</div>
						</div>
					{:then showcase}
						<div
							style={"background-image: url('" +
								(showcase ? getJellyfinPosterUrl(showcase) : '') +
								"');"}
							class="w-32 aspect-[2/3] rounded-lg bg-center bg-cover flex-shrink-0 shadow-lg"
						/>
						<div>
							<p class="text-zinc-400 font-medium">Latest Addition</p>
							<h1 class="text-3xl sm:text-4xl md:text-5xl font-semibold">
								{showcase?.Name}
							</h1>
							<div class="flex gap-2 mt-4">
								<Button
									type="primary"
									on:click={() => showcase?.Id && playerState.streamJellyfinId(showcase?.Id)}
								>
									Play<ChevronRight size={20} />
								</Button>
								<Button
									href={`/${showcase?.Type === 'Movie' ? 'movie' : 'series'}/${
										showcase?.ProviderIds?.Tmdb || showcase?.ProviderIds?.Tvdb
									}`}
								>
									<span>{$_('titleShowcase.details')}</span><ChevronRight size={20} />
								</Button>
							</div>
						</div>
					{/await}
				</div>
			</div>
		</div>
	</div>

	<div
		class="py-4 px-2 md:px-8"
		in:fade|global={{
			duration: $settings.animationDuration,
			delay: $settings.animationDuration
		}}
		out:fade|global={{ duration: $settings.animationDuration }}
	>
		<div class="max-w-screen-2xl m-auto flex flex-col gap-12">
			{#if downloadProps?.length}
				<div>
					<Carousel heading="Downloading">
						{#each downloadProps as props}
							<Poster {...props} />
						{/each}
					</Carousel>
				</div>
			{/if}

			<LibraryItems />
		</div>
	</div>
{/if}
