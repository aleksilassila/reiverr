import { ApiProperty } from '@nestjs/swagger';
import {
  CodecProfile,
  ContainerProfile,
  DeviceProfile,
  DirectPlayProfile,
  ProfileCondition,
  SubtitleProfile,
  TranscodingProfile,
} from '@aleksilassila/reiverr-plugin';

export class DirectPlayProfileDto implements DirectPlayProfile {
  @ApiProperty({
    required: false,
    description: 'Gets or sets the container.',
    nullable: true,
  })
  Container?: string;

  @ApiProperty({
    required: false,
    description: 'Gets or sets the audio codec.',
    nullable: true,
  })
  AudioCodec?: string | null;

  @ApiProperty({
    required: false,
    description: 'Gets or sets the video codec.',
    nullable: true,
  })
  VideoCodec?: string | null;

  @ApiProperty({
    required: false,
    description: 'Gets or sets the Dlna profile type.',
    enum: ['Audio', 'Video', 'Photo', 'Subtitle', 'Lyric'],
  })
  Type?: 'Audio' | 'Video' | 'Photo' | 'Subtitle' | 'Lyric';
}

export class ProfileConditionDto implements ProfileCondition {
  @ApiProperty({
    description: 'Gets or sets the condition.',
    enum: [
      'Equals',
      'NotEquals',
      'LessThanEqual',
      'GreaterThanEqual',
      'EqualsAny',
    ],
    nullable: true,
    required: false,
  })
  Condition?:
    | 'Equals'
    | 'NotEquals'
    | 'LessThanEqual'
    | 'GreaterThanEqual'
    | 'EqualsAny';

  @ApiProperty({
    description: 'Gets or sets the property.',
    enum: [
      'AudioChannels',
      'AudioBitrate',
      'AudioProfile',
      'Width',
      'Height',
      'Has64BitOffsets',
      'PacketLength',
      'VideoBitDepth',
      'VideoBitrate',
      'VideoFramerate',
      'VideoLevel',
      'VideoProfile',
      'VideoTimestamp',
      'IsAnamorphic',
      'RefFrames',
      'NumAudioStreams',
      'NumVideoStreams',
      'IsSecondaryAudio',
      'VideoCodecTag',
      'IsAvc',
      'IsInterlaced',
      'AudioSampleRate',
      'AudioBitDepth',
      'VideoRangeType',
    ],
    nullable: true,
    required: false,
  })
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
    | 'VideoRangeType'
    | null;

  @ApiProperty({
    description: 'Gets or sets the value.',
    nullable: true,
    required: false,
  })
  Value?: string | null;

  @ApiProperty({
    description: 'Indicates if the condition is required.',
    nullable: true,
    required: false,
  })
  IsRequired?: boolean;
}

export class TranscodingProfileDto implements TranscodingProfile {
  @ApiProperty({
    description: 'Gets or sets the container.',
    nullable: true,
    required: false,
  })
  Container?: string;

  @ApiProperty({
    description: 'Gets or sets the DLNA profile type.',
    enum: ['Audio', 'Video', 'Photo', 'Subtitle', 'Lyric'],
    required: false,
  })
  Type?: 'Audio' | 'Video' | 'Photo' | 'Subtitle' | 'Lyric';

  @ApiProperty({
    description: 'Gets or sets the video codec.',
    nullable: true,
    required: false,
  })
  VideoCodec?: string;

  @ApiProperty({
    description: 'Gets or sets the audio codec.',
    nullable: true,
    required: false,
  })
  AudioCodec?: string;

  @ApiProperty({
    description: 'Media streaming protocol.',
    enum: ['http', 'hls'],
    required: false,
  })
  Protocol?: 'http' | 'hls';

  @ApiProperty({
    description: 'Indicates if the content length should be estimated.',
    default: false,
    required: false,
  })
  EstimateContentLength?: boolean;

  @ApiProperty({
    description: 'Indicates if M2TS mode is enabled.',
    default: false,
    required: false,
  })
  EnableMpegtsM2TsMode?: boolean;

  @ApiProperty({
    description: 'Gets or sets the transcoding seek info mode.',
    default: 'Auto',
    enum: ['Auto', 'Bytes'],
    required: false,
  })
  TranscodeSeekInfo?: 'Auto' | 'Bytes';

  @ApiProperty({
    description: 'Indicates if timestamps should be copied.',
    default: false,
    required: false,
  })
  CopyTimestamps?: boolean;

  @ApiProperty({
    description: 'Gets or sets the encoding context.',
    default: 'Streaming',
    enum: ['Streaming', 'Static'],
    required: false,
  })
  Context?: 'Streaming' | 'Static';

  @ApiProperty({
    description: 'Indicates if subtitles are allowed in the manifest.',
    default: false,
    required: false,
  })
  EnableSubtitlesInManifest?: boolean;

  @ApiProperty({
    description: 'Gets or sets the maximum audio channels.',
    nullable: true,
    required: false,
  })
  MaxAudioChannels?: string | null;

  @ApiProperty({
    description: 'Gets or sets the minimum amount of segments.',
    format: 'int32',
    default: 0,
    required: false,
  })
  MinSegments?: number;

  @ApiProperty({
    description: 'Gets or sets the segment length.',
    format: 'int32',
    default: 0,
    required: false,
  })
  SegmentLength?: number;

  @ApiProperty({
    description:
      'Indicates if breaking the video stream on non-keyframes is supported.',
    default: false,
    required: false,
  })
  BreakOnNonKeyFrames?: boolean;

  @ApiProperty({
    description: 'Gets or sets the profile conditions.',
    type: [ProfileConditionDto],
    nullable: true,
    required: false,
  })
  Conditions?: ProfileConditionDto[];

  @ApiProperty({
    description: 'Indicates if variable bitrate encoding is supported.',
    default: true,
    required: false,
  })
  EnableAudioVbrEncoding?: boolean;
}

export class ContainerProfileDto implements ContainerProfile {
  @ApiProperty({
    description:
      'Gets or sets the MediaBrowser.Model.Dlna.DlnaProfileType which this container must meet.',
    enum: ['Audio', 'Video', 'Photo', 'Subtitle', 'Lyric'],
    nullable: true,
    required: false,
  })
  Type?: 'Audio' | 'Video' | 'Photo' | 'Subtitle' | 'Lyric';

  @ApiProperty({
    description: 'Gets or sets the profile conditions.',
    type: [ProfileConditionDto],
    nullable: true,
    required: false,
  })
  Conditions?: ProfileConditionDto[];

  @ApiProperty({
    description:
      'Gets or sets the container(s) which this container must meet.',
    nullable: true,
    required: false,
  })
  Container?: string | null;

  @ApiProperty({
    description:
      'Gets or sets the sub container(s) which this container must meet.',
    nullable: true,
    required: false,
  })
  SubContainer?: string | null;
}

export class CodecProfileDto implements CodecProfile {
  @ApiProperty({
    description:
      'Gets or sets the MediaBrowser.Model.Dlna.CodecType which this container must meet.',
    enum: ['Video', 'VideoAudio', 'Audio'],
    nullable: true,
    required: false,
  })
  Type?: 'Video' | 'VideoAudio' | 'Audio';

  @ApiProperty({
    description: 'Gets or sets the profile conditions.',
    type: [ProfileConditionDto],
    nullable: true,
    required: false,
  })
  Conditions?: ProfileConditionDto[];

  @ApiProperty({
    description: 'Gets or sets the apply conditions if this profile is met.',
    type: [ProfileConditionDto],
    nullable: true,
    required: false,
  })
  ApplyConditions?: ProfileConditionDto[];

  @ApiProperty({
    description: 'Gets or sets the codec(s) that this profile applies to.',
    nullable: true,
    required: false,
  })
  Codec?: string | null;

  @ApiProperty({
    description:
      'Gets or sets the container(s) which this profile will be applied to.',
    nullable: true,
    required: false,
  })
  Container?: string | null;

  @ApiProperty({
    description:
      'Gets or sets the sub-container(s) which this profile will be applied to.',
    nullable: true,
    required: false,
  })
  SubContainer?: string | null;
}

export class SubtitleProfileDto implements SubtitleProfile {
  @ApiProperty({
    description: 'Gets or sets the format.',
    nullable: true,
    required: false,
  })
  Format?: string | null;

  @ApiProperty({
    description: 'Gets or sets the delivery method.',
    enum: ['Encode', 'Embed', 'External', 'Hls', 'Drop'],
    nullable: true,
    required: false,
  })
  Method?: 'Encode' | 'Embed' | 'External' | 'Hls' | 'Drop';

  @ApiProperty({
    description: 'Gets or sets the DIDL mode.',
    nullable: true,
    required: false,
  })
  DidlMode?: string | null;

  @ApiProperty({
    description: 'Gets or sets the language.',
    nullable: true,
    required: false,
  })
  Language?: string | null;

  @ApiProperty({
    description: 'Gets or sets the container.',
    nullable: true,
    required: false,
  })
  Container?: string | null;
}

/**
 * A MediaBrowser.Model.Dlna.DeviceProfile represents a set of metadata which determines which content a certain device is able to play.
 * <br />
 * Specifically, it defines the supported <see cref="P:MediaBrowser.Model.Dlna.DeviceProfile.ContainerProfiles">containers</see> and
 * <see cref="P:MediaBrowser.Model.Dlna.DeviceProfile.CodecProfiles">codecs</see> (video and/or audio, including codec profiles and levels)
 * the device is able to direct play (without transcoding or remuxing),
 * as well as which <see cref="P:MediaBrowser.Model.Dlna.DeviceProfile.TranscodingProfiles">containers/codecs to transcode to</see> in case it isn't.
 */
export class DeviceProfileDto implements DeviceProfile {
  @ApiProperty({
    description:
      'Gets or sets the name of this device profile. User profiles must have a unique name.',
    nullable: true,
    required: false,
  })
  Name?: string | null;

  @ApiProperty({
    description: 'Gets or sets the unique internal identifier.',
    format: 'uuid',
    nullable: true,
    required: false,
  })
  Id?: string | null;

  @ApiProperty({
    description:
      'Gets or sets the maximum allowed bitrate for all streamed content.',
    format: 'int32',
    nullable: true,
    required: false,
  })
  MaxStreamingBitrate?: number | null;

  @ApiProperty({
    description:
      'Gets or sets the maximum allowed bitrate for statically streamed content (= direct played files).',
    format: 'int32',
    nullable: true,
    required: false,
  })
  MaxStaticBitrate?: number | null;

  @ApiProperty({
    description:
      'Gets or sets the maximum allowed bitrate for transcoded music streams.',
    format: 'int32',
    nullable: true,
    required: false,
  })
  MusicStreamingTranscodingBitrate?: number | null;

  @ApiProperty({
    description:
      'Gets or sets the maximum allowed bitrate for statically streamed (= direct played) music files.',
    format: 'int32',
    nullable: true,
    required: false,
  })
  MaxStaticMusicBitrate?: number | null;

  @ApiProperty({
    description: 'Gets or sets the direct play profiles.',
    type: [DirectPlayProfileDto],
    nullable: true,
    required: false,
  })
  DirectPlayProfiles?: DirectPlayProfileDto[];

  @ApiProperty({
    description: 'Gets or sets the transcoding profiles.',
    type: [TranscodingProfileDto],
    nullable: true,
    required: false,
  })
  TranscodingProfiles?: TranscodingProfileDto[];

  @ApiProperty({
    description: 'Gets or sets the container profiles.',
    type: [ContainerProfileDto],
    nullable: true,
    required: false,
  })
  ContainerProfiles?: ContainerProfileDto[];

  @ApiProperty({
    description: 'Gets or sets the codec profiles.',
    type: [CodecProfileDto],
    nullable: true,
    required: false,
  })
  CodecProfiles?: CodecProfileDto[];

  @ApiProperty({
    description: 'Gets or sets the subtitle profiles.',
    type: [SubtitleProfileDto],
    nullable: true,
    required: false,
  })
  SubtitleProfiles?: SubtitleProfileDto[];
}
