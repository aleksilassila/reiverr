import { Injectable } from '@nestjs/common';
import { generateApi, generateTemplates } from 'swagger-typescript-api';
import {
  BaseItemKind,
  ItemFields,
  Api as JellyfinApi,
} from './jellyfin.openapi';
import {
  PlaybackConfig,
  PluginSettings,
  PluginSettingsTemplate,
  SourcePlugin,
  Subtitles,
  UserContext,
  VideoStream,
} from 'plugins/plugin-types';

interface JellyfinSettings extends PluginSettings {
  apiKey: string;
  baseUrl: string;
  userId: string;
}

interface JellyfinUserContext extends UserContext {
  settings: JellyfinSettings;
}

const JELLYFIN_DEVICE_ID = 'Reiverr Client';

const bitrateQualities = [
  {
    label: '4K - 120 Mbps',
    bitrate: 120000000,
    codec: undefined,
  },
  {
    label: '4K - 80 Mbps',
    bitrate: 80000000,
    codec: undefined,
  },
  {
    label: '1080p - 40 Mbps',
    bitrate: 40000000,
    codec: undefined,
  },
  {
    label: '1080p - 10 Mbps',
    bitrate: 10000000,
    codec: undefined,
  },
  {
    label: '720p - 8 Mbps',
    bitrate: 8000000,
    codec: undefined,
  },
  {
    label: '720p - 4 Mbps',
    bitrate: 4000000,
    codec: undefined,
  },
  {
    label: '480p - 3 Mbps',
    bitrate: 3000000,
    codec: undefined,
  },
  {
    label: '480p - 720 Kbps',
    bitrate: 720000,
    codec: undefined,
  },
  {
    label: '360p - 420 Kbps',
    bitrate: 420000,
    codec: undefined,
  },
];

function getClosestBitrate(qualities, bitrate) {
  return qualities.reduce(
    (prev, curr) =>
      Math.abs(curr.bitrate - bitrate) < Math.abs(prev.bitrate - bitrate)
        ? curr
        : prev,
    qualities[0],
  );
}

@Injectable()
export default class JellyfinPlugin implements SourcePlugin {
  name: string = 'jellyfin';

  validateSettings: (settings: JellyfinSettings) => Promise<{
    isValid: boolean;
    errors: Record<string, string>;
    replace: Record<string, any>;
  }> = async (settings) => {
    let isValid = true;
    const errors = {
      baseUrl: '',
      apiKey: '',
      userId: '',
    };
    const replace: Record<string, any> = {};

    if (!settings.baseUrl) {
      isValid = false;
      errors.baseUrl = 'Base URL is required';
    }

    if (!settings.apiKey) {
      isValid = false;
      errors.apiKey = 'API Key is required';
    }

    if (!settings.userId) {
      isValid = false;
      errors.userId = 'User ID is required';
    }

    if (isValid) {
      const context = new PluginContext(settings);
      let [user, err] = await context.api.users
        .getUserById(settings.userId)
        .then((res) => [res.data, undefined])
        .catch((err) => [undefined, err.message]);

      if (!user && err) {
        [user, err] = await context.api.users
          .getUsers()
          .then((res) => res.data?.find((u) => u.Name === settings.userId))
          .then((user) => {
            if (!user || !user.Id) {
              return [undefined, 'User not found'];
            }

            replace.userId = user.Id;

            return [user, undefined];
          })
          .catch((err) => [undefined, err.message]);
      }

      if (!user && err) {
        isValid = false;
        errors.userId = `Could not get user: ${err}`;
      }
    }

    return {
      isValid,
      errors,
      replace,
    };
  };

  getIndex: () => Promise<Record<number, any>>;

  getIsIndexable: () => boolean = () => true;

  getSettingsTemplate: () => PluginSettingsTemplate = () => ({
    baseUrl: {
      type: 'string',
      label: 'Base URL',
      placeholder: 'http://localhost:8096',
    },
    apiKey: {
      type: 'password',
      label: 'API Key',
      placeholder: '',
    },
    userId: {
      type: 'string',
      label: 'Username or User ID',
      placeholder: 'username or user id',
    },
  });

  getEpisodeStream: (
    tmdbId: string,
    season: number,
    episode: number,
  ) => Promise<any>;

  handleProxy({ uri, headers }, settings: JellyfinSettings) {
    return {
      url: `${settings.baseUrl}/${uri}`,
      headers: {
        ...headers,
        Authorization: `MediaBrowser DeviceId="${JELLYFIN_DEVICE_ID}", Token="${settings.apiKey}"`,
      },
    };
  }

  private async getLibraryItems(context: PluginContext) {
    return context.api.items
      .getItems({
        userId: context.settings.userId,
        hasTmdbId: true,
        recursive: true,
        includeItemTypes: [BaseItemKind.Movie, BaseItemKind.Series],
        fields: [
          ItemFields.ProviderIds,
          ItemFields.Genres,
          ItemFields.DateLastMediaAdded,
          ItemFields.DateCreated,
          ItemFields.MediaSources,
        ],
      })
      .then((res) => {
        console.log(res.request.path);
        return res;
      })
      .then((res) => res.data.Items ?? []);
  }

  async getMovieStream(
    tmdbId: string,
    userContext: JellyfinUserContext,
    config: PlaybackConfig = {
      audioStreamIndex: undefined,
      bitrate: undefined,
      progress: undefined,
      defaultLanguage: undefined,
      deviceProfile: undefined,
    },
  ): Promise<VideoStream> {
    const context = new PluginContext(userContext.settings, userContext.token);
    const items = await this.getLibraryItems(context);
    const proxyUrl = `/api/movies/${tmdbId}/sources/${this.name}/stream`;

    const movie = items.find((item) => item.ProviderIds?.Tmdb === tmdbId);

    // console.log(items.map((item) => item))

    if (!movie || !movie.MediaSources || movie.MediaSources.length === 0) {
      throw new Error('Movie stream not found');
    }

    /*
        await jellyfinApi.getPlaybackInfo(
          id,
          getDeviceProfile(),
          options.playbackPosition || item?.UserData?.PlaybackPositionTicks || 0,
          options.bitrate || getQualities(item?.Height || 1080)[0]?.maxBitrate,
          audioStreamIndex
        );
        */

    const startTimeTicks = movie.RunTimeTicks
      ? movie.RunTimeTicks * config.progress
      : undefined;
    const maxStreamingBitrate = config.bitrate || 0; //|| movie.MediaSources?.[0]?.Bitrate || 10000000

    const playbackInfo = await context.api.items.getPostedPlaybackInfo(
      movie.Id,
      {
        DeviceProfile: config.deviceProfile,
      },
      {
        userId: context.settings.userId,
        startTimeTicks: startTimeTicks || 0,
        ...(maxStreamingBitrate ? { maxStreamingBitrate } : {}),
        autoOpenLiveStream: true,
        ...(config.audioStreamIndex
          ? { audioStreamIndex: config.audioStreamIndex }
          : {}),
        mediaSourceId: movie.Id,

        // deviceId: JELLYFIN_DEVICE_ID,
        // mediaSourceId: movie.MediaSources[0].Id,
        // maxBitrate: 8000000,
      },
    );

    const mediasSource = playbackInfo.data?.MediaSources?.[0];

    const playbackUri =
      proxyUrl +
      (mediasSource?.TranscodingUrl ||
        `/Videos/${mediasSource?.Id}/stream.mp4?Static=true&mediaSourceId=${mediasSource?.Id}&deviceId=${JELLYFIN_DEVICE_ID}&api_key=${context.settings.apiKey}&Tag=${mediasSource?.ETag}`) +
      `&reiverr_token=${userContext.token}`;

    const audioStreams: VideoStream['audioStreams'] =
      mediasSource?.MediaStreams.filter((s) => s.Type === 'Audio').map((s) => ({
        bitrate: s.BitRate,
        label: s.Language,
        codec: s.Codec,
        index: s.Index,
      })) ?? [];

    const qualities = [
      ...bitrateQualities,
      {
        bitrate: mediasSource.Bitrate,
        label: 'Original',
        codec: undefined,
      },
    ].map((q, i) => ({
      ...q,
      index: i,
    }));

    const bitrate = Math.min(
      maxStreamingBitrate,
      movie.MediaSources[0].Bitrate,
    );

    const subtitles: Subtitles[] = mediasSource.MediaStreams.filter(
      (s) => s.Type === 'Subtitle' && s.DeliveryUrl,
    ).map((s, i) => ({
      index: i,
      uri: proxyUrl + s.DeliveryUrl + `reiverr_token=${userContext.token}`,
      label: s.DisplayTitle,
      codec: s.Codec,
    }));

    return {
      audioStreamIndex:
        config.audioStreamIndex ??
        mediasSource?.DefaultAudioStreamIndex ??
        audioStreams[0].index,
      audioStreams,
      progress: config.progress ?? 0,
      qualities,
      quality: getClosestBitrate(qualities, bitrate).index,
      subtitles,
      uri: playbackUri,
      directPlay:
        !!mediasSource?.SupportsDirectPlay ||
        !!mediasSource?.SupportsDirectStream,
    };
  }
}

class PluginContext {
  api: JellyfinApi<{}>;
  settings: JellyfinSettings;
  token: string;

  constructor(settings: JellyfinSettings, token = '') {
    this.token = token;
    this.settings = settings;
    this.api = new JellyfinApi({
      baseURL: settings.baseUrl,
      headers: {
        Authorization: `MediaBrowser DeviceId="${JELLYFIN_DEVICE_ID}", Token="${settings.apiKey}"`,
      },
      paramsSerializer: {
        indexes: null,
      },
    });
  }
}
