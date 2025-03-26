<script lang="ts">
	import Container from '$components/Container.svelte';
	import { createEventDispatcher } from 'svelte';
	import type { Writable } from 'svelte/store';

	export let tabValue: number;
	export let openTab: Writable<number>;

	const dispatch = createEventDispatcher();

	function handleSelect() {
		openTab.set(tabValue);
		dispatch('select', { value: tabValue });
	}

	$: isActive = $openTab === tabValue;
</script>

<Container
	on:enter={handleSelect}
	on:clickOrSelect={handleSelect}
	let:hasFocus
	focusOnClick
	{...$$restProps}
>
	<slot {isActive} {hasFocus} />
</Container>
