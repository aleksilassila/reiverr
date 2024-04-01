<script lang="ts">
	import type { MovieFileResource } from '../../../apis/radarr/radarr-api';
	import Button from '../../Button.svelte';
	export let file: MovieFileResource;
	export let handleDeleteFile: (fileId: number) => Promise<boolean>;
</script>

<div class="-my-1">
	<Button focusOnMount on:click={() => file.id && handleDeleteFile(file.id)}>Delete File</Button>
</div>
