<script lang="ts">
	import Container from '../../../Container.svelte';

	export let focusOnMount = false;
</script>

<Container class="flex flex-col my-16" canFocusEmpty={false} {focusOnMount}>
	<h1 class="tracking-wide text-2xl font-semibold mb-4">
		<slot name="header">Header is missing</slot>
	</h1>
	<slot>Content is missing</slot>
</Container>
