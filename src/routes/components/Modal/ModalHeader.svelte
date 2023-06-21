<script>
	import IconButton from '../IconButton.svelte';
	import { Cross2 } from 'radix-icons-svelte';

	export let text;
	export let close;
</script>

<div class="flex text-zinc-200 items-center p-3 px-5 gap-4 border-b border-zinc-700">
	<slot />
	{#if text}
		<p class="font flex-1">{text}</p>
	{/if}
	<IconButton on:click={close}>
		<Cross2 size="20" />
	</IconButton>
</div>
