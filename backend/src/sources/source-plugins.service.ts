import { Inject, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface SourcePlugin {
  handleProxy(request: { uri: string; headers: any }): any;
  name: string;
  indexable: boolean;
  getMovieStream: (tmdbId: string) => Promise<string>;
}

@Injectable()
export class SourcePluginsService {
  private plugins: Record<string, SourcePlugin>;

  constructor() {
    console.log('Loading source plugins...');

    this.plugins = this.loadPlugins(
      path.join(require.main.path, '..', 'plugins'),
    );

    console.log(
      `Loaded source plugins: ${Object.keys(this.plugins).join(', ')}`,
    );
  }

  async getLoadedPlugins(): Promise<Record<string, SourcePlugin>> {
    return this.plugins;
  }

  private loadPlugins(rootDirectory: string): Record<string, SourcePlugin> {
    const pluginDirectories = fs.readdirSync(rootDirectory);

    const pluginPaths = [];
    for (const directoryName of pluginDirectories) {
      const directoryPath = path.join(rootDirectory, directoryName);
      const directoryStat = fs.statSync(directoryPath);

      if (directoryStat.isDirectory()) {
        pluginPaths.push(directoryPath);
      }
    }

    const plugins: Record<string, SourcePlugin> = {};

    for (const pluginPath of pluginPaths) {
      const pluginModule = require(pluginPath);
      const plugin = new pluginModule.default();
      plugins[plugin.name] = plugin;
    }

    return plugins;
  }

  getPlugin(pluginName: string): SourcePlugin | undefined {
    return this.plugins[pluginName];
  }
}
