<script lang="ts">
	import { useRequest } from '../../../stores/data.store';
	import type { MovieFileResource } from '../../../apis/radarr/radarr-api';
	import ButtonGhost from '../../Ghosts/ButtonGhost.svelte';
	import Button from '../../Button.svelte';

	export let id: number;
	export let getFiles: (movieId: number) => Promise<MovieFileResource[]>;
	export let handleSelectFile: (file: MovieFileResource) => void;

	const { data: files, isLoading } = useRequest(getFiles, id);
</script>

<div class="-my-1">
	{#if $isLoading}
		{#each new Array(5) as _, index}
			<div class="flex-1 my-1">
				<ButtonGhost />
			</div>
		{/each}
	{:else if $files}
		{#each $files as file, index}
			<Button focusOnMount={index === 0} on:click={() => handleSelectFile(file)}>
				{file.relativePath}
			</Button>
		{/each}
	{/if}
</div>
