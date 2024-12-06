<script lang="ts">
	import { ArrowRight, ChevronRight } from 'radix-icons-svelte';
	import Container from '../../../Container.svelte';
	import Button from '../../components/Button.svelte';
	import { createModal, modalStack } from '../../components/Modal/modal.store';
	import EditPluginDialog from './EditPluginDialog.ManagePage.svelte';
	import { capitalize } from '../../utils';

	export let plugin: string;

	function handleEditPluginSettings() {
		console.log('Edit plugin settings');
		createModal(EditPluginDialog, { plugin });
	}
</script>

<Button iconAfter={ArrowRight} on:click={handleEditPluginSettings}>
	{capitalize(plugin)}
</Button>
