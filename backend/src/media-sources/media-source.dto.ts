import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { PickAndPartial } from 'src/common/common.dto';
import { MediaSource } from './media-source.entity';
import { ValidationResponseDto } from 'src/source-providers/source-provider.dto';

export class MediaSourceDto extends PickAndPartial(
  MediaSource,
  [
    'id',
    'pluginId',
    'name',
    'userId',
    'adminControlled',
    'enabled',
    'priority',
  ],
  ['pluginSettings'],
) {}

export class UpdateOrCreateMediaSourceDto extends PickAndPartial(
  MediaSource,
  ['pluginSettings', 'pluginId'],
  ['id', 'adminControlled', 'name', 'priority'],
) {}

export class UpdateMediaSourceDto extends OmitType(
  PartialType(MediaSourceDto),
  ['id', 'pluginId', 'userId'],
) {}

export class CreateMediaSourceDto extends OmitType(MediaSourceDto, [
  'id',
  'userId',
]) {}

export class UpdateMediaSourceResponse {
  @ApiProperty({ type: MediaSourceDto })
  mediaSource: MediaSourceDto;

  @ApiProperty({ type: ValidationResponseDto, required: false })
  validationResponse: ValidationResponseDto | undefined;
}
