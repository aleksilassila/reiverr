<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { fade } from 'svelte/transition';
    import { PLATFORM_WEB } from '../constants';

    export let videoId: string | null = null;
    export let backgroundUrl: string;

    let player: any;
    let showBackgroundImage = true;
    let showBackgroundImageError = false;
    let isDestroyed = false;
    let isPlayerReady = false;
    let lastRequestedVideoId: string | null = null; 
    const stopBeforeEnd = 12;
    let checkStopInterval: any = null;
    let isLoadingPlayer = false;

    function loadYouTubeAPI() {
        if (!PLATFORM_WEB) return;

        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(tag);
            window.onYouTubeIframeAPIReady = () => {
                setupPlayer();
            };
        } else {
            setupPlayer();
        }
    }

    function destroyPlayer() {
        if (player) {
            try {
                player.destroy();
            } catch (e) {
                console.warn("Error destroying player.", e);
            }
            player = null;
            isPlayerReady = false;
            clearInterval(checkStopInterval);
        }
    }

    function setupPlayer() {
        if (!PLATFORM_WEB || !window.YT || isDestroyed || !videoId || isLoadingPlayer) return;
    
        isLoadingPlayer = true;
        if (videoId === lastRequestedVideoId) {
            isLoadingPlayer = false;
            return;
        }
        
        lastRequestedVideoId = videoId;
        destroyPlayer();
    
        setTimeout(() => {
            if (!window.YT || isDestroyed) {
                isLoadingPlayer = false;
                return;
            }
    
            player = new window.YT.Player('youtube-player', {
                videoId: videoId,
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
                    onReady: () => {
                        isLoadingPlayer = false;
                        if (isDestroyed || videoId !== lastRequestedVideoId) {
                            destroyPlayer();
                            return;
                        }
                        isPlayerReady = true;
                        setTimeout(() => player?.playVideo(), 1500);
                    },
                    onStateChange: handlePlayerStateChange,
                    onError: handlePlayerError
                }
            });
        }, 200);
    }

    function handlePlayerError(event: any) {
        if (isDestroyed) return;

        const errorMessages: Record<number, string> = {
            2: "Invalid video ID.",
            5: "Playback error.",
            100: "Video not found.",
            101: "Embedding restricted by the owner.",
            150: "Embedding restricted by the owner."
        };

        console.warn("YouTube Player Error:", errorMessages[event.data] || "Unknown error.");
        showBackgroundImageError = true;
        showBackgroundImage = true;
        destroyPlayer();
    }

    function handlePlayerStateChange(event: any) {
        if (isDestroyed || !isPlayerReady) return;

        if (event.data === YT.PlayerState.PLAYING) {
            setTimeout(() => (showBackgroundImage = false), 1000);

            if (checkStopInterval) {
                clearInterval(checkStopInterval);
            }

            checkStopInterval = setInterval(() => {
                if (!player || showBackgroundImageError || isDestroyed) {
                    clearInterval(checkStopInterval);
                    return;
                }

                const remainingTime = player.getDuration() - player.getCurrentTime();

                if (remainingTime <= stopBeforeEnd) {
                    try {
                        player.pauseVideo();
                        player.seekTo(0);
                        player.playVideo();
                    } catch (e) {
                        console.warn("Error looping video.", e);
                    }
                }
            }, 1000);
        } else if (event.data === YT.PlayerState.ENDED) {
            if (!isDestroyed) {
                try {
                    player.seekTo(0);
                    player.playVideo();
                } catch (e) {
                    console.warn("Error restarting video.", e);
                }
            }
        }
    }

    onMount(() => {
        isDestroyed = false;
        loadYouTubeAPI();
    });

    onDestroy(() => {
        isDestroyed = true;
        destroyPlayer();
    });

    $: if (videoId && window.YT && !isDestroyed) {
        setupPlayer();
    }
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
