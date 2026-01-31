import {
  Commands,
  GetVideoCandidatesDto,
  GetVideoCandidatesResponseDto,
  GetVideoStreamDto,
  GetVideoStreamResponseDto,
  MediaPluginSettings,
  MediaPluginSettingsResponseDto,
  mediaPluginVersion,
} from '@aleksilassila/reiverr-shared/dist/src/old';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { MEDIA_PLUGIN_CLIENTS } from './media-plugin-clients.provider';
import { TmdbSeries } from 'src/metadata/tmdb/tmdb.dto';

class MediaPlugin {
  id: string;
  client: ClientProxy;
  settings: MediaPluginSettings;

  isCompatibleWith(reiverrVersion: string): boolean {
    const pluginVersionParts = this.settings.version.split('.');
    const reiverrVersionParts = reiverrVersion.split('.');

    if (
      !pluginVersionParts.length ||
      pluginVersionParts.length !== reiverrVersionParts.length
    ) {
      return false;
    }

    return (
      pluginVersionParts[0] === reiverrVersionParts[0] &&
      Number(reiverrVersionParts[1]) >= Number(pluginVersionParts[1])
    );
  }

  getVideoCandidates(data: GetVideoCandidatesDto) {
    return firstValueFrom(
      this.client.send<GetVideoCandidatesResponseDto>(
        { cmd: Commands.getVideoCandidates },
        data,
      ),
    );
  }

  getVideoStream(data: GetVideoStreamDto) {
    return firstValueFrom(
      this.client.send<GetVideoStreamResponseDto>(
        { cmd: Commands.createVideoStream },
        data,
      ),
    );
  }
}

@Injectable()
export class MediaPluginsService {
  private logger = new Logger(MediaPluginsService.name);
  private plugins: Record<string, MediaPlugin> = {};

  constructor(
    @Inject(MEDIA_PLUGIN_CLIENTS)
    private readonly clients: ClientProxy[],
  ) {
    this.logger.log('Using Reiverr plugin API version ' + mediaPluginVersion);

    const connectedClients = Promise.all(
      this.clients.map(async (client, index) => {
        const success = await client
          .connect()
          .then(() => true)
          .catch((err) => {
            this.logger.error(
              `Failed to connect to media server client #${index}: ${err}`,
            );
            return false;
          });

        if (success) return client;

        this.logger.log(`Connected to media server client #${index}`);
      }),
    ).then(
      (clients) => clients.filter((c) => c !== undefined) as ClientProxy[],
    );

    const plugins = connectedClients
      .then((clients) =>
        Promise.all(
          clients.map(async (client) => {
            const settings = await this.getSettings(client);
            if (settings) {
              const plugin = new MediaPlugin();
              plugin.id = settings.id;
              plugin.client = client;
              plugin.settings = settings;
              return plugin;
            }
            return undefined;
          }),
        ),
      )
      .then(
        (plugins) => plugins.filter((p) => p !== undefined) as MediaPlugin[],
      );

    plugins.then((plugins) => {
      for (const plugin of plugins) {
        if (plugin.isCompatibleWith(mediaPluginVersion)) {
          this.plugins[plugin.id] = plugin;
          this.logger.log(
            `Loaded media plugin: ${plugin.settings.name} (v${plugin.settings.version})`,
          );
        } else {
          this.logger.warn(
            `Incompatible media plugin version: ${plugin.settings.name} (v${plugin.settings.version})`,
          );
        }
      }
    });
  }

  private async getSettings(client: ClientProxy): Promise<MediaPluginSettings> {
    return lastValueFrom(
      client.send<MediaPluginSettingsResponseDto>(
        { cmd: Commands.settings },
        {},
      ),
    )
      .then((r) => r.settings)
      .catch((err) => undefined);
  }

  getPlugins(): Array<MediaPlugin> {
    return Object.values(this.plugins);
  }

  getPlugin(id: string): MediaPlugin | undefined {
    return this.plugins[id];
  }
}
