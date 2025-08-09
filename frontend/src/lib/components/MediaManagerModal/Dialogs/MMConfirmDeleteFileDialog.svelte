<script lang="ts">
	import ConfirmDialog from '../../Dialog/ConfirmDialog.svelte';

	export let modalId: symbol;
	export let deleteFile: () => Promise<any>;
</script>

<ConfirmDialog {modalId} confirm={deleteFile}>
	<h1 slot="header">Delete file?</h1>
	<div>Are you sure you want to permanently delete this file?</div>
</ConfirmDialog>
