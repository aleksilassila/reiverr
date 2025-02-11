<script lang="ts">
	import type { MediaSource } from '$lib/apis/reiverr/reiverr.openapi';
	import SelectField from '$lib/components/SelectField.svelte';
	import { createModal } from '../../components/Modal/modal.store';
	import { capitalize } from '../../utils';
	import EditPluginDialog from './EditMediaSourceDialog.ManagePage.svelte';

	export let mediaSource: MediaSource;

	function handleEditPluginSettings() {
		createModal(EditPluginDialog, { sourceId: mediaSource.id });
	}
</script>

<SelectField
	color="primary"
	value={capitalize(mediaSource.name)}
	action={async () => handleEditPluginSettings()}
/>
