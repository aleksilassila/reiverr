<script lang="ts">
	import Container from '$components/Container.svelte';
	import type { SeasonEpisodeDto } from '$lib/apis/reiverr/reiverr.openapi';
	import { backgroundContext } from '$lib/components/GlobalBackground/background-stack.store';
	import HeroCarousel from '$lib/components/HeroShowcase/HeroCarousel.svelte';
	import { usePageQuery } from '$lib/queries/page-query';
	import { seriesQueries, setEpisodeWatched } from '$lib/queries/series.queries';
	import { Check, ExternalLink, Play } from 'radix-icons-svelte';
	import Button from '../../components/Button/Button.svelte';
	import { PLATFORM_WEB } from '../../constants';
	import { formatThousands } from '../../utils';
	import TitleProperties from './HeroTitleInfo.svelte';
	import { playEpisode } from './play-media';

	export let id: string; // Series tmdbId
	export let season: string;
	export let episode: string;

	const seasonNumber = Number(season);
	const episodeNumber = Number(episode);

	const background = backgroundContext.createContext({ videoMediaId: id });
	const tmdbSeries = usePageQuery(seriesQueries.metadata(id));
	const userData = usePageQuery(seriesQueries.userData(id));

	$: tmdbEpisode = $tmdbSeries.data?.seasons
		?.map((s) => s.episodes ?? [])
		.flat()
		.find((e) => e.season_number === seasonNumber && e.episode_number === episodeNumber);
	$: playState = $userData.data?.playStates.find(
		(p) => p.season === seasonNumber && p.episode === episodeNumber
	);
	$: isWatched = playState?.watched ?? false;
	$: progress = playState?.progress ?? 0;

	$: if (tmdbEpisode) background.setBackgrounds([{ backdropUri: `${tmdbEpisode.still_path}` }]);
	$: titleProperties = tmdbEpisode ? getTitleProperties(tmdbEpisode) : [];

	function getTitleProperties(episode: SeasonEpisodeDto) {
		const properties: { href?: string; label: string }[] = [];

		if (episode.vote_average) {
			properties.push({
				label: `${episode.vote_average.toFixed(1)} TMDB (${formatThousands(
					episode.vote_count ?? 0
				)})`,
				href: `https://www.themoviedb.org/tv/${id}/season/${season}/episode/${episodeNumber}`
			});
		}
		if (episode.runtime) {
			properties.push({ label: `${episode.runtime} Minutes` });
		}

		if (episode.air_date) {
			properties.push({
				label: `Aired on ${new Date(episode.air_date).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				})}`
			});
		}

		return properties;
	}

	const play = () =>
		playEpisode({
			tmdbId: id,
			season: seasonNumber,
			episode: episodeNumber,
			title: tmdbEpisode?.name ?? '',
			subtitle: `Season ${season} Episode ${episode}`,
			progress,
			playMedia: background.playMedia
		});
</script>

{#if tmdbEpisode}
	<!-- <div class="absolute inset-0 flex flex-col -z-10">
		<div class="h-screen bg-gradient-to-b from-transparent to-secondary-900" />
		<div class="flex-1 bg-secondary-500" />
	</div> -->

	<Container focusOnMount class="h-screen flex flex-col justify-end mx-32 py-16">
		<HeroCarousel>
			<!-- <div class="mt-2 text-zinc-200 font-medium text-lg tracking-wider">
				Season {tmdbEpisode?.season_number} Episode {tmdbEpisode?.episode_number}
			</div> -->
			<TitleProperties properties={titleProperties} overview={tmdbEpisode.overview ?? ''}>
				<span slot="title">
					<span class="text-secondary-400">
						{`S${tmdbEpisode.season_number}E${tmdbEpisode.episode_number}`}
					</span>
					{tmdbEpisode.name ?? ''}
				</span>
			</TitleProperties>
			<Container direction="horizontal" class="flex mt-8 space-x-4" focusOnMount>
				<Button class="mr-4" action={play}>
					Play
					<Play size={19} slot="icon" />
				</Button>

				{#if isWatched}
					<Button
						action={() => setEpisodeWatched(id, seasonNumber, episodeNumber, false)}
						icon={Check}
					>
						Mark as Unwatched
					</Button>
				{:else}
					<Button
						action={() => setEpisodeWatched(id, seasonNumber, episodeNumber, true)}
						icon={Check}
					>
						Mark as Watched
					</Button>
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
{/if}
