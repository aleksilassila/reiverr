<script lang="ts">
	import { Container } from '../actions/focusAction';

	export let container: Container;
	const registerer = container.getRegisterer();

	export let handleClick = () => {
		container.focus();
	};
</script>

<button use:registerer on:click={handleClick} class="outline-none ring-0">
	<slot />
</button>
