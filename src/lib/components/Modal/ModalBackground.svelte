<script lang="ts">
	import { fade } from 'svelte/transition';
	import { modalStack } from './Modal';
</script>

{#if $modalStack.top}
	<div
		class="fixed inset-0 bg-stone-900 bg-opacity-50 z-[19] overflow-hidden"
		transition:fade={{ duration: 100 }}
	/>
{/if}
