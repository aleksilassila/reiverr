<script lang="ts">
	import type { TmdbMovie, TmdbSeries } from '../../apis/tmdb/tmdb-api';
	import { TMDB_POSTER_SMALL } from '../../constants';
	import type { TitleType } from '../../types';
	import { navigate } from '../StackRouter/StackRouter';
	import Card from './Card.svelte';

	export let item:
		| Pick<TmdbMovie, 'id' | 'title' | 'poster_path' | 'runtime'>
		| Pick<TmdbSeries, 'id' | 'name' | 'poster_path'>;
	export let progress = 0;

	let title = '';
	let type: TitleType = 'movie';

	if ('title' in item) {
		title = item.title || title;
		type = 'movie';
	} else if ('name' in item) {
		title = item.name || title;
		type = 'series';
	}
</script>

<Card
	{...$$restProps}
	backdropUrl={item.poster_path ? TMDB_POSTER_SMALL + item.poster_path : undefined}
	orientation="portrait"
	size="lg"
	{title}
	{progress}
	runtime={'runtime' in item ? item.runtime : 0}
	on:enter
	on:clickOrSelect={() => navigate(`/${type}/${item.id}`)}
/>
