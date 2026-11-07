<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ContainerProps } from '$lib/components/Container.type';
	import Container from '$components/Container.svelte';
	import type { Writable } from 'svelte/store';

	type Props = Omit<ContainerProps, 'children'> & {
		tabValue: number;
		onSelect?: (detail: { value: number }) => void;
		openTab: Writable<number>;
		children?: Snippet<[{ isActive: boolean; hasFocus: boolean }]>;
	};

	let { tabValue, openTab, onSelect, children: content, ...rest }: Props = $props();

	function handleSelect() {
		openTab.set(tabValue);
		onSelect?.({ value: tabValue });
	}

	let isActive = $derived($openTab === tabValue);
</script>

<Container onEnter={handleSelect} onClickOrSelect={handleSelect} focusOnClick {...rest}>
	{#snippet children({ hasFocus })}
		{@render content?.({ isActive, hasFocus })}
	{/snippet}
</Container>
