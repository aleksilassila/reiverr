import { Inject, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PluginProvider, SourceProvider } from 'plugin-types';

@Injectable()
export class SourcePluginsService {
  private plugins: Record<string, SourceProvider> = {};

  constructor() {
    console.log('Loading source plugins...');

    this.plugins = this.loadPlugins(
      path.join(require.main.path, '..', '..', 'plugins'),
    );

    console.log(
      `Loaded source plugins: ${Object.keys(this.plugins).join(', ')}`,
    );
  }

  async getPlugins(): Promise<Record<string, SourceProvider>> {
    return this.plugins;
  }

  private loadPlugins(rootDirectory: string): Record<string, SourceProvider> {
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
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pluginModule = require(pluginPath);
        const provider: typeof PluginProvider = pluginModule.default;
        provider.getPlugins().forEach((plugin) => {
          plugins[plugin.name] = plugin;
        });
      } catch (e) {
        console.error(`Failed to load plugin from ${pluginPath}: ${e}`);
      }
    }

    return plugins;
  }

  getPlugin(pluginName: string): SourceProvider | undefined {
    return this.plugins[pluginName];
  }
}
