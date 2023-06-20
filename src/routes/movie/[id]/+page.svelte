<script lang="ts">
	import type { PageData } from './$types';
	import ResourceDetails from '../../components/ResourceDetails/ResourceDetails.svelte';
	import ResourceLocalDetails from '../../components/ResourceDetails/ResourceLocalDetails.svelte';
	export let data: PageData;
</script>

{#if data.movie}
	<ResourceDetails movie={data.movie} />
	<ResourceLocalDetails tmdbId={data.movie.id} />
{/if}
