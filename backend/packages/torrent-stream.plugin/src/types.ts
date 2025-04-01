import type { SourceProviderSettings } from '@aleksilassila/reiverr-plugin';

export interface TorrentSettings extends SourceProviderSettings {
  apiKey: string;
  baseUrl: string;
}
