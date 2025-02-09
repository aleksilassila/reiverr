import {
  SourceProviderSettings,
  UserContext,
} from '@aleksilassila/reiverr-plugin';
import { Api as JellyfinApi } from './jellyfin.openapi';
import { JELLYFIN_DEVICE_ID } from './utils';
import { PluginSettings } from 'plugins/plugin-types';

export interface JellyfinSettings extends SourceProviderSettings {
  apiKey: string;
  baseUrl: string;
  userId: string;
}

export interface JellyfinUserContext extends UserContext {
  settings: JellyfinSettings;
}

export class PluginContext {
  api: JellyfinApi<unknown>;
  settings: JellyfinSettings;
  token: string;

  constructor(settings: PluginSettings, token = '') {
    this.token = token;
    this.settings = settings as JellyfinSettings;
    this.api = new JellyfinApi({
      baseURL: settings.baseUrl,
      headers: {
        Authorization: `MediaBrowser DeviceId="${JELLYFIN_DEVICE_ID}", Token="${settings.apiKey}"`,
      },
      paramsSerializer: {
        indexes: null,
      },
    });
  }
}
