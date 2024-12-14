import { OmitType } from '@nestjs/swagger';
import { PlayState } from './play-state.entity';

export class PlayStateDto extends PlayState {}

export class UpdatePlayStateDto extends OmitType(PlayState, [
  'id',
  'tmdbId',
  'episode',
  'season',
  'user',
  'userId',
  'lastPlayedAt',
]) {}
