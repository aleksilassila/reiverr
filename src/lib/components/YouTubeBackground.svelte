<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
  
    export let videoId: string | null = null;
    export let backgroundUrl: string;
  
    let player: any;
    let showBackgroundImage = true;
    let showBackgroundImageError = false;
    const stopBeforeEnd = 12;
  
    function loadYouTubeAPI() {
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
        window.onYouTubeIframeAPIReady = setupPlayer;
      } else {
        setupPlayer();
      }
    }
  
    function setupPlayer() {
      if (player) {
        player.destroy();
      }
  
      if (window.YT && videoId) {
        player = new window.YT.Player('youtube-player', {
          videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            iv_load_policy: 3,
            start: 3,
            fs: 0,
            disablekb: 1,
            cc_load_policy: 0,
            mute: 1
          },
          events: {
            onReady: () => setTimeout(() => player.playVideo(), 1500),
            onStateChange: handlePlayerStateChange,
            onError: () => {
              console.log('Player encountered an error.');
              showBackgroundImageError = showBackgroundImage = true;
            }
          }
        });
      } else {
        showBackgroundImage = true;
      }
    }
  
    function handlePlayerStateChange(event: any) {
      if (event.data === YT.PlayerState.PLAYING) {
        setTimeout(() => (showBackgroundImage = false), 1000);
  
        const checkStopInterval = setInterval(() => {
          const remainingTime = player.getDuration() - player.getCurrentTime();
          if (remainingTime <= stopBeforeEnd) {
            player.pauseVideo();
            player.seekTo(0);
            player.playVideo();
            console.log(`Video looped, stopping ${stopBeforeEnd} seconds before the end.`);
          }
        }, 1000);
        
      } else if (event.data === YT.PlayerState.ENDED) {
        player.seekTo(0);
        player.playVideo();
      }
    }
  
    onMount(() => {
      loadYouTubeAPI();
      return () => player?.destroy();
    });
  
    $: if (videoId && window.YT) setupPlayer();
  </script>
  
  <div id="youtube-player" class="video-background"></div>
  
  {#if showBackgroundImage || showBackgroundImageError}
    <div
      class="background-image"
      style={`background-image: url('${backgroundUrl}');`}
      in:fade={{ duration: 200 }}
      out:fade={{ duration: 400 }}
    ></div>
  {/if}
  
  <style>
    .video-background {
      position: fixed;
      top: 50%;
      left: 50%;
      width: 100vw;
      height: 100vh;
      transform: translate(-50%, -50%) scale(1.6);
      transition: transform 0.5s ease-in-out;
      z-index: 0;
    }
  
    @media (max-width: 1200px) {
      .video-background {
        transform: translate(-50%, -50%) scale(2);
      }
    }
  
    @media (max-width: 800px) {
      .video-background {
        transform: translate(-50%, -50%) scale(2.5);
      }
    }
  
    @media (max-width: 500px) {
      .video-background {
        transform: translate(-50%, -50%) scale(3);
      }
    }
  
    .background-image {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 1;
      background-size: cover;
      background-position: center;
      opacity: 1;
    }
  </style>
  