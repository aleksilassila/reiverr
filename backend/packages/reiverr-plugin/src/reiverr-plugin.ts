import {
  EpisodeMetadata,
  CatalogueItem,
  MovieMetadata,
  PaginatedResponse,
  PaginationParams,
  PlaybackConfig,
  SourceProviderSettingsTemplate,
  UserContext,
  ValidationResponse,
  Stream,
  StreamCandidate,
  DirectionOption,
  OrderOption,
} from './types';
import * as packageJson from '../package.json';

/**
 * PluginProvider is a class that provides a list of SourceProvider instances.
 * This is so that you can provide multiple SourceProviders in a single plugin.
 *
 * The plugin should default export a class that extends PluginProvider.
 *
 * @see SourceProvider
 */
export abstract class PluginProvider {
  /**
   * @returns {SourceProvider[]} A list of SourceProvider instances that the plugin provides.
   */
  abstract getPlugins(): SourceProvider[];
}

export class SettingsManager {
  getSettingsTemplate: () => SourceProviderSettingsTemplate = () => ({});

  validateSettings: (
    settings: Record<string, any>,
  ) => Promise<ValidationResponse> = async () => ({
    isValid: true,
    errors: {},
    settings: {},
  });
}

export class CatalogueProvider {
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

  getSupportsSortDirection?: () => Promise<boolean> = () =>
    Promise.resolve(false);

  /**
   * Returns an index of all items available in the source.
   */
  getCatalogue?: (options: {
    context: UserContext;
    pagination: PaginationParams;
    order?: string;
    direction?: string;
  }) => Promise<PaginatedResponse<CatalogueItem>>;

  /**
   * Returns an index of all movies available in the source.
   */
  getMovieCatalogue?: (options: {
    context: UserContext;
    pagination: PaginationParams;
    order?: string;
    direction?: string;
  }) => Promise<PaginatedResponse<CatalogueItem>>;

  /**
   * Returns an index of all series available in the source.
   */
  getSeriesCatalogue?: (options: {
    context: UserContext;
    pagination: PaginationParams;
    order?: string;
    direction?: string;
  }) => Promise<PaginatedResponse<CatalogueItem>>;

  /**
   * Filters my list items to only include those that are not available in the source.
   */
  getMissingInCatalogue?: <T extends object = object>(options: {
    context: UserContext;
    pagination: PaginationParams;
    order?: string;
    direction?: string;
    myListItems: Record<string, T>;
  }) => Promise<PaginatedResponse<T>>;
}

/**
 * SourceProvider is a class that provides a set of methods to interact with a streaming source.
 *
 * Important distinction between SourceProvider and MediaSource:
 * An user doesn't directly add a SourceProvider to their account, but instead users can configure
 * `MediaSources`. MediaSource is essentially all the user-specific configuration that SourceProvider
 * needs to function. This way different users can have different configurations for the same
 * SourceProvider - for example, two users can use the same JellyfinPlugin (JellyfinSourceProvider)
 * to access two different Jellyfin servers, because they access the provider with their own
 * MediaSource instances.
 *
 * UserContext is used to pass the user-specific configuration to the SourceProvider methods.
 *
 * @see UserContext
 * @see PluginProvider
 */
export abstract class SourceProvider {
  abstract name: string;

  settingsManager: SettingsManager = new SettingsManager();

  catalogueProvider: CatalogueProvider | undefined;

  /**
   * Returns a list of stream candidates for a movie that the user can choose to stream from.
   *
   * @see StreamCandidate
   */
  getMovieStreams?: (
    tmdbId: string,
    metadata: MovieMetadata,
    context: UserContext,
    config?: PlaybackConfig,
  ) => Promise<{ candidates: StreamCandidate[] }>;

  /**
   * Returns a list of stream candidates for an episode that the user can choose to stream from.
   *
   * @see StreamCandidate
   */
  getEpisodeStreams?: (
    tmdbId: string,
    metadata: EpisodeMetadata,
    context: UserContext,
    config?: PlaybackConfig,
  ) => Promise<{ candidates: StreamCandidate[] }>;

  /**
   * Returns a specific stream for a movie that the user can stream from.
   *
   * @see Stream
   */
  getMovieStream?: (
    tmdbId: string,
    metadata: MovieMetadata,
    key: string,
    context: UserContext,
    config?: PlaybackConfig,
  ) => Promise<Stream | undefined>;

  /**
   * Returns a specific stream for an episode that the user can stream from.
   *
   * @see Stream
   */
  getEpisodeStream?: (
    tmdbId: string,
    metadata: EpisodeMetadata,
    key: string,
    context: UserContext,
    config?: PlaybackConfig,
  ) => Promise<Stream | undefined>;

  /**
   * This method will be called when the client makes a request to the provider's
   * proxy endpoint (e.g. /api/proxy/:providerName/:path). This can be used to
   * relay video streams and subtitles to the client, by making a request to an
   * external service and then returning the response to the client. Ideally,
   * the stream url pointed to by a `Stream` object should use the proxy endpoint
   * so that the plugin can handle the video requests here.
   */
  proxyHandler?: (
    req: any,
    res: any,
    options: { context: UserContext; uri: string; targetUrl?: string },
  ) => Promise<any>;

  _getPluginVersion(): string {
    return getReiverrPluginVersion();
  }

  _isCompatibleWith(version: string): boolean {
    const pluginVersion = getReiverrPluginVersion();
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

export function getReiverrPluginVersion(): string {
  return packageJson.version;
}
