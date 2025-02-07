/**
 * A MediaBrowser.Model.Dlna.DeviceProfile represents a set of metadata which determines which content a certain device is able to play.
 * <br />
 * Specifically, it defines the supported <see cref="P:MediaBrowser.Model.Dlna.DeviceProfile.ContainerProfiles">containers</see> and
 * <see cref="P:MediaBrowser.Model.Dlna.DeviceProfile.CodecProfiles">codecs</see> (video and/or audio, including codec profiles and levels)
 * the device is able to direct play (without transcoding or remuxing),
 * as well as which <see cref="P:MediaBrowser.Model.Dlna.DeviceProfile.TranscodingProfiles">containers/codecs to transcode to</see> in case it isn't.
 */
export interface DeviceProfile {
  /** Gets or sets the name of this device profile. User profiles must have a unique name. */
  Name?: string | null;
  /**
   * Gets or sets the unique internal identifier.
   * @format uuid
   */
  Id?: string | null;
  /**
   * Gets or sets the maximum allowed bitrate for all streamed content.
   * @format int32
   */
  MaxStreamingBitrate?: number | null;
  /**
   * Gets or sets the maximum allowed bitrate for statically streamed content (= direct played files).
   * @format int32
   */
  MaxStaticBitrate?: number | null;
  /**
   * Gets or sets the maximum allowed bitrate for transcoded music streams.
   * @format int32
   */
  MusicStreamingTranscodingBitrate?: number | null;
  /**
   * Gets or sets the maximum allowed bitrate for statically streamed (= direct played) music files.
   * @format int32
   */
  MaxStaticMusicBitrate?: number | null;
  /** Gets or sets the direct play profiles. */
  DirectPlayProfiles?: DirectPlayProfile[];
  /** Gets or sets the transcoding profiles. */
  TranscodingProfiles?: TranscodingProfile[];
  /** Gets or sets the container profiles. Failing to meet these optional conditions causes transcoding to occur. */
  ContainerProfiles?: ContainerProfile[];
  /** Gets or sets the codec profiles. */
  CodecProfiles?: CodecProfile[];
  /** Gets or sets the subtitle profiles. */
  SubtitleProfiles?: SubtitleProfile[];
}

/** Defines the MediaBrowser.Model.Dlna.DirectPlayProfile. */
export interface DirectPlayProfile {
  /** Gets or sets the container. */
  Container?: string;
  /** Gets or sets the audio codec. */
  AudioCodec?: string | null;
  /** Gets or sets the video codec. */
  VideoCodec?: string | null;
  /** Gets or sets the Dlna profile type. */
  Type?: 'Audio' | 'Video' | 'Photo' | 'Subtitle' | 'Lyric';
}

/** A class for transcoding profile information. */
export interface TranscodingProfile {
  /** Gets or sets the container. */
  Container?: string;
  /** Gets or sets the DLNA profile type. */
  Type?: 'Audio' | 'Video' | 'Photo' | 'Subtitle' | 'Lyric';
  /** Gets or sets the video codec. */
  VideoCodec?: string;
  /** Gets or sets the audio codec. */
  AudioCodec?: string;
  /**
   * Media streaming protocol.
   * Lowercase for backwards compatibility.
   */
  Protocol?: 'http' | 'hls';
  /**
   * Gets or sets a value indicating whether the content length should be estimated.
   * @default false
   */
  EstimateContentLength?: boolean;
  /**
   * Gets or sets a value indicating whether M2TS mode is enabled.
   * @default false
   */
  EnableMpegtsM2TsMode?: boolean;
  /**
   * Gets or sets the transcoding seek info mode.
   * @default "Auto"
   */
  TranscodeSeekInfo?: 'Auto' | 'Bytes';
  /**
   * Gets or sets a value indicating whether timestamps should be copied.
   * @default false
   */
  CopyTimestamps?: boolean;
  /**
   * Gets or sets the encoding context.
   * @default "Streaming"
   */
  Context?: 'Streaming' | 'Static';
  /**
   * Gets or sets a value indicating whether subtitles are allowed in the manifest.
   * @default false
   */
  EnableSubtitlesInManifest?: boolean;
  /** Gets or sets the maximum audio channels. */
  MaxAudioChannels?: string | null;
  /**
   * Gets or sets the minimum amount of segments.
   * @format int32
   * @default 0
   */
  MinSegments?: number;
  /**
   * Gets or sets the segment length.
   * @format int32
   * @default 0
   */
  SegmentLength?: number;
  /**
   * Gets or sets a value indicating whether breaking the video stream on non-keyframes is supported.
   * @default false
   */
  BreakOnNonKeyFrames?: boolean;
  /** Gets or sets the profile conditions. */
  Conditions?: ProfileCondition[];
  /**
   * Gets or sets a value indicating whether variable bitrate encoding is supported.
   * @default true
   */
  EnableAudioVbrEncoding?: boolean;
}

export interface ProfileCondition {
  Condition?:
    | 'Equals'
    | 'NotEquals'
    | 'LessThanEqual'
    | 'GreaterThanEqual'
    | 'EqualsAny';
  Property?:
    | 'AudioChannels'
    | 'AudioBitrate'
    | 'AudioProfile'
    | 'Width'
    | 'Height'
    | 'Has64BitOffsets'
    | 'PacketLength'
    | 'VideoBitDepth'
    | 'VideoBitrate'
    | 'VideoFramerate'
    | 'VideoLevel'
    | 'VideoProfile'
    | 'VideoTimestamp'
    | 'IsAnamorphic'
    | 'RefFrames'
    | 'NumAudioStreams'
    | 'NumVideoStreams'
    | 'IsSecondaryAudio'
    | 'VideoCodecTag'
    | 'IsAvc'
    | 'IsInterlaced'
    | 'AudioSampleRate'
    | 'AudioBitDepth'
    | 'VideoRangeType';
  Value?: string | null;
  IsRequired?: boolean;
}

/** Defines the MediaBrowser.Model.Dlna.ContainerProfile. */
export interface ContainerProfile {
  /** Gets or sets the MediaBrowser.Model.Dlna.DlnaProfileType which this container must meet. */
  Type?: 'Audio' | 'Video' | 'Photo' | 'Subtitle' | 'Lyric';
  /** Gets or sets the list of MediaBrowser.Model.Dlna.ProfileCondition which this container will be applied to. */
  Conditions?: ProfileCondition[];
  /** Gets or sets the container(s) which this container must meet. */
  Container?: string | null;
  /** Gets or sets the sub container(s) which this container must meet. */
  SubContainer?: string | null;
}

/** Defines the MediaBrowser.Model.Dlna.CodecProfile. */
export interface CodecProfile {
  /** Gets or sets the MediaBrowser.Model.Dlna.CodecType which this container must meet. */
  Type?: 'Video' | 'VideoAudio' | 'Audio';
  /** Gets or sets the list of MediaBrowser.Model.Dlna.ProfileCondition which this profile must meet. */
  Conditions?: ProfileCondition[];
  /** Gets or sets the list of MediaBrowser.Model.Dlna.ProfileCondition to apply if this profile is met. */
  ApplyConditions?: ProfileCondition[];
  /** Gets or sets the codec(s) that this profile applies to. */
  Codec?: string | null;
  /** Gets or sets the container(s) which this profile will be applied to. */
  Container?: string | null;
  /** Gets or sets the sub-container(s) which this profile will be applied to. */
  SubContainer?: string | null;
}

/** A class for subtitle profile information. */
export interface SubtitleProfile {
  /** Gets or sets the format. */
  Format?: string | null;
  /** Gets or sets the delivery method. */
  Method?: 'Encode' | 'Embed' | 'External' | 'Hls' | 'Drop';
  /** Gets or sets the DIDL mode. */
  DidlMode?: string | null;
  /** Gets or sets the language. */
  Language?: string | null;
  /** Gets or sets the container. */
  Container?: string | null;
}
