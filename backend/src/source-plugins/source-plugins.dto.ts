import {
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  AudioStream,
  PlaybackConfig,
  PluginSettings,
  PluginSettingsInput,
  PluginSettingsLink,
  PluginSettingsTemplate,
  Quality,
  Subtitles,
  ValidationResponse,
  VideoStream,
  VideoStreamCandidate,
  VideoStreamProperty,
} from 'plugins/plugin-types';
import { DeviceProfileDto } from './device-profile.dto';

class PluginSettingsLinkDto implements PluginSettingsLink {
  @ApiProperty({ example: 'link', enum: ['link'] })
  type: 'link';

  @ApiProperty({ example: 'https://example.com' })
  url: string;

  @ApiProperty({ example: 'Example' })
  label: string;
}

class PluginSettingsInputDto implements PluginSettingsInput {
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
  settings: PluginSettingsTemplate;
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
  settings: PluginSettings;
}

export class ValidationResponsekDto implements ValidationResponse {
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
  replace: Record<string, any>;
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
  index: number;

  @ApiProperty()
  uri: string;

  @ApiProperty()
  label: string;

  @ApiProperty({ required: false })
  codec: string | undefined;
}

export class VideoStreamPropertyDto implements VideoStreamProperty {
  @ApiProperty()
  label: string;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'number' }],
  })
  value: string | number;

  @ApiProperty({ required: false })
  formatted: string | undefined;
}

export class VideoStreamCandidateDto implements VideoStreamCandidate {
  @ApiProperty()
  key: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ type: [VideoStreamPropertyDto] })
  properties: VideoStreamPropertyDto[];
}

export class VideoStreamDto
  extends VideoStreamCandidateDto
  implements VideoStream
{
  @ApiProperty()
  uri: string;

  @ApiProperty()
  directPlay: boolean;

  @ApiProperty()
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

export class VideoStreamListDto {
  @ApiProperty({
    type: [VideoStreamCandidateDto],
  })
  streams: VideoStreamCandidateDto[];
}
