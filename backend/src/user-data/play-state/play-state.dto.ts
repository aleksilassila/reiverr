import { ApiProperty, OmitType, PartialType, PickType } from '@nestjs/swagger';
import { PlayState } from './play-state.entity';

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
  inLibrary: boolean;

  @ApiProperty({ type: PlayStateDto, required: false })
  playState?: PlayStateDto;
}

export class SeriesUserDataDto {
  @ApiProperty()
  tmdbId: string;

  @ApiProperty()
  inLibrary: boolean;

  @ApiProperty({ type: [PlayStateDto] })
  playStates: PlayStateDto[];
}
