import type { SourceProviderSettings } from '@aleksilassila/reiverr-shared/dist/src/old';

export interface TorrentSettings extends SourceProviderSettings {
  apiKey: string;
  baseUrl: string;
}
