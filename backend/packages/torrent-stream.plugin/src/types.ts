import type { SourceProviderSettings } from '@aleksilassila/reiverr-shared';

export interface TorrentSettings extends SourceProviderSettings {
  apiKey: string;
  baseUrl: string;
}
