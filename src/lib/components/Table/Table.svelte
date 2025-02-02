<script lang="ts">
	import Container from '../Container.svelte';

	export let rows: number;
</script>

<table class="w-full grid">
	<thead>
		<slot name="header" />
	</thead>
	<Container tag="tbody" {...$$restProps}>
		<slot />
	</Container>
</table>
