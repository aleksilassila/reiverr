import {
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  PluginSettings,
  PluginSettingsInput,
  PluginSettingsLink,
  PluginSettingsTemplate,
  ValidationResponse,
} from 'plugins/plugin-types';

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
