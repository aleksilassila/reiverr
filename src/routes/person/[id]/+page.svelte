<script lang="ts">
	import type { PageData } from './$types';
	import PersonPage from './PersonPage.svelte';

	export let data: PageData;

	let personId: number;
	$: personId = Number(data.personId);
</script>

{#key personId}
	<PersonPage tmdbId={personId} />
{/key}
