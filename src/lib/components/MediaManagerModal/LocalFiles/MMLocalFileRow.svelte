<script lang="ts">
	import TableRow from '../../Table/TableRow.svelte';
	import { scrollIntoView } from '../../../selectable';
	import type { FileResource } from '../../../apis/combined-types';
	import { formatSize } from '../../../utils';
	import TableButton from '../../Table/TableButton.svelte';
	import { Trash } from 'radix-icons-svelte';
	import TableCell from '../../Table/TableCell.svelte';
	import type { DeleteFileFn } from '../MediaManagerModal';
	import { modalStack } from '../../Modal/modal.store';
	import MMConfirmDeleteFileDialog from '../Dialogs/MMConfirmDeleteFileDialog.svelte';

	export let file: FileResource;
	export let deleteFile: DeleteFileFn;
</script>

<TableRow class="font-medium">
	<TableCell>
		<div class="font-medium text-lg">
			{file.sceneName}
		</div>
	</TableCell>
	<TableCell class="text-zinc-300">{file.mediaInfo?.runTime}</TableCell>
	<TableCell class="text-zinc-300">{formatSize(file.size || 0)}</TableCell>
	<TableCell class="text-zinc-300">{file.quality?.quality?.name}</TableCell>
	<TableCell>
		<TableButton
			on:enter={scrollIntoView({ vertical: 128 })}
			on:clickOrSelect={() =>
				modalStack.create(MMConfirmDeleteFileDialog, {
					deleteFile: () => deleteFile(file.id || -1)
				})}
		>
			<Trash size={19} />
		</TableButton>
	</TableCell>
</TableRow>
