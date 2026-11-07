<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import Card from '../Card/Card.svelte';
	import LazyImg from '../LazyImg.svelte';
	import { navigate } from '../StackRouter/stack-router.store';
	import type { Collection } from './collections';

	interface Props {
		onEnter?: ComponentProps<typeof Card>['onEnter'];
		collection: Collection;
	}

	let { collection, onEnter }: Props = $props();
</script>

<Card
	orientation="landscape"
	onClickOrSelect={() => navigate(`/collection/${collection.route}`)}
	{onEnter}
>
	{#snippet children({ width, height })}
		{#if collection.backdropUrl}
			<LazyImg src={collection.backdropUrl} class="absolute inset-0" {width} {height} />
		{/if}
		<h1
			class="relative z-10 flex-1 h3 bg-primary-800/50 flex items-center text-center p-4 line-clamp-2"
		>
			{collection.name}
		</h1>
	{/snippet}
</Card>
