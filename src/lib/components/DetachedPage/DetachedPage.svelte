<script>
	import Container from '../../../Container.svelte';
</script>

<Container
	navigationActions={{
		left: () => {
			history.back();
			return false;
		}
	}}
	focusOnMount
	trapFocus
	class="fixed inset-0 z-20"
>
	<slot />
</Container>
