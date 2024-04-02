<script lang="ts">
	import Container from '../../Container.svelte';
	import HeroShowcase from '../components/HeroShowcase/HeroShowcase.svelte';
	import { tmdbApi } from '../apis/tmdb/tmdb-api';
	import { getShowcasePropsFromTmdb } from '../components/HeroShowcase/HeroShowcase';
	import Carousel from '../components/Carousel/Carousel.svelte';
	import SidebarMargin from '../components/SidebarMargin.svelte';
	import { _ } from 'svelte-i18n';
	import CarouselPlaceholderItems from '../components/Carousel/CarouselPlaceholderItems.svelte';
	import TmdbCard from '../components/Card/TmdbCard.svelte';
	import Button from '../components/Button.svelte';
	import { useNavigate } from 'svelte-navigator';

	const popularMovies = tmdbApi.getPopularMovies();
	const navigate = useNavigate();
</script>

<Container focusOnMount class="flex flex-col">
	<div class="flex flex-col h-screen">
		<div class="flex-1 flex relative px-20">
			<HeroShowcase items={popularMovies.then(getShowcasePropsFromTmdb)} />
		</div>
		<div class="mt-8">
			<Carousel>
				<SidebarMargin slot="title" class="mx-4">
					<div class="text-xl font-semibold text-zinc-300">
						{$_('discover.streamingNow')}
					</div>
				</SidebarMargin>
				{#await popularMovies}
					<CarouselPlaceholderItems />
				{:then items}
					<div class="w-[4.5rem] h-1 shrink-0" />
					{#each items as item (item.id)}
						<div class="m-2">
							<TmdbCard {item} />
						</div>
					{/each}
				{/await}
			</Carousel>
		</div>
	</div>
</Container>
