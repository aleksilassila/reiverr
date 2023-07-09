<script lang="ts">
	import classNames from 'classnames';
	import { fade } from 'svelte/transition';

	export let visible = false;
	export let close: () => void;
</script>

{#if visible}
	<div
		class={classNames('fixed inset-0 bg-[#00000088] justify-center items-center z-20', {
			hidden: !visible,
			'flex overflow-hidden': visible
		})}
		on:click|self={close}
		transition:fade={{ duration: 100 }}
	>
		<slot />
	</div>
{/if}
