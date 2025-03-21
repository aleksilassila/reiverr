<script lang="ts">
	import Container from '$components/Container.svelte';
	import { createBackgroundPage } from '$lib/components/GlobalBackground/BackgroundStack';
	import HeroCarousel from '$lib/components/HeroShowcase/HeroCarousel.svelte';
	import { type StackRouterPageProps } from '$lib/components/StackRouter/StackRouterPage.type';
	import { tmdbEpisodeDataStore } from '$lib/stores/data.store';
	import { useEpisodeUserData } from '$lib/stores/media-user-data.store';
	import { Check, ExternalLink, Play } from 'radix-icons-svelte';
	import { onDestroy } from 'svelte';
	import Button from '../../components/Button.svelte';
	import { PLATFORM_WEB, TMDB_IMAGES_ORIGINAL } from '../../constants';
	import { formatThousands } from '../../utils';
	import TitleProperties from './HeroTitleInfo.svelte';

	export let id: string; // Series tmdbId
	export let season: string;
	export let episode: string;

	export let handleGoBack: StackRouterPageProps['handleGoBack'];
	export let registrar: StackRouterPageProps['registrar'];

	const background = createBackgroundPage({ mediaId: id });
	const { promise: tmdbEpisode, unsubscribe: unsubscribeTmdbEpisode } =
		tmdbEpisodeDataStore.subscribe(Number(id), Number(season), Number(episode));

	const {
		progress,
		handleAutoplay,
		handleOpenStreamSelector,
		canStream,
		isWatched,
		toggleIsWatched,
		unsubscribe
	} = useEpisodeUserData(id, Number(season), Number(episode));

	let titleProperties: { href?: string; label: string }[] = [];
	$tmdbEpisode.then((episode) => {
		background?.setBackgrounds([
			{
				backdropUrl: `${TMDB_IMAGES_ORIGINAL}${episode?.still_path}`
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

	onDestroy(() => {
		unsubscribe();
		unsubscribeTmdbEpisode();
	});
</script>

{#await $tmdbEpisode then tmdbEpisode}
	<!-- <div class="absolute inset-0 flex flex-col -z-10">
		<div class="h-screen bg-gradient-to-b from-transparent to-secondary-900" />
		<div class="flex-1 bg-secondary-500" />
	</div> -->

	<Container focusOnMount class="h-screen flex flex-col justify-end mx-32 py-16">
		<HeroCarousel>
			<div class="mt-2 text-zinc-200 font-medium text-lg tracking-wider">
				Season {tmdbEpisode?.season_number} Episode {tmdbEpisode?.episode_number}
			</div>
			<TitleProperties
				title={tmdbEpisode?.name ?? ''}
				properties={titleProperties}
				overview={tmdbEpisode?.overview ?? ''}
			/>
			<Container
				direction="horizontal"
				class="flex mt-8 space-x-4"
				focusOnMount
				on:back={handleGoBack}
				on:mount={registrar}
			>
				<Button
					class="mr-4"
					action={handleAutoplay}
					secondaryAction={handleOpenStreamSelector}
					disabled={!$canStream}
				>
					Play
					<Play size={19} slot="icon" />
				</Button>

				<Button action={toggleIsWatched}>
					{#if $isWatched}
						Mark as Unwatched
					{:else}
						Mark as Watched
					{/if}
					<Check slot="icon" size={19} />
				</Button>

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
