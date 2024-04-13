<script lang="ts">
	import Container from '../../Container.svelte';
	import { getPosterProps, tmdbApi, TmdbApiOpen } from '../apis/tmdb/tmdb-api';
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
	import {
		getShowcasePropsFromTmdbMovie,
		getShowcasePropsFromTmdbSeries
	} from '../components/HeroShowcase/HeroShowcase';
	import { scrollIntoView } from '../selectable';
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
	<div class="flex flex-col h-screen">
		<div class="flex-1 flex relative px-20">
			<HeroShowcase items={tmdbApi.getPopularSeries().then(getShowcasePropsFromTmdbSeries)} />
		</div>
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
						<Container class="m-2" on:enter={scrollIntoView({ left: 64 + 16 })}>
							<Card {...prop} />
						</Container>
					{/each}
				{/await}
			</Carousel>
		</div>
	</div>
</Container>
