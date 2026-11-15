import { ApiProperty, OmitType, PartialType, PickType } from '@nestjs/swagger';
import { PlayState } from './play-state.entity.js';

export class PlayStateDto extends PlayState {}

// export class PlayStateDto extends IntersectionType(
//   OmitType(PlayState, ['id']),
//   PartialType(PickType(PlayState, ['id'])),
// ) {
//   constructor(
//     tmdbId: string,
//     userId: string,
//     season?: number,
//     episode?: number,
//   ) {
//     super();
//     this.tmdbId = tmdbId;
//     this.userId = userId;
//     if (season !== undefined) this.season = season;
//     if (episode !== undefined) this.episode = episode;
//   }
// }

export class UpdatePlayStateDto extends PartialType(
  PickType(PlayStateDto, ['season', 'episode', 'watched', 'progress']),
) {}

export class BulkUpdatePlayStateDto {
  @ApiProperty({ type: UpdatePlayStateDto, isArray: true })
  playStates: UpdatePlayStateDto[];
}

export class MovieUserDataDto {
  @ApiProperty()
  tmdbId: string;

  @ApiProperty()
  inMyList: boolean;

  @ApiProperty({ type: PlayStateDto, required: false })
  playState?: PlayStateDto;
}

/** What the user would watch next of a series */
export class NextEpisodeDto {
  @ApiProperty()
  season: number;

  @ApiProperty()
  episode: number;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    required: false,
    description:
      'When the episode aired or airs; absent when it has no date yet',
  })
  airDate?: string;
}

export class SeriesUserDataDto {
  @ApiProperty()
  tmdbId: string;

  @ApiProperty()
  inMyList: boolean;

  @ApiProperty({ type: [PlayStateDto] })
  playStates: PlayStateDto[];

  @ApiProperty({
    type: NextEpisodeDto,
    required: false,
    description:
      'The first unwatched episode after the one the user watched last; absent when nothing is left to watch or the user has nothing of the series yet',
  })
  nextEpisode?: NextEpisodeDto;
}
