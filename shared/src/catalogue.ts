import { OrderOption } from './common';

/**
 * Catalogue of media items provided by a media plugin
 */
export type MediaCatalogue = {
  id: string;
  name: string;
  orderOptions: OrderOption[];
};
