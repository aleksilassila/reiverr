<script lang="ts">
	import Dialog from '../Dialog/Dialog.svelte';
	import type { JellyfinUser } from '../../apis/jellyfin/jellyfin-api';
	import SelectItem from '../SelectItem.svelte';
	import { useComponentStack } from '../StackRouter/stack-router.store';

	const { close } = useComponentStack();

	// TODO: Add labels to the options
	export let title: string = 'Select';
	export let subtitle: string = '';
	export let options: string[];
	export let selectedOption: string | undefined = undefined;
	export let handleSelectOption: (option: string) => void;

	function handleSelect(option: string) {
		handleSelectOption(option);
		close();
	}
</script>

<Dialog>
	<div class="mb-4">
		<slot>
			<h1 class="h4">{title}</h1>
			<p class="text-secondary-300">{subtitle}</p>
		</slot>
	</div>
	<div class="space-y-4">
		{#each options as option}
			<SelectItem
				selected={selectedOption === option}
				on:clickOrSelect={() => handleSelect(option)}
			>
				{option}
			</SelectItem>
		{/each}
	</div>
</Dialog>
