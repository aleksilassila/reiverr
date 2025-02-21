import {
  SettingsManager,
  SourceProviderSettingsTemplate,
  ValidationResponse,
} from '@aleksilassila/reiverr-plugin';
import { testConnection } from './lib/jackett.api';

export class TorrentSettingsManager extends SettingsManager {
  validateSettings = async (
    settings: Record<string, any>,
  ): Promise<ValidationResponse> => {
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

  getSettingsTemplate = (): SourceProviderSettingsTemplate => ({
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
}
