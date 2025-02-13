<script lang="ts">
	import { TMDB_POSTER_SMALL } from '../constants.js';
	import { tmdbApi } from '../apis/tmdb/tmdb-api';
	import DetachedPage from '../components/DetachedPage/DetachedPage.svelte';
	import classNames from 'classnames';
	import { DotFilled } from 'radix-icons-svelte';
	import CardGrid from '../components/CardGrid.svelte';
	import TmdbCard from '../components/Card/TmdbCard.svelte';
	import Container from '$components/Container.svelte';
	import { scrollIntoView } from '../selectable';
	import HeroTitleInfo from './TitlePages/HeroTitleInfo.svelte';

	export let id: string;
	$: person = tmdbApi.getPerson(Number(id));
	$: titles = person.then((person) => {
		if (person.known_for_department === 'Acting') {
			return [...(person.movie_credits.cast || []), ...(person.tv_credits.cast || [])].sort(
				(a, b) =>
					// @ts-ignore
					(b.release_date ?? b.first_air_date ?? 0) > (a.release_date ?? a.first_air_date ?? 0)
						? 1
						: -1
			);
		} else {
			return [...(person.movie_credits.crew || []), ...(person.tv_credits.crew || [])].sort(
				(a, b) =>
					// @ts-ignore
					(b.release_date ?? b.first_air_date ?? 0) > (a.release_date ?? a.first_air_date ?? 0)
						? 1
						: -1
			);
		}
	});

	let infoProperties: { href?: string; label: string }[] = [];
	$: {
		person.then((person) => {
			if (person.birthday) {
				infoProperties.push({
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
				infoProperties.push({
					label: `${
						(person.movie_credits.cast?.length || 0) + (person.tv_credits.cast?.length || 0)
					} Credits`,
					href: `https://www.themoviedb.org/person/${id}`
				});
			}
		});
	}
</script>

<DetachedPage let:handleGoBack let:registrar>
	{#await person then person}
		<Container
			focusOnMount
			on:back={handleGoBack}
			on:mount={registrar}
			class="px-32 py-16 space-y-16"
		>
			<div class="flex space-x-8">
				<Container
					on:enter={scrollIntoView({ vertical: 128 })}
					class="bg-center bg-cover rounded-xl w-44 h-64 cursor-pointer"
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

			<CardGrid>
				{#await titles then titles}
					{#each titles as title}
						<TmdbCard item={title} on:enter={scrollIntoView({ vertical: 128 })} />
					{/each}
				{/await}
			</CardGrid>
		</Container>
	{/await}
</DetachedPage>
