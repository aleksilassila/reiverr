import {
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';
import { DeviceProfileDto } from './device-profile.dto';
import {
  AudioStream,
  IndexItem,
  PlaybackConfig,
  SourceProviderSettings,
  SourceProviderSettingsInput,
  SourceProviderSettingsLink,
  SourceProviderSettingsTemplate,
  Quality,
  Subtitles,
  ValidationResponse,
  StreamCandidate,
  StreamProperty,
  Stream,
} from '@aleksilassila/reiverr-plugin';

export class IndexItemDto implements IndexItem {
  @ApiProperty()
  id: string;
}

class PluginSettingsLinkDto implements SourceProviderSettingsLink {
  @ApiProperty({ example: 'link', enum: ['link'] })
  type: 'link';

  @ApiProperty({ example: 'https://example.com' })
  url: string;

  @ApiProperty({ example: 'Example' })
  label: string;
}

class PluginSettingsInputDto implements SourceProviderSettingsInput {
  @ApiProperty({
    example: 'string',
    enum: ['string', 'number', 'boolean', 'password'],
  })
  type: 'string' | 'number' | 'boolean' | 'password';

  @ApiProperty({ example: 'Example' })
  label: string;

  @ApiProperty({ example: 'Placeholder' })
  placeholder: string;
}

export class PluginSettingsTemplateDto {
  @ApiProperty({
    example: {
      setting1: 'string',
      setting2: { type: 'link', url: 'https://example.com' },
    },
    type: 'object',
    additionalProperties: {
      oneOf: [
        { $ref: getSchemaPath(PluginSettingsInputDto) },
        { $ref: getSchemaPath(PluginSettingsLinkDto) },
      ],
    },
  })
  settings: SourceProviderSettingsTemplate;
}

export class SourceProviderCapabilitiesDto {
  @ApiProperty()
  moviePlayback: boolean;

  @ApiProperty()
  episodePlayback: boolean;

  @ApiProperty()
  movieIndexing: boolean;

  @ApiProperty()
  episodeIndexing: boolean;

  // @ApiProperty()
  // requesting: boolean;

  // @ApiProperty()
  // deletion: boolean;
}

export class PluginSettingsDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: true, // Indicates that any properties are allowed
    example: {
      setting1: 'some value',
      setting2: 12345,
      setting3: true,
      setting4: { nestedKey: 'nestedValue' },
    },
  })
  settings: SourceProviderSettings;
}

export class ValidationResponseDto implements ValidationResponse {
  @ApiProperty({ example: true })
  isValid: boolean;

  @ApiProperty({
    example: {
      setting1: 'error message',
      setting2: 'another error message',
    },
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  errors: Record<string, string>;

  @ApiProperty({
    example: {
      setting1: 'new value',
      setting2: 'another new value',
    },
    type: 'object',
    additionalProperties: true,
  })
  settings: Record<string, any>;
}

export class AudioStreamDto implements AudioStream {
  @ApiProperty()
  index: number;

  @ApiProperty()
  label: string;

  @ApiProperty({ example: 'aac', required: false })
  codec: string | undefined;

  @ApiProperty({ example: 96_000, type: 'number', required: false })
  bitrate: number | undefined;
}

export class QualityDto implements Quality {
  @ApiProperty()
  index: number;

  @ApiProperty()
  bitrate: number;

  @ApiProperty()
  label: string;

  @ApiProperty({ required: false })
  codec: string | undefined;

  @ApiProperty()
  original: boolean;
}

export class SubtitlesDto implements Subtitles {
  @ApiProperty()
  src: string;
  @ApiProperty()
  lang: string;
  @ApiProperty({
    type: 'string',
    enum: ['subtitles', 'captions', 'descriptions'],
  })
  kind: 'subtitles' | 'captions' | 'descriptions';
  @ApiProperty()
  label: string;
}

export class VideoStreamPropertyDto implements StreamProperty {
  @ApiProperty()
  label: string;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'number' }],
  })
  value: string | number;

  @ApiProperty({ required: false })
  formatted: string | undefined;
}

export class StreamCandidateDto implements StreamCandidate {
  @ApiProperty()
  key: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ type: [VideoStreamPropertyDto] })
  properties: VideoStreamPropertyDto[];
}

export class StreamDto extends StreamCandidateDto implements Stream {
  @ApiProperty()
  src: string;

  @ApiProperty()
  directPlay: boolean;

  @ApiProperty({ description: 'Duration in seconds' })
  duration: number;

  @ApiProperty({ description: 'Play progress as a number between 0 and 1' })
  progress: number;

  @ApiProperty({ type: [AudioStreamDto] })
  audioStreams: AudioStreamDto[];

  @ApiProperty()
  audioStreamIndex: number;

  @ApiProperty({ type: [QualityDto] })
  qualities: QualityDto[];

  @ApiProperty()
  qualityIndex: number;

  @ApiProperty({ type: [SubtitlesDto] })
  subtitles: SubtitlesDto[];
}

export class PlaybackConfigDto implements PlaybackConfig {
  @ApiPropertyOptional({ example: 0, required: false })
  bitrate: number | undefined;

  @ApiPropertyOptional({ example: 0, required: false })
  audioStreamIndex: number | undefined;

  @ApiPropertyOptional({ example: 0, required: false })
  progress: number | undefined;

  @ApiPropertyOptional({
    example: 'en',
    required: false,
    type: DeviceProfileDto,
  })
  deviceProfile: DeviceProfileDto | undefined;

  @ApiPropertyOptional({ example: 'en', required: false })
  defaultLanguage: string | undefined;
}

export class StreamCandidatesDto {
  @ApiProperty({
    type: [StreamCandidateDto],
  })
  candidates: StreamCandidateDto[];
}
