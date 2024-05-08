<script lang="ts">
	import Container from '../../../Container.svelte';
</script>

<Container focusOnMount trapFocus class="fixed inset-0">
	<slot />
</Container>
