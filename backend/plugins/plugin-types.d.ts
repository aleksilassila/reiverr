export type PluginSettingsLink = {
  type: 'link';
  url: string;
  label: string;
};

export type PluginSettingsInput = {
  type: 'string' | 'number' | 'boolean' | 'password';
  label: string;
  placeholder: string;
};

export type PluginSettingsTemplate = Record<
  string,
  PluginSettingsLink | PluginSettingsInput
>;

export type PluginSettings = Record<string, any>;

export type ValidationResponse = {
  isValid: boolean;
  errors: Record<string, string>;
  replace: Record<string, any>;
};

export interface SourcePlugin {
  name: string;

  getIsIndexable: () => boolean;

  getIndex: () => Promise<
    Record<
      number,
      any
      // | { tmdbId: number; quality: number }
      // | {
      //     tmdbId: number;
      //     seasons: Record<number, Record<number, { quality: number }>>;
      //   }
    >
  >;

  getSettingsTemplate: () => PluginSettingsTemplate;

  validateSettings: (
    settings: Record<string, any>,
  ) => Promise<ValidationResponse>;

  getMovieStream: (tmdbId: string, settings: PluginSettings) => Promise<any>;

  getEpisodeStream: (
    tmdbId: string,
    season: number,
    episode: number,
    settings: PluginSettings,
  ) => Promise<any>;

  handleProxy(
    request: { uri: string; headers: any },
    settings: PluginSettings,
  ): {
    url: string;
    headers: any;
  };
}
