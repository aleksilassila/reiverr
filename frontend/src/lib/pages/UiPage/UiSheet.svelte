<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import Container from '$lib/components/Container.svelte';
	import { Sheet } from '$lib/components/Sheet';
	import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';

	const componentStack = useComponentStack();
</script>

<Sheet size="lg" on:close={() => componentStack.close()}>
	<h1 class="h3 mb-2">Sheet</h1>
	<p class="body mb-8">Opened with createModal. Back closes it, so does the cross.</p>
	<Container class="flex flex-col space-y-4">
		<Button on:clickOrSelect={() => componentStack.close()}>Close</Button>
		<Button type="secondary" on:clickOrSelect={() => componentStack.close()}>Also close</Button>
	</Container>
</Sheet>
