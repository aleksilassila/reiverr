<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import Card from '$lib/components/Card/Card.svelte';
	import { TMDB_BACKDROP_SMALL } from '$lib/constants';

	type Props = Omit<ComponentProps<typeof Card>, 'children'> & {
		backdropUri: string;
	};

	let { backdropUri, ...rest }: Props = $props();
</script>

<Card {...rest} backdropUrl={TMDB_BACKDROP_SMALL + backdropUri} orientation="landscape" size="sm" />
