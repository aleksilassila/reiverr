<script lang="ts">
	import Modal from '$lib/components/Modal/Modal.svelte';
	import { hook } from '$lib/utils';
	import { createModal } from '../Modal/modal.store';
	import type { MenuStack } from './DynamicMenu';

	export let stack: MenuStack;

	const openModal = hook(createModal, {
		before: (args) => {
			args[1] = {
				...args[1],
				stack
			};

			return args;
		}
	});
</script>

<Modal>
	<slot {openModal} />
</Modal>
