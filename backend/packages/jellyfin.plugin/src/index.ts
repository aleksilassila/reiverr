import {
  CatalogueItem,
  CatalogueProvider,
  DirectionOption,
  EpisodeMetadata,
  MovieMetadata,
  OrderOption,
  PaginatedResponse,
  PaginationParams,
  PlaybackConfig,
  PluginProvider,
  SettingsManager,
  SourceProvider,
  SourceProviderError,
  Stream,
  StreamCandidate,
  Subtitles,
  UserContext,
} from '@aleksilassila/reiverr-plugin';
import { Readable } from 'stream';
import {
  BaseItemKind,
  ItemFields,
  ItemSortBy,
  SortOrder,
} from './jellyfin.openapi';
import { JellyfinSettings, PluginContext } from './plugin-context';
import { JellyfinSettingsManager } from './settings';
import {
  bitrateQualities,
  formatSize,
  formatTicksToTime,
  getClosestBitrate,
  JELLYFIN_DEVICE_ID,
} from './utils';

export default class JellyfinPluginProvider extends PluginProvider {
  getPlugins(): SourceProvider[] {
    return [new JellyfinProvider()];
  }
}

async function getLibraryItems(context: PluginContext) {
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

export class JellyfinCatalogueProvider implements CatalogueProvider {
  getOrderOptions?: () => Promise<OrderOption[]> = async () => {
    const directions: DirectionOption[] = [
      {
        label: 'Ascending',
        value: 'asc',
      },
      {
        label: 'Descending',
        value: 'desc',
      },
    ];

    return [
      {
        label: 'Title',
        value: 'title',
        directions,
      },
      {
        label: 'Date Added',
        value: 'date-added',
        directions,
      },
      {
        label: 'Date Created',
        value: 'date-created',
        directions,
      },
    ];
  };

  getMovieCatalogue?: (options: {
    context: UserContext;
    pagination: PaginationParams;
    order?: string;
    direction?: string;
  }) => Promise<PaginatedResponse<CatalogueItem>> = async (options) => {
    const { context, pagination, order, direction } = options;

    const sortBy: ItemSortBy[] = [];

    if (order === 'title') {
      sortBy.push(ItemSortBy.Name);
    } else if (order === 'date-added') {
      sortBy.push(ItemSortBy.DateLastContentAdded);
    } else if (order === 'date-created') {
      sortBy.push(ItemSortBy.DateCreated);
    }
    // const items = (
    //   await getLibraryItems(new PluginContext(context.settings, context.token))
    // ).filter((i) => i.ProviderIds?.Tmdb && i.Type === 'Movie');
    const items = await new PluginContext(
      context.settings,
      context.token,
    ).api.items
      .getItems({
        userId: context.settings.userId,
        hasTmdbId: true,
        recursive: true,
        includeItemTypes: [BaseItemKind.Movie],
        fields: [
          ItemFields.ProviderIds,
          ItemFields.Genres,
          ItemFields.DateLastMediaAdded,
          ItemFields.DateCreated,
          ItemFields.MediaSources,
        ],
        sortBy,
        sortOrder: [
          direction === 'asc' ? SortOrder.Ascending : SortOrder.Descending,
        ],
        startIndex: (pagination.page - 1) * pagination.itemsPerPage,
        limit: pagination.itemsPerPage,
      })
      .then((res) => res.data.Items ?? [])
      .catch((e) => {
        console.error('error fetching items', e);
        return [];
      });

    return {
      total: items.length,
      page: pagination.page,
      itemsPerPage: pagination.itemsPerPage,
      items: items.map((item) => ({
        id: item.ProviderIds?.Tmdb,
        tmdbId: item.ProviderIds?.Tmdb,
        mediaType: 'movie' as const,
      })),
    };
  };

  getSeriesCatalogue?: (options: {
    context: UserContext;
    pagination: PaginationParams;
    order?: string;
    direction?: 'asc' | 'desc';
  }) => Promise<PaginatedResponse<CatalogueItem>> = async (options) => {
    const { context, pagination, order, direction } = options;

    const sortBy: ItemSortBy[] = [];

    if (order === 'title') {
      sortBy.push(ItemSortBy.Name);
    } else if (order === 'date-added') {
      sortBy.push(ItemSortBy.DateLastContentAdded);
    } else if (order === 'date-created') {
      sortBy.push(ItemSortBy.DateCreated);
    }

    const items = await new PluginContext(
      context.settings,
      context.token,
    ).api.items
      .getItems({
        userId: context.settings.userId,
        hasTmdbId: true,
        recursive: true,
        includeItemTypes: [BaseItemKind.Series],
        fields: [
          ItemFields.ProviderIds,
          ItemFields.Genres,
          ItemFields.DateLastMediaAdded,
          ItemFields.DateCreated,
          ItemFields.MediaSources,
        ],
        sortBy,
        sortOrder: [
          direction === 'asc' ? SortOrder.Ascending : SortOrder.Descending,
        ],
        startIndex: (pagination.page - 1) * pagination.itemsPerPage,
        limit: pagination.itemsPerPage,
      })
      .then((res) => res.data.Items ?? [])
      .catch((e) => {
        console.error('error fetching items', e);
        return [];
      });

    return {
      total: items.length,
      page: pagination.page,
      itemsPerPage: pagination.itemsPerPage,
      items: items.map((item) => ({
        id: item.ProviderIds?.Tmdb,
        tmdbId: item.ProviderIds?.Tmdb,
        mediaType: 'series' as const,
      })),
    };
  };
}

class JellyfinProvider extends SourceProvider {
  name: string = 'jellyfin';

  private getProxyUrl(sourceId: string) {
    return `/api/sources/${sourceId}/proxy`;
  }

  settingsManager: SettingsManager = new JellyfinSettingsManager();

  catalogueProvider: CatalogueProvider = new JellyfinCatalogueProvider();

  getMovieStreams = async (
    tmdbId: string,
    metadata: MovieMetadata,
    context: UserContext,
    config?: PlaybackConfig,
  ): Promise<{ candidates: StreamCandidate[] }> => {
    return this.getMovieStream(tmdbId, metadata, '', context, config)
      .then((stream) => ({ candidates: [stream] }))
      .catch((e) => {
        if (e === SourceProviderError.StreamNotFound) {
          return { candidates: [] };
        } else throw e;
      });
  };

  getEpisodeStreams = async (
    tmdbId: string,
    metadata: EpisodeMetadata,
    context: UserContext,
    config?: PlaybackConfig,
  ): Promise<{ candidates: StreamCandidate[] }> => {
    return this.getEpisodeStream(tmdbId, metadata, '', context, config)
      .then((stream) => ({ candidates: [stream] }))
      .catch((e) => {
        if (e === SourceProviderError.StreamNotFound) {
          return { candidates: [] };
        } else throw e;
      });
  };

  getMovieStream = async (
    tmdbId: string,
    metadata: MovieMetadata,
    key: string,
    userContext: UserContext,
    config?: PlaybackConfig,
  ): Promise<Stream | undefined> => {
    const context = new PluginContext(userContext.settings, userContext.token);
    const items = await getLibraryItems(context);

    const movie = items.find((item) => item.ProviderIds?.Tmdb === tmdbId);

    // console.log(items.map((item) => item))

    if (!movie || !movie.MediaSources || movie.MediaSources.length === 0) {
      throw SourceProviderError.StreamNotFound;
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
      ? Math.floor(movie.RunTimeTicks * config?.progress)
      : undefined;
    const maxStreamingBitrate = config?.bitrate || 0; //|| movie.MediaSources?.[0]?.Bitrate || 10000000

    const playbackInfo = await context.api.items.getPostedPlaybackInfo(
      movie.Id,
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
        mediaSourceId: movie.Id,

        // deviceId: JELLYFIN_DEVICE_ID,
        // mediaSourceId: movie.MediaSources[0].Id,
        // maxBitrate: 8000000,
      },
    );

    const mediasSource = playbackInfo.data?.MediaSources?.[0];

    const playbackUri =
      this.getProxyUrl(userContext.sourceId) +
      (mediasSource?.TranscodingUrl ||
        `/Videos/${mediasSource?.Id}/stream.mp4?Static=true&mediaSourceId=${mediasSource?.Id}&deviceId=${JELLYFIN_DEVICE_ID}&api_key=${context.settings.apiKey}&Tag=${mediasSource?.ETag}`) +
      `&reiverr_token=${userContext.token}`;

    const audioStreams: Stream['audioStreams'] =
      mediasSource?.MediaStreams.filter((s) => s.Type === 'Audio').map((s) => ({
        bitrate: s.BitRate,
        label: s.Language,
        codec: s.Codec,
        index: s.Index,
      })) ?? [];

    const qualities: Stream['qualities'] = [
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
      src:
        this.getProxyUrl(userContext.sourceId) +
        `${s.DeliveryUrl}&reiverr_token=${userContext.token}`,
      lang: s.Language,
      kind: 'subtitles',
      label: s.DisplayTitle,
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
        config?.audioStreamIndex ??
        mediasSource?.DefaultAudioStreamIndex ??
        audioStreams[0].index,
      audioStreams,
      duration: mediasSource.RunTimeTicks
        ? mediasSource.RunTimeTicks / 10_000_000
        : 0,
      progress: config?.progress ?? 0,
      qualities,
      qualityIndex: getClosestBitrate(qualities, bitrate).index,
      subtitles,
      src: playbackUri,
      // uri:
      //   proxyUrl +
      //   '/stream_new2/H4sIAAAAAAAAAw3OWXKDIAAA0Cvhggn9TBqSuJARBcU_CloiYp2Ojcvpm3eCB2EXASWjIAwRUkd4AF7XdYdQAY0kVPIjDTghrElZT0EJqGlv5I_64V5UOk58vOSO7F8bcjKYnvmusRg0zLe5Lv2YaWsSUpFMuTXOAAS5O66s_H5RBpbWrmftnV4JuIdZ8LNrf1laHs_FTqkMmro4z7CsSS7sRNpx2liFotJ5TPY45Q6tms3R45NSdYWGWZ6yvTm14.lXAV7r67IyOy85n5JHjQeFzV0z0guHo2YcrCzQQoEumgIZxrlQgQir2m4suLyPK22t6eX7nmG.Sn8SxRNdH7dBNKMxxGucvgyj8Lind4D.AeRg7d1BAQAA/master.m3u8' +
      //   `?reiverr_token=${userContext.token}`,
      directPlay:
        !!mediasSource?.SupportsDirectPlay ||
        !!mediasSource?.SupportsDirectStream,
    };
  };

  getEpisodeStream = async (
    tmdbId: string,
    metadata: EpisodeMetadata,
    key: string,
    userContext: UserContext,
    config?: PlaybackConfig,
  ): Promise<Stream | undefined> => {
    const context = new PluginContext(userContext.settings, userContext.token);
    const items = await getLibraryItems(context);

    const show = items.find(
      (item) => item.ProviderIds?.Tmdb === tmdbId,
      // && item.ParentIndexNumber === seasonNumber &&
      // item.IndexNumber === episodeNumber,
    );

    const episode = items.find(
      (item) =>
        item.SeriesId === show?.Id &&
        item.IndexNumber === metadata.episode &&
        item.ParentIndexNumber === metadata.season,
    );

    if (
      !episode ||
      !episode.MediaSources ||
      episode.MediaSources.length === 0
    ) {
      throw SourceProviderError.StreamNotFound;
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
      this.getProxyUrl(userContext.sourceId) +
      (mediasSource?.TranscodingUrl ||
        `/Videos/${mediasSource?.Id}/stream.mp4?Static=true&mediaSourceId=${mediasSource?.Id}&deviceId=${JELLYFIN_DEVICE_ID}&api_key=${context.settings.apiKey}&Tag=${mediasSource?.ETag}`) +
      `&reiverr_token=${userContext.token}`;

    const audioStreams: Stream['audioStreams'] =
      mediasSource?.MediaStreams.filter((s) => s.Type === 'Audio').map((s) => ({
        bitrate: s.BitRate,
        label: s.Language,
        codec: s.Codec,
        index: s.Index,
      })) ?? [];

    const qualities: Stream['qualities'] = [
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
      src:
        this.getProxyUrl(userContext.sourceId) +
        `${s.DeliveryUrl}&reiverr_token=${userContext.token}`,
      lang: s.Language,
      kind: 'subtitles',
      label: s.DisplayTitle,
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
        config?.audioStreamIndex ??
        mediasSource?.DefaultAudioStreamIndex ??
        audioStreams[0].index,
      audioStreams,
      duration: mediasSource.RunTimeTicks
        ? mediasSource.RunTimeTicks / 10_000_000
        : 0,
      progress: config?.progress ?? 0,
      qualities,
      qualityIndex: getClosestBitrate(qualities, bitrate).index,
      subtitles,
      src: playbackUri,
      // uri:
      //   proxyUrl +
      //   '/stream_new2/H4sIAAAAAAAAAw3OWXKDIAAA0Cvhggn9TBqSuJARBcU_CloiYp2Ojcvpm3eCB2EXASWjIAwRUkd4AF7XdYdQAY0kVPIjDTghrElZT0EJqGlv5I_64V5UOk58vOSO7F8bcjKYnvmusRg0zLe5Lv2YaWsSUpFMuTXOAAS5O66s_H5RBpbWrmftnV4JuIdZ8LNrf1laHs_FTqkMmro4z7CsSS7sRNpx2liFotJ5TPY45Q6tms3R45NSdYWGWZ6yvTm14.lXAV7r67IyOy85n5JHjQeFzV0z0guHo2YcrCzQQoEumgIZxrlQgQir2m4suLyPK22t6eX7nmG.Sn8SxRNdH7dBNKMxxGucvgyj8Lind4D.AeRg7d1BAQAA/master.m3u8' +
      //   `?reiverr_token=${userContext.token}`,
      directPlay:
        !!mediasSource?.SupportsDirectPlay ||
        !!mediasSource?.SupportsDirectStream,
    };
  };

  proxyHandler = async (
    req: any,
    res: any,
    options: { context: UserContext; uri: string; targetUrl?: string },
  ): Promise<any> => {
    const { context, uri, targetUrl } = options;
    const settings = context.settings as JellyfinSettings;

    const url = settings.baseUrl + uri;

    const headers = {};
    for (const key in req.headers) {
      if (key === 'host') continue;
      headers[key] = req.headers[key];
    }

    const proxyRes = await fetch(url, {
      method: req.method || 'GET',
      headers: {
        ...headers,
        Authorization: `MediaBrowser DeviceId="${JELLYFIN_DEVICE_ID}", Token="${settings.apiKey}"`,
      },
    }).catch((e) => {
      console.error('error fetching proxy response', e);
      res.status(500).send('Error fetching proxy response');
    });

    if (!proxyRes) return;

    proxyRes.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });

    res.status(proxyRes.status);
    Readable.from(proxyRes.body).pipe(res);
  };
}
