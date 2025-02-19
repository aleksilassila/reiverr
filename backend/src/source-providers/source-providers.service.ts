import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
  PluginProvider,
  SourceProvider,
  getReiverrPluginVersion,
} from '@aleksilassila/reiverr-plugin';

@Injectable()
export class SourceProvidersService {
  private logger = new Logger(SourceProvidersService.name);
  private providers: Record<string, SourceProvider> = {};

  constructor() {
    this.logger.log(
      'Using Reiverr plugin API version ' + getReiverrPluginVersion(),
    );

    this.providers = {
      ...this.loadPlugins(path.join(require.main.path, '..', '..', 'packages')),
      ...this.loadPlugins(path.join(require.main.path, '..', '..', 'plugins')),
    };

    this.logger.log(
      `Loaded source plugins: ${Object.keys(this.providers).join(', ')}`,
    );
  }

  async getProviders(): Promise<Record<string, SourceProvider>> {
    return this.providers;
  }

  private loadPlugins(rootDirectory: string): Record<string, SourceProvider> {
    this.logger.log(`Loading plugins from ${rootDirectory}`);
    const pluginDirectories = fs.readdirSync(rootDirectory);

    const pluginPaths = [];
    for (const directoryName of pluginDirectories) {
      const directoryPath = path.join(rootDirectory, directoryName);
      const directoryStat = fs.statSync(directoryPath);

      if (directoryStat.isDirectory() && directoryName.endsWith('.plugin')) {
        pluginPaths.push(directoryPath);
      }
    }

    const plugins: Record<string, SourceProvider> = {};

    for (const pluginPath of pluginPaths) {
      try {
        const supportedPluginVersion = getReiverrPluginVersion();
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pluginModule = require(pluginPath);
        const provider: PluginProvider =
          new pluginModule.default() as PluginProvider;
        provider.getPlugins().forEach((plugin) => {
          if (plugin._isCompatibleWith(supportedPluginVersion)) {
            plugins[plugin.name] = plugin;
          } else {
            this.logger.warn(
              `Plugin ${
                plugin.name
              }@${plugin._getPluginVersion()} is not compatible with Reiverr plugin API version ${supportedPluginVersion}`,
            );
          }
        });
      } catch (e) {
        this.logger.error(`Failed to load plugin from ${pluginPath}: ${e}`);
      }
    }

    return plugins;
  }

  getProvider(pluginName: string): SourceProvider | undefined {
    return this.providers[pluginName];
  }
}
