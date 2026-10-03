import { ApiProperty } from '@nestjs/swagger';

export class LocalMediaSettingsDto {
  @ApiProperty({ type: [String] })
  movieFolders: string[];

  @ApiProperty({ type: [String] })
  seriesFolders: string[];
}

export class LocalSubtitleFileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty({
    required: false,
    description: 'Language code from the file name',
  })
  lang?: string;

  @ApiProperty({
    description: 'The tags of the file name, such as "en forced"',
  })
  label: string;
}

export class LocalMediaFileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  size: number;

  @ApiProperty({
    type: [LocalSubtitleFileDto],
    description: 'Subtitle files next to the video',
  })
  subtitles: LocalSubtitleFileDto[];
}

export class LocalEpisodeFileDto extends LocalMediaFileDto {
  @ApiProperty()
  season: number;

  @ApiProperty({ type: [Number] })
  episodes: number[];
}
