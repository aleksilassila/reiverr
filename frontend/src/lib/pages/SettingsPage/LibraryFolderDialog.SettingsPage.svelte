<script lang="ts">
	import Container from '$components/Container.svelte';
	import { Check, Trash } from 'radix-icons-svelte';
	import Button from '../../components/Button/Button.svelte';
	import ConfirmDialog from '../../components/Dialog/ConfirmDialog.svelte';
	import Dialog from '../../components/Dialog/Dialog.svelte';
	import { createModal } from '../../components/Modal/modal.store';
	import { useComponentStack } from '../../components/StackRouter/stack-router.store';

	export let path: string;
	/** What the folder holds, "Series folder" or "Movie folder" */
	export let label: string;
	export let isPrimary: boolean;
	/** Makes the folder the primary one. The dialog closes when it resolves and shows what it rejects with */
	export let onMakePrimary: () => Promise<unknown>;
	/** Removes the folder; with `force`, the indexed files in it are forgotten */
	export let onRemove: (force: boolean) => Promise<unknown>;

	const { close } = useComponentStack();

	let error = '';

	const errorMessage = (e: any): string => e?.response?.data?.message ?? e?.message ?? String(e);

	const makePrimary = () =>
		onMakePrimary().then(
			() => close(),
			(e) => (error = errorMessage(e))
		);

	function confirmRemove() {
		createModal(ConfirmDialog, {
			header: 'Remove the folder?',
			body: `${path} is no longer a library folder. Nothing in it is deleted.`,
			confirm: () => remove(false)
		});
	}

	/** The server refuses a folder with indexed files in it until they may be forgotten, which is asked next */
	function remove(force: boolean): Promise<void> {
		error = '';

		return onRemove(force).then(
			() => close(),
			(e) => {
				const message = errorMessage(e);
				if (!force && e?.response?.status === 400 && message.includes('forgets the files')) {
					createModal(ConfirmDialog, {
						header: 'Forget the files?',
						body: message,
						confirm: () => remove(true)
					});
				} else {
					error = message;
				}
			}
		);
	}
</script>

<Dialog>
	<h1 class="h3">{label}</h1>
	<p class="body mb-8 break-all">{path}</p>
	{#if error}
		<p class="error mb-4">{error}</p>
	{/if}
	<Container class="flex flex-col space-y-4">
		<Button type="primary-dark" disabled={isPrimary} icon={Check} action={makePrimary}>
			Make Primary
		</Button>
		<Button
			type="primary-dark"
			focusedChild={isPrimary}
			icon={Trash}
			on:clickOrSelect={confirmRemove}
		>
			Remove Folder
		</Button>
	</Container>
</Dialog>
