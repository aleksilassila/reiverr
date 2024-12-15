import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Movie } from './metadata.entity';
import { MOVIE_REPOSITORY } from './metadata.providers';
import { TMDB_CACHE_TTL } from 'src/consts';
import { TMDB_API, TmdbApi } from './tmdb/tmdb.providers';

@Injectable()
export class MetadataService {
  constructor(
    @Inject(TMDB_API)
    private tmdbApi: TmdbApi,

    @Inject(MOVIE_REPOSITORY)
    private movieRepository: Repository<Movie>,
  ) {}

  async getMovieByTmdbId(tmdbId: string): Promise<any> {
    let movie = await this.movieRepository.findOne({ where: { tmdbId } });

    if (!movie) {
      movie = new Movie();
      movie.tmdbId = tmdbId;
    }

    if (
      !movie.updatedAt ||
      new Date().getTime() - movie.updatedAt.getTime() > TMDB_CACHE_TTL
    ) {
      const tmdbMovie = await this.tmdbApi.v3
        .movieDetails(Number(tmdbId), {
          append_to_response: 'videos,credits,external_ids,images',
        })
        .then((r) => r.data);
      movie.tmdbMovie = tmdbMovie;
    }

    return movie;
  }

  async getBulkMoviesByTmdbIds(tmdbIds: string[]): Promise<any[]> {
    return [];
  }
}
