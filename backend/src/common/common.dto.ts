import { Type } from '@nestjs/common';
import {
  ApiProperty,
  IntersectionType,
  OmitType,
  PartialType,
  PickType,
} from '@nestjs/swagger';

export const PickAndPartial = <T, K extends keyof T>(
  clazz: Type<T>,
  pick: K[] = [],
  partial: K[] = [],
) =>
  IntersectionType(
    OmitType(PickType(clazz, pick), partial),
    PickType(PartialType(clazz), partial),
  );

export class PaginatedResponseDto<T> {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  itemsPerPage: number;

  // @ApiProperty()
  items: T[];
}

export class PaginationDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  itemsPerPage: number;
}

export class SuccessResponseDto {
  @ApiProperty()
  success: boolean;
}

export class EpisodeRefDto {
  @ApiProperty()
  season: number;

  @ApiProperty()
  episode: number;
}

export class ErrorResponseDto {
  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  error?: string;
}

export enum MediaType {
  Movie = 'movie',
  Series = 'series',
}

export enum MediaTypeFull {
  Movie = 'movie',
  Series = 'series',
  Episode = 'episode',
}

export enum OrderDirection {
  Asc = 'asc',
  Desc = 'desc',
}

/** The initials a list of titles is filtered by: a letter, or '#' for a name that starts with none */
export const LETTERS = [
  '#',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
] as const;
export type Letter = (typeof LETTERS)[number];
