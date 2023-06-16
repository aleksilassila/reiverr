<script lang="ts">
	import type { PageData } from './$types';
	import ResourceDetails from '../../components/ResourceDetails/ResourceDetails.svelte';
	import ResourceLocalDetails from '../../components/ResourceDetails/ResourceLocalDetails.svelte';
	export let data: PageData;
</script>

<ResourceDetails resource={data.movie} remoteResource={data.remoteMovie} />
<ResourceLocalDetails tmdbId={data.remoteMovie.id} />
