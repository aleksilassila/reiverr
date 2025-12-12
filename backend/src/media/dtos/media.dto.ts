import {
  VideoCandidate,
  VideoProperty,
  VideoStream,
  VideoSrc,
  Subtitles,
  AudioTrack,
  VideoOptions,
} from '@aleksilassila/reiverr-shared';
import { ApiProperty } from '@nestjs/swagger';

/*
export type VideoOptions = {
    codec: string;
    width: number;
    height: number;
    framerate: number;
};
export type VideoProperty = {
    label: string;
    value: string | number;
    formatted: string | undefined;
};
export type VideoCandidate = {
    id: string;
    title: string;
    properties: VideoProperty[];
    canStream: boolean;
    canRequest: boolean;
    canDelete: boolean;
};
export type VideoSrc = {
    src: string;
    label: string;
    bitrate: number;
    default: boolean;
};
export type Subtitles = {
    src: string;
    lang: string;
    kind: 'subtitles' | 'captions' | 'descriptions';
    label: string;
    default: boolean;
};
export type AudioTrack = {
    label: string;
    codec: string;
    bitrate: number;
    default: boolean;
};
export type VideoStream = {
    id: string;
    videoCandidate: VideoCandidate;
    playbackMethod: 'direct' | 'hsl' | 'dash';
    sources: VideoSrc[];
    duration: number;
    videoOptions?: VideoOptions;
    subtitles: Subtitles[];
    audioStreams: AudioTrack[];
};
*/

export class VideoPropertyDto implements VideoProperty {
  @ApiProperty()
  label: string;

  @ApiProperty()
  value: string | number;

  @ApiProperty({ required: false })
  formatted: string | undefined;
}

export class VideoCandidateDto implements VideoCandidate {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ type: [VideoPropertyDto] })
  properties: VideoProperty[];

  @ApiProperty()
  canStream: boolean;

  @ApiProperty()
  canRequest: boolean;

  @ApiProperty()
  canDelete: boolean;
}

export class VideoSrcDto implements VideoSrc {
  @ApiProperty()
  src: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  bitrate: number;

  @ApiProperty()
  default: boolean;
}

export class SubtitlesDto implements Subtitles {
  @ApiProperty()
  src: string;

  @ApiProperty()
  lang: string;

  @ApiProperty({ enum: ['subtitles', 'captions', 'descriptions'] })
  kind: 'subtitles' | 'captions' | 'descriptions';

  @ApiProperty()
  label: string;

  @ApiProperty()
  default: boolean;
}

export class AudioTrackDto implements AudioTrack {
  @ApiProperty()
  label: string;

  @ApiProperty()
  codec: string;

  @ApiProperty()
  bitrate: number;

  @ApiProperty()
  default: boolean;
}

export class VideoOptionsDto implements VideoOptions {
  @ApiProperty()
  codec: string;

  @ApiProperty()
  width: number;

  @ApiProperty()
  height: number;

  @ApiProperty()
  framerate: number;
}

export class VideoStreamDto implements VideoStream {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: VideoCandidateDto })
  videoCandidate: VideoCandidate;

  @ApiProperty({ enum: ['direct', 'hsl', 'dash'] })
  playbackMethod: 'direct' | 'hsl' | 'dash';

  @ApiProperty({ type: [VideoSrcDto] })
  sources: VideoSrc[];

  @ApiProperty()
  duration: number;

  @ApiProperty({ required: false, type: VideoOptionsDto })
  videoOptions?: VideoOptions;

  @ApiProperty({ type: [SubtitlesDto] })
  subtitles: Subtitles[];

  @ApiProperty({ type: [AudioTrackDto] })
  audioStreams: AudioTrack[];
}
