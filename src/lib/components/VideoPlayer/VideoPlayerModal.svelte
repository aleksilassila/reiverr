<script lang="ts">
	import FullScreenModal from '../Modal/FullScreenModal.svelte';
	import VideoPlayer from './VideoPlayer.svelte';
	export let modalId: symbol;
	export let id: string;
</script>

<FullScreenModal {modalId}>
	<VideoPlayer jellyfinId={id} />
</FullScreenModal>
