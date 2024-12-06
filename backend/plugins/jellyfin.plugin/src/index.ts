import { Injectable } from '@nestjs/common';
import { generateApi, generateTemplates } from 'swagger-typescript-api';
import {
  BaseItemKind,
  ItemFields,
  Api as JellyfinApi,
} from './jellyfin.openapi';
import {
  PluginSettings,
  PluginSettingsTemplate,
  SourcePlugin,
} from 'plugins/plugin-types';

interface JellyfinSettings extends PluginSettings {
  apiKey: string;
  baseUrl: string;
  userId: string;
}

export const JELLYFIN_DEVICE_ID = 'Reiverr Client';

@Injectable()
export default class JellyfinPlugin implements SourcePlugin {
  name: string = 'jellyfin';

  validateSettings: (settings: JellyfinSettings) => Promise<{
    isValid: boolean;
    errors: Record<string, string>;
    replace: Record<string, any>;
  }> = async (settings) => {
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
      const context = new PluginContext(settings);
      let [user, err] = await context.api.users
        .getUserById(settings.userId)
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
      replace,
    };
  };

  getIndex: () => Promise<Record<number, any>>;

  getIsIndexable: () => boolean = () => true;

  getSettingsTemplate: () => PluginSettingsTemplate = () => ({
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
    userId: {
      type: 'string',
      label: 'Username or User ID',
      placeholder: 'username or user id',
    },
  });

  getEpisodeStream: (
    tmdbId: string,
    season: number,
    episode: number,
  ) => Promise<any>;

  handleProxy({ uri, headers }, settings: JellyfinSettings) {
    return {
      url: `${settings.baseUrl}/${uri}`,
      headers: {
        ...headers,
        Authorization: `MediaBrowser DeviceId="${JELLYFIN_DEVICE_ID}", Token="${settings.apiKey}"`,
      },
    };
  }

  private async getLibraryItems(context: PluginContext) {
    return context.api.items
      .getItems({
        userId: context.settings.userId,
        hasTmdbId: true,
        recursive: true,
        includeItemTypes: [BaseItemKind.Movie, BaseItemKind.Series],
        fields: [
          ItemFields.ProviderIds,
          ItemFields.Genres,
          ItemFields.DateLastMediaAdded,
          ItemFields.DateCreated,
          ItemFields.MediaSources,
        ],
      })
      .then((res) => {
        console.log(res.request.path);
        return res;
      })
      .then((res) => res.data.Items ?? []);
  }

  async getMovieStream(
    tmdbId: string,
    settings: JellyfinSettings,
  ): Promise<string> {
    const context = new PluginContext(settings);
    const items = await this.getLibraryItems(context);

    const movie = items.find((item) => item.ProviderIds?.Tmdb === tmdbId);

    // console.log(items.map((item) => item))

    if (!movie || !movie.MediaSources || movie.MediaSources.length === 0) {
      throw new Error('Movie stream not found');
    }

    /*
        await jellyfinApi.getPlaybackInfo(
          id,
          getDeviceProfile(),
          options.playbackPosition || item?.UserData?.PlaybackPositionTicks || 0,
          options.bitrate || getQualities(item?.Height || 1080)[0]?.maxBitrate,
          audioStreamIndex
        );
        */

    const playbackInfo = await context.api.items.getPlaybackInfo(movie.Id, {
      userId: context.settings.userId,
      // deviceId: JELLYFIN_DEVICE_ID,
      // mediaSourceId: movie.MediaSources[0].Id,
      // maxBitrate: 8000000,
    });

    const playbackUri =
      playbackInfo.data?.MediaSources?.[0]?.TranscodingUrl ||
      `/Videos/${playbackInfo.data?.MediaSources?.[0]?.Id}/stream.mp4?Static=true&mediaSourceId=${playbackInfo.data?.MediaSources?.[0]?.Id}&deviceId=${JELLYFIN_DEVICE_ID}&api_key=${context.settings.apiKey}&Tag=${playbackInfo.data?.MediaSources?.[0]?.ETag}`;

    return playbackUri;
  }
}

class PluginContext {
  api: JellyfinApi<{}>;
  settings: JellyfinSettings;

  constructor(settings: JellyfinSettings) {
    this.settings = settings;
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
