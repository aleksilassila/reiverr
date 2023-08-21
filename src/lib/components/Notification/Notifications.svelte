<script lang="ts">
	import { notificationStack } from '$lib/stores/notification.store';
	import { flip } from 'svelte/animate';
</script>

<div class="fixed bottom-8 right-8 z-50 flex flex-col gap-4">
	{#each $notificationStack as notification (notification.id)}
		<div animate:flip={{ duration: 500 }}>
			<svelte:component
				this={notification.component}
				id={notification.id}
				duration={notification.duration}
				{...notification.props}
			/>
		</div>
	{/each}
</div>
