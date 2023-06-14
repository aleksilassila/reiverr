<script lang="ts">
	import type { PageData } from './$types';
	import ResourceDetails from '../../ResourceDetails/ResourceDetails.svelte';
	import ResourceDetailsControls from '../../ResourceDetailsControls.svelte';
	export let data: PageData;
	console.log('data', data);
</script>

<ResourceDetails resource={data.movie} remoteResource={data.remoteMovie} />
