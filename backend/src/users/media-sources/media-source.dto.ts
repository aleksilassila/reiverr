import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { PickAndPartial } from 'src/common/common.dto';
import { MediaSource } from './media-source.entity';
import { ValidationResponseDto } from 'src/source-providers/source-provider.dto';
import { SourceProvider } from '@aleksilassila/reiverr-plugin';

export class MediaSourceCapabilitiesDto {
  @ApiProperty()
  catalogues: boolean;

  @ApiProperty()
  moviesCatalogue: boolean;

  @ApiProperty()
  seriesCatalogue: boolean;

  @ApiProperty()
  combinedCatalogue: boolean;

  @ApiProperty()
  missingCatalogue: boolean;

  // @ApiProperty()
  // request: boolean;

  // @ApiProperty()
  // delete: boolean;
}

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
) {
  @ApiProperty()
  capabilities: MediaSourceCapabilitiesDto;
}

export class UpdateOrCreateMediaSourceDto extends PickAndPartial(
  MediaSource,
  ['pluginSettings', 'pluginId'],
  ['id', 'adminControlled', 'name', 'priority'],
) {}

export class UpdateMediaSourceDto extends OmitType(PartialType(MediaSource), [
  'id',
  'pluginId',
  'userId',
]) {}

export class CreateMediaSourceDto extends OmitType(MediaSource, [
  'id',
  'userId',
]) {}

export class UpdateMediaSourceResponseDto {
  @ApiProperty({ type: MediaSourceDto })
  mediaSource: MediaSourceDto;

  @ApiProperty({ type: ValidationResponseDto, required: false })
  validationResponse: ValidationResponseDto | undefined;
}
