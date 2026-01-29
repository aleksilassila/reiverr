<script lang="ts">
  import type { TmdbEpisode, TmdbSeries } from '$lib/apis/tmdb/tmdb-api';
  import Button from '$lib/components/Button/Button.svelte';
  import LazyImg from '$lib/components/LazyImg.svelte';
  import { Sheet } from '$lib/components/Sheet';
  import { TMDB_BACKDROP_SMALL } from '$lib/constants';
  import { componentStackContext } from '$lib/stores/component-stack.store';
  import { useIsWatched } from '$lib/stores/user-data/is-watched.store';
  import {
    type EpisodeUserData,
    TITLE_USER_DATA_CONTEXT,
    type TitleUserData,
  } from '$lib/stores/user-data/title-user-data.store';
  import { reiverrApi } from '$lib/stores/user.store';
  import { Check, Cross1, Gear, Play } from 'radix-icons-svelte';
  import { getContext } from 'svelte';
  import { writable } from 'svelte/store';
  import StreamListMenu from './ActionsPage/StreamListMenu.svelte';
  import ButtonSpinner from '$lib/components/Button/ButtonSpinner.svelte';
  import { timeout } from '$lib/utils';
  import { playableDataContext } from './ActionsPage/actions-page';
  import {
    getBackgroundPage,
    type BackgroundPage,
    type BackgroundPageStore,
  } from '$lib/components/GlobalBackground/BackgroundStack';
  import VideoPlayer from '$lib/components/VideoPlayer/VideoPlayer.svelte';

  export let series: TmdbSeries;
  export let episode: TmdbEpisode;

  export let handleClose: () => void;
  // export let handleStream: (opts: { series: TmdbSeries; episode: TmdbEpisode }) => Promise<void>;
  export let handleMarkAsWatched: (opts: {
    series: TmdbSeries;
    episode: TmdbEpisode;
  }) => Promise<void>;

  const componentStack = componentStackContext.getContext();
  const background = getBackgroundPage();

  // export let imgUrl: string;

  // export let title: string;
  // export let subtitle: string;

  // const { playStream } = playableDataContext.createContext({
  //   tmdbId: `${series.id}`,
  //   season: episode.season_number ?? 0,
  //   episode: episode.episode_number ?? 0,
  // });

  const { episodesUserData } = getContext<TitleUserData>(
    TITLE_USER_DATA_CONTEXT,
  );
  const episodeUserData = writable<EpisodeUserData | undefined>();
  $: {
    episodeUserData.set(
      $episodesUserData.find(
        (e) =>
          e.season === episode.season_number &&
          e.episode === episode.episode_number,
      ),
    );
  }

  const { isWatched, toggleIsWatched } = useIsWatched({
    userData: episodeUserData,
    toggleFn: (userId, watched) =>
      reiverrApi.users
        .updateEpisodePlayStateByTmdbId(
          userId,
          String(series.id),
          episode.season_number ?? 0,
          episode.episode_number ?? 0,
          {
            watched,
          },
        )
        .finally(() => {
          episodesUserData.update((eds) => {
            const ed = eds.find(
              (e) =>
                e.season === episode.season_number &&
                e.episode === episode.episode_number,
            );
            if (ed) ed.watched = watched;

            return eds;
          });
        }),
  });

  $: imgUrl =
    episode.still_path || series.backdrop_path
      ? TMDB_BACKDROP_SMALL + (episode.still_path || series.backdrop_path)
      : '';

  // export let handleStream: () => Promise<void>;

  // function handleClose() {
  // 	modalStack.closeTopmost();
  // }

  const groups = reiverrApi.media
    .getVideoCandidates({
      tmdbId: `${series.id}`,
      episode: episode.episode_number ?? 0,
      season: episode.season_number ?? 0,
    })
    .then((r) => r.data.items);

  async function handleStream({
    mediaPluginId,
    candidateId,
  }: {
    mediaPluginId: string;
    candidateId: string;
  }) {
    console.log('Stream clicked');
    const { data } = await reiverrApi.media.getStream({
      candidateId,
      mediaPluginId,
    });

    const videoSrc = data.sources.find((s) => s.default) || data.sources[0];

    if (background && videoSrc) {
      background.setVideo({
        id: Symbol(),
        component: VideoPlayer,
        props: {
          load: true,
          paused: false,
          muted: false,
          videoSource: {
            src: videoSrc.src,
            directPlay: data.playbackMethod === 'direct',
            audioStreamIndex: 0,
            audioTracks: [],
            selectAudioTrack: () => {},
          },
          subtitleInfo: undefined,
          title: series.name || '',
          subtitle: `S${episode.season_number} E${episode.episode_number} ${
            episode.name || ''
          }`,
          video: undefined,
        },
      });
      background.focus();
    } else {
      console.error('No background page found', background, videoSrc);
    }

    // playStream({});

    // componentStack.push({
    //   component: StreamListMenu,
    //   props: { items: data.items, series, episode },
    // });
  }
</script>

<Sheet on:close={handleClose} size="md">
  <div class="flex gap-8">
    <div class="flex flex-col gap-4 max-w-xl">
      <div class="rounded-xl overflow-hidden">
        <LazyImg src={imgUrl} />
      </div>

      <div class="flex flex-col space-y-2">
        <div class="mb-2 flex-1">
          <h2 class="h3">{episode.name ?? series.name ?? ''}</h2>
          <p class="body">
            {`Season ${episode.season_number} Episode ${episode.episode_number}`}
          </p>
        </div>

        <Button
          type="primary-dark"
          action={async () => {
            // await handleStream();
            await timeout(2000);
            handleClose();
          }}
          let:loading
        >
          <ButtonSpinner {loading} class="mr-1">
            <Play size={24} />
          </ButtonSpinner>
          Stream
        </Button>

        <Button
          type="primary-dark"
          action={() => toggleIsWatched()}
          let:loading
        >
          {#if $isWatched}
            <ButtonSpinner {loading} class="mr-1">
              <Cross1 size={24} />
            </ButtonSpinner>
            Mark as Unwatched
          {:else}
            <ButtonSpinner {loading} class="mr-1">
              <Check size={24} />
            </ButtonSpinner>
            Mark as Watched
          {/if}
        </Button>

        <Button
          type="primary-dark"
          action={() => handleMarkAsWatched({ series, episode })}
          disabled
        >
          <Gear size={24} class="mr-1" />
          Manage
        </Button>
      </div>
    </div>

    <div class="space-y-8 flex-1">
      {#await groups then groups}
        {#each groups as { groupId, groupLabel, candidates }}
          <div>
            <h1 class="h3 mb-4">{groupLabel}</h1>
            <div class="flex flex-col gap-4">
              {#each candidates as candidate}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div
                  class="flex items-center bg-primary-900 rounded-xl px-6 h-20 gap-4 cursor-pointer"
                  on:click={() =>
                    handleStream({
                      mediaPluginId: groupId,
                      candidateId: candidate.id,
                    })}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-disc3-icon lucide-disc-3 h-12 w-12 shrink-0"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M6 12c0-1.7.7-3.2 1.8-4.2" />
                    <circle cx="12" cy="12" r="2" />
                    <path d="M18 12c0 1.7-.7 3.2-1.8 4.2" />
                  </svg>
                  <div>
                    <h1 class="line-clamp-1 h5">
                      {candidate.title}
                    </h1>
                    {#each candidate.properties as property}
                      <div class="text-secondary-200 text-sm font-medium">
                        {property.formatted}
                      </div>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      {/await}

      <!-- <div>
        <h1 class="h3 mb-4">Local Media</h1>
        <div class="flex gap-4">
          <div class="flex flex-col items-center gap-2">
            <div class="bg-primary-900 h-28 w-28 rounded-xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-disc3-icon lucide-disc-3 w-full h-full p-8"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M6 12c0-1.7.7-3.2 1.8-4.2" />
                <circle cx="12" cy="12" r="2" />
                <path d="M18 12c0 1.7-.7 3.2-1.8 4.2" />
              </svg>
            </div>
            <div
              class="w-32 text-wrap break-words line-clamp-3 text-center text-sm font-medium text-secondary-100"
            >
              Black.Mirror.S02E01.1080p.WEBRip.DD2.0.x264-CasStudio
            </div>
          </div>

          <div class="flex flex-col items-center gap-2">
            <div class="bg-primary-900 h-28 w-28 rounded-xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-disc3-icon lucide-disc-3 w-full h-full p-8"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M6 12c0-1.7.7-3.2 1.8-4.2" />
                <circle cx="12" cy="12" r="2" />
                <path d="M18 12c0 1.7-.7 3.2-1.8 4.2" />
              </svg>
            </div>
            <div
              class="w-32 text-wrap break-words line-clamp-3 text-center text-sm font-medium text-secondary-100"
            >
              Black.Mirror.S02E01.720p.WEBRip.DD2.0.x264-CasStudio
            </div>
          </div>

          <div class="flex flex-col items-center gap-2">
            <div class="bg-primary-900 h-28 w-28 rounded-xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-plus-icon lucide-plus w-full h-full p-8"
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
            </div>
            <div
              class="w-32 text-wrap break-words line-clamp-3 text-center text-sm font-medium text-secondary-100"
            >
              Request
            </div>
          </div>
        </div>
      </div>
      <div>
        <h1 class="h3 mb-4">The Pirate Bay</h1>
        <div>Local media here</div>
      </div> -->
    </div>
  </div>
</Sheet>
