<script lang="ts">
	import { ChevronLeft } from 'radix-icons-svelte';
	import IconButton from '../IconButton.svelte';
	import CardGrid from '../Card/CardGrid.svelte';
	import CardPlaceholder from '../Card/CardPlaceholder.svelte';
	import { capitalize } from '$lib/utils';

	export let title: string;
</script>

<div class="pt-24 p-8 bg-black">
	<div class="flex flex-col gap-1 items-start">
		<button
			class="flex items-center cursor-pointer hover:text-zinc-200 text-zinc-400 transition-colors"
			on:click={() => window?.history?.back()}
		>
			<ChevronLeft size={18} />
			<h2 class="text-sm">Back</h2>
		</button>
		<h1 class="font-bold text-5xl">{capitalize(title)}</h1>
	</div>
</div>

<div class="p-8">
	<CardGrid>
		<slot>
			{#each [...Array(20).keys()] as index (index)}
				<CardPlaceholder size="dynamic" {index} />
			{/each}
		</slot>
	</CardGrid>
</div>
