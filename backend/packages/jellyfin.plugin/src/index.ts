import {
  CatalogueProvider,
  MediaSourceProvider,
  ReiverrPlugin,
  SourceProviderSettings,
  SourceProviderSettingsTemplate,
  ValidationResponse,
} from '@aleksilassila/reiverr-plugin';
import { JellyfinMediaSourceProvider } from './media-source-provider';
import { JellyfinCatalogueProvider } from './catalogue-provider';

class JellyfinPlugin extends ReiverrPlugin {
  name: string = 'jellyfin';

  getMediaSourceProvider: (
    options: {
      userId: string;
      sourceId: string;
      settings: SourceProviderSettings;
    } & { token: string },
  ) => MediaSourceProvider = (options) =>
    new JellyfinMediaSourceProvider(options);

  getCatalogueProvider: (options: {
    userId: string;
    sourceId: string;
    settings: SourceProviderSettings;
  }) => CatalogueProvider = (options) => new JellyfinCatalogueProvider(options);

  getSettingsTemplate: () => SourceProviderSettingsTemplate = () => ({
    baseUrl: {
      type: 'string',
      label: 'Base URL',
      placeholder: 'http://localhost:8096',
      required: true,
    },
    apiKey: {
      type: 'password',
      label: 'API Key',
      placeholder: '',
      required: true,
    },
    userId: {
      type: 'string',
      label: 'Username or User ID',
      placeholder: 'username or user id',
      required: true,
    },
  });

  validateSettings: (options: {
    settings: Record<string, any>;
  }) => Promise<ValidationResponse> = async ({ settings }) => {
    let isValid = true;
    const errors = {
      baseUrl: '',
      apiKey: '',
      userId: '',
    };
    const replace: Record<string, any> = {};

    if (!settings.baseUrl) {
      isValid = false;
      errors.baseUrl = 'Base URL is required';
    }

    if (!settings.apiKey) {
      isValid = false;
      errors.apiKey = 'API Key is required';
    }

    if (!settings.userId) {
      isValid = false;
      errors.userId = 'User ID is required';
    }

    if (isValid) {
      const mediaSourceProvider = new JellyfinMediaSourceProvider({
        settings,
        token: '',
        sourceId: '',
        userId: '',
      });
      let [user, err] = await mediaSourceProvider.api.users
        .getUserById(settings.userId, { timeout: 5000 })
        .then((res) => [res.data, undefined])
        .catch((err) => [undefined, err.message]);

      if (!user && err) {
        [user, err] = await mediaSourceProvider.api.users
          .getUsers()
          .then((res) => res.data?.find((u) => u.Name === settings.userId))
          .then((user) => {
            if (!user || !user.Id) {
              return [undefined, 'User not found'];
            }

            replace.userId = user.Id;

            return [user, undefined];
          })
          .catch((err) => [undefined, err.message]);
      }

      if (!user && err) {
        isValid = false;
        errors.userId = `Could not get user: ${err}`;
      }
    }

    return {
      isValid,
      errors,
      settings: replace,
    };
  };
}

export default new JellyfinPlugin();
