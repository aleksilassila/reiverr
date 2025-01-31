import { OmitType } from '@nestjs/swagger';
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

export class UpdatePlayStateDto extends OmitType(PlayState, [
  'id',
  'tmdbId',
  'episode',
  'season',
  'user',
  'userId',
  'lastPlayedAt',
]) {}
