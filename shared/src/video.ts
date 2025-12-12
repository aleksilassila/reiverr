export type VideoOptions = {
  codec: string;
  width: number;
  height: number;
  framerate: number;
};

export type VideoProperty = {
  /**
   * The label of the property
   * @example "Resolution"
   */
  label: string;

  /**
   * Used for sorting and filtering, or displayed if `formatted` is not provided.
   * @example 1080
   */
  value: string | number;

  /**
   * The formatted value of the property
   * @example "1080p"
   */
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
