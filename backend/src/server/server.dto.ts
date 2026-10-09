import { ApiProperty } from '@nestjs/swagger';
import { LibraryEntryDto } from '../local-media/local-media.dto.js';

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

export class DeleteLibraryEntriesDto {
  @ApiProperty({ description: 'One of the library folders' })
  folder: string;

  @ApiProperty({
    type: [String],
    description:
      'Where the files and directories to delete are in the folder, with / between the names',
  })
  paths: string[];
}
