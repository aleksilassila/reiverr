import { Injectable } from '@nestjs/common';
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
import { Readable } from 'stream';

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

  private getProxyUrl() {
    return `/api/sources/${this.name}/proxy`;
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

  // handleProxy({ uri, headers }, settings: JellyfinSettings) {
  //   return {
  //     url: `https://tmstr2.luminousstreamhaven.com/${uri}`,
  //     headers: {
  //       ...headers,
  //       // Authorization: `MediaBrowser DeviceId="${JELLYFIN_DEVICE_ID}", Token="${settings.apiKey}"`,
  //     },
  //   };
  // }

  private async getLibraryItems(context: PluginContext) {
    return context.api.items
      .getItems({
        userId: context.settings.userId,
        // hasTmdbId: true,
        recursive: true,
        includeItemTypes: [
          BaseItemKind.Movie,
          BaseItemKind.Series,
          BaseItemKind.Episode,
        ],
        fields: [
          ItemFields.ProviderIds,
          ItemFields.Genres,
          ItemFields.DateLastMediaAdded,
          ItemFields.DateCreated,
          ItemFields.MediaSources,
        ],
      })
      .then((res) => res.data.Items ?? []);
  }

  // private async getLibraryEpisodes(context: PluginContext) {
  //   return context.api.items
  //     .getItems({
  //       userId: context.settings.userId,
  //       // hasTmdbId: true,
  //       recursive: true,
  //       includeItemTypes: [BaseItemKind.Episode],
  //       fields: [
  //         ItemFields.ProviderIds,
  //         ItemFields.Genres,
  //         ItemFields.DateLastMediaAdded,
  //         ItemFields.DateCreated,
  //         ItemFields.MediaSources,
  //       ],
  //     })
  //     .then((res) => res.data.Items ?? []);
  // }

  async getMovieStreams(
    tmdbId: string,
    metadata,
    userContext: JellyfinUserContext,
    config: PlaybackConfig = {
      audioStreamIndex: undefined,
      bitrate: undefined,
      progress: undefined,
      defaultLanguage: undefined,
      deviceProfile: undefined,
    },
  ): Promise<VideoStreamCandidate[]> {
    return this.getMovieStream(tmdbId, metadata, '', userContext, config)
      .then((stream) => [stream])
      .catch((e) => {
        if (e === SourcePluginError.StreamNotFound) {
          return [];
        } else throw e;
      });
  }

  async getEpisodeStreams(
    tmdbId: string,
    _,
    season: number,
    episode: number,
    userContext: JellyfinUserContext,
    config?: PlaybackConfig,
  ): Promise<VideoStreamCandidate[]> {
    return this.getEpisodeStream(
      tmdbId,
      '',
      season,
      episode,
      '',
      userContext,
      config,
    )
      .then((stream) => [stream])
      .catch((e) => {
        if (e === SourcePluginError.StreamNotFound) {
          return [];
        } else throw e;
      });
  }

  async getMovieStream(
    tmdbId: string,
    metadata,
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
    const proxyUrl = this.getProxyUrl();

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
      ? Math.floor(movie.RunTimeTicks * config.progress)
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
      key: '0',
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
      duration: mediasSource.RunTimeTicks
        ? mediasSource.RunTimeTicks / 10_000_000
        : 0,
      progress: config.progress ?? 0,
      qualities,
      qualityIndex: getClosestBitrate(qualities, bitrate).index,
      subtitles,
      uri: playbackUri,
      // uri:
      //   proxyUrl +
      //   '/stream_new2/H4sIAAAAAAAAAw3OWXKDIAAA0Cvhggn9TBqSuJARBcU_CloiYp2Ojcvpm3eCB2EXASWjIAwRUkd4AF7XdYdQAY0kVPIjDTghrElZT0EJqGlv5I_64V5UOk58vOSO7F8bcjKYnvmusRg0zLe5Lv2YaWsSUpFMuTXOAAS5O66s_H5RBpbWrmftnV4JuIdZ8LNrf1laHs_FTqkMmro4z7CsSS7sRNpx2liFotJ5TPY45Q6tms3R45NSdYWGWZ6yvTm14.lXAV7r67IyOy85n5JHjQeFzV0z0guHo2YcrCzQQoEumgIZxrlQgQir2m4suLyPK22t6eX7nmG.Sn8SxRNdH7dBNKMxxGucvgyj8Lind4D.AeRg7d1BAQAA/master.m3u8' +
      //   `?reiverr_token=${userContext.token}`,
      directPlay:
        !!mediasSource?.SupportsDirectPlay ||
        !!mediasSource?.SupportsDirectStream,
    };
  }

  async getEpisodeStream(
    tmdbId: string,
    _,
    seasonNumber: number,
    episodeNumber: number,
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
    const proxyUrl = this.getProxyUrl();

    const show = items.find(
      (item) => item.ProviderIds?.Tmdb === tmdbId,
      // && item.ParentIndexNumber === seasonNumber &&
      // item.IndexNumber === episodeNumber,
    );

    const episode = items.find(
      (item) =>
        item.SeriesId === show?.Id &&
        item.IndexNumber === episodeNumber &&
        item.ParentIndexNumber === seasonNumber,
    );

    if (
      !episode ||
      !episode.MediaSources ||
      episode.MediaSources.length === 0
    ) {
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

    const startTimeTicks = episode.RunTimeTicks
      ? Math.floor(episode.RunTimeTicks * (config?.progress ?? 0))
      : undefined;
    const maxStreamingBitrate = config?.bitrate || 0; //|| movie.MediaSources?.[0]?.Bitrate || 10000000

    const playbackInfo = await context.api.items.getPostedPlaybackInfo(
      episode.Id,
      {
        DeviceProfile: config?.deviceProfile,
      },
      {
        userId: context.settings.userId,
        startTimeTicks: startTimeTicks || 0,
        ...(maxStreamingBitrate ? { maxStreamingBitrate } : {}),
        autoOpenLiveStream: true,
        ...(config?.audioStreamIndex
          ? { audioStreamIndex: config?.audioStreamIndex }
          : {}),
        mediaSourceId: episode.Id,

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
      key: '0',
      title: episode.Name,
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
      duration: mediasSource.RunTimeTicks
        ? mediasSource.RunTimeTicks / 10_000_000
        : 0,
      progress: config.progress ?? 0,
      qualities,
      qualityIndex: getClosestBitrate(qualities, bitrate).index,
      subtitles,
      uri: playbackUri,
      // uri:
      //   proxyUrl +
      //   '/stream_new2/H4sIAAAAAAAAAw3OWXKDIAAA0Cvhggn9TBqSuJARBcU_CloiYp2Ojcvpm3eCB2EXASWjIAwRUkd4AF7XdYdQAY0kVPIjDTghrElZT0EJqGlv5I_64V5UOk58vOSO7F8bcjKYnvmusRg0zLe5Lv2YaWsSUpFMuTXOAAS5O66s_H5RBpbWrmftnV4JuIdZ8LNrf1laHs_FTqkMmro4z7CsSS7sRNpx2liFotJ5TPY45Q6tms3R45NSdYWGWZ6yvTm14.lXAV7r67IyOy85n5JHjQeFzV0z0guHo2YcrCzQQoEumgIZxrlQgQir2m4suLyPK22t6eX7nmG.Sn8SxRNdH7dBNKMxxGucvgyj8Lind4D.AeRg7d1BAQAA/master.m3u8' +
      //   `?reiverr_token=${userContext.token}`,
      directPlay:
        !!mediasSource?.SupportsDirectPlay ||
        !!mediasSource?.SupportsDirectStream,
    };
  }

  proxyHandler?: (
    req: any,
    res: any,
    options: { context: UserContext; uri: string },
  ) => Promise<any> = async (req, res, { context, uri }) => {
    const settings = context.settings as JellyfinSettings;

    const url = settings.baseUrl + uri;

    const proxyRes = await fetch(url, {
      method: req.method || 'GET',
      headers: {
        Authorization: `MediaBrowser DeviceId="${JELLYFIN_DEVICE_ID}", Token="${settings.apiKey}"`,
      },
    }).catch((e) => {
      console.error('error fetching proxy response', e);
      res.status(500).send('Error fetching proxy response');
    });

    if (!proxyRes) return;

    res.status(proxyRes.status);
    Readable.from(proxyRes.body).pipe(res);
  };
}

class PluginContext {
  api: JellyfinApi<unknown>;
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
