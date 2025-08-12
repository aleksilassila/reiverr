import {
  CatalogueCapabilities,
  CatalogueItem,
  PaginatedResponse,
  PaginationParams,
} from "./types";
import { WithMediaSource } from "./with-media-source";

/**
 * MediaSourceProvider is a class that handles all requests for Reiverr users that have configured the plugin as MediaSource. A new MediaSourceProvider is instantiated for each request / function call, and it contains data about the Reiverr user that called the function.
 */

export class CatalogueProvider extends WithMediaSource {
  getCatalogueCapabilities: (options?: any) => Promise<CatalogueCapabilities> =
    async (options = {}) => ({
      combinedCatalogue: {
        isSupported: false,
        orderOptions: [],
      },
      moviesCatalogue: {
        isSupported: false,
        orderOptions: [],
      },
      seriesCatalogue: {
        isSupported: false,
        orderOptions: [],
      },
      missingCatalogue: {
        isSupported: false,
        orderOptions: [],
      },
    });

  /**
   * Returns an index of all items available in the source.
   */
  getCatalogue: (options: {
    pagination: PaginationParams;
    order?: string;
    direction?: string;
  }) => Promise<PaginatedResponse<CatalogueItem>> = async () => ({
    items: [],
    total: 0,
    page: 1,
    itemsPerPage: 0,
  });

  /**
   * Returns an index of all movies available in the source.
   */
  getMovieCatalogue: (options: {
    pagination: PaginationParams;
    order?: string;
    direction?: string;
  }) => Promise<PaginatedResponse<CatalogueItem>> = async () => ({
    items: [],
    total: 0,
    page: 1,
    itemsPerPage: 0,
  });

  /**
   * Returns an index of all series available in the source.
   */
  getSeriesCatalogue: (options: {
    pagination: PaginationParams;
    order?: string;
    direction?: string;
  }) => Promise<PaginatedResponse<CatalogueItem>> = async () => ({
    items: [],
    total: 0,
    page: 1,
    itemsPerPage: 0,
  });

  /**
   * Filters my list items to only include those that are not available in the source.
   */
  getMissingInCatalogue: <T extends object = object>(options: {
    pagination: PaginationParams;
    order?: string;
    direction?: string;
    myListItems: Record<string, T>;
  }) => Promise<PaginatedResponse<T>> = async () => ({
    items: [],
    total: 0,
    page: 1,
    itemsPerPage: 0,
  });
}
