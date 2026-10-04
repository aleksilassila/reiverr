import { ApiProperty } from '@nestjs/swagger';

export class LocalMediaSettingsDto {
  @ApiProperty({ type: [String] })
  movieFolders: string[];

  @ApiProperty({ type: [String] })
  seriesFolders: string[];
}

export class LocalSubtitleFileDto {
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

export class LibraryEntryDto {
  @ApiProperty({
    description: 'Where it is in the library folder, with / between the names',
  })
  path: string;

  @ApiProperty()
  isDirectory: boolean;

  @ApiProperty({ description: 'Bytes, 0 for a directory' })
  size: number;

  @ApiProperty({
    required: false,
    description: 'The id of the file, when it is a video that is indexed',
  })
  mediaFileId?: string;

  @ApiProperty({
    required: false,
    description:
      'For an indexed file, whether it was imported from a torrent, which leaves it to the cleanup',
  })
  managed?: boolean;

  @ApiProperty({
    required: false,
    description:
      'Why the entry could not be read. What is in a directory that could not be read is not listed',
  })
  error?: string;
}

export class FailedLibraryEntryDto {
  @ApiProperty()
  path: string;

  @ApiProperty()
  error: string;
}

export class DeletedLibraryEntriesDto {
  @ApiProperty({ description: 'How many of the entries were deleted' })
  deleted: number;

  @ApiProperty({
    type: [FailedLibraryEntryDto],
    description:
      'The entries that could not be deleted, or not completely, and why',
  })
  failed: FailedLibraryEntryDto[];
}
