<script lang="ts">
	import Container from '../../../../Container.svelte';
	import type { MovieFileResource } from '../../../apis/radarr/radarr-api';
	import { formatSize } from '../../../utils';
	import Button from '../../Button.svelte';
	import FullScreenModal from '../../Modal/FullScreenModal.svelte';
	import FullScreenModalContainer from '../ManageMediaMenuLayout.svelte';
	import type { FileResource } from '../../../apis/combined-types';

	export let modalId: symbol;
	export let file: FileResource;
	export let handleDeleteFile: (fileId: number) => Promise<any>;
</script>

<FullScreenModal {modalId}>
	<FullScreenModalContainer>
		<div slot="header" class="flex">
			<h1 class="line-clamp-1 flex-1 mr-4">
				{file.relativePath}
			</h1>
			<h1 class="text-zinc-300">{formatSize(file.size || 0)}</h1>
		</div>
		<Container>
			<div class="-my-1">
				<Button focusOnMount on:clickOrSelect={() => file.id && handleDeleteFile(file.id)}>
					Delete File
				</Button>
			</div>
		</Container>
	</FullScreenModalContainer>
</FullScreenModal>
