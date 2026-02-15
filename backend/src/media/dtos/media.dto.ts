import {
  StreamResponse,
  SubtitleTrack,
  VideoTrack,
} from '@aleksilassila/reiverr-shared';
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

export class VideoTrackDto implements VideoTrack {
  @ApiProperty()
  label: string;

  @ApiProperty()
  url: string;

  @ApiProperty({ enum: ['direct', 'hls', 'dash'] })
  type: string;

  @ApiProperty({ required: false })
  lang?: string;

  @ApiProperty({ required: false })
  proxy?: boolean;
}

export class SubtitleTrackDto implements SubtitleTrack {
  @ApiProperty()
  label: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  lang: string;

  @ApiProperty()
  kind: string;

  @ApiProperty({ required: false })
  proxy?: boolean;
}

// export class AudioTrack {
//   @ApiProperty()
//   label: string;

//   @ApiProperty()
//   url: string;

//   @ApiProperty()
//   lang: string;
// }

export class StreamDto implements StreamResponse {
  @ApiProperty({ type: [VideoTrackDto] })
  videoTracks: VideoTrackDto[];

  @ApiProperty({ type: [SubtitleTrackDto] })
  subtitleTracks: SubtitleTrackDto[];

  // @ApiProperty({ type: [AudioTrack] })
  // audioTracks: AudioTrack[];
}
