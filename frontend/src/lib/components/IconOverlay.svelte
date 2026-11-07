<script lang="ts">
	import type { IconComponent } from '$lib/components/icon.type';

	interface Props {
		icon: IconComponent;
	}

	let { icon }: Props = $props();

	const SvelteComponent = $derived(icon);
</script>

<div class="absolute inset-0 bg-secondary-800/75 flex items-center justify-center">
	<div class="rounded-full p-2.5 bg-secondary-800/75">
		<SvelteComponent size={32} />
	</div>
</div>
