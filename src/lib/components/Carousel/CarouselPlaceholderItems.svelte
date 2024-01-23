<script lang="ts">
	import CardPlaceholder from '../Card/CardPlaceholder.svelte';
	import classNames from 'classnames';
	import Container from '../../../Container.svelte';
	import type { Readable } from 'svelte/store';
	export let size: 'dynamic' | 'md' | 'lg' = 'md';
	export let orientation: 'landscape' | 'portrait' = 'landscape';

	let focusIndex: Readable<number>;
	let focusWithin: Readable<boolean>;
</script>

<p
	class={classNames({
		'bg-blue-500': $focusWithin
	})}
>
	Index: {$focusIndex}
</p>

{#each Array(10) as _, i (i)}
	<Container
		bind:focusIndex
		bind:focusWithin
		class={classNames({
			'bg-red-500': $focusIndex === i && $focusWithin
		})}
	>
		<CardPlaceholder {size} index={i} {orientation} />
	</Container>
{/each}
