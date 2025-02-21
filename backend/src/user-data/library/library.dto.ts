import { ApiProperty, PickType } from '@nestjs/swagger';
import { MovieDto } from 'src/metadata/metadata.dto';
import { MovieMetadata, SeriesMetadata } from 'src/metadata/metadata.entity';
import { LibraryItem } from './library.entity';
import {
  TmdbMovie,
  TmdbMovieFull,
  TmdbSeries,
} from 'src/metadata/tmdb/tmdb.dto';
import { MediaType } from 'src/common/common.dto';

export class LibraryItemDto extends PickType(LibraryItem, [
  'tmdbId',
  'mediaType',
  'playStates',
  'createdAt',
]) {
  @ApiProperty({ type: MovieDto, required: false })
  movieMetadata?: MovieDto;

  @ApiProperty({ type: SeriesMetadata, required: false })
  seriesMetadata?: SeriesMetadata;

  @ApiProperty({ required: false })
  watched?: boolean;
}

class NextEpisodeToAir {
  @ApiProperty({ required: false })
  air_date?: string;
}

class Season {
  @ApiProperty({ required: false })
  air_date?: string;

  @ApiProperty({ required: false })
  episode_count?: number;

  @ApiProperty({ required: false })
  id?: number;

  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false })
  overview?: string;

  @ApiProperty({ required: false })
  poster_path?: string;

  @ApiProperty({ required: false })
  season_number?: number;

  @ApiProperty({ required: false })
  vote_average?: number;
}

export class LibraryItemDto2
  extends PickType(LibraryItem, [
    'tmdbId',
    'mediaType',
    'playStates',
    'createdAt',
  ])
  implements TmdbMovie, TmdbSeries
{
  // TmdbMovie & TmdbSeries

  @ApiProperty({ required: false })
  id?: number;

  @ApiProperty({ required: false })
  poster_path?: string;

  @ApiProperty({ required: false })
  vote_average?: number;

  // TmdbMovie only

  @ApiProperty({ required: false })
  title?: string;

  @ApiProperty({ required: false })
  release_date?: string;

  @ApiProperty({ required: false })
  runtime?: number;

  // TmdbSeries only

  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false })
  first_air_date?: string;

  @ApiProperty({ required: false })
  last_air_date?: string;

  @ApiProperty({ required: false, type: NextEpisodeToAir })
  next_episode_to_air?: NextEpisodeToAir;

  @ApiProperty({ required: false, isArray: true, type: Season })
  seasons?: Season[];

  // Library Item

  @ApiProperty({ required: false })
  watched?: boolean;

  static create(options: {
    libraryItem: LibraryItem;
    movieMetadata?: MovieMetadata;
    seriesMetadata?: SeriesMetadata;
  }): LibraryItemDto2 {
    const { libraryItem, movieMetadata, seriesMetadata } = options;

    if (!movieMetadata && !seriesMetadata) {
      throw new Error(
        'At least one of movieMetadata or seriesMetadata must be provided',
      );
    }

    let watched = false;

    if (libraryItem.mediaType === MediaType.Movie) {
      watched = libraryItem.playStates?.some((state) => state.watched) ?? false;
    } else if (
      libraryItem.mediaType === MediaType.Series &&
      seriesMetadata?.tmdbSeries?.last_episode_to_air
    ) {
      const { season_number: season, episode_number: episode } =
        seriesMetadata?.tmdbSeries.last_episode_to_air;
      watched =
        libraryItem.playStates?.some(
          (state) =>
            state.season === season &&
            state.episode === episode &&
            state.watched,
        ) ?? false;
    }

    return {
      ...libraryItem,
      watched,
      id: movieMetadata?.tmdbMovie.id ?? seriesMetadata?.tmdbSeries.id,
      poster_path:
        movieMetadata?.tmdbMovie.poster_path ??
        seriesMetadata?.tmdbSeries.poster_path,
      vote_average:
        movieMetadata?.tmdbMovie.vote_average ??
        seriesMetadata?.tmdbSeries.vote_average,
      title: movieMetadata?.tmdbMovie.title,
      release_date: movieMetadata?.tmdbMovie.release_date,
      runtime: movieMetadata?.tmdbMovie.runtime,
      name: seriesMetadata?.tmdbSeries.name,
      first_air_date: seriesMetadata?.tmdbSeries.first_air_date,
      last_air_date: seriesMetadata?.tmdbSeries.last_air_date,
      next_episode_to_air: seriesMetadata?.tmdbSeries.next_episode_to_air,
      seasons: seriesMetadata?.tmdbSeries.seasons,
    };
  }
}
