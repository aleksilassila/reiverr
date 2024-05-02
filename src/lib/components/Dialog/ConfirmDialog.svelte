<script lang="ts">
	import Container from '../../../Container.svelte';
	import Button from '../Button.svelte';
	import Modal from '../Modal/Modal.svelte';
	import { modalStack } from '../Modal/modal.store';

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

<Modal {modalId}>
	<div class="h-full flex items-center justify-center bg-secondary-950/75">
		<div class="bg-secondary-800 rounded-xl max-w-lg p-16">
			<div class="text-xl font-semibold tracking-wide mb-2">
				<slot name="header" />
			</div>
			<div class="font-medium text-zinc-300 mb-8">
				<slot />
			</div>
			<Container direction="horizontal" class="flex">
				<Button
					type="secondary"
					inactive={fetching}
					on:clickOrSelect={() => handleAction(confirm)}
					class="mr-4"
				>
					Confirm
				</Button>
				<Button type="secondary" inactive={fetching} on:clickOrSelect={() => handleAction(cancel)}
					>Cancel</Button
				>
			</Container>
		</div>
	</div>
</Modal>
