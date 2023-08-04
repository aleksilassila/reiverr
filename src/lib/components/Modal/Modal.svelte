<script lang="ts">
	import { onMount } from 'svelte';
	import { modalStack } from './Modal';

	// export let visible = false;
	export let close: () => void;
	export let id: Symbol;

	function handleShortcuts(event: KeyboardEvent) {
		if (event.key === 'Escape' && $modalStack.top === id) {
			close();
		}
	}

	onMount(() => {
		modalStack.push(id);
	});
</script>

<svelte:window on:keydown={handleShortcuts} />
<svelte:head>
	{#if $modalStack.top}
		<style>
			body {
				overflow: hidden;
			}
		</style>
	{/if}
</svelte:head>

{#if $modalStack.top === id}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="fixed inset-0 justify-center items-center z-20 overflow-hidden flex"
		on:click|self={close}
	>
		<slot />
	</div>
{/if}
