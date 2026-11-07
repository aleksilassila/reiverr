<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { notificationStack } from './notification.store';
	import { onDestroy } from 'svelte';

	interface Props {
		persistent?: boolean;
	}

	let { persistent = false }: Props = $props();

	onDestroy(() => {
		notificationStack.destroy();
	});
</script>

<div class="fixed top-8 right-8 z-50 flex flex-col">
	{#each $notificationStack
		.slice(Math.max($notificationStack.length - 5, 0))
		.reverse() as notification (notification.id)}
		<div in:fly|global={{ duration: 150, x: 50 }} out:fade|global={{ duration: 150 }} class="mb-4">
			<notification.component id={notification.id} {...notification.props} {persistent} />
		</div>
	{/each}
</div>
