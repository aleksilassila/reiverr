import {
  SettingsManager,
  SourceProviderSettingsTemplate,
} from '@aleksilassila/reiverr-plugin';

export class TorrentSettingsManager extends SettingsManager {
  getSettingsTemplate = (): SourceProviderSettingsTemplate => ({
    baseUrl: {
      type: 'string',
      label: 'Jackett URL',
      placeholder:
        'http://127.0.0.1:9117/api/v2.0/indexers/indexer/results/torznab/',
    },
    apiKey: {
      type: 'password',
      label: 'Jackett API Key',
      placeholder: '',
    },
  });
}
