<script lang="ts">
	import type { Container } from '../actions/focusAction';

	export let container: Container;
	let registerer = container.getChildRegisterer();
</script>

<div use:registerer>MoviesPage</div>
