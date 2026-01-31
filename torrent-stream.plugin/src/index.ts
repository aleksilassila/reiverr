import {
  CatalogueProvider,
  MediaSourceProvider,
  ReiverrPlugin,
  SourceProviderSettings,
  SourceProviderSettingsTemplate,
  UserContext,
  ValidationResponse,
} from '@aleksilassila/reiverr-shared/dist/src/old';
import { testConnection } from './lib/jackett.api';
import { TorrentMediaSourceProvider } from './media-source-provider';

class TorrentCatalogueProvider extends CatalogueProvider {}

class TorrentPlugin extends ReiverrPlugin {
  name: string = 'torrent';

  getCatalogueProvider: (options: {
    userId: string;
    sourceId: string;
    settings: SourceProviderSettings;
  }) => CatalogueProvider = (options) => new TorrentCatalogueProvider(options);

  getMediaSourceProvider: (
    options: {
      userId: string;
      sourceId: string;
      settings: SourceProviderSettings;
    } & { token: string },
  ) => MediaSourceProvider = (options) =>
    new TorrentMediaSourceProvider(options);

  // getMediaSourceProvider: (userContext: UserContext) => MediaSourceProvider = (
  //   context,
  // ) => new TorrentMediaSourceProvider(context);

  getSettingsTemplate: () => SourceProviderSettingsTemplate = () => ({
    baseUrl: {
      type: 'string',
      label: 'Jackett URL',
      placeholder:
        'http://127.0.0.1:9117/api/v2.0/indexers/indexer/results/torznab/',
      required: true,
    },
    apiKey: {
      type: 'password',
      label: 'Jackett API Key',
      placeholder: '',
      required: true,
    },
  });

  validateSettings: (options: {
    settings: Record<string, any>;
  }) => Promise<ValidationResponse> = async ({ settings }) => {
    const { baseUrl, apiKey } = settings;
    let isValid = true;
    const errors = {
      baseUrl: '',
      apiKey: '',
    };

    if (!baseUrl) {
      isValid = false;
      errors.baseUrl = 'Base URL is required';
    }

    if (!apiKey) {
      isValid = false;
      errors.apiKey = 'API Key is required';
    }

    if (isValid) {
      await testConnection({ baseUrl, apiKey })
        .then((err) => {
          if (err) {
            isValid = false;
            errors.apiKey = err;
          }
        })
        .catch((e) => {
          isValid = false;
          errors.baseUrl = e.message ?? 'Invalid URL';
        });
    }

    return { isValid, errors, settings };
  };
}

export default new TorrentPlugin();
