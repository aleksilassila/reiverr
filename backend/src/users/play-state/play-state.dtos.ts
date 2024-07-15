import { PlayState } from './play-state.entity';
import { OmitType, PartialType } from '@nestjs/swagger';

export class PlayStateDto extends PlayState {}

export class UpdatePlayStateDto extends PartialType(
  OmitType(PlayState, [
    'user',
    'id',
    'episodeNumber',
    'tmdbId',
    'seasonNumber',
  ]),
) {}
