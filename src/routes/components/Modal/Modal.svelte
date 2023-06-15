<script lang="ts">
	import classNames from 'classnames';
	import { createEventDispatcher } from 'svelte';

	const dispatcher = createEventDispatcher();

	export let visible = false;
	export let close: () => void;
</script>

<div
	class={classNames('fixed inset-0 bg-[#00000088] justify-center items-center z-20', {
		hidden: !visible,
		flex: visible
	})}
	on:click|self={close}
>
	<slot />
</div>
