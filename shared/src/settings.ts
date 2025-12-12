import { MediaCatalogue } from './catalogue';
import { Permission } from './permissions';

export type MediaPluginSettings = {
  id: string;
  name: string;
  version: string;
  catalogues: MediaCatalogue[];
  permissions: Permission[];
};
