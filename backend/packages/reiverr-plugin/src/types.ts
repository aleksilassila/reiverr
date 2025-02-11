import { DeviceProfile } from './device-profile';

export enum SourceProviderError {
  StreamNotFound = 'StreamNotFound',
}

export type SourceProviderSettingsLink = {
  type: 'link';
  url: string;
  label: string;
};

export type SourceProviderSettingsInput = {
  type: 'string' | 'number' | 'boolean' | 'password';
  label: string;
  placeholder: string;
};

export type SourceProviderSettingsTemplate = Record<
  string,
  SourceProviderSettingsLink | SourceProviderSettingsInput
>;

export type UserContext = {
  userId: string;
  token: string;
  sourceId: string;
  settings: SourceProviderSettings;
};

export type SourceProviderSettings = Record<string, any>;

export type ValidationResponse = {
  isValid: boolean;
  errors: Record<string, string>;
  replace: Record<string, any>;
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
  label: string;
  value: string | number;
  formatted: string | undefined;
};

export type StreamCandidate = {
  key: string;
  title: string;
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
