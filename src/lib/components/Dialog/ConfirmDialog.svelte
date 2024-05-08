<script lang="ts">
	import Container from '../../../Container.svelte';
	import Button from '../Button.svelte';
	import Modal from '../Modal/Modal.svelte';
	import { modalStack } from '../Modal/modal.store';
	import Dialog from './Dialog.svelte';

	export let modalId: symbol;

	type ActionFn = (() => Promise<any>) | (() => any);
	export let confirm: ActionFn;
	export let cancel: ActionFn = () => {};

	let fetching = false;

	function handleAction(actionFn: ActionFn) {
		const result = actionFn();
		if (result) {
			fetching = true;
			result.then(() => {
				fetching = false;
				modalStack.close(modalId);
			});
		} else {
			modalStack.close(modalId);
		}
	}
</script>

<Dialog {modalId}>
	<div class="text-2xl font-semibold tracking-wide mb-2 text-secondary-100">
		<slot name="header" />
	</div>
	<div class="font-medium text-secondary-300 mb-8">
		<slot />
	</div>
	<Container direction="horizontal" class="flex">
		<Button
			type="secondary"
			disabled={fetching}
			on:clickOrSelect={() => handleAction(confirm)}
			class="mr-4"
		>
			Confirm
		</Button>
		<Button type="secondary" disabled={fetching} on:clickOrSelect={() => handleAction(cancel)}
			>Cancel</Button
		>
	</Container>
</Dialog>
