<script lang="ts">
	import Container from '$components/Container.svelte';
	import { backgroundContext } from '$lib/components/GlobalBackground/background-stack.store';
	import HeroCarousel from '$lib/components/HeroShowcase/HeroCarousel.svelte';
	import { useEpisodeContext } from '$lib/stores/data/episode-data.store';
	import { Check, ExternalLink, Play } from 'radix-icons-svelte';
	import { onDestroy } from 'svelte';
	import Button from '../../components/Button/Button.svelte';
	import { PLATFORM_WEB } from '../../constants';
	import { formatThousands } from '../../utils';
	import TitleProperties from './HeroTitleInfo.svelte';
	import StreamablesView from './SeriesPage/StreamablesView.svelte';

	export let id: string; // Series tmdbId
	export let season: string;
	export let episode: string;

	const background = backgroundContext.createContext({ videoMediaId: id });

	const { componentStack, episodeData, progress, isWatched, setIsWatched, unsubscribe } =
		useEpisodeContext(id, Number(season), Number(episode)).createContext();

	let titleProperties: { href?: string; label: string }[] = [];
	$episodeData.then((episode) => {
		background?.setBackgrounds([
			{
				backdropUri: `${episode?.still_path}`
			}
		]);

		if (episode?.vote_average) {
			titleProperties.push({
				label: `${episode.vote_average.toFixed(1)} TMDB (${formatThousands(
					episode.vote_count ?? 0
				)})`,
				href: `https://www.themoviedb.org/tv/${id}/season/${season}/episode/${episode}`
			});
		}
		if (episode?.runtime) {
			titleProperties.push({ label: `${episode.runtime} Minutes` });
		}

		if (episode?.air_date) {
			titleProperties.push({
				label: `Aired on ${new Date(episode.air_date).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				})}`
			});
		}
	});

	function openStreamablesView() {
		componentStack.push({
			component: StreamablesView,
			props: {
				tmdbId: id,
				season: Number(season),
				episode: Number(episode),
				progress: $progress
			}
		});
	}

	onDestroy(() => {
		unsubscribe();
	});
</script>

{#await $episodeData then tmdbEpisode}
	<!-- <div class="absolute inset-0 flex flex-col -z-10">
		<div class="h-screen bg-gradient-to-b from-transparent to-secondary-900" />
		<div class="flex-1 bg-secondary-500" />
	</div> -->

	<Container focusOnMount class="h-screen flex flex-col justify-end mx-32 py-16">
		<HeroCarousel>
			<!-- <div class="mt-2 text-zinc-200 font-medium text-lg tracking-wider">
				Season {tmdbEpisode?.season_number} Episode {tmdbEpisode?.episode_number}
			</div> -->
			<TitleProperties properties={titleProperties} overview={tmdbEpisode?.overview ?? ''}>
				<span slot="title">
					<span class="text-secondary-400">
						{`S${tmdbEpisode?.season_number}E${tmdbEpisode?.episode_number}`}
					</span>
					{tmdbEpisode?.name ?? ''}
				</span>
			</TitleProperties>
			<Container direction="horizontal" class="flex mt-8 space-x-4" focusOnMount>
				<Button class="mr-4" on:clickOrSelect={openStreamablesView}>
					Play
					<Play size={19} slot="icon" />
				</Button>

				{#if $isWatched}
					<Button on:clickOrSelect={() => setIsWatched(false)} icon={Check}>
						Mark as Unwatched
					</Button>
				{:else}
					<Button on:clickOrSelect={() => setIsWatched(true)} icon={Check}>Mark as Watched</Button>
				{/if}

				{#if PLATFORM_WEB}
					<Button>
						Open In TMDB
						<ExternalLink size={19} slot="icon-after" />
					</Button>
				{/if}
			</Container>
		</HeroCarousel>
	</Container>
{/await}
