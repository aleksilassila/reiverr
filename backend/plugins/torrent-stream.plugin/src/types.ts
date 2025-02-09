import type { PluginSettings, UserContext } from '../../plugin-types';

export interface TorrentSettings extends PluginSettings {
  apiKey: string;
  baseUrl: string;
}

export interface TorrentUserContext extends UserContext {
  settings: TorrentSettings;
}
