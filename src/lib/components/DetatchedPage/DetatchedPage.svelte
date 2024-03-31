<script>
	import Container from '../../../Container.svelte';
</script>

<Container
	navigationActions={{
		left: () => {
			console.log('Not called?');
			history.back();
			return false;
		}
	}}
	focusOnMount
	trapFocus
	class="fixed inset-0"
>
	<slot />
</Container>
