<script lang="ts">
	import Card from './Card.svelte';
	import type { TmdbMovie2 } from '../../apis/tmdb/tmdb-api';
	import type { ComponentProps } from 'svelte';
	import { TMDB_POSTER_SMALL } from '../../constants';

	export let item: TmdbMovie2;
	const props: ComponentProps<Card> = {
		tmdbId: item.id,
		title: item.title,
		subtitle: item.release_date,
		backdropUrl: TMDB_POSTER_SMALL + item.poster_path,
		type: 'movie',
		orientation: 'portrait',
		rating: item.vote_average
	};
</script>

<Card {...props} />
