<script lang="ts">
	import { type EpisodeFileResource, sonarrApi } from '../../apis/sonarr/sonarr-api';
	import ConfirmDialog from '../Dialog/ConfirmDialog.svelte';

	export let modalId: symbol;

	export let files: EpisodeFileResource[];
	export let onComplete: () => void = () => {};

	function handleDeleteSeason() {
		return sonarrApi.deleteSonarrEpisodes(files.map((f) => f.id || -1)).then(() => onComplete());
	}
</script>

<ConfirmDialog {modalId} confirm={handleDeleteSeason}>
	<h1 slot="header">Delete Season Files?</h1>
	<div>
		Are you sure you want to delete all {files.length} file(s) from season {files[0]?.seasonNumber}?
	</div>
</ConfirmDialog>
