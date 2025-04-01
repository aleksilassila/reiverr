import {
  CatalogueItem,
  DirectionOption,
  MediaSourceProvider,
  OrderOption,
  PaginatedResponse,
  PaginationParams,
  PlaybackConfig,
  SourceProviderError,
  SourceProviderSettings,
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
  Api as JellyfinApi,
  SortOrder,
} from './jellyfin.openapi';
import {
  bitrateQualities,
  formatSize,
  formatTicksToTime,
  getClosestBitrate,
  JELLYFIN_DEVICE_ID,
} from './utils';

export interface JellyfinSettings extends SourceProviderSettings {
  apiKey: string;
  baseUrl: string;
  userId: string;
}

export class JellyfinMediaSourceProvider extends MediaSourceProvider {
  api: JellyfinApi<unknown>;

  private getProxyUrl() {
    return `/api/sources/${this.sourceId}/proxy`;
  }

  constructor(userContext: UserContext) {
    super(userContext);
    this.api = new JellyfinApi({
      baseURL: userContext.settings.baseUrl,
      headers: {
        Authorization: `MediaBrowser DeviceId="${JELLYFIN_DEVICE_ID}", Token="${userContext.settings.apiKey}"`,
      },
      paramsSerializer: {
        indexes: null,
      },
    });
  }

  getTmdbMovieCandidates?: (options: {
    tmdbMovie: any;
  }) => Promise<{ candidates: StreamCandidate[] }> = async ({ tmdbMovie }) => {
    const movies = await this.api.items.getItems({
      userId: this.settings.userId,
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
    });

    const movie = movies.data.Items.find(
      (i) => i.ProviderIds?.Tmdb === tmdbMovie.id,
    );

    if (!movie || !movie.MediaSources || movie.MediaSources.length === 0) {
      throw SourceProviderError.StreamNotFound;
    }

    return {
      candidates: [
        {
          id: movie.ProviderIds?.Tmdb,
          tmdbId: movie.ProviderIds?.Tmdb,
          mediaType: 'movie' as const,
          streamId: movie.Id,
          title: movie.Name,
          properties: [
            {
              label: 'Video',
              value: movie.MediaSources[0].Bitrate || 0,
              formatted:
                movie.MediaSources[0].MediaStreams.find(
                  (s) => s.Type === 'Video',
                )?.DisplayTitle || 'Unknown',
            },
            {
              label: 'Size',
              value: movie.MediaSources[0].Size,
              formatted: formatSize(movie.MediaSources[0].Size),
            },
            {
              label: 'Filename',
              value: movie.MediaSources[0].Name,
              formatted: undefined,
            },
            {
              label: 'Runtime',
              value: movie.MediaSources[0].RunTimeTicks,
              formatted: formatTicksToTime(movie.MediaSources[0].RunTimeTicks),
            },
          ],
        },
      ],
    };
  };

  getTmdbEpisodeCandidates?: (options: {
    tmdbSeries: any;
    tmdbEpisode: any;
  }) => Promise<{ candidates: StreamCandidate[] }> = async ({
    tmdbSeries,
    tmdbEpisode,
  }) => {
    // return this.getEpisodeStream(tmdbId, metadata, '', context, config)
    //   .then((stream) => ({ candidates: [stream] }))
    //   .catch((e) => {
    //     if (e === SourceProviderError.StreamNotFound) {
    //       return { candidates: [] };
    //     } else throw e;
    //   });

    const series = await this.api.items.getItems({
      userId: this.settings.userId,
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
    });

    const show = series.data.Items.find(
      (i) => i.ProviderIds?.Tmdb === String(tmdbSeries.id),
    );

    if (!show) {
      console.error(
        'series not found',
        series.data?.Items?.map((i) => i.ProviderIds),
        tmdbSeries,
      );
      throw SourceProviderError.StreamNotFound;
    }

    const episodes = await this.api.items.getItems({
      userId: this.settings.userId,
      recursive: true,
      includeItemTypes: [BaseItemKind.Episode],
      fields: [
        // ItemFields.DateLastMediaAdded,
        // ItemFields.DateCreated,
        ItemFields.MediaSources,
      ],
      // parentId: show.Id,
      parentIndexNumber: tmdbEpisode.season_number,
      indexNumber: tmdbEpisode.episode_number,
    });

    const episode = episodes.data.Items.find(
      (e) =>
        e.SeriesId === show.Id &&
        e.ParentIndexNumber === tmdbEpisode.season_number &&
        e.IndexNumber === tmdbEpisode.episode_number,
    );

    if (
      !episode ||
      !episode.MediaSources ||
      episode.MediaSources.length === 0
    ) {
      console.error('episode not found', episode, episodes.data.Items.length);
      throw SourceProviderError.StreamNotFound;
    }

    return {
      candidates: [
        {
          id: episode.ProviderIds?.Tmdb,
          tmdbId: episode.ProviderIds?.Tmdb,
          mediaType: 'episode' as const,
          streamId: episode.Id,
          title: episode.Name,
          properties: [
            {
              label: 'Video',
              value: episode.MediaSources[0].Bitrate || 0,
              formatted:
                episode.MediaSources[0].MediaStreams.find(
                  (s) => s.Type === 'Video',
                )?.DisplayTitle || 'Unknown',
            },
            {
              label: 'Size',
              value: episode.MediaSources[0].Size,
              formatted: formatSize(episode.MediaSources[0].Size),
            },
            {
              label: 'Filename',
              value: episode.MediaSources[0].Name,
              formatted: undefined,
            },
            {
              label: 'Runtime',
              value: episode.MediaSources[0].RunTimeTicks,
              formatted: formatTicksToTime(
                episode.MediaSources[0].RunTimeTicks,
              ),
            },
          ],
        },
      ],
    };
  };

  getStream?: (options: {
    streamId: string;
    config?: PlaybackConfig;
  }) => Promise<Stream | undefined> = async (options) => {
    const { progress, audioStreamIndex, deviceProfile } = options.config || {};

    const movie = await this.api.items
      .getItems({
        ids: [options.streamId],
        userId: this.settings.userId,
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
      .then((r) => r.data.Items.find((i) => i.Id === options.streamId));

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
      ? Math.floor(movie.RunTimeTicks * progress)
      : undefined;
    const maxStreamingBitrate = options?.config?.bitrate ?? 0; //|| movie.MediaSources?.[0]?.Bitrate || 10000000

    const playbackInfo = await this.api.items.getPostedPlaybackInfo(
      movie.Id,
      {
        DeviceProfile: deviceProfile,
      },
      {
        userId: this.settings.userId,
        startTimeTicks: startTimeTicks || 0,
        ...(maxStreamingBitrate ? { maxStreamingBitrate } : {}),
        autoOpenLiveStream: true,
        ...(audioStreamIndex ? { audioStreamIndex } : {}),
        mediaSourceId: movie.Id,

        // deviceId: JELLYFIN_DEVICE_ID,
        // mediaSourceId: movie.MediaSources[0].Id,
        // maxBitrate: 8000000,
      },
    );

    const mediasSource = playbackInfo.data?.MediaSources?.[0];

    const playbackUri =
      this.getProxyUrl() +
      (mediasSource?.TranscodingUrl ||
        `/Videos/${mediasSource?.Id}/stream.mp4?Static=true&mediaSourceId=${mediasSource?.Id}&deviceId=${JELLYFIN_DEVICE_ID}&api_key=${this.settings.apiKey}&Tag=${mediasSource?.ETag}`) +
      `&reiverr_token=${this.token}`;

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
      src: this.getProxyUrl() + `${s.DeliveryUrl}&reiverr_token=${this.token}`,
      lang: s.Language,
      kind: 'subtitles',
      label: s.DisplayTitle,
    }));

    return {
      streamId: '0',
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
        audioStreamIndex ??
        mediasSource?.DefaultAudioStreamIndex ??
        audioStreams[0].index,
      audioStreams,
      duration: mediasSource.RunTimeTicks
        ? mediasSource.RunTimeTicks / 10_000_000
        : 0,
      progress: progress,
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

  proxyHandler?: (options: {
    req: any;
    res: any;
    uri: string;
    targetUrl?: string;
  }) => Promise<any> = async (options) => {
    const { req, res, uri, targetUrl } = options;

    const url = this.settings.baseUrl + uri;

    const headers = {};
    for (const key in req.headers) {
      if (key === 'host') continue;
      headers[key] = req.headers[key];
    }

    const proxyRes = await fetch(url, {
      method: req.method || 'GET',
      headers: {
        ...headers,
        Authorization: `MediaBrowser DeviceId="${JELLYFIN_DEVICE_ID}", Token="${this.settings.apiKey}"`,
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

  // Catalogue

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

  getCatalogue?: (options: {
    pagination: PaginationParams;
    order?: string;
    direction?: string;
  }) => Promise<PaginatedResponse<CatalogueItem>>;

  getMovieCatalogue?: (options: {
    pagination: PaginationParams;
    order?: string;
    direction?: string;
  }) => Promise<PaginatedResponse<CatalogueItem>> = async (options) => {
    const { pagination, order, direction } = options;

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
    const data = await this.api.items
      .getItems({
        userId: this.settings.userId,
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
      .then((res) => res.data);

    return {
      total: data.TotalRecordCount ?? data.Items?.length ?? 0,
      page: pagination.page,
      itemsPerPage: pagination.itemsPerPage,
      items:
        data?.Items?.map((item) => ({
          id: item.ProviderIds?.Tmdb,
          tmdbId: item.ProviderIds?.Tmdb,
          mediaType: 'movie' as const,
        })) ?? [],
    };
  };

  getSeriesCatalogue?: (options: {
    pagination: PaginationParams;
    order?: string;
    direction?: string;
  }) => Promise<PaginatedResponse<CatalogueItem>> = async (options) => {
    const { pagination, order, direction } = options;

    const sortBy: ItemSortBy[] = [];

    if (order === 'title') {
      sortBy.push(ItemSortBy.Name);
    } else if (order === 'date-added') {
      sortBy.push(ItemSortBy.DateLastContentAdded);
    } else if (order === 'date-created') {
      sortBy.push(ItemSortBy.DateCreated);
    }

    const data = await this.api.items
      .getItems({
        userId: this.settings.userId,
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
      .then((res) => res.data);

    return {
      total: data.TotalRecordCount ?? data.Items?.length ?? 0,
      page: pagination.page,
      itemsPerPage: pagination.itemsPerPage,
      items:
        data?.Items?.map((item) => ({
          id: item.ProviderIds?.Tmdb,
          tmdbId: item.ProviderIds?.Tmdb,
          mediaType: 'series' as const,
        })) ?? [],
    };
  };

  getMissingInCatalogue?: <T extends object = object>(options: {
    pagination: PaginationParams;
    order?: string;
    direction?: string;
    myListItems: Record<string, T>;
  }) => Promise<PaginatedResponse<T>>;
}
