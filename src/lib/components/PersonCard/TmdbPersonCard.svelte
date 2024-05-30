<script lang="ts">
	import PersonCard from './PersonCard.svelte';
	import type { TmdbCredit } from '../../apis/tmdb/tmdb-api';
	import { TMDB_PROFILE_LARGE, TMDB_PROFILE_SMALL } from '../../constants';

	export let tmdbCredit: TmdbCredit;
	let subtitle = 'Uncredited';
	if ('roles' in tmdbCredit) {
		subtitle = tmdbCredit.roles?.[0]?.character || subtitle;
	} else if ('character' in tmdbCredit) {
		subtitle = tmdbCredit?.character || subtitle;
	}
</script>

<PersonCard
	tmdbId={tmdbCredit.id || -1}
	name={tmdbCredit.name || 'Unknown'}
	{subtitle}
	backdropUrl={TMDB_PROFILE_LARGE + tmdbCredit.profile_path}
	on:clickOrSelect
	on:enter
/>
