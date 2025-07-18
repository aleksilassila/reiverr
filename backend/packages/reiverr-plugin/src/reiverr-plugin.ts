import * as packageJson from '../package.json';
import { CatalogueProvider } from './catalogue-provider';
import { MediaSourceProvider } from './meida-source-provider';
import { SourceProviderSettingsTemplate, ValidationResponse } from './types';

/**
 * ReiverrPlugin is a class that a plugin should default export (or an array of ReiverrPlugins). It contains "static" methods that can be called without Reiverr user context.
 *
 * @see MediaSourceProvider
 */
export abstract class ReiverrPlugin {
  abstract name: string;

  /**
   * This method is called for every user request, and it should return an object that can handle requests that depend on an user that has connected to the plugin / configured it as a source in their settings page.
   */
  abstract getMediaSourceProvider: (
    ...args: ConstructorParameters<typeof MediaSourceProvider>
  ) => MediaSourceProvider;

  abstract getCatalogueProvider: (
    ...args: ConstructorParameters<typeof CatalogueProvider>
  ) => CatalogueProvider;

  /**
   * @returns The settings that the plugin supports. @see SourceProviderSettingsTemplate
   */
  getSettingsTemplate: () => SourceProviderSettingsTemplate = () => ({});

  validateSettings: (options: {
    settings: Record<string, any>;
  }) => Promise<ValidationResponse> = async () => ({
    isValid: true,
    errors: {},
    settings: {},
  });

  getPluginVersion(): string {
    return packageJson.version;
  }

  _isCompatibleWith(version: string): boolean {
    const pluginVersion = this.getPluginVersion();
    const pluginVersionParts = pluginVersion.split('.');
    const versionParts = version.split('.');

    if (
      !pluginVersionParts.length ||
      pluginVersionParts.length !== versionParts.length
    ) {
      return false;
    }

    return (
      pluginVersionParts[0] === versionParts[0] &&
      Number(pluginVersionParts[1]) >= Number(versionParts[1])
    );
  }
}

export function getReiverrPluginVersion(): string {
  return packageJson.version;
}
