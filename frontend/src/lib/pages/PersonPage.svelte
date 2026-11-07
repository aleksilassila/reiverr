<script lang="ts">
	import type { TmdbItemDto } from '$lib/apis/reiverr/reiverr.openapi';
	import type { TmdbPersonFull } from '$lib/apis/tmdb/tmdb-api';
	import { backgroundContext } from '$lib/components/GlobalBackground/background-stack.store';
	import HeroTitleInfo from '$lib/components/HeroShowcase/HeroTitleInfo.svelte';
	import { usePageQuery } from '$lib/queries/page-query';
	import { tmdbQueries } from '$lib/queries/tmdb.queries';
	import { TMDB_POSTER_SMALL } from '../constants.js';
	import CollectionPage from './CollectionPages/CollectionPage.svelte';

	backgroundContext.createContext();

	interface Props {
		id: string;
	}

	let { id }: Props = $props();

	const personQuery = usePageQuery(tmdbQueries.person(Number(id)));

	function getInfoProperties(person: TmdbPersonFull) {
		const properties: { href?: string; label: string }[] = [];

		if (person.birthday) {
			properties.push({
				label: `Born ${new Date(person.birthday).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				})} (${Math.floor(
					(new Date().getTime() - new Date(person.birthday).getTime()) / 1000 / 60 / 60 / 24 / 365
				)} years old)`
			});
		}

		if (person.movie_credits.cast?.length || person.tv_credits.cast?.length) {
			properties.push({
				label: `${
					(person.movie_credits.cast?.length || 0) + (person.tv_credits.cast?.length || 0)
				} Credits`,
				href: `https://www.themoviedb.org/person/${id}`
			});
		}

		return properties;
	}

	/** What they acted in, or else worked on, newest first */
	function getCredits(person: TmdbPersonFull): TmdbItemDto[] {
		const credits =
			person.known_for_department === 'Acting'
				? [...(person.movie_credits.cast || []), ...(person.tv_credits.cast || [])]
				: [...(person.movie_credits.crew || []), ...(person.tv_credits.crew || [])];

		return credits.sort((a, b) =>
			// @ts-ignore
			(b.release_date ?? b.first_air_date ?? 0) > (a.release_date ?? a.first_air_date ?? 0) ? 1 : -1
		);
	}
	let person = $derived($personQuery.data);
	let infoProperties = $derived(person ? getInfoProperties(person) : []);
	let items = $derived(person ? getCredits(person) : []);
</script>

{#if person}
	<CollectionPage {items} subtitle="Person" title={person.name ?? 'Unknown'}>
		{#snippet header()}
			<div class="flex space-x-8">
				<div
					class="bg-center bg-cover rounded-xl w-44 h-64 cursor-pointer flex-shrink-0"
					style={`background-image: url("${TMDB_POSTER_SMALL + person.profile_path}")`}
				></div>

				<div class="flex flex-col justify-end">
					<HeroTitleInfo
						title={person.name ?? ''}
						overview={person.biography ?? ''}
						properties={infoProperties}
					/>
				</div>
			</div>
		{/snippet}
	</CollectionPage>
{/if}
