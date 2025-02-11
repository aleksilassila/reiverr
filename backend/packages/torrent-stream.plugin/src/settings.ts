import {
  SettingsManager,
  SourceProviderSettingsTemplate,
} from '@aleksilassila/reiverr-plugin';

export class TorrentSettingsManager extends SettingsManager {
  getSettingsTemplate = (): SourceProviderSettingsTemplate => ({
    baseUrl: {
      type: 'string',
      label: 'Base URL',
      placeholder: 'http://localhost:8096',
    },
    apiKey: {
      type: 'password',
      label: 'API Key',
      placeholder: '',
    },
  });
}
