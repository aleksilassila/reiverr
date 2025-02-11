import {
  SourceProviderSettings,
  UserContext,
} from '@aleksilassila/reiverr-plugin';
import { Api as JellyfinApi } from './jellyfin.openapi';
import { JELLYFIN_DEVICE_ID } from './utils';

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

  constructor(settings: SourceProviderSettings, token = '') {
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
