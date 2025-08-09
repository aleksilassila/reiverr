<script lang="ts">
	import Container from '../Container.svelte';
</script>

<Container
	class="px-6 py-2 rounded-lg font-medium tracking-wide flex items-center bg-stone-600/50 animate-pulse"
>
	<div class="opacity-0">
		<slot>Loading...</slot>
	</div>
</Container>
