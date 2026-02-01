import { ApiProperty } from '@nestjs/swagger';

export class StreamableDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;
}

export class StreamablesDto {
  @ApiProperty()
  pluginId: string;

  @ApiProperty()
  label: string;

  @ApiProperty({ type: [StreamableDto] })
  streamables: StreamableDto[];
}

export class StreamDto {
  url: string;
}
