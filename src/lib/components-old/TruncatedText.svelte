<script lang="ts">
	export let text: string;
	export let maxLength: number = 300;

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
			{viewAll ? 'View less' : 'View all'}
		</button>
	{:else}
		{text}
	{/if}
</p>
