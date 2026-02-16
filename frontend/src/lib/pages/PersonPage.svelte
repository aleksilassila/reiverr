<script lang="ts">
	import type { TmdbItemDto } from '$lib/apis/reiverr/reiverr.openapi';
	import { backgroundContext } from '$lib/components/GlobalBackground/background-stack.store';
	import { tmdbApi } from '../apis/tmdb/tmdb-api';
	import { TMDB_POSTER_SMALL } from '../constants.js';
	import CollectionPage from './CollectionPages/CollectionPage.svelte';
	import HeroTitleInfo from './TitlePages/HeroTitleInfo.svelte';

	backgroundContext.createContext();

	export let id: string;

	let items: TmdbItemDto[] = [];
	let infoProperties: { href?: string; label: string }[] = [];
	let loading = true;

	$: person = tmdbApi.getPerson(Number(id));
	$: {
		person
			.then((person) => {
				if (person.birthday) {
					infoProperties.push({
						label: `Born ${new Date(person.birthday).toLocaleDateString('en-US', {
							year: 'numeric',
							month: 'long',
							day: 'numeric'
						})} (${Math.floor(
							(new Date().getTime() - new Date(person.birthday).getTime()) /
								1000 /
								60 /
								60 /
								24 /
								365
						)} years old)`
					});
				}

				if (person.movie_credits.cast?.length || person.tv_credits.cast?.length) {
					infoProperties.push({
						label: `${
							(person.movie_credits.cast?.length || 0) + (person.tv_credits.cast?.length || 0)
						} Credits`,
						href: `https://www.themoviedb.org/person/${id}`
					});
				}

				if (person.known_for_department === 'Acting') {
					items = [...(person.movie_credits.cast || []), ...(person.tv_credits.cast || [])].sort(
						(a, b) =>
							// @ts-ignore
							(b.release_date ?? b.first_air_date ?? 0) > (a.release_date ?? a.first_air_date ?? 0)
								? 1
								: -1
					);
				} else {
					items = [...(person.movie_credits.crew || []), ...(person.tv_credits.crew || [])].sort(
						(a, b) =>
							// @ts-ignore
							(b.release_date ?? b.first_air_date ?? 0) > (a.release_date ?? a.first_air_date ?? 0)
								? 1
								: -1
					);
				}
			})
			.finally(() => {
				loading = false;
			});
	}
</script>

{#await person then person}
	<CollectionPage {items} {loading} subtitle="Person" title={person.name ?? 'Unknown'}>
		<div class="flex space-x-8" slot="header">
			<div
				class="bg-center bg-cover rounded-xl w-44 h-64 cursor-pointer flex-shrink-0"
				style={`background-image: url("${TMDB_POSTER_SMALL + person.profile_path}")`}
			/>

			<div class="flex flex-col justify-end">
				<HeroTitleInfo
					title={person.name ?? ''}
					overview={person.biography ?? ''}
					properties={infoProperties}
				/>
			</div>
		</div>
	</CollectionPage>
{/await}
