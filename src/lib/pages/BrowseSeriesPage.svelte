<script lang="ts">
	import Container from '../../Container.svelte';
	import { getPosterProps, getTmdbPopularMovies, TmdbApiOpen } from '../apis/tmdb/tmdb-api';
	import { formatDateToYearMonthDay } from '../utils';
	import { settings } from '../stores/settings.store';
	import type { TitleType } from '../types';
	import type { ComponentProps } from 'svelte';
	import Card from '../components/Card/Card.svelte';
	import { type JellyfinItem } from '../apis/jellyfin/jellyfin-api';
	import { jellyfinItemsStore } from '../stores/data.store';
	import Carousel from '../components/Carousel/Carousel.svelte';
	import { _ } from 'svelte-i18n';
	import CarouselPlaceholderItems from '../components/Carousel/CarouselPlaceholderItems.svelte';
	import HeroShowcase from '../components/HeroShowcase/HeroShowcase.svelte';
	import { getShowcasePropsFromTmdb } from '../components/HeroShowcase/HeroShowcase';
	import { scrollWithOffset } from '../selectable';
	import SidebarMargin from '../components/SidebarMargin.svelte';

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
	): Promise<ComponentProps<Card>[]> => {
		const filtered = $settings.discover.excludeLibraryItems
			? items.filter(
					async (item) =>
						!(await jellyfinItemsPromise).find((i) => i.ProviderIds?.Tmdb === String(item.id))
			  )
			: items;

		return Promise.all(filtered.map(async (item) => getPosterProps(item, type))).then((props) =>
			props.filter((p) => p.backdropUrl).map((i) => ({ ...i, openInModal: false }))
		);
	};

	const fetchNowStreaming = () =>
		TmdbApiOpen.GET('/3/discover/tv', {
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

	const fetchPopularMovies = () => getTmdbPopularMovies();

	// const fetchLibraryItems = async () => {
	// 	const items = await getJellyfinItems();
	// 	const props = await fetchCardProps(items, 'series');
	// 	console.log('JellyfinItems', items, props);
	// 	return props;
	// };

	function parseIncludedLanguages(includedLanguages: string) {
		return includedLanguages.replace(' ', '').split(',').join('|');
	}
</script>

<Container focusOnMount>
	<div class="h-screen flex flex-col">
		<HeroShowcase items={getTmdbPopularMovies().then(getShowcasePropsFromTmdb)} />
		<div class="mt-8">
			<Carousel scrollClass="">
				<SidebarMargin slot="title" class="mx-4">
					<div class="text-xl font-semibold text-zinc-300">
						{$_('discover.streamingNow')}
					</div>
				</SidebarMargin>
				{#await fetchNowStreaming()}
					<CarouselPlaceholderItems />
				{:then props}
					<div class="w-[4.5rem] h-1 shrink-0" />
					{#each props as prop (prop.tmdbId)}
						<div class="m-2">
							<Card {...prop} />
						</div>
					{/each}
				{/await}
			</Carousel>
		</div>
	</div>
	<!--	<Carousel scrollClass="px-2 sm:px-8 2xl:px-16">-->
	<!--		<div slot="title" class="text-lg font-semibold text-zinc-300">-->
	<!--			{$_('discover.library')}-->
	<!--		</div>-->
	<!--		{#await fetchLibraryItems()}-->
	<!--			<CarouselPlaceholderItems />-->
	<!--		{:then props}-->
	<!--			{#each props as prop (prop.tmdbId)}-->
	<!--				<Container>-->
	<!--					<Poster {...prop} />-->
	<!--				</Container>-->
	<!--			{/each}-->
	<!--		{/await}-->
	<!--	</Carousel>-->
	<!--	<Poster-->
	<!--		backdropUrl="http://192.168.0.129:8096/Items/8cc44d55dba1495a2ffcda104286d611/Images/Primary?quality=80&fillWidth=432&tag=d026e7eb1d9ba9934c8769695e396dc4"-->
	<!--	/>-->
	<!--	<VideoPlayer jellyfinId="8cc44d55dba1495a2ffcda104286d611" />-->
</Container>
