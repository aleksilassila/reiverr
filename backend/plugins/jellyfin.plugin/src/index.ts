import { Injectable } from '@nestjs/common';
import { generateApi, generateTemplates } from 'swagger-typescript-api';
import {
  BaseItemKind,
  ItemFields,
  Api as JellyfinApi,
} from './jellyfin.openapi';
import {
  PlaybackConfig,
  SourcePluginCapabilities,
  PluginSettings,
  PluginSettingsTemplate,
  SourcePlugin,
  Subtitles,
  UserContext,
  VideoStream,
  VideoStreamCandidate,
  IndexItem,
  PaginatedResponse,
  PaginationParams,
  SourcePluginError,
} from '../../plugin-types';
import {
  bitrateQualities,
  formatSize,
  formatTicksToTime,
  getClosestBitrate,
} from './utils';

interface JellyfinSettings extends PluginSettings {
  apiKey: string;
  baseUrl: string;
  userId: string;
}

interface JellyfinUserContext extends UserContext {
  settings: JellyfinSettings;
}

const JELLYFIN_DEVICE_ID = 'Reiverr Client';

@Injectable()
export default class JellyfinPlugin implements SourcePlugin {
  name: string = 'jellyfin';

  private getProxyUrl(tmdbId: string) {
    return `/api/movies/${tmdbId}/sources/${this.name}/stream/proxy`;
  }

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

  getCapabilities: (conext: UserContext) => Promise<SourcePluginCapabilities> =
    async (context) => {
      return {
        deletion: true,
        indexing: true,
        playback: true,
        requesting: true,
      };
    };

  getMovieIndex: (
    context: UserContext,
    pagination: PaginationParams,
  ) => Promise<PaginatedResponse<IndexItem>> = async (
    userContext: JellyfinUserContext,
    pagination,
  ) => {
    const items = (
      await this.getLibraryItems(
        new PluginContext(userContext.settings, userContext.token),
      )
    ).filter((i) => i.ProviderIds?.Tmdb && i.Type === 'Movie');

    const startIndex = (pagination.page - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;

    return {
      total: items.length,
      page: pagination.page,
      itemsPerPage: pagination.itemsPerPage,
      items: items.slice(startIndex, endIndex).map((item) => ({
        id: item.ProviderIds?.Tmdb,
      })),
    };
  };

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

  async getMovieStreams(
    tmdbId: string,
    userContext: JellyfinUserContext,
    config: PlaybackConfig = {
      audioStreamIndex: undefined,
      bitrate: undefined,
      progress: undefined,
      defaultLanguage: undefined,
      deviceProfile: undefined,
    },
  ): Promise<VideoStreamCandidate[]> {
    return this.getMovieStream(tmdbId, '', userContext, config)
      .then((stream) => [stream])
      .catch((e) => {
        if (e === SourcePluginError.StreamNotFound) {
          return [];
        } else throw e;
      });
  }

  async getMovieStream(
    tmdbId: string,
    key: string,
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
    const proxyUrl = this.getProxyUrl(tmdbId);

    const movie = items.find((item) => item.ProviderIds?.Tmdb === tmdbId);

    // console.log(items.map((item) => item))

    if (!movie || !movie.MediaSources || movie.MediaSources.length === 0) {
      throw SourcePluginError.StreamNotFound;
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

    const qualities: VideoStream['qualities'] = [
      ...bitrateQualities,
      {
        bitrate: mediasSource.Bitrate,
        label: 'Original',
        codec: undefined,
        original: true,
      },
    ].map((q, i) => ({
      ...q,
      index: i,
    }));

    const bitrate = Math.min(maxStreamingBitrate, mediasSource.Bitrate);

    const subtitles: Subtitles[] = mediasSource.MediaStreams.filter(
      (s) => s.Type === 'Subtitle' && s.DeliveryUrl,
    ).map((s, i) => ({
      index: i,
      uri: proxyUrl + s.DeliveryUrl + `reiverr_token=${userContext.token}`,
      label: s.DisplayTitle,
      codec: s.Codec,
    }));

    return {
      key: '',
      title: movie.Name,
      properties: [
        {
          label: 'Video',
          value: mediasSource.Bitrate || 0,
          formatted:
            mediasSource.MediaStreams.find((s) => s.Type === 'Video')
              ?.DisplayTitle || 'Unknown',
        },
        {
          label: 'Size',
          value: mediasSource.Size,
          formatted: formatSize(mediasSource.Size),
        },
        {
          label: 'Filename',
          value: mediasSource.Name,
          formatted: undefined,
        },
        {
          label: 'Runtime',
          value: mediasSource.RunTimeTicks,
          formatted: formatTicksToTime(mediasSource.RunTimeTicks),
        },
      ],
      audioStreamIndex:
        config.audioStreamIndex ??
        mediasSource?.DefaultAudioStreamIndex ??
        audioStreams[0].index,
      audioStreams,
      progress: config.progress ?? 0,
      qualities,
      qualityIndex: getClosestBitrate(qualities, bitrate).index,
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
