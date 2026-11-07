<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import type { TmdbMovie, TmdbSeries } from '../../apis/tmdb/tmdb-api';
	import { TMDB_POSTER_SMALL } from '../../constants';
	import type { TitleType } from '../../types';
	import { navigate } from '../StackRouter/stack-router.store';
	import Card from './Card.svelte';

	type Props = Omit<ComponentProps<typeof Card>, 'children'> & {
		item:
			| Pick<TmdbMovie, 'id' | 'title' | 'poster_path' | 'runtime'>
			| Pick<TmdbSeries, 'id' | 'name' | 'poster_path'>;
		progress?: number;
	};

	let { item, progress = 0, ...rest }: Props = $props();

	let title = $state('');
	let type: TitleType = $state('movie');

	if ('title' in item) {
		title = item.title || title;
		type = 'movie';
	} else if ('name' in item) {
		title = item.name || title;
		type = 'series';
	}
</script>

<Card
	{...rest}
	backdropUrl={item.poster_path ? TMDB_POSTER_SMALL + item.poster_path : undefined}
	orientation="portrait"
	size="lg"
	{title}
	{progress}
	runtime={'runtime' in item ? item.runtime : 0}
	onClickOrSelect={() => navigate(`/${type}/${item.id}`)}
/>
