<script lang="ts">
	import type { PageData } from './$types';
	import ResourceDetails from '../../ResourceDetails/ResourceDetails.svelte';
	export let data: PageData;
</script>

<ResourceDetails trailer={false} resource={data.movie} remoteResource={data.remoteMovie} />
