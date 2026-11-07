<script lang="ts">
	import type { ContainerProps } from '$lib/components/Container.type';
	import PersonCard from './PersonCard.svelte';
	import type { TmdbCredit } from '../../apis/tmdb/tmdb-api';
	import { TMDB_PROFILE_LARGE, TMDB_PROFILE_SMALL } from '../../constants';

	type Props = Omit<ContainerProps, 'children'> & {
		tmdbCredit: TmdbCredit;
	};

	let { tmdbCredit, ...rest }: Props = $props();
	let subtitle = $state('Uncredited');
	if ('roles' in tmdbCredit) {
		subtitle = tmdbCredit.roles?.[0]?.character || subtitle;
	} else if ('character' in tmdbCredit) {
		subtitle = tmdbCredit?.character || subtitle;
	}
</script>

<PersonCard
	{...rest}
	tmdbId={tmdbCredit.id || -1}
	name={tmdbCredit.name || 'Unknown'}
	{subtitle}
	backdropUrl={TMDB_PROFILE_LARGE + tmdbCredit.profile_path}
/>
