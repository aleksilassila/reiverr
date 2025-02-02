<script lang="ts">
	import classNames from 'classnames';
	import Container from '../Container.svelte';
	import { modalStack } from '../Modal/modal.store';
	import Modal from '../Modal/Modal.svelte';

	export let modalId: symbol;
	export let hidden: boolean = false;
</script>

<Modal>
	<div
		class={classNames(
			'fixed inset-0 overflow-hidden',
			{
				'opacity-0': hidden
			},
			// 'bg-[radial-gradient(169.40%_89.55%_at_94.76%_6.29%,rgba(0,0,0,0.40)_0%,rgba(255,255,255,0.00)_100%)]'
			// 'bg-[radial-gradient(150%_50%_at_50%_-25%,_#DFAA2BF0_0%,_#073AFF00_100%),linear-gradient(0deg,_#1A1914FF_0%,_#1A1914FF_0%)]'
			'bg-secondary-900'
		)}
	>
		<div
			class="absolute top-0 inset-x-0 h-screen -z-10 bg-[radial-gradient(150%_50%_at_50%_-25%,_#DFAA2Bcc_0%,_#00000000_100%)]"
		/>
		<slot />
	</div>
</Modal>
