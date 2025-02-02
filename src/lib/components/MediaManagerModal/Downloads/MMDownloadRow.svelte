<script lang="ts">
	import TableButton from '../../Table/TableButton.svelte';
	import { Cross1 } from 'radix-icons-svelte';
	import type { Download } from '../../../apis/combined-types';
	import type { CancelDownloadFn } from '../MediaManagerModal';
	import { scrollIntoView } from '../../../selectable';
	import Container from '../../Container.svelte';
	import classNames from 'classnames';
	import { modalStack } from '../../Modal/modal.store';
	import MMConfirmDeleteFileDialog from '../Dialogs/MMConfirmDeleteFileDialog.svelte';

	export let download: Download;
	export let cancelDownload: CancelDownloadFn;

	let title = '';
	let subtitle = '';

	function handleCancelDownload() {
		modalStack.create(MMConfirmDeleteFileDialog, {
			deleteFile: () => cancelDownload(download.id || -1)
		});
	}

	$: {
		if ('series' in download && 'episode' in download) {
			title = download.episode?.title || '';
			subtitle = `Episode ${download.episode?.episodeNumber || ''}`;
		}
	}

	$: console.log('download', download);
</script>

<Container class="contents" let:hasFocusWithin>
	<div
		class={classNames(
			'flex items-center justify-between relative overflow-hidden',
			'px-6 py-3 bg-secondary-800 border-2 border-secondary-800 rounded-xl',
			{
				'bg-secondary-900 border-secondary-500': hasFocusWithin
			}
		)}
	>
		<!-- Background -->
		<div
			class="absolute inset-y-0 bg-secondary-50/10 left-0"
			style={`width: ${
				(((download.size || download.sizeleft || 0) - (download.sizeleft || 0)) /
					(download.size || 1)) *
				100
			}%`}
		/>

		<div>
			<h2 class="text-zinc-300 font-medium">{subtitle}</h2>
			<h1 class="text-lg font-medium tracking-wide">{title}</h1>
		</div>
		<div>
			<TableButton
				on:clickOrSelect={handleCancelDownload}
				on:enter={scrollIntoView({ vertical: 128 })}
			>
				<Cross1 size={19} />
			</TableButton>
		</div>
	</div>
</Container>
