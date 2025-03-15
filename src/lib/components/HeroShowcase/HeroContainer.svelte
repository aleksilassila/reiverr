<script lang="ts">
	import Container from '../Container.svelte';
</script>

<Container class="flex-1 flex" on:enter>
	<div class="absolute inset-0 flex flex-col" style={`-webkit-transform: translate3d(0,0,0);`}>
		<div class="h-screen bg-gradient-to-b from-transparent to-secondary-900" />
		<div class="flex-1 bg-secondary-900" />
	</div>
	<div class="z-10 flex-1 flex">
		<slot />
	</div>
</Container>
