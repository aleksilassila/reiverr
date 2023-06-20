<script lang="ts">
	import { onMount } from 'svelte';
	import { getJellyfinPlaybackInfo } from '$lib/jellyfin/jellyfin';
	import Hls from 'hls.js';
	import Modal from '../Modal/Modal.svelte';
	import { JELLYFIN_BASE_URL } from '$lib/jellyfin/jellyfin.js';

	export let visible = false;

	export let jellyfinVideoId: string;

	let video: HTMLVideoElement;

	const { data: playbackInfo, load: loadPlaybackInfo } = getJellyfinPlaybackInfo();

	onMount(() => {
		if (!Hls.isSupported()) {
			throw new Error('HLS is not supported');
		}

		if (!jellyfinVideoId) {
			throw new Error('No video id provided');
		}

		loadPlaybackInfo(jellyfinVideoId);
	});

	playbackInfo.subscribe((info) => {
		console.log('Subscribe info', info);
		if (!info) return;

		console.log(video.src);

		const hls = new Hls();

		hls.loadSource(JELLYFIN_BASE_URL + info);
		hls.attachMedia(video);
		video.play();
		video.requestFullscreen();
	});

	function handleClose() {
		visible = false;
		video?.pause();
	}
</script>

<Modal {visible} close={handleClose}>
	<video controls bind:this={video} />
</Modal>
