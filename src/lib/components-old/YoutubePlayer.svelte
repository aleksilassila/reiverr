<script lang="ts">
	import classNames from 'classnames';

	export let videoId: string;
</script>

<div class="overflow-hidden w-full h-full">
	<div class="youtube-container scale-[150%] h-full w-full">
		<iframe
			src={'https://www.youtube-nocookie.com/embed/' +
				videoId +
				'?autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&playsinline=1&rel=0&enablejsapi=1'}
			title="YouTube video player"
			frameborder="0"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
			allowfullscreen
			tabindex="-1"
		/>
	</div>
</div>

<style>
	.youtube-container {
		overflow: hidden;
		width: 100%;
		aspect-ratio: 16/9;
		pointer-events: none;
	}

	.youtube-container iframe {
		width: 300%;
		height: 100%;
		margin-left: -100%;
	}
</style>
