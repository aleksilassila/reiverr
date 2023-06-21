<script lang="ts">
	import type { PageData } from './$types';
	import ResourceDetails from '../../components/ResourceDetails/ResourceDetails.svelte';
	export let data: PageData;
</script>

{#if data.movie}
	<ResourceDetails movie={data.movie} showDetails={true} />
{/if}
