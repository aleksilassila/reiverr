<script lang="ts">
	import type { MediaSource, MediaSourceDto } from '$lib/apis/reiverr/reiverr.openapi';
	import SelectField from '$lib/components/SelectField.svelte';
	import classNames from 'classnames';
	import { createModal } from '../../components/Modal/modal.store';
	import { capitalize } from '../../utils';
	import EditPluginDialog from './EditMediaSourceDialog.ManagePage.svelte';

	export let mediaSource: MediaSourceDto;

	function handleEditPluginSettings() {
		createModal(EditPluginDialog, { sourceId: mediaSource.id });
	}
</script>

<SelectField color="primary" action={async () => handleEditPluginSettings()}>
	<div slot="content" class="flex items-center space-x-4">
		<div
			class={classNames('w-2.5 h-2.5 rounded-full', {
				'bg-green-500': mediaSource.enabled,
				'bg-primary-500': !mediaSource.enabled
			})}
		/>
		<span>
			{capitalize(mediaSource.name)}
		</span>
	</div>
</SelectField>
