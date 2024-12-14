import { Injectable } from '@nestjs/common';

@Injectable()
export class MediaService {
  async getMovieByTmdbId(tmdbId: string): Promise<any> {
    // throw new Error('Method not implemented.');

    return {};
  }

  async getBulkMoviesByTmdbIds(tmdbIds: string[]): Promise<any[]> {
    return [];
  }
}
