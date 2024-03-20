<script lang="ts">
	import Container from '../../Container.svelte';

	export let id: string;
</script>

<Container focusOnMount>
	<Container>
		<div>
			Series page for id: {id}
		</div>
	</Container>
	<Container>This is something</Container>
	<Container on:click={() => history.back()}>Go back</Container>
</Container>
