import { ApiProperty } from '@nestjs/swagger';

export class ServerLogSettingsDto {
  @ApiProperty({
    description:
      'How many of the newest entries are kept, older ones are deleted. 0 keeps any number of them.',
  })
  maxEntries: number;

  @ApiProperty({
    description:
      'Entries older than this many days are deleted. 0 keeps them whatever their age.',
  })
  maxAgeDays: number;
}
