import { ApiProperty } from '@nestjs/swagger';

export class StreamableDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  label: string;
}

export class StreamablesDto {
  @ApiProperty()
  pluginId: string;

  @ApiProperty()
  label: string;

  @ApiProperty({ type: [StreamableDto] })
  streamables: StreamableDto[];
}

export class VideoTrack {}

export class SubtitleTrack {}

export class AudioTrack {}

export class StreamDto {
  videoTracks: VideoTrack[];
  subtitleTracks: SubtitleTrack[];
  audioTracks: AudioTrack[];
}
