<script lang="ts">
	import { TMDB_POSTER_SMALL } from '../constants.js';
	import { tmdbApi } from '../apis/tmdb/tmdb-api';
	import DetachedPage from '../components/DetachedPage/DetachedPage.svelte';
	import classNames from 'classnames';
	import { DotFilled } from 'radix-icons-svelte';
	import CardGrid from '../components/CardGrid.svelte';
	import TmdbCard from '../components/Card/TmdbCard.svelte';
	import Container from '../../Container.svelte';
	import { scrollIntoView } from '../selectable';
	import { _ } from 'svelte-i18n';


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
					<div
						class={classNames(
							'text-left font-medium tracking-wider text-stone-200 hover:text-amber-200 mt-2',
							{
								'text-4xl sm:text-5xl 2xl:text-6xl': person.name?.length || 0 < 15,
								'text-3xl sm:text-4xl 2xl:text-5xl': person.name?.length || 0 >= 15
							}
						)}
					>
						{person.name}
					</div>
					<div
						class="flex items-center gap-1 uppercase text-zinc-300 font-semibold tracking-wider mt-2 text-lg"
					>
						<p class="flex-shrink-0">
							{$_('library.personPage.born')} {new Date(person.birthday || 0).toLocaleDateString('en-US', {
								year: 'numeric',
								month: 'long',
								day: 'numeric'
							})}
						</p>
						<!-- <DotFilled />
													<p class="flex-shrink-0">{movie.runtime}</p> -->
						<DotFilled />
						<p class="flex-shrink-0">
							<a href={'https://www.themoviedb.org/person/' + id}>
								{(person.movie_credits.cast?.length || 0) + (person.tv_credits.cast?.length || 0)} Credits</a
							>
						</p>
					</div>
					<div class="text-stone-300 font-medium line-clamp-3 opacity-75 max-w-4xl mt-4 text-lg">
						{person.biography}
					</div>
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
