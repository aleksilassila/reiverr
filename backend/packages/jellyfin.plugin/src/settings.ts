import {
  SettingsManager,
  SourceProviderSettingsTemplate,
  ValidationResponse,
} from '@aleksilassila/reiverr-plugin';
import { PluginContext } from './plugin-context';

export class JellyfinSettingsManager extends SettingsManager {
  validateSettings = async (
    settings: Record<string, any>,
  ): Promise<ValidationResponse> => {
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
      const context = new PluginContext(settings as any);
      let [user, err] = await context.api.users
        .getUserById(settings.userId, { timeout: 5000 })
        .then((res) => [res.data, undefined])
        .catch((err) => [undefined, err.message]);

      if (!user && err) {
        [user, err] = await context.api.users
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
      settings: { ...settings, ...replace },
    };
  };

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
}
