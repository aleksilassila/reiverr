import { ApiProperty } from '@nestjs/swagger';
import { DiskUsageDto, LibraryEntryDto } from '../library/library.dto.js';

export class DirectoryEntryDto {
  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'The absolute path' })
  path: string;

  @ApiProperty({ description: 'A link that leads to a directory' })
  isSymbolicLink: boolean;
}

/** One level of the filesystem, for picking a folder */
export class DirectoryListingDto {
  @ApiProperty({ description: 'The resolved absolute path' })
  path: string;

  @ApiProperty({
    type: 'string',
    nullable: true,
    description: 'The directory above; null at the root',
  })
  parent: string | null;

  @ApiProperty({
    type: DiskUsageDto,
    required: false,
    description: 'The disk the directory is on, when it can be measured',
  })
  disk?: DiskUsageDto;

  @ApiProperty({
    type: [DirectoryEntryDto],
    description: 'The directories in it, hidden ones left out',
  })
  entries: DirectoryEntryDto[];
}

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
