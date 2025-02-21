import { DeviceProfile } from './device-profile';

export enum SourceProviderError {
  StreamNotFound = 'StreamNotFound',
}

export type SourceProviderSetting = {
  required?: boolean;
};

export type SourceProviderSettingsLink = SourceProviderSetting & {
  type: 'link';
  url: string;
  label: string;
};

export type SourceProviderSettingsInput = SourceProviderSetting & {
  type: 'string' | 'number' | 'boolean' | 'password';
  label: string;
  placeholder: string;
};

export type SourceProviderSettingsTemplate = Record<
  string,
  SourceProviderSettingsLink | SourceProviderSettingsInput
>;

/**
 * UserContext is used to pass the user-specific configuration to the SourceProvider methods.
 */
export type UserContext = {
  /**
   * An id unique to each Reiverr user
   */
  userId: string;

  /**
   * The access token of the user that can be used to authenticate requests to the backend
   * (e.g. proxy requests)
   */
  token: string;
  /**
   * The id of the MediaSource instance that the user is using to access the SourceProvider
   */
  sourceId: string;

  /**
   * @see SourceProviderSettings
   */
  settings: SourceProviderSettings;
};

/**
 * The settings/configuration defined in the `SourceProvider` and
 * provided by the user's MediaSource instance
 */
export type SourceProviderSettings = Record<string, any>;

export type ValidationResponse = {
  isValid: boolean;
  errors: Record<string, string>;
  settings: Record<string, any>;
};

export type AudioStream = {
  index: number;
  label: string;
  codec: string | undefined;
  bitrate: number | undefined;
};

export type Quality = {
  index: number;
  bitrate: number;
  label: string;
  codec: string | undefined;
  original: boolean;
};

export type Subtitles = {
  src: string;
  lang: string;
  kind: 'subtitles' | 'captions' | 'descriptions';
  label: string;
};

export type StreamProperty = {
  /**
   * The label of the property
   * @example "Resolution"
   */
  label: string;

  /**
   * Used for sorting and filtering, or displayed if `formatted` is not provided.
   * @example 1080
   */
  value: string | number;

  /**
   * The formatted value of the property
   * @example "1080p"
   */
  formatted: string | undefined;
};

/**
 * `StreamCandidate` represents a stream that can be played by the user,
 * and contains all the information that is presented to the user in the
 * stream selection UI.
 */
export type StreamCandidate = {
  /**
   * Unique id for the stream, that can be used to later stream the specific stream.
   */
  key: string;

  /**
   * Title of the stream, presented to the user.
   */
  title: string;

  /**
   * A list of properties that are shown to the user in the stream selection UI.
   */
  properties: StreamProperty[];
};

export type Stream = StreamCandidate & {
  src: string;
  directPlay: boolean;
  progress: number;
  duration: number;
  audioStreams: AudioStream[];
  audioStreamIndex: number;
  qualities: Quality[];
  qualityIndex: number;
  subtitles: Subtitles[];
};

export type PlaybackConfig = {
  bitrate: number | undefined;
  audioStreamIndex: number | undefined;
  progress: number | undefined;
  deviceProfile: DeviceProfile | undefined;
  defaultLanguage: string | undefined;
};

export type IndexItem = {
  id: string;
};

export type PaginatedResponse<T> = {
  total: number;
  page: number;
  itemsPerPage: number;
  items: T[];
};

export type PaginationParams = {
  page: number;
  itemsPerPage: number;
};

interface Metadata {
  tmdbId?: string;
  imdbId?: string;
  year?: number;
}

export interface MovieMetadata extends Metadata {
  title: string;
  runtime?: number;
}

export interface EpisodeMetadata extends Metadata {
  series: string;
  season: number;
  episode: number;
  episodeRuntime?: number;
  seasonEpisodes?: number;
}
