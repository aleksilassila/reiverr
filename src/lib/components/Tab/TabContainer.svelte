<script lang="ts">
	import Container from '../Container.svelte';
	import type { NavigateEvent } from '../../selectable';

	function handleNavigate({ detail }: CustomEvent<NavigateEvent>) {}
</script>

<Container on:navigate={handleNavigate}>
	<slot />
</Container>
