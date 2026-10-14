import { ApiProperty, PickType } from '@nestjs/swagger';
import { LogEntry } from './log-entry.entity.js';

export class LogEntryDto extends PickType(LogEntry, [
  'id',
  'type',
  'message',
  'data',
  'createdAt',
] as const) {}

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
