import { ApiProperty } from '@nestjs/swagger';
import { LibraryEntryDto } from '../library/library.dto.js';

export class ServerLibraryEntryDto extends LibraryEntryDto {
  @ApiProperty({
    required: false,
    description:
      'For an indexed file, how many requests it fulfils. They are deleted with the file',
  })
  requests?: number;
}

export class ScanLibraryDto {
  @ApiProperty({ description: 'One of the library folders' })
  folder: string;

  @ApiProperty({
    required: false,
    description:
      'Scan a folder that is not available as it is, which forgets everything indexed in it',
  })
  force?: boolean;
}

export class LibraryEntriesDto {
  @ApiProperty({ description: 'One of the library folders' })
  folder: string;

  @ApiProperty({
    type: [String],
    description:
      'Where the files and directories are in the folder, with / between the names',
  })
  paths: string[];
}

export class DeleteLibraryEntriesDto extends LibraryEntriesDto {}

export class ManageLibraryEntriesResultDto {
  @ApiProperty({ description: 'Indexed files whose managed flag changed' })
  files: number;
}

export class RequestLibraryEntriesResultDto {
  @ApiProperty({
    description: 'Requests that were made or pointed at the files',
  })
  requests: number;

  @ApiProperty({
    description:
      'Files of movies and of episodes the series does not have, which were not requested',
  })
  skipped: number;
}
