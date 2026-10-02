import { ApiProperty } from '@nestjs/swagger';

export class IndexerDto {
  @ApiProperty({ required: false, description: 'Generated when missing' })
  id?: string;

  @ApiProperty()
  name: string;

  @ApiProperty({
    description: 'Torznab feed URL, as copied from Jackett or Prowlarr',
  })
  url: string;

  @ApiProperty()
  apiKey: string;
}

export class IndexerSettingsDto {
  @ApiProperty({ type: [IndexerDto] })
  indexers: IndexerDto[];
}

export class ReleaseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  indexer: string;

  @ApiProperty({ description: 'Bytes' })
  size: number;

  @ApiProperty()
  seeders: number;

  @ApiProperty({ description: 'Seeders and leechers' })
  peers: number;

  @ApiProperty({ required: false, type: 'string' })
  publishedAt?: Date;

  @ApiProperty({ required: false })
  infoHash?: string;

  @ApiProperty({ type: [Number] })
  seasons: number[];

  @ApiProperty({ type: [Number], description: 'Empty for season packs' })
  episodes: number[];
}
