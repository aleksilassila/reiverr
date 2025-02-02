<script lang="ts">
	import Container from '../Container.svelte';
</script>

<Container
	direction="horizontal"
	on:enter
	class="*:sticky *:top-0 *:bg-primary-800 row-wrapper contents"
>
	<!--	<div class="absolute -inset-y-2 -inset-x-8 -z-10 bg-secondary-900" />-->
	<slot />
</Container>
