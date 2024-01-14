<script lang="ts">
	import { Container } from '../actions/focusAction';

	export let container: Container;
	const registerer = container.getHtmlElementRegisterer();

	export let handleClick = () => {
		container.focus();
	};
</script>

<button use:registerer tabindex="0" on:click={handleClick} class="outline-none ring-0">
	<slot />
</button>
