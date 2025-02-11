import {
  EpisodeMetadata,
  IndexItem,
  MovieMetadata,
  PaginatedResponse,
  PaginationParams,
  PlaybackConfig,
  SourceProviderSettingsTemplate,
  UserContext,
  ValidationResponse,
  Stream,
  StreamCandidate,
} from './types';

/**
 * PluginProvider is a class that provides a list of SourceProvider instances.
 * This is so that you can provide multiple SourceProviders in a single plugin.
 *
 * The plugin should default export a class that extends PluginProvider.
 *
 * @see SourceProvider
 */
export class PluginProvider {
  /**
   * @returns {SourceProvider[]} A list of SourceProvider instances that the plugin provides.
   */
  static getPlugins(): SourceProvider[] {
    return [];
  }
}

export class SettingsManager {
  getSettingsTemplate: () => SourceProviderSettingsTemplate = () => ({});

  validateSettings: (
    settings: Record<string, any>,
  ) => Promise<ValidationResponse> = async () => ({
    isValid: true,
    errors: {},
    replace: {},
  });
}

export abstract class SourceProvider {
  abstract name: string;

  settingsManager: SettingsManager = new SettingsManager();

  getMovieCatalogue?: (
    context: UserContext,
    pagination: PaginationParams,
  ) => Promise<PaginatedResponse<IndexItem>>;

  getEpisodeCatalogue?: (
    context: UserContext,
    pagination: PaginationParams,
  ) => Promise<PaginatedResponse<IndexItem>>;

  getMovieStreams?: (
    tmdbId: string,
    metadata: MovieMetadata,
    context: UserContext,
    config?: PlaybackConfig,
  ) => Promise<{ candidates: StreamCandidate[] }>;

  getEpisodeStreams?: (
    tmdbId: string,
    metadata: EpisodeMetadata,
    context: UserContext,
    config?: PlaybackConfig,
  ) => Promise<{ candidates: StreamCandidate[] }>;

  getMovieStream?: (
    tmdbId: string,
    metadata: MovieMetadata,
    key: string,
    context: UserContext,
    config?: PlaybackConfig,
  ) => Promise<Stream | undefined>;

  getEpisodeStream?: (
    tmdbId: string,
    metadata: EpisodeMetadata,
    key: string,
    context: UserContext,
    config?: PlaybackConfig,
  ) => Promise<Stream | undefined>;

  proxyHandler?: (
    req: any,
    res: any,
    options: { context: UserContext; uri: string; targetUrl?: string },
  ) => Promise<any>;
}
