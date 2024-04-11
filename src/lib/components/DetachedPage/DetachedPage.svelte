<script>
	import Container from '../../../Container.svelte';
</script>

<Container
	on:navigate={({ detail }) => {
		if (detail.direction === 'left' && detail.options.willLeaveContainer) {
			history.back();
			detail.preventNavigation();
		}
	}}
	focusOnMount
	trapFocus
	class="fixed inset-0 z-20 bg-stone-950 overflow-y-auto"
>
	<slot />
</Container>
