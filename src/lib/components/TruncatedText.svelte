<script lang="ts">
	export let text: string;
	export let maxLength: number = 300;
	import { _ } from 'svelte-i18n';

	let viewAll = false;
</script>

<p class={$$restProps.class}>
	{#if text.length > maxLength}
		{#if viewAll}
			{text}
		{:else}
			{text.slice(0, maxLength).trim()}...
		{/if}
		<button
			class="underline hover:text-zinc-100 text-zinc-400"
			on:click={() => (viewAll = !viewAll)}
		>
			{viewAll ? $_('library.content.viewLess') : $_('library.content.viewAll')}
		</button>
	{:else}
		{text}
	{/if}
</p>
