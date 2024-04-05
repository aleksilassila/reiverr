<script>
	import Container from '../../../Container.svelte';
</script>

<Container
	handleNavigateOut={{
		left: () => {
			history.back();
			return false;
		}
	}}
	focusOnMount
	trapFocus
	class="fixed inset-0 z-20 bg-stone-950 overflow-y-auto"
>
	<slot />
</Container>
