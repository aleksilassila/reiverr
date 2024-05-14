import createClient from 'openapi-fetch';
import { Api } from './api.interface';
import { paths } from './jellyfin.generated';
import { User } from './user/user.entity';

export const JELLYFIN_DEVICE_ID = 'Reiverr Client';

export class JellyfinApi implements Api<paths> {
  user: User;

  constructor(user: User) {
    this.user = user;
  }

  getClient() {
    const jellyfinSettings = this.user?.settings.jellyfin;
    const baseUrl = jellyfinSettings?.baseUrl;
    const apiKey = jellyfinSettings?.apiKey;

    return createClient<paths>({
      baseUrl,
      headers: {
        Authorization: `MediaBrowser DeviceId="${JELLYFIN_DEVICE_ID}", Token="${apiKey}"`,
      },
    });
  }

  getUserId() {
    return this.user?.settings.jellyfin.userId || '';
  }

  getApiKey() {
    return this.user?.settings.jellyfin.apiKey || '';
  }

  getBaseUrl() {
    return this.user?.settings.jellyfin.baseUrl || '';
  }

  getLibraryItems = async () =>
    this.getClient()
      .GET('/Users/{userId}/Items', {
        params: {
          path: {
            userId: this.getUserId(),
          },
          query: {
            hasTmdbId: true,
            recursive: true,
            includeItemTypes: ['Movie', 'Series'],
            fields: [
              'ProviderIds',
              'Genres',
              'DateLastMediaAdded',
              'DateCreated',
              'MediaSources',
            ],
          },
        },
      })
      .then((r) => r.data?.Items || []) || Promise.resolve([]);
}
