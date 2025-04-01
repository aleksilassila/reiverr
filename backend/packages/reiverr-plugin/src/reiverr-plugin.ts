import * as packageJson from '../package.json';
import {
  CatalogueItem,
  OrderOption,
  PaginatedResponse,
  PaginationParams,
  PlaybackConfig,
  SourceProviderSettings,
  SourceProviderSettingsTemplate,
  Stream,
  StreamCandidate,
  UserContext,
  ValidationResponse,
} from './types';

/**
 * ReiverrPlugin is a class that a plugin should default export (or an array of ReiverrPlugins). It contains "static" methods that can be called without Reiverr user context.
 *
 * @see MediaSourceProvider
 */
export abstract class ReiverrPlugin {
  abstract name: string;

  /**
   * This method is called for every user request, and it should return an object that can handle requests that depend on an user that has connected to the plugin / configured it as a source in their settings page.
   */
  abstract getMediaSourceProvider: (
    userContext: UserContext,
  ) => MediaSourceProvider;

  /**
   * @returns The settings that the plugin supports. @see SourceProviderSettingsTemplate
   */
  getSettingsTemplate: () => SourceProviderSettingsTemplate = () => ({});

  validateSettings: (options: {
    settings: Record<string, any>;
  }) => Promise<ValidationResponse> = async () => ({
    isValid: true,
    errors: {},
    settings: {},
  });

  getPluginVersion(): string {
    return packageJson.version;
  }

  _isCompatibleWith(version: string): boolean {
    const pluginVersion = this.getPluginVersion();
    const pluginVersionParts = pluginVersion.split('.');
    const versionParts = version.split('.');

    if (
      !pluginVersionParts.length ||
      pluginVersionParts.length !== versionParts.length
    ) {
      return false;
    }

    return (
      pluginVersionParts[0] === versionParts[0] &&
      Number(pluginVersionParts[1]) >= Number(versionParts[1])
    );
  }
}

/**
 * MediaSourceProvider is a class that handles all requests for Reiverr users that have configured the plugin as MediaSource. A new MediaSourceProvider is instantiated for each request / function call, and it contains data about the Reiverr user that called the function.
 */
export abstract class MediaSourceProvider {
  /**
   * An id unique to each Reiverr user
   */
  protected userId: string;

  /**
   * The access token of the user that can be used to authenticate requests to the backend
   * (e.g. proxy requests)
   */
  protected token: string;
  /**
   * The id of the MediaSource instance that the user is using to access the SourceProvider
   */
  protected sourceId: string;

  /**
   * @see SourceProviderSettings
   */
  protected settings: SourceProviderSettings;

  constructor(userContext: UserContext) {
    this.userId = userContext.userId;
    this.token = userContext.token;
    this.sourceId = userContext.sourceId;
    this.settings = userContext.settings;
  }

  /**
   * Returns a list of stream candidates for a movie that the user can choose to stream from.
   *
   * @see StreamCandidate
   */
  abstract getTmdbMovieCandidates?: (options: {
    tmdbMovie: any;
  }) => Promise<{ candidates: StreamCandidate[] }>;

  /**
   * Returns a list of stream candidates for an episode that the user can choose to stream from.
   *
   * @see StreamCandidate
   */
  abstract getTmdbEpisodeCandidates?: (options: {
    tmdbSeries: any;
    tmdbEpisode: any;
  }) => Promise<{ candidates: StreamCandidate[] }>;

  /**
   * Returns a specific stream for a movie that the user can stream from.
   *
   * @see Stream
   */
  abstract getStream?: (options: {
    streamId: string;
    config?: PlaybackConfig;
  }) => Promise<Stream | undefined>;

  /**
   * This method will be called when the client makes a request to the provider's
   * proxy endpoint (e.g. /api/proxy/:providerName/:path). This can be used to
   * relay video streams and subtitles to the client, by making a request to an
   * external service and then returning the response to the client. Ideally,
   * the stream url pointed to by a `Stream` object should use the proxy endpoint
   * so that the plugin can handle the video requests here.
   */
  abstract proxyHandler?: (options: {
    req: any;
    res: any;
    uri: string;
    targetUrl?: string;
  }) => Promise<any>;

  getOrderOptions?: () => Promise<OrderOption[]> = () =>
    Promise.resolve([
      {
        label: 'Title',
        value: 'title',
        directions: [
          {
            label: 'Ascending',
            value: 'asc',
          },
          {
            label: 'Descending',
            value: 'desc',
          },
        ],
      },
    ]);

  /**
   * Returns an index of all items available in the source.
   */
  abstract getCatalogue?: (options: {
    pagination: PaginationParams;
    order?: string;
    direction?: string;
  }) => Promise<PaginatedResponse<CatalogueItem>>;

  /**
   * Returns an index of all movies available in the source.
   */
  abstract getMovieCatalogue?: (options: {
    pagination: PaginationParams;
    order?: string;
    direction?: string;
  }) => Promise<PaginatedResponse<CatalogueItem>>;

  /**
   * Returns an index of all series available in the source.
   */
  abstract getSeriesCatalogue?: (options: {
    pagination: PaginationParams;
    order?: string;
    direction?: string;
  }) => Promise<PaginatedResponse<CatalogueItem>>;

  /**
   * Filters my list items to only include those that are not available in the source.
   */
  abstract getMissingInCatalogue?: <T extends object = object>(options: {
    pagination: PaginationParams;
    order?: string;
    direction?: string;
    myListItems: Record<string, T>;
  }) => Promise<PaginatedResponse<T>>;
}

export function getReiverrPluginVersion(): string {
  return packageJson.version;
}
