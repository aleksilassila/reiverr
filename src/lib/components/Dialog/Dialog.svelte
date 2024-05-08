<script lang="ts">
	import Modal from '../Modal/Modal.svelte';
</script>

<Modal>
	<div class="h-full flex items-center justify-center bg-secondary-950/75 py-20">
		<div
			class="flex-1 bg-secondary-900 rounded-2xl max-w-lg p-10 overflow-y-auto min-h-0 max-h-full scrollbar-hide"
		>
			<slot />
		</div>
	</div>
</Modal>
