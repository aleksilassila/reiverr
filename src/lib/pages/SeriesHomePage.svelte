<script lang="ts">
	import Container from '../../Container.svelte';
	import { tmdbApi } from '../apis/tmdb/tmdb-api';

	import { jellyfinApi } from '../apis/jellyfin/jellyfin-api';
	import { useRequest } from '../stores/data.store';
	import Carousel from '../components/Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '../components/Carousel/CarouselPlaceholderItems.svelte';
	import HeroShowcase from '../components/HeroShowcase/HeroShowcase.svelte';
	import { getShowcasePropsFromTmdbSeries } from '../components/HeroShowcase/HeroShowcase';
	import { scrollIntoView } from '../selectable';
	import JellyfinCard from '../components/Card/JellyfinCard.svelte';

	const { data: continueWatching, isLoading: isLoadingContinueWatching } = useRequest(
		jellyfinApi.getContinueWatchingSeries
	);
	const { data: recentlyAdded, isLoading: isLoadingRecentlyAdded } = useRequest(
		jellyfinApi.getRecentlyAdded,
		'series'
	);

	// const jellyfinItemsPromise = new Promise<JellyfinItem[]>((resolve) => {
	// 	jellyfinItemsStore.subscribe((data) => {
	// 		if (data.loading) return;
	// 		resolve(data.data || []);
	// 	});
	// });

	// const fetchCardProps = async (
	// 	items: {
	// 		name?: string;
	// 		title?: string;
	// 		id?: number;
	// 		vote_average?: number;
	// 		number_of_seasons?: number;
	// 		first_air_date?: string;
	// 		poster_path?: string;
	// 	}[],
	// 	type: TitleType | undefined = undefined
	// ): Promise<ComponentProps<Card>[]> => {
	// 	const filtered = $settings.discover.excludeLibraryItems
	// 		? items.filter(
	// 				async (item) =>
	// 					!(await jellyfinItemsPromise).find((i) => i.ProviderIds?.Tmdb === String(item.id))
	// 		  )
	// 		: items;
	//
	// 	return Promise.all(filtered.map(async (item) => getPosterProps(item, type))).then((props) =>
	// 		props.filter((p) => p.backdropUrl).map((i) => ({ ...i, openInModal: false }))
	// 	);
	// };
	//
	// const fetchNowStreaming = () =>
	// 	TmdbApiOpen.GET('/3/discover/tv', {
	// 		params: {
	// 			query: {
	// 				'air_date.gte': formatDateToYearMonthDay(new Date()),
	// 				'first_air_date.lte': formatDateToYearMonthDay(new Date()),
	// 				sort_by: 'popularity.desc',
	// 				language: $settings.language,
	// 				with_original_language: parseIncludedLanguages($settings.discover.includedLanguages)
	// 			}
	// 		}
	// 	})
	// 		.then((res) => res.data?.results || [])
	// 		.then((i) => fetchCardProps(i, 'series'));
	//
	// function parseIncludedLanguages(includedLanguages: string) {
	// 	return includedLanguages.replace(' ', '').split(',').join('|');
	// }
</script>

<Container focusOnMount class="flex flex-col">
	<div class="h-[calc(100vh-12rem)] flex px-20">
		<HeroShowcase
			items={tmdbApi.getPopularSeries().then(getShowcasePropsFromTmdbSeries)}
			on:enter={scrollIntoView({ top: 0 })}
		/>
	</div>
	<div class="mt-16">
		<Carousel scrollClass="px-20" on:enter={scrollIntoView({ vertical: 64 })}>
			<div class="text-xl font-semibold text-zinc-300" slot="header">
				{$isLoadingContinueWatching || ($isLoadingRecentlyAdded && !$continueWatching?.length)
					? 'Loading...'
					: $continueWatching?.length
					? 'Continue Watching'
					: 'Recently Added'}
			</div>
			{#if $isLoadingContinueWatching || ($isLoadingRecentlyAdded && !$continueWatching?.length)}
				<CarouselPlaceholderItems />
			{:else if $continueWatching?.length}
				<div class="flex -mx-2">
					{#each $continueWatching as item (item.Id)}
						<Container class="m-4" on:enter={scrollIntoView({ horizontal: 64 + 20 })}>
							<JellyfinCard size="lg" {item} />
						</Container>
					{/each}
				</div>
			{:else if $recentlyAdded?.length}
				<div class="flex -mx-4">
					{#each $recentlyAdded as item (item.Id)}
						<Container class="m-4" on:enter={scrollIntoView({ horizontal: 64 + 20 })}>
							<JellyfinCard size="lg" {item} />
						</Container>
					{/each}
				</div>
			{/if}
		</Carousel>
	</div>
</Container>
