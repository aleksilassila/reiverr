import { Injectable } from '@nestjs/common';
import { generateApi, generateTemplates } from 'swagger-typescript-api';
import {
  BaseItemKind,
  ItemFields,
  Api as JellyfinApi,
} from './api/jellyfin.openapi';

export interface SourcePlugin {
  handleProxy(request: { uri: string; headers: any }): any;
  name: string;
  indexable: boolean;
  getMovieStream: (tmdbId: string) => Promise<string>;
}

const config = {
  apiKey: '',
  baseUrl: 'http://192.168.0.129:8096',
  userId: '',
};
export const JELLYFIN_DEVICE_ID = 'Reiverr Client';

@Injectable()
export default class JellyfinPlugin implements SourcePlugin {
  name: string = 'jellyfin';
  indexable: boolean = true;

  api: JellyfinApi<{}>;

  constructor() {
    generateApi({
      name: 'jellyfin.openapi.ts',
      url: 'https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json',
      output:
        '/Users/aleksilassila/Workspace/Documents/node/reiverr/backend/plugins/jellyfin.plugin/api',
      // generateClient: true,
      // generateRouteTypes: false,
      // sortTypes: true,
      httpClientType: 'axios',
    });

    this.api = new JellyfinApi({
      baseURL: config.baseUrl,
      headers: {
        Authorization: `MediaBrowser DeviceId="${JELLYFIN_DEVICE_ID}", Token="${config.apiKey}"`,
      },
      paramsSerializer: {
        indexes: null,
      },
    });
  }
  handleProxy({ uri, headers }) {
    return {
      url: `${config.baseUrl}/${uri}`,
      headers: {
        ...headers,
        Authorization: `MediaBrowser DeviceId="${JELLYFIN_DEVICE_ID}", Token="${config.apiKey}"`,
      },
    };
  }

  private async getLibraryItems() {
    return this.api.items
      .getItems({
        userId: config.userId,
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

  async getMovieStream(tmdbId: string): Promise<string> {
    const items = await this.getLibraryItems();

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

    const playbackInfo = await this.api.items.getPlaybackInfo(movie.Id, {
      userId: config.userId,
      // deviceId: JELLYFIN_DEVICE_ID,
      // mediaSourceId: movie.MediaSources[0].Id,
      // maxBitrate: 8000000,
    });

    const playbackUri =
      playbackInfo.data?.MediaSources?.[0]?.TranscodingUrl ||
      `/Videos/${playbackInfo.data?.MediaSources?.[0]?.Id}/stream.mp4?Static=true&mediaSourceId=${playbackInfo.data?.MediaSources?.[0]?.Id}&deviceId=${JELLYFIN_DEVICE_ID}&api_key=${config.apiKey}&Tag=${playbackInfo.data?.MediaSources?.[0]?.ETag}`;

    return playbackUri;
  }
}
