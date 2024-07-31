<script lang="ts">
	import { Selectable } from '../selectable';

	export let container: Selectable;
	const registerer = container.getRegisterer();

	export let handleClick = () => {
		container.focus();
	};
</script>

<button use:registerer on:click={handleClick} class="outline-none ring-0">
	<slot />
</button>
