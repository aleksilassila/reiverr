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

/** A movie or a series, as TMDB knows it */
export interface Title {
  mediaType: MediaType;
  tmdbId: string;
}

/** The title of a row without its other fields, for data that is sent as it is, as that of a client event */
export const titleOf = ({ mediaType, tmdbId }: Title): Title => ({
  mediaType,
  tmdbId,
});

/** A user and a title, which the rules and the title states are kept per */
export interface Pair extends Title {
  userId: string;
}

export const pairKey = ({ userId, mediaType, tmdbId }: Pair) =>
  `${userId}/${mediaType}/${tmdbId}`;

export const uniquePairs = (pairs: Pair[]): Pair[] => [
  ...new Map(
    pairs.map(({ userId, mediaType, tmdbId }) => [
      pairKey({ userId, mediaType, tmdbId }),
      { userId, mediaType, tmdbId },
    ]),
  ).values(),
];

export const seriesPair = (userId: string, tmdbId: string): Pair => ({
  userId,
  mediaType: MediaType.Series,
  tmdbId,
});

export const moviePair = (userId: string, tmdbId: string): Pair => ({
  userId,
  mediaType: MediaType.Movie,
  tmdbId,
});

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

/** The letter a name is listed under: its first character in upper case, '#' when that is no letter (as the catalogue's SQL filter) */
export function initialOf(name: string): Letter {
  const initial = name.charAt(0).toUpperCase();
  return /^[A-Z]$/.test(initial) ? (initial as Letter) : '#';
}
