export type PluginSettingsTemplate = Record<
  string,
  'string' | 'number' | 'boolean' | 'password' | { type: 'link'; url: string }
>;

export type PluginSettings = Record<string, any>;

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

  validateSettings: (settings: Record<string, any>) => Promise<{
    isValid: boolean;
    errors: Record<string, string>;
  }>;

  getMovieStream: (tmdbId: string, settings: PluginSettings) => Promise<any>;

  getEpisodeStream: (
    tmdbId: string,
    season: number,
    episode: number,
    settings: PluginSettings,
  ) => Promise<any>;

  handleProxy(request: { uri: string; headers: any }, settings: PluginSettings): {
    url: string;
    headers: any;
  };
}
