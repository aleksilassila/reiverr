import type {
  SourceProviderSettings,
  UserContext,
} from '@aleksilassila/reiverr-plugin';

export interface TorrentSettings extends SourceProviderSettings {
  apiKey: string;
  baseUrl: string;
}

export interface TorrentUserContext extends UserContext {
  settings: TorrentSettings;
}
