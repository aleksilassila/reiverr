<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import Container from '$lib/components/Container.svelte';
	import { Sheet } from '$lib/components/Sheet';
	import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';
	import type { MediaType } from '$lib/queries/query-client';
	import { removeFromContinueWatching } from '$lib/queries/user-data.queries';
	import { Minus } from 'radix-icons-svelte';

	interface Props {
		mediaType: MediaType;
		tmdbId: string;
		title: string;
	}

	let { mediaType, tmdbId, title }: Props = $props();

	const componentStack = useComponentStack();

	async function remove() {
		await removeFromContinueWatching(mediaType, tmdbId);
		componentStack.close();
	}
</script>

<Sheet size="lg" onClose={() => componentStack.close()}>
	<div class="text-secondary-400 font-medium text-lg">Continue Watching</div>
	<h1 class="h3 mb-8">{title}</h1>

	<Container class="flex flex-col space-y-4">
		<Button icon={Minus} type="primary-dark" action={remove} focusOnMount>
			Remove from Continue Watching
		</Button>
	</Container>
</Sheet>
