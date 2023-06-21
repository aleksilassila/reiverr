<script lang="ts">
	import { fetchJellyfinPlaybackUrl } from '$lib/jellyfin/jellyfin';
	import Hls from 'hls.js';
	import Modal from '../Modal/Modal.svelte';
	import { JELLYFIN_BASE_URL } from '$lib/jellyfin/jellyfin.js';
	import IconButton from '../IconButton.svelte';
	import { Cross2 } from 'radix-icons-svelte';
	import classNames from 'classnames';

	export let visible = false;

	export let jellyfinId: string;

	let video: HTMLVideoElement;

	const fetchPlaybackInfo = (id: string) =>
		fetchJellyfinPlaybackUrl(id).then((uri) => {
			if (!uri) return;

			const hls = new Hls();

			hls.loadSource(JELLYFIN_BASE_URL + uri);
			hls.attachMedia(video);
			video.play();
		});

	function handleClose() {
		visible = false;
		video?.pause();
	}

	let uiVisible = false;
	let timeout;
	function handleMouseMove() {
		uiVisible = true;
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			uiVisible = false;
		}, 2000);
	}

	$: {
		if (video) {
			if (!Hls.isSupported()) {
				throw new Error('HLS is not supported');
			}

			if (!jellyfinId) {
				throw new Error('No video id provided');
			}

			fetchPlaybackInfo(jellyfinId);
		}
	}
</script>

<Modal {visible} close={handleClose}>
	<div class="bg-black w-screen h-screen relative" on:mousemove={handleMouseMove}>
		<video controls bind:this={video} class="w-full h-full inset-0" />
		<div
			class={classNames('absolute top-4 right-8 transition-opacity', {
				'opacity-0': !uiVisible,
				'opacity-100': uiVisible
			})}
		>
			<IconButton on:click={handleClose}>
				<Cross2 />
			</IconButton>
		</div>
	</div>
</Modal>
