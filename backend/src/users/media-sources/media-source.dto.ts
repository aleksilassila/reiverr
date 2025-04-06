import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { PickAndPartial } from 'src/common/common.dto';
import { ValidationResponseDto } from 'src/source-providers/source-provider.dto';
import { MediaSource } from './media-source.entity';
import {
  CatalogueCapabilities,
  DirectionOption,
  OrderOption,
} from '@aleksilassila/reiverr-plugin';

class CatalogueOrderDirectionOption implements DirectionOption {
  @ApiProperty()
  label: string;

  @ApiProperty()
  value: string;
}

class OrderOptionDto implements OrderOption {
  @ApiProperty()
  label: string;

  @ApiProperty()
  value: string;

  @ApiProperty({ type: [CatalogueOrderDirectionOption] })
  directions: CatalogueOrderDirectionOption[];
}

export class CatalogueCapability {
  @ApiProperty()
  isSupported: boolean;

  @ApiProperty({ type: [OrderOptionDto] })
  orderOptions: OrderOptionDto[];
}

export class CatalogueCapabilitiesDto implements CatalogueCapabilities {
  @ApiProperty({ type: CatalogueCapability })
  combinedCatalogue: CatalogueCapability;

  @ApiProperty({ type: CatalogueCapability })
  missingCatalogue: CatalogueCapability;

  @ApiProperty({ type: CatalogueCapability })
  moviesCatalogue: CatalogueCapability;

  @ApiProperty({ type: CatalogueCapability })
  seriesCatalogue: CatalogueCapability;
}

export class MediaSourceCapabilitiesDto {
  @ApiProperty({ type: CatalogueCapabilitiesDto })
  catalogueCapabilities: CatalogueCapabilitiesDto;
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
  // @ApiProperty()
  // capabilities: MediaSourceCapabilitiesDto;

  @ApiProperty({ type: CatalogueCapabilitiesDto })
  catalogueCapabilities: CatalogueCapabilitiesDto;
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
