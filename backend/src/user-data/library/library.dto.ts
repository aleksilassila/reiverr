import { ApiProperty, PickType } from '@nestjs/swagger';
import { MediaType } from 'src/common/common.dto';
import { MovieMetadata, SeriesMetadata } from 'src/metadata/metadata.entity';
import { TmdbItemDto } from 'src/metadata/tmdb/tmdb.dto';
import { LibraryItem } from './library.entity';

export class LibraryItemDto extends PickType(LibraryItem, [
  'tmdbId',
  'mediaType',
  'playStates',
  'createdAt',
]) {
  @ApiProperty()
  tmdbItem: TmdbItemDto;

  @ApiProperty({ required: false })
  watched?: boolean;

  static create(options: {
    libraryItem: LibraryItem;
    movieMetadata?: MovieMetadata;
    seriesMetadata?: SeriesMetadata;
  }): LibraryItemDto {
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
      tmdbItem: {
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
      },
    };
  }
}
