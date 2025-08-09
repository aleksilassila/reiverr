<script lang="ts">
	import { flip } from 'svelte/animate';
	import { fly, fade } from 'svelte/transition';
	import { notificationStack } from './notification.store';
	import { onDestroy } from 'svelte';

	export let persistent = false;

	onDestroy(() => {
		notificationStack.destroy([]);
	});
</script>

<div class="fixed top-8 right-8 z-50 flex flex-col">
	{#each $notificationStack
		.slice(Math.max($notificationStack.length - 5, 0))
		.reverse() as notification (notification.id)}
		<div
			animate:flip={{ duration: 500 }}
			in:fly|global={{ duration: 150, x: 50 }}
			out:fade|global={{ duration: 150 }}
			class="mb-4"
		>
			<svelte:component
				this={notification.component}
				id={notification.id}
				{...notification.props}
				{persistent}
			/>
		</div>
	{/each}
</div>
