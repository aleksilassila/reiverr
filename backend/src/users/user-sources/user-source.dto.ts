import {
  ApiProperty,
  IntersectionType,
  OmitType,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import { MediaSource } from './user-source.entity';
import { Type } from '@nestjs/common';
import { PickAndPartial } from 'src/common/common.dto';

export class SourceDto extends PickAndPartial(
  MediaSource,
  ['id', 'userId', 'adminControlled', 'enabled'],
  ['pluginSettings'],
) {}

export class CreateSourceDto extends PickAndPartial(
  MediaSource,
  ['pluginSettings'],
  ['enabled', 'adminControlled'],
) {}
