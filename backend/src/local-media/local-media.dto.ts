import { ApiProperty } from '@nestjs/swagger';

export class LocalMediaSettingsDto {
  @ApiProperty({ type: [String] })
  movieFolders: string[];

  @ApiProperty({ type: [String] })
  seriesFolders: string[];
}

export class LocalMediaFileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  size: number;
}

export class LocalEpisodeFileDto extends LocalMediaFileDto {
  @ApiProperty()
  season: number;

  @ApiProperty({ type: [Number] })
  episodes: number[];
}
