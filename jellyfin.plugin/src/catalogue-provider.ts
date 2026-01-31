import {
  CatalogueCapabilities,
  CatalogueItem,
  CatalogueProvider,
  DirectionOption,
  OrderOption,
  PaginatedResponse,
  PaginationParams,
} from '@aleksilassila/reiverr-shared/dist/src/old';
import {
  ItemSortBy,
  BaseItemKind,
  ItemFields,
  SortOrder,
  Api as JellyfinApi,
} from './jellyfin.openapi';
import { JELLYFIN_DEVICE_ID } from './utils';

export class JellyfinCatalogueProvider extends CatalogueProvider {
  api: JellyfinApi<unknown>;

  constructor(options) {
    super(options);
    this.api = new JellyfinApi({
      baseURL: options.settings.baseUrl,
      headers: {
        Authorization: `MediaBrowser DeviceId="${JELLYFIN_DEVICE_ID}", Token="${options.settings.apiKey}"`,
      },
      paramsSerializer: {
        indexes: null,
      },
    });
  }

  getCatalogueCapabilities: (options?: any) => Promise<CatalogueCapabilities> =
    async () => {
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

      const orderOptions: OrderOption[] = [
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

      return {
        moviesCatalogue: {
          isSupported: true,
          orderOptions,
        },
        seriesCatalogue: {
          isSupported: true,
          orderOptions,
        },
        combinedCatalogue: {
          isSupported: false,
          orderOptions: [],
        },
        missingCatalogue: {
          isSupported: false,
          orderOptions: [],
        },
      };
    };

  getMovieCatalogue: (options: {
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

  getSeriesCatalogue: (options: {
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

  //   getMissingInCatalogue?: <T extends object = object>(options: {
  //     pagination: PaginationParams;
  //     order?: string;
  //     direction?: string;
  //     myListItems: Record<string, T>;
  //   }) => Promise<PaginatedResponse<T>>;
}
