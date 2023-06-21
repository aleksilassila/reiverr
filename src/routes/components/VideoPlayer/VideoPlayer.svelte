<script lang="ts">
	import { fetchJellyfinPlaybackUrl } from '$lib/jellyfin/jellyfin';
	import Hls from 'hls.js';
	import Modal from '../Modal/Modal.svelte';
	import IconButton from '../IconButton.svelte';
	import { Cross2 } from 'radix-icons-svelte';
	import classNames from 'classnames';
	import { getContext } from 'svelte';
	import { PUBLIC_JELLYFIN_URL } from '$env/static/public';

	const { playerState, close } = getContext('player');

	let video: HTMLVideoElement;

	const fetchPlaybackInfo = (id: string) =>
		fetchJellyfinPlaybackUrl(id).then((uri) => {
			if (!uri) return;

			const hls = new Hls();

			hls.loadSource(PUBLIC_JELLYFIN_URL + uri);
			hls.attachMedia(video);
			video.play();
		});

	function handleClose() {
		close();
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

	let state;
	playerState.subscribe((s) => (state = s));

	$: {
		if (video && state.jellyfinId) {
			if (!Hls.isSupported()) {
				throw new Error('HLS is not supported');
			}

			fetchPlaybackInfo(state.jellyfinId);
		}
	}
</script>

<Modal visible={$playerState.visible} close={handleClose}>
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
