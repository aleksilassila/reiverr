import {
  PluginService,
  PluginMediaService,
} from '@aleksilassila/reiverr-shared';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  ClientGrpcProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { join } from 'path';
import { SettingsService } from 'src/settings/settings.service';
import { firstValueFrom } from 'rxjs';
import { mediaPluginVersion } from '@aleksilassila/reiverr-shared/dist/src/old';

const SETTINGS_KEY = 'plugin-clients';

// Persist what's needed for creating ClientProxies
export interface PluginConfig {
  id: string;
  url: string;
}

interface PluginSettings {
  pluginConfigs: PluginConfig[];
}

interface PluginClient {
  config: PluginConfig;
  client: ClientGrpcProxy;
  pluginService: PluginService;
  mediaService?: PluginMediaService;
}

/**
 * @todo Check for race conditions
 */
@Injectable()
export class PluginsService implements OnModuleInit {
  private logger = new Logger(PluginsService.name);
  private clients: Record<string, PluginClient> = {};

  constructor(private readonly settingsService: SettingsService) {}

  async onModuleInit() {
    const settings = await this.getSettings();

    for (const config of settings.pluginConfigs) {
      try {
        await this.initializeClient(config);
      } catch (error) {
        console.error(`Failed to initialize plugin ${config.id}:`, error);
      }
    }
  }

  private async initializeClient(config: PluginConfig): Promise<void> {
    const client = ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        url: config.url,
        package: 'aleksilassila.reiverr.plugin.v1',
        protoPath: join(__dirname, '../../../../shared/reiverr-plugin.proto'),
      },
    });

    const pluginService = client.getService<PluginService>('PluginService');

    // Get plugin info to determine which services to initialize
    const pluginInfo = await firstValueFrom(pluginService.GetInfo({}));

    this.logger.log(
      `Initializing plugin ${pluginInfo.name} (ID: ${config.id})`,
    );
    this.logger.debug(JSON.stringify(pluginInfo, null, 2));

    // Version check
    const pluginVersionParts = pluginInfo.apiVersion.split('.');
    const reiverrVersionParts = mediaPluginVersion.split('.');

    if (
      !pluginVersionParts.length ||
      pluginVersionParts.length !== reiverrVersionParts.length ||
      pluginVersionParts[0] !== reiverrVersionParts[0] ||
      Number(reiverrVersionParts[1]) < Number(pluginVersionParts[1])
    ) {
      this.logger.warn(
        `Plugin ${pluginInfo.name} (ID: ${config.id}) has incompatible API version ${pluginInfo.apiVersion}, disabling...`,
      );
      client.close();
      return;
    }

    const pluginClient: PluginClient = {
      config,
      client,
      pluginService,
    };

    // Conditionally initialize services based on capabilities
    if (pluginInfo.streamingSupported) {
      pluginClient.mediaService =
        client.getService<PluginMediaService>('PluginMediaService');
    }

    this.clients[config.id] = pluginClient;
    this.logger.log(
      `Plugin ${pluginInfo.name} (ID: ${config.id}) initialized successfully`,
    );
  }

  private async getSettings(): Promise<PluginSettings> {
    const settings =
      await this.settingsService.getValue<PluginSettings>(SETTINGS_KEY);

    return settings ?? { pluginConfigs: [] };
  }

  private async saveSettings(settings: PluginSettings): Promise<void> {
    const saved = await this.settingsService.saveValue(SETTINGS_KEY, settings);

    if (!saved) {
      throw new Error('Failed to save plugin settings');
    }
  }

  async addClient(url: string): Promise<{ id: string }> {
    const settings = await this.getSettings();

    // Check if already exists
    const existing = settings.pluginConfigs.find((c) => c.url === url);
    if (existing) {
      return { id: existing.id };
    }

    // Generate new ID and config
    const id = Math.random().toString(36).substring(2, 15);
    const config: PluginConfig = { id, url };

    // Save to settings
    await this.saveSettings({
      pluginConfigs: [...settings.pluginConfigs, config],
    });

    // Initialize the client
    await this.initializeClient(config);

    return { id };
  }

  async removeClient(id: string): Promise<void> {
    const settings = await this.getSettings();

    // Remove from settings
    const newConfigs = settings.pluginConfigs.filter((c) => c.id !== id);
    await this.saveSettings({ pluginConfigs: newConfigs });

    // Close and remove the client
    const pluginClient = this.clients[id];
    if (pluginClient) {
      await pluginClient.client.close();
      delete this.clients[id];
    }
  }

  getClient(id: string): PluginClient | undefined {
    return this.clients[id];
  }

  getClients(): Record<string, PluginClient> {
    return this.clients;
  }

  getMediaServices(): PluginClient[] {
    return Object.values(this.clients).filter((client) => client.mediaService);
  }
}
