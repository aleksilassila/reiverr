<script lang="ts">
	import Modal from '../Modal/Modal.svelte';
	import TmdbVideoPlayer from './TmdbVideoPlayer.svelte';
</script>

<Modal class="bg-black">
	<TmdbVideoPlayer {...$$restProps} />
</Modal>
