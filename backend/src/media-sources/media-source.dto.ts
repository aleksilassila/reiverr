import { OmitType, PartialType } from '@nestjs/swagger';
import { PickAndPartial } from 'src/common/common.dto';
import { MediaSource } from './media-source.entity';

export class MediaSourceDto extends PickAndPartial(
  MediaSource,
  ['id', 'pluginId', 'name', 'userId', 'adminControlled', 'enabled'],
  ['pluginSettings'],
) {}

export class UpdateOrCreateMediaSourceDto extends PickAndPartial(
  MediaSource,
  ['pluginSettings', 'pluginId'],
  ['enabled', 'id', 'adminControlled', 'name', 'priority'],
) {}

export class UpdateMediaSourceDto extends OmitType(
  PartialType(MediaSourceDto),
  ['id', 'pluginId', 'userId'],
) {}

export class CreateMediaSourceDto extends OmitType(MediaSourceDto, [
  'id',
  'userId',
]) {}
