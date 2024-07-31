<script lang="ts">
	import type { ComponentType } from 'svelte';

	export let icon: ComponentType;
</script>

<div class="absolute inset-0 bg-secondary-800/75 flex items-center justify-center">
	<div class="rounded-full p-2.5 bg-secondary-800/75">
		<svelte:component this={icon} size={32} />
	</div>
</div>
