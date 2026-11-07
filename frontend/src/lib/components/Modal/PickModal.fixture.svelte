<script lang="ts">
	import { useComponentStack } from '../StackRouter/stack-router.store';

	// As the track modals of the video player: closes itself, then tells what was picked
	let { options, onPick }: { options: string[]; onPick: (option: string) => void } = $props();

	const { close } = useComponentStack();
</script>

{#each options as option}
	<button
		onclick={() => {
			close();
			onPick(option);
		}}
	>
		{option}
	</button>
{/each}
