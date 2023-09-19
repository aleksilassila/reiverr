<script lang="ts">
	import {
		getJellyfinBackdrop,
		getJellyfinContinueWatching,
		getJellyfinNextUp,
		type JellyfinItem
	} from '$lib/apis/jellyfin/jellyfinApi';
	import {
		getPosterProps,
		getTmdbMovie,
		getTmdbPopularMovies,
		TmdbApiOpen
	} from '$lib/apis/tmdb/tmdbApi';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '$lib/components/Carousel/CarouselPlaceholderItems.svelte';
	import GenreCard from '$lib/components/GenreCard.svelte';
	import NetworkCard from '$lib/components/NetworkCard.svelte';
	import PersonCard from '$lib/components/PersonCard/PersonCard.svelte';
	import Poster from '$lib/components/Poster/Poster.svelte';
	import TitleShowcases from '$lib/components/TitleShowcase/TitleShowcasesContainer.svelte';
	import { genres, networks } from '$lib/discover';
	import { jellyfinItemsStore } from '$lib/stores/data.store';
	import { settings } from '$lib/stores/settings.store';
	import type { TitleType } from '$lib/types';
	import { formatDateToYearMonthDay } from '$lib/utils';
	import type { ComponentProps } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { fade } from 'svelte/transition';

	let continueWatchingVisible = true;

	const tmdbPopularMoviesPromise = getTmdbPopularMovies()
		.then((movies) => Promise.all(movies.map((movie) => getTmdbMovie(movie.id || 0))))
		.then((movies) => movies.filter((m) => !!m).slice(0, 10));

	let nextUpP = getJellyfinNextUp();
	let continueWatchingP = getJellyfinContinueWatching();

	let nextUpProps = Promise.all([nextUpP, continueWatchingP])
		.then(([nextUp, continueWatching]) => [
			...(continueWatching || []),
			...(nextUp?.filter((i) => !continueWatching?.find((c) => c.SeriesId === i.SeriesId)) || [])
		])
		.then((items) =>
			Promise.all(
				items?.map(async (item) => {
					const parentSeries = await jellyfinItemsStore.promise.then((items) =>
						items.find((i) => i.Id === item.SeriesId)
					);

					return {
						tmdbId: Number(item.ProviderIds?.Tmdb) || Number(parentSeries?.ProviderIds?.Tmdb) || 0,
						jellyfinId: item.Id,
						backdropUrl: getJellyfinBackdrop(item),
						title: item.Name || '',
						progress: item.UserData?.PlayedPercentage || undefined,
						runtime: item.RunTimeTicks ? item.RunTimeTicks / 10_000_000 / 60 : 0,
						...(item.Type === 'Movie'
							? {
									type: 'movie',
									subtitle: item.Genres?.join(', ') || ''
							  }
							: {
									type: 'series',
									subtitle:
										(item?.IndexNumber && 'Episode ' + item.IndexNumber) ||
										item.Genres?.join(', ') ||
										''
							  })
					} as const;
				})
			)
		);

	nextUpProps.then((props) => {
		if (props.length === 0) {
			continueWatchingVisible = false;
		}
	});

	let showcaseIndex = 0;

	async function onNext() {
		showcaseIndex = (showcaseIndex + 1) % (await tmdbPopularMoviesPromise).length;
	}

	async function onPrevious() {
		showcaseIndex =
			(showcaseIndex - 1 + (await tmdbPopularMoviesPromise).length) %
			(await tmdbPopularMoviesPromise).length;
	}

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
			poster_path?: string;
		}[],
		type: TitleType | undefined = undefined
	): Promise<ComponentProps<Poster>[]> => {
		const filtered = $settings.discover.excludeLibraryItems
			? items.filter(
					async (item) =>
						!(await jellyfinItemsPromise).find((i) => i.ProviderIds?.Tmdb === String(item.id))
			  )
			: items;

		return Promise.all(filtered.map(async (item) => getPosterProps(item, type))).then((props) =>
			props.filter((p) => p.backdropUrl)
		);
	};

	const trendingItemsPromise = TmdbApiOpen.get('/3/trending/all/{time_window}', {
		params: {
			path: {
				time_window: 'day'
			},
			query: {
				language: $settings.language
			}
		}
	}).then((res) => res.data?.results || []);

	const fetchTrendingProps = () => trendingItemsPromise.then(fetchCardProps);

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

<TitleShowcases />

<div
	class="flex flex-col gap-12 py-6 bg-stone-950"
	in:fade|global={{
		duration: $settings.animationDuration,
		delay: $settings.animationDuration
	}}
	out:fade|global={{ duration: $settings.animationDuration }}
>
	<Carousel scrollClass="px-2 sm:px-8 2xl:px-16">
		<div slot="title" class="text-lg font-semibold text-zinc-300">
			{$_('discover.popularPeople')}
		</div>
		{#await fetchTrendingActorProps()}
			<CarouselPlaceholderItems />
		{:then props}
			{#each props as prop (prop.tmdbId)}
				<PersonCard {...prop} />
			{/each}
		{/await}
	</Carousel>
	<Carousel scrollClass="px-2 sm:px-8 2xl:px-16">
		<div slot="title" class="text-lg font-semibold text-zinc-300">
			{$_('discover.upcomingMovies')}
		</div>
		{#await fetchUpcomingMovies()}
			<CarouselPlaceholderItems />
		{:then props}
			{#each props as prop (prop.tmdbId)}
				<Poster {...prop} />
			{/each}
		{/await}
	</Carousel>
	<Carousel scrollClass="px-2 sm:px-8 2xl:px-16">
		<div slot="title" class="text-lg font-semibold text-zinc-300">
			{$_('discover.upcomingSeries')}
		</div>
		{#await fetchUpcomingSeries()}
			<CarouselPlaceholderItems />
		{:then props}
			{#each props as prop (prop.tmdbId)}
				<Poster {...prop} />
			{/each}
		{/await}
	</Carousel>
	<Carousel scrollClass="px-2 sm:px-8 2xl:px-16">
		<div slot="title" class="text-lg font-semibold text-zinc-300">
			{$_('discover.genres')}
		</div>
		{#each Object.values(genres) as genre (genre.tmdbGenreId)}
			<GenreCard {genre} />
		{/each}
	</Carousel>
	<Carousel scrollClass="px-2 sm:px-8 2xl:px-16">
		<div slot="title" class="text-lg font-semibold text-zinc-300">
			{$_('discover.newDigitalReleases')}
		</div>
		{#await fetchDigitalReleases()}
			<CarouselPlaceholderItems />
		{:then props}
			{#each props as prop (prop.tmdbId)}
				<Poster {...prop} />
			{/each}
		{/await}
	</Carousel>
	<Carousel scrollClass="px-2 sm:px-8 2xl:px-16">
		<div slot="title" class="text-lg font-semibold text-zinc-300">
			{$_('discover.streamingNow')}
		</div>
		{#await fetchNowStreaming()}
			<CarouselPlaceholderItems />
		{:then props}
			{#each props as prop (prop.tmdbId)}
				<Poster {...prop} />
			{/each}
		{/await}
	</Carousel>
	<Carousel scrollClass="px-2 sm:px-8 2xl:px-16">
		<div slot="title" class="text-lg font-semibold text-zinc-300">
			{$_('discover.TVNetworks')}
		</div>
		{#each Object.values(networks) as network (network.tmdbNetworkId)}
			<NetworkCard {network} />
		{/each}
	</Carousel>
</div>
