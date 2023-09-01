<script lang="ts">
	import type { JellyfinItem } from '$lib/apis/jellyfin/jellyfinApi';
	import { TmdbApiOpen, getTmdbItemBackdrop, getTmdbMovieBackdrop } from '$lib/apis/tmdb/tmdbApi';
	import Card from '$lib/components/Card/Card.svelte';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '$lib/components/Carousel/CarouselPlaceholderItems.svelte';
	import GenreCard from '$lib/components/GenreCard.svelte';
	import NetworkCard from '$lib/components/NetworkCard.svelte';
	import PeopleCard from '$lib/components/PeopleCard/PeopleCard.svelte';
	import Poster from '$lib/components/Poster/Poster.svelte';
	import { TMDB_BACKDROP_SMALL } from '$lib/constants';
	import { genres, networks } from '$lib/discover';
	import { jellyfinItemsStore } from '$lib/stores/data.store';
	import { settings } from '$lib/stores/settings.store';
	import type { TitleType } from '$lib/types';
	import { formatDateToYearMonthDay } from '$lib/utils';
	import type { ComponentProps } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { fade } from 'svelte/transition';

	const jellyfinItemsPromise = new Promise<JellyfinItem[]>((resolve) => {
		jellyfinItemsStore.subscribe((data) => {
			if (data.loading) return;
			resolve(data.data || []);
		});
	});

	const fetchCardProps = async (
		items: {
			name?: string;
			title?: string;
			id?: number;
			vote_average?: number;
			number_of_seasons?: number;
			first_air_date?: string;
		}[],
		type: TitleType | undefined = undefined
	): Promise<ComponentProps<Poster>[]> => {
		const filtered = $settings.discover.excludeLibraryItems
			? items.filter(
					async (item) =>
						!(await jellyfinItemsPromise).find((i) => i.ProviderIds?.Tmdb === String(item.id))
			  )
			: items;

		return Promise.all(
			filtered.map(async (item) => {
				const backdropUri = await getTmdbMovieBackdrop(item.id || 0);
				const t =
					type ||
					(item?.number_of_seasons === undefined && item?.first_air_date === undefined
						? 'movie'
						: 'series');
				return {
					tmdbId: item.id || 0,
					title: item.title || item.name || '',
					// subtitle: item.subtitle || '',
					rating: item.vote_average || undefined,
					size: 'md',
					backdropUrl: backdropUri ? TMDB_BACKDROP_SMALL + backdropUri : '',
					type: t
				} as const;
			})
		).then((props) => props.filter((p) => p.backdropUrl));
	};

	const fetchTrendingProps = () =>
		TmdbApiOpen.get('/3/trending/all/{time_window}', {
			params: {
				path: {
					time_window: 'day'
				},
				query: {
					language: $settings.language
				}
			}
		})
			.then((res) => res.data?.results || [])
			.then(fetchCardProps);

	const fetchTrendingActorProps = () =>
		TmdbApiOpen.get('/3/trending/person/{time_window}', {
			params: {
				path: {
					time_window: 'week'
				}
			}
		})
			.then((res) => res.data?.results || [])
			.then((actors) =>
				actors
					.filter((a) => a.profile_path)
					.map((actor) => ({
						tmdbId: actor.id || 0,
						backdropUri: actor.profile_path || '',
						name: actor.name || '',
						subtitle: actor.known_for_department || ''
					}))
			);

	const fetchUpcomingMovies = () =>
		TmdbApiOpen.get('/3/discover/movie', {
			params: {
				query: {
					'primary_release_date.gte': formatDateToYearMonthDay(new Date()),
					sort_by: 'popularity.desc',
					language: $settings.language,
					region: $settings.discover.region,
					with_original_language: parseIncludedLanguages($settings.discover.includedLanguages)
				}
			}
		})
			.then((res) => res.data?.results || [])
			.then(fetchCardProps);

	const fetchUpcomingSeries = () =>
		TmdbApiOpen.get('/3/discover/tv', {
			params: {
				query: {
					'first_air_date.gte': formatDateToYearMonthDay(new Date()),
					sort_by: 'popularity.desc',
					language: $settings.language,
					with_original_language: parseIncludedLanguages($settings.discover.includedLanguages)
				}
			}
		})
			.then((res) => res.data?.results || [])
			.then((i) => fetchCardProps(i, 'series'));

	const fetchDigitalReleases = () =>
		TmdbApiOpen.get('/3/discover/movie', {
			params: {
				query: {
					with_release_type: 4,
					sort_by: 'popularity.desc',
					'release_date.lte': formatDateToYearMonthDay(new Date()),
					language: $settings.language,
					with_original_language: parseIncludedLanguages($settings.discover.includedLanguages)
					// region: $settings.discover.region
				}
			}
		})
			.then((res) => res.data?.results || [])
			.then(fetchCardProps);

	const fetchNowStreaming = () =>
		TmdbApiOpen.get('/3/discover/tv', {
			params: {
				query: {
					'air_date.gte': formatDateToYearMonthDay(new Date()),
					'first_air_date.lte': formatDateToYearMonthDay(new Date()),
					sort_by: 'popularity.desc',
					language: $settings.language,
					with_original_language: parseIncludedLanguages($settings.discover.includedLanguages)
				}
			}
		})
			.then((res) => res.data?.results || [])
			.then((i) => fetchCardProps(i, 'series'));

	function parseIncludedLanguages(includedLanguages: string) {
		return includedLanguages.replace(' ', '').split(',').join('|');
	}
</script>

<div
	class="pt-24 bg-stone-950 pb-8"
	in:fade|global={{
		duration: $settings.animationDuration,
		delay: $settings.animationDuration
	}}
	out:fade|global={{ duration: $settings.animationDuration }}
>
	<div class="max-w-screen-2xl mx-auto">
		<Carousel
			gradientFromColor="from-stone-950"
			heading={$_('discover.trending')}
			class="mx-2 sm:mx-8 2xl:mx-0"
		>
			{#await fetchTrendingProps()}
				<CarouselPlaceholderItems size="lg" />
			{:then props}
				{#each props as prop (prop.tmdbId)}
					<Poster {...prop} size="lg" />
				{/each}
			{/await}
		</Carousel>
	</div>
</div>

<div
	class="flex flex-col gap-12 max-w-screen-2xl mx-auto py-4"
	in:fade|global={{
		duration: $settings.animationDuration,
		delay: $settings.animationDuration
	}}
	out:fade|global={{ duration: $settings.animationDuration }}
>
	<Carousel class="mx-2 sm:mx-8 2xl:mx-0" heading={$_('discover.popularPeople')}>
		{#await fetchTrendingActorProps()}
			<CarouselPlaceholderItems />
		{:then props}
			{#each props as prop (prop.tmdbId)}
				<PeopleCard {...prop} />
			{/each}
		{/await}
	</Carousel>
	<Carousel class="mx-2 sm:mx-8 2xl:mx-0" heading={$_('discover.upcomingMovies')}>
		{#await fetchUpcomingMovies()}
			<CarouselPlaceholderItems />
		{:then props}
			{#each props as prop (prop.tmdbId)}
				<Poster {...prop} />
			{/each}
		{/await}
	</Carousel>
	<Carousel class="mx-2 sm:mx-8 2xl:mx-0" heading={$_('discover.upcomingSeries')}>
		{#await fetchUpcomingSeries()}
			<CarouselPlaceholderItems />
		{:then props}
			{#each props as prop (prop.tmdbId)}
				<Poster {...prop} />
			{/each}
		{/await}
	</Carousel>
	<Carousel class="mx-2 sm:mx-8 2xl:mx-0" heading={$_('discover.genres')}>
		{#each Object.values(genres) as genre (genre.tmdbGenreId)}
			<GenreCard {genre} />
		{/each}
	</Carousel>
	<Carousel class="mx-2 sm:mx-8 2xl:mx-0" heading={$_('discover.newDigitalReleases')}>
		{#await fetchDigitalReleases()}
			<CarouselPlaceholderItems />
		{:then props}
			{#each props as prop (prop.tmdbId)}
				<Poster {...prop} />
			{/each}
		{/await}
	</Carousel>
	<Carousel class="mx-2 sm:mx-8 2xl:mx-0" heading={$_('discover.streamingNow')}>
		{#await fetchNowStreaming()}
			<CarouselPlaceholderItems />
		{:then props}
			{#each props as prop (prop.tmdbId)}
				<Poster {...prop} />
			{/each}
		{/await}
	</Carousel>
	<Carousel class="mx-2 sm:mx-8 2xl:mx-0" heading={$_('discover.TVNetworks')}>
		{#each Object.values(networks) as network (network.tmdbNetworkId)}
			<NetworkCard {network} />
		{/each}
	</Carousel>
</div>
