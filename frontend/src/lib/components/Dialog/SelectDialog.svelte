<script lang="ts">
	import type { Snippet } from 'svelte';
	import Dialog from '../Dialog/Dialog.svelte';
	import SelectItem from '../SelectItem.svelte';
	import { useComponentStack } from '../StackRouter/stack-router.store';

	const { close } = useComponentStack();

	interface Props {
		// TODO: Add labels to the options
		title?: string;
		subtitle?: string;
		options: string[];
		selectedOption?: string | undefined;
		handleSelectOption: (option: string) => void;
		children?: Snippet;
	}

	let {
		title = 'Select',
		subtitle = '',
		options,
		selectedOption = undefined,
		handleSelectOption,
		children
	}: Props = $props();

	function handleSelect(option: string) {
		handleSelectOption(option);
		close();
	}
</script>

<Dialog>
	<div class="mb-4">
		{#if children}{@render children()}{:else}
			<h1 class="h4">{title}</h1>
			<p class="text-secondary-300">{subtitle}</p>
		{/if}
	</div>
	<div class="space-y-4">
		{#each options as option}
			<SelectItem selected={selectedOption === option} onClickOrSelect={() => handleSelect(option)}>
				{option}
			</SelectItem>
		{/each}
	</div>
</Dialog>
