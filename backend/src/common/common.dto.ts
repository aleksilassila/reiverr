import { Type } from '@nestjs/common';
import {
  ApiProperty,
  IntersectionType,
  OmitType,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import {
  PaginatedResponse,
  PaginationParams,
} from '@aleksilassila/reiverr-plugin';

export const PickAndPartial = <T, K extends keyof T>(
  clazz: Type<T>,
  pick: K[] = [],
  partial: K[] = [],
) =>
  IntersectionType(
    OmitType(PickType(clazz, pick), partial),
    PickType(PartialType(clazz), partial),
  );

export class PaginatedResponseDto<T> implements PaginatedResponse<T> {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  itemsPerPage: number;

  // @ApiProperty()
  items: T[];
}

export class PaginationParamsDto implements PaginationParams {
  @ApiProperty()
  page: number;

  @ApiProperty()
  itemsPerPage: number;
}

export class SuccessResponseDto {
  @ApiProperty()
  success: boolean;
}

export enum MediaType {
  Movie = 'Movie',
  Series = 'Series',
  Episode = 'Episode',
}
