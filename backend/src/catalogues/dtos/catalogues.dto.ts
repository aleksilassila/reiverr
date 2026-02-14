import {
  CatalogueInfo,
  CatalogueItem,
  OrderOption,
} from '@aleksilassila/reiverr-shared';
import { ApiProperty } from '@nestjs/swagger';
import { TmdbItemDto } from 'src/metadata/tmdb/tmdb.dto';

export class OrderOptionDto implements OrderOption {
  @ApiProperty()
  label: string;

  @ApiProperty()
  value: string;

  @ApiProperty({ required: false })
  direction?: string | undefined;
}

export class CatalogueInfoDto implements CatalogueInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  label: string;

  @ApiProperty({ type: [OrderOptionDto] })
  orderOptions: OrderOption[];
}

// Custom DTO for aggregating catalogues from different plugins
export class CatalogueDto extends CatalogueInfoDto {
  @ApiProperty()
  pluginId: string;

  @ApiProperty()
  pluginLabel: string;
}

export class CatalogueItemDto implements CatalogueItem {
  @ApiProperty()
  id: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  mediaType: string;

  @ApiProperty({ required: false })
  tmdbId?: string | undefined;

  @ApiProperty({ required: false })
  posterUrl?: string | undefined;

  @ApiProperty({ required: false })
  backdropUrl?: string | undefined;

  // Additional fields
  @ApiProperty({ required: false })
  tmdbItem: TmdbItemDto;
}

export class CatalogueItemsDto {
  @ApiProperty({ type: [TmdbItemDto] })
  items: TmdbItemDto[];
}
