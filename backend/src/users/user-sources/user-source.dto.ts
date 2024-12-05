import {
  ApiProperty,
  IntersectionType,
  OmitType,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import { MediaSource } from './user-source.entity';
import { Type } from '@nestjs/common';

const PickAndPartial = <T, K extends keyof T>(
  clazz: Type<T>,
  pick: K[] = [],
  partial: K[] = [],
) =>
  IntersectionType(
    OmitType(PickType(clazz, pick), partial),
    PickType(PartialType(clazz), partial),
  );

export class SourceDto extends PickAndPartial(
  MediaSource,
  ['id', 'userId', 'adminControlled', 'enabled'],
  ['pluginSettings'],
) {}

export class CreateSourceDto extends PickAndPartial(
  MediaSource,
  ['pluginSettings', 'id'],
  ['enabled', 'adminControlled'],
) {}
