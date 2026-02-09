<script lang="ts">
	import Container from '../Container.svelte';
	import Button from '../Button/Button.svelte';
	import Dialog from './Dialog.svelte';
	import { useComponentStack } from '../StackRouter/stack-router.store';

	type ActionFn = (() => Promise<any>) | (() => any);
	const { close } = useComponentStack();

	export let header: string;
	export let body: string;
	export let confirm: ActionFn;
	export let cancel: ActionFn = () => {};

	let fetching = false;

	function handleAction(actionFn: ActionFn) {
		const result = actionFn();
		if (result) {
			fetching = true;
			result.then(() => {
				fetching = false;
				close();
			});
		} else {
			close();
		}
	}
</script>

<Dialog>
	<div class="h3 mb-4">
		{header}
	</div>
	<div class="font-medium text-secondary-300 mb-8">
		{body}
	</div>
	<Container class="flex flex-col space-y-4">
		<Button type="secondary" disabled={fetching} on:clickOrSelect={() => handleAction(confirm)}>
			Confirm
		</Button>
		<Button type="secondary" disabled={fetching} on:clickOrSelect={() => handleAction(cancel)}>
			Cancel
		</Button>
	</Container>
</Dialog>
