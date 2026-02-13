/* eslint-disable */
/**
 * =====================================================================
 * THIS FILE WAS AI-GENERATED
 * =====================================================================
 *
 * These types were automatically generated from the TMDB v3 OpenAPI
 * specification (tmdb.v3.openapi.ts) and converted to NestJS DTOs with
 * Swagger decorators for API documentation.
 *
 * Generation prompt:
 * "Can you create tmdb.v3.generated.dto.ts and in there create nestjs swagger
 * classes for all types from tmdb.v3.openapi.ts. You can look at
 * source-provider.dto.ts or media-source.dto.ts for reference if you need it.
 * At the top of the new file include a disclaimer that the types were AI
 * generated and include this prompt word-to-word."
 *
 * =====================================================================
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// =====================================================================
// COMMON/SHARED TYPES
// =====================================================================

export class GenreDto {
  @ApiPropertyOptional({ example: 18, description: 'Genre ID' })
  id?: number;

  @ApiPropertyOptional({ example: 'Drama', description: 'Genre name' })
  name?: string;
}

export class ProductionCompanyDto {
  @ApiPropertyOptional({ example: 508, description: 'Company ID' })
  id?: number;

  @ApiPropertyOptional({
    example: '/7cxRWzi4LsVm4Utfpr1hfARNurT.png',
    description: 'Company logo path',
  })
  logo_path?: string;

  @ApiPropertyOptional({
    example: 'Regency Enterprises',
    description: 'Company name',
  })
  name?: string;

  @ApiPropertyOptional({ example: 'US', description: 'Origin country code' })
  origin_country?: string;
}

export class ProductionCountryDto {
  @ApiPropertyOptional({
    example: 'US',
    description: 'Country code (ISO 3166-1)',
  })
  iso_3166_1?: string;

  @ApiPropertyOptional({
    example: 'United States of America',
    description: 'Country name',
  })
  name?: string;
}

export class SpokenLanguageDto {
  @ApiPropertyOptional({
    example: 'English',
    description: 'Language name in English',
  })
  english_name?: string;

  @ApiPropertyOptional({
    example: 'en',
    description: 'Language code (ISO 639-1)',
  })
  iso_639_1?: string;

  @ApiPropertyOptional({
    example: 'English',
    description: 'Language native name',
  })
  name?: string;
}

export class NetworkDto {
  @ApiPropertyOptional({ example: 49, description: 'Network ID' })
  id?: number;

  @ApiPropertyOptional({
    example: '/tuomPhY2UtuPTqqFnKMVHvSb724.png',
    description: 'Network logo path',
  })
  logo_path?: string;

  @ApiPropertyOptional({ example: 'HBO', description: 'Network name' })
  name?: string;

  @ApiPropertyOptional({ example: 'US', description: 'Origin country code' })
  origin_country?: string;
}

export class CreatorDto {
  @ApiPropertyOptional({ example: 9813, description: 'Creator ID' })
  id?: number;

  @ApiPropertyOptional({
    example: '5256c8c219c2956ff604858a',
    description: 'Credit ID',
  })
  credit_id?: string;

  @ApiPropertyOptional({
    example: 'David Benioff',
    description: 'Creator name',
  })
  name?: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Gender (0=not specified, 1=female, 2=male)',
  })
  gender?: number;

  @ApiPropertyOptional({
    example: '/xvNN5huL0X8yJ7h3IZfGG4O2zBD.jpg',
    description: 'Profile image path',
  })
  profile_path?: string;
}

// =====================================================================
// MOVIE TYPES
// =====================================================================

export class MovieDetailsDto {
  @ApiPropertyOptional({
    example: false,
    description: 'Whether the movie is adult content',
  })
  adult?: boolean;

  @ApiPropertyOptional({
    example: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
    description: 'Path to backdrop image',
  })
  backdrop_path?: string;

  @ApiPropertyOptional({
    description: 'Collection information if part of a collection',
  })
  belongs_to_collection?: any;

  @ApiPropertyOptional({
    example: 63000000,
    description: 'Movie production budget',
  })
  budget?: number;

  @ApiPropertyOptional({
    type: [GenreDto],
    description: 'Array of genres',
  })
  genres?: GenreDto[];

  @ApiPropertyOptional({
    example: 'http://www.foxmovies.com/movies/fight-club',
    description: 'Official movie website',
  })
  homepage?: string;

  @ApiPropertyOptional({ example: 550, description: 'Movie ID' })
  id?: number;

  @ApiPropertyOptional({
    example: 'tt0137523',
    description: 'IMDb identifier',
  })
  imdb_id?: string;

  @ApiPropertyOptional({
    example: 'en',
    description: 'Original language code (ISO 639-1)',
  })
  original_language?: string;

  @ApiPropertyOptional({
    example: 'Fight Club',
    description: 'Original movie title',
  })
  original_title?: string;

  @ApiPropertyOptional({
    example:
      'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.',
    description: 'Movie plot summary',
  })
  overview?: string;

  @ApiPropertyOptional({ example: 61.416, description: 'Popularity score' })
  popularity?: number;

  @ApiPropertyOptional({
    example: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    description: 'Path to poster image',
  })
  poster_path?: string;

  @ApiPropertyOptional({
    type: [ProductionCompanyDto],
    description: 'Array of production companies',
  })
  production_companies?: ProductionCompanyDto[];

  @ApiPropertyOptional({
    type: [ProductionCountryDto],
    description: 'Array of production countries',
  })
  production_countries?: ProductionCountryDto[];

  @ApiPropertyOptional({
    example: '1999-10-15',
    description: 'Release date (YYYY-MM-DD)',
  })
  release_date?: string;

  @ApiPropertyOptional({
    example: 100853753,
    description: 'Box office revenue',
  })
  revenue?: number;

  @ApiPropertyOptional({ example: 139, description: 'Duration in minutes' })
  runtime?: number;

  @ApiPropertyOptional({
    type: [SpokenLanguageDto],
    description: 'Array of spoken languages',
  })
  spoken_languages?: SpokenLanguageDto[];

  @ApiPropertyOptional({ example: 'Released', description: 'Release status' })
  status?: string;

  @ApiPropertyOptional({
    example: 'Mischief. Mayhem. Soap.',
    description: 'Movie tagline',
  })
  tagline?: string;

  @ApiPropertyOptional({ example: 'Fight Club', description: 'Movie title' })
  title?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether video is available',
  })
  video?: boolean;

  @ApiPropertyOptional({ example: 8.433, description: 'Average rating' })
  vote_average?: number;

  @ApiPropertyOptional({ example: 26280, description: 'Number of votes' })
  vote_count?: number;
}

export class MovieSearchResultItemDto {
  @ApiPropertyOptional({ example: false, description: 'Whether adult content' })
  adult?: boolean;

  @ApiPropertyOptional({
    example: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
    description: 'Backdrop image path',
  })
  backdrop_path?: string;

  @ApiPropertyOptional({
    type: [Number],
    example: [18, 53, 28],
    description: 'Array of genre IDs',
  })
  genre_ids?: number[];

  @ApiPropertyOptional({ example: 550, description: 'Movie ID' })
  id?: number;

  @ApiPropertyOptional({ example: 'en', description: 'Original language code' })
  original_language?: string;

  @ApiPropertyOptional({ example: 'Fight Club', description: 'Original title' })
  original_title?: string;

  @ApiPropertyOptional({
    example: 'A ticking-time-bomb insomniac and a slippery soap salesman...',
    description: 'Overview',
  })
  overview?: string;

  @ApiPropertyOptional({ example: 73.433, description: 'Popularity score' })
  popularity?: number;

  @ApiPropertyOptional({
    example: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    description: 'Poster path',
  })
  poster_path?: string;

  @ApiPropertyOptional({
    example: '1999-10-15',
    description: 'Release date',
  })
  release_date?: string;

  @ApiPropertyOptional({ example: 'Fight Club', description: 'Movie title' })
  title?: string;

  @ApiPropertyOptional({ example: false, description: 'Has video' })
  video?: boolean;

  @ApiPropertyOptional({ example: 8.433, description: 'Vote average' })
  vote_average?: number;

  @ApiPropertyOptional({ example: 26279, description: 'Vote count' })
  vote_count?: number;
}

export class MovieSearchResponseDto {
  @ApiPropertyOptional({ example: 1, description: 'Current page number' })
  page?: number;

  @ApiPropertyOptional({
    type: [MovieSearchResultItemDto],
    description: 'Array of movie results',
  })
  results?: MovieSearchResultItemDto[];

  @ApiPropertyOptional({ example: 2, description: 'Total pages available' })
  total_pages?: number;

  @ApiPropertyOptional({ example: 39, description: 'Total results count' })
  total_results?: number;
}

// =====================================================================
// TV SERIES TYPES
// =====================================================================

export class EpisodeToAirDto {
  @ApiPropertyOptional({ example: 1551830, description: 'Episode ID' })
  id?: number;

  @ApiPropertyOptional({
    example: 'The Iron Throne',
    description: 'Episode name',
  })
  name?: string;

  @ApiPropertyOptional({
    example: 'In the aftermath of the devastating attack...',
    description: 'Episode overview',
  })
  overview?: string;

  @ApiPropertyOptional({ example: 4.809, description: 'Vote average' })
  vote_average?: number;

  @ApiPropertyOptional({ example: 241, description: 'Vote count' })
  vote_count?: number;

  @ApiPropertyOptional({
    example: '2019-05-19',
    description: 'Air date (YYYY-MM-DD)',
  })
  air_date?: string;

  @ApiPropertyOptional({ example: 6, description: 'Episode number' })
  episode_number?: number;

  @ApiPropertyOptional({ example: '806', description: 'Production code' })
  production_code?: string;

  @ApiPropertyOptional({ example: 80, description: 'Runtime in minutes' })
  runtime?: number;

  @ApiPropertyOptional({ example: 8, description: 'Season number' })
  season_number?: number;

  @ApiPropertyOptional({ example: 1399, description: 'Show ID' })
  show_id?: number;

  @ApiPropertyOptional({
    example: '/zBi2O5EJfgTS6Ae0HdAYLm9o2nf.jpg',
    description: 'Still image path',
  })
  still_path?: string;
}

export class SeasonDto {
  @ApiPropertyOptional({
    example: '2010-12-05',
    description: 'Season air date',
  })
  air_date?: string;

  @ApiPropertyOptional({ example: 272, description: 'Episode count' })
  episode_count?: number;

  @ApiPropertyOptional({ example: 3627, description: 'Season ID' })
  id?: number;

  @ApiPropertyOptional({ example: 'Specials', description: 'Season name' })
  name?: string;

  @ApiPropertyOptional({ example: '', description: 'Season overview' })
  overview?: string;

  @ApiPropertyOptional({
    example: '/kMTcwNRfFKCZ0O2OaBZS0nZ2AIe.jpg',
    description: 'Poster path',
  })
  poster_path?: string;

  @ApiPropertyOptional({ example: 0, description: 'Season number' })
  season_number?: number;

  @ApiPropertyOptional({ example: 0, description: 'Vote average' })
  vote_average?: number;
}

export class TvSeriesDetailsDto {
  @ApiPropertyOptional({ example: false, description: 'Whether adult content' })
  adult?: boolean;

  @ApiPropertyOptional({
    example: '/6LWy0jvMpmjoS9fojNgHIKoWL05.jpg',
    description: 'Backdrop path',
  })
  backdrop_path?: string;

  @ApiPropertyOptional({
    type: [CreatorDto],
    description: 'Array of series creators',
  })
  created_by?: CreatorDto[];

  @ApiPropertyOptional({
    type: [Number],
    example: [60, 45],
    description: 'Array of typical episode durations',
  })
  episode_run_time?: number[];

  @ApiPropertyOptional({
    example: '2011-04-17',
    description: 'First air date',
  })
  first_air_date?: string;

  @ApiPropertyOptional({
    type: [GenreDto],
    description: 'Array of genres',
  })
  genres?: GenreDto[];

  @ApiPropertyOptional({
    example: 'http://www.hbo.com/game-of-thrones',
    description: 'Official homepage',
  })
  homepage?: string;

  @ApiPropertyOptional({ example: 1399, description: 'Series ID' })
  id?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether still in production',
  })
  in_production?: boolean;

  @ApiPropertyOptional({
    type: [String],
    example: ['en', 'es'],
    description: 'Array of language codes',
  })
  languages?: string[];

  @ApiPropertyOptional({
    example: '2019-05-19',
    description: 'Most recent air date',
  })
  last_air_date?: string;

  @ApiPropertyOptional({
    type: EpisodeToAirDto,
    description: 'Last episode to air',
  })
  last_episode_to_air?: EpisodeToAirDto;

  @ApiPropertyOptional({
    example: 'Game of Thrones',
    description: 'Series name',
  })
  name?: string;

  @ApiPropertyOptional({ description: 'Next episode to air (if any)' })
  next_episode_to_air?: any;

  @ApiPropertyOptional({
    type: [NetworkDto],
    description: 'Array of networks',
  })
  networks?: NetworkDto[];

  @ApiPropertyOptional({ example: 73, description: 'Total number of episodes' })
  number_of_episodes?: number;

  @ApiPropertyOptional({ example: 8, description: 'Total number of seasons' })
  number_of_seasons?: number;

  @ApiPropertyOptional({
    type: [String],
    example: ['US', 'GB'],
    description: 'Array of origin countries',
  })
  origin_country?: string[];

  @ApiPropertyOptional({
    example: 'en',
    description: 'Original language code',
  })
  original_language?: string;

  @ApiPropertyOptional({
    example: 'Game of Thrones',
    description: 'Original series name',
  })
  original_name?: string;

  @ApiPropertyOptional({
    example:
      'Seven noble families fight for control of the mythical land of Westeros...',
    description: 'Series description',
  })
  overview?: string;

  @ApiPropertyOptional({ example: 346.098, description: 'Popularity score' })
  popularity?: number;

  @ApiPropertyOptional({
    example: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
    description: 'Poster path',
  })
  poster_path?: string;

  @ApiPropertyOptional({
    type: [ProductionCompanyDto],
    description: 'Array of production companies',
  })
  production_companies?: ProductionCompanyDto[];

  @ApiPropertyOptional({
    type: [ProductionCountryDto],
    description: 'Array of production countries',
  })
  production_countries?: ProductionCountryDto[];

  @ApiPropertyOptional({
    type: [SeasonDto],
    description: 'Array of seasons',
  })
  seasons?: SeasonDto[];

  @ApiPropertyOptional({
    type: [SpokenLanguageDto],
    description: 'Array of spoken languages',
  })
  spoken_languages?: SpokenLanguageDto[];

  @ApiPropertyOptional({ example: 'Ended', description: 'Series status' })
  status?: string;

  @ApiPropertyOptional({
    example: 'Winter Is Coming',
    description: 'Series tagline',
  })
  tagline?: string;

  @ApiPropertyOptional({ example: 'Scripted', description: 'Series type' })
  type?: string;

  @ApiPropertyOptional({ example: 8.438, description: 'Average rating' })
  vote_average?: number;

  @ApiPropertyOptional({ example: 21390, description: 'Vote count' })
  vote_count?: number;
}

export class TvSearchResultItemDto {
  @ApiPropertyOptional({ example: false, description: 'Whether adult content' })
  adult?: boolean;

  @ApiPropertyOptional({
    example: '/bsNm9z2TJfe0WO3RedPGWQ8mG1X.jpg',
    description: 'Backdrop path',
  })
  backdrop_path?: string;

  @ApiPropertyOptional({
    type: [Number],
    example: [18, 80],
    description: 'Array of genre IDs',
  })
  genre_ids?: number[];

  @ApiPropertyOptional({ example: 1396, description: 'Series ID' })
  id?: number;

  @ApiPropertyOptional({
    type: [String],
    example: ['US'],
    description: 'Origin countries',
  })
  origin_country?: string[];

  @ApiPropertyOptional({ example: 'en', description: 'Original language' })
  original_language?: string;

  @ApiPropertyOptional({
    example: 'Breaking Bad',
    description: 'Original name',
  })
  original_name?: string;

  @ApiPropertyOptional({
    example: 'When Walter White, a New Mexico chemistry teacher...',
    description: 'Overview',
  })
  overview?: string;

  @ApiPropertyOptional({ example: 298.884, description: 'Popularity' })
  popularity?: number;

  @ApiPropertyOptional({
    example: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    description: 'Poster path',
  })
  poster_path?: string;

  @ApiPropertyOptional({
    example: '2008-01-20',
    description: 'First air date',
  })
  first_air_date?: string;

  @ApiPropertyOptional({ example: 'Breaking Bad', description: 'Series name' })
  name?: string;

  @ApiPropertyOptional({ example: 8.879, description: 'Vote average' })
  vote_average?: number;

  @ApiPropertyOptional({ example: 11536, description: 'Vote count' })
  vote_count?: number;
}

export class TvSearchResponseDto {
  @ApiPropertyOptional({ example: 1, description: 'Current page' })
  page?: number;

  @ApiPropertyOptional({
    type: [TvSearchResultItemDto],
    description: 'Search results',
  })
  results?: TvSearchResultItemDto[];

  @ApiPropertyOptional({ example: 1, description: 'Total pages' })
  total_pages?: number;

  @ApiPropertyOptional({ example: 1, description: 'Total results' })
  total_results?: number;
}

// =====================================================================
// EPISODE TYPES
// =====================================================================

export class CrewMemberDto {
  @ApiPropertyOptional({ example: 'Directing', description: 'Department' })
  department?: string;

  @ApiPropertyOptional({ example: 'Director', description: 'Job title' })
  job?: string;

  @ApiPropertyOptional({
    example: '5256c8a219c2956ff6046e77',
    description: 'Credit ID',
  })
  credit_id?: string;

  @ApiPropertyOptional({ example: false, description: 'Adult content' })
  adult?: boolean;

  @ApiPropertyOptional({ example: 2, description: 'Gender' })
  gender?: number;

  @ApiPropertyOptional({ example: 44797, description: 'Person ID' })
  id?: number;

  @ApiPropertyOptional({
    example: 'Directing',
    description: 'Known for department',
  })
  known_for_department?: string;

  @ApiPropertyOptional({ example: 'Timothy Van Patten', description: 'Name' })
  name?: string;

  @ApiPropertyOptional({
    example: 'Timothy Van Patten',
    description: 'Original name',
  })
  original_name?: string;

  @ApiPropertyOptional({ example: 7.775, description: 'Popularity' })
  popularity?: number;

  @ApiPropertyOptional({
    example: '/MzSOFrd99HRdr6pkSRSctk3kBR.jpg',
    description: 'Profile path',
  })
  profile_path?: string;
}

export class GuestStarDto {
  @ApiPropertyOptional({
    example: 'Benjen Stark',
    description: 'Character name',
  })
  character?: string;

  @ApiPropertyOptional({
    example: '5256c8b919c2956ff604836a',
    description: 'Credit ID',
  })
  credit_id?: string;

  @ApiPropertyOptional({ example: 62, description: 'Billing order' })
  order?: number;

  @ApiPropertyOptional({ example: false, description: 'Adult content' })
  adult?: boolean;

  @ApiPropertyOptional({ example: 2, description: 'Gender' })
  gender?: number;

  @ApiPropertyOptional({ example: 119783, description: 'Person ID' })
  id?: number;

  @ApiPropertyOptional({
    example: 'Acting',
    description: 'Known for department',
  })
  known_for_department?: string;

  @ApiPropertyOptional({ example: 'Joseph Mawle', description: 'Name' })
  name?: string;

  @ApiPropertyOptional({
    example: 'Joseph Mawle',
    description: 'Original name',
  })
  original_name?: string;

  @ApiPropertyOptional({ example: 6.758, description: 'Popularity' })
  popularity?: number;

  @ApiPropertyOptional({
    example: '/1Ocb9v3h54beGVoJMm4w50UQhLf.jpg',
    description: 'Profile path',
  })
  profile_path?: string;
}

export class TvEpisodeDetailsDto {
  @ApiPropertyOptional({
    example: '2011-04-17',
    description: 'Episode air date',
  })
  air_date?: string;

  @ApiPropertyOptional({
    type: [CrewMemberDto],
    description: 'Crew members',
  })
  crew?: CrewMemberDto[];

  @ApiPropertyOptional({ example: 1, description: 'Episode number' })
  episode_number?: number;

  @ApiPropertyOptional({
    type: [GuestStarDto],
    description: 'Guest stars',
  })
  guest_stars?: GuestStarDto[];

  @ApiPropertyOptional({
    example: 'Winter Is Coming',
    description: 'Episode name',
  })
  name?: string;

  @ApiPropertyOptional({
    example: 'Jon Arryn, the Hand of the King, is dead...',
    description: 'Episode overview',
  })
  overview?: string;

  @ApiPropertyOptional({ example: 63056, description: 'Episode ID' })
  id?: number;

  @ApiPropertyOptional({ example: '101', description: 'Production code' })
  production_code?: string;

  @ApiPropertyOptional({ example: 62, description: 'Runtime in minutes' })
  runtime?: number;

  @ApiPropertyOptional({ example: 1, description: 'Season number' })
  season_number?: number;

  @ApiPropertyOptional({
    example: '/9hGF3WUkBf7cSjMg0cdMDHJkByd.jpg',
    description: 'Still image path',
  })
  still_path?: string;

  @ApiPropertyOptional({ example: 7.838, description: 'Vote average' })
  vote_average?: number;

  @ApiPropertyOptional({ example: 291, description: 'Vote count' })
  vote_count?: number;
}

// =====================================================================
// SEASON TYPES
// =====================================================================

export class SeasonEpisodeDto {
  @ApiPropertyOptional({
    example: '2011-04-17',
    description: 'Episode air date',
  })
  air_date?: string;

  @ApiPropertyOptional({ example: 1, description: 'Episode number' })
  episode_number?: number;

  @ApiPropertyOptional({ example: 63056, description: 'Episode ID' })
  id?: number;

  @ApiPropertyOptional({
    example: 'Winter Is Coming',
    description: 'Episode name',
  })
  name?: string;

  @ApiPropertyOptional({
    example: 'Jon Arryn, the Hand of the King, is dead...',
    description: 'Overview',
  })
  overview?: string;

  @ApiPropertyOptional({ example: '101', description: 'Production code' })
  production_code?: string;

  @ApiPropertyOptional({ example: 62, description: 'Runtime in minutes' })
  runtime?: number;

  @ApiPropertyOptional({ example: 1, description: 'Season number' })
  season_number?: number;

  @ApiPropertyOptional({ example: 1399, description: 'Show ID' })
  show_id?: number;

  @ApiPropertyOptional({
    example: '/9hGF3WUkBf7cSjMg0cdMDHJkByd.jpg',
    description: 'Still path',
  })
  still_path?: string;

  @ApiPropertyOptional({ example: 7.838, description: 'Vote average' })
  vote_average?: number;

  @ApiPropertyOptional({ example: 291, description: 'Vote count' })
  vote_count?: number;

  @ApiPropertyOptional({
    type: [CrewMemberDto],
    description: 'Crew members',
  })
  crew?: CrewMemberDto[];

  @ApiPropertyOptional({
    type: [GuestStarDto],
    description: 'Guest stars',
  })
  guest_stars?: GuestStarDto[];
}

export class TvSeasonDetailsDto {
  @ApiPropertyOptional({
    example: '5256c89f19c2956ff6046d47',
    description: 'Internal ID',
  })
  _id?: string;

  @ApiPropertyOptional({
    example: '2011-04-17',
    description: 'Season air date',
  })
  air_date?: string;

  @ApiPropertyOptional({
    type: [SeasonEpisodeDto],
    description: 'Episodes in season',
  })
  episodes?: SeasonEpisodeDto[];

  @ApiPropertyOptional({ example: 'Season 1', description: 'Season name' })
  name?: string;

  @ApiPropertyOptional({
    example: 'Trouble is brewing in the Seven Kingdoms of Westeros...',
    description: 'Season overview',
  })
  overview?: string;

  @ApiPropertyOptional({ example: 3624, description: 'Season ID' })
  id?: number;

  @ApiPropertyOptional({
    example: '/wgfKiqzuMrFIkU1M68DDDY8kGC1.jpg',
    description: 'Poster path',
  })
  poster_path?: string;

  @ApiPropertyOptional({ example: 1, description: 'Season number' })
  season_number?: number;

  @ApiPropertyOptional({ example: 8.3, description: 'Vote average' })
  vote_average?: number;
}

// =====================================================================
// CREDITS TYPES
// =====================================================================

export class CastMemberDto {
  @ApiPropertyOptional({ example: false, description: 'Adult content' })
  adult?: boolean;

  @ApiPropertyOptional({ example: 2, description: 'Gender' })
  gender?: number;

  @ApiPropertyOptional({ example: 819, description: 'Actor ID' })
  id?: number;

  @ApiPropertyOptional({
    example: 'Acting',
    description: 'Known for department',
  })
  known_for_department?: string;

  @ApiPropertyOptional({ example: 'Edward Norton', description: 'Actor name' })
  name?: string;

  @ApiPropertyOptional({
    example: 'Edward Norton',
    description: 'Original name',
  })
  original_name?: string;

  @ApiPropertyOptional({ example: 26.99, description: 'Popularity' })
  popularity?: number;

  @ApiPropertyOptional({
    example: '/5XBzD5WuTyVQZeS4VI25z2moMeY.jpg',
    description: 'Profile path',
  })
  profile_path?: string;

  @ApiPropertyOptional({ example: 4, description: 'Cast ID' })
  cast_id?: number;

  @ApiPropertyOptional({
    example: 'The Narrator',
    description: 'Character name',
  })
  character?: string;

  @ApiPropertyOptional({
    example: '52fe4250c3a36847f800068f',
    description: 'Credit ID',
  })
  credit_id?: string;

  @ApiPropertyOptional({ example: 0, description: 'Billing order' })
  order?: number;
}

export class MovieCreditsDto {
  @ApiPropertyOptional({ example: 550, description: 'Movie ID' })
  id?: number;

  @ApiPropertyOptional({
    type: [CastMemberDto],
    description: 'Cast members',
  })
  cast?: CastMemberDto[];

  @ApiPropertyOptional({
    type: [CrewMemberDto],
    description: 'Crew members',
  })
  crew?: CrewMemberDto[];
}

export class AggregateRoleDto {
  @ApiPropertyOptional({
    example: '52542282760ee313280017f9',
    description: 'Credit ID',
  })
  credit_id?: string;

  @ApiPropertyOptional({
    example: 'Eddard Stark',
    description: 'Character name',
  })
  character?: string;

  @ApiPropertyOptional({ example: 10, description: 'Episode count' })
  episode_count?: number;
}

export class AggregateCastMemberDto {
  @ApiPropertyOptional({ example: false, description: 'Adult content' })
  adult?: boolean;

  @ApiPropertyOptional({ example: 2, description: 'Gender' })
  gender?: number;

  @ApiPropertyOptional({ example: 239019, description: 'Actor ID' })
  id?: number;

  @ApiPropertyOptional({
    example: 'Acting',
    description: 'Known for department',
  })
  known_for_department?: string;

  @ApiPropertyOptional({ example: 'Sean Bean', description: 'Actor name' })
  name?: string;

  @ApiPropertyOptional({ example: 'Sean Bean', description: 'Original name' })
  original_name?: string;

  @ApiPropertyOptional({ example: 20.991, description: 'Popularity' })
  popularity?: number;

  @ApiPropertyOptional({
    example: '/kTjiABk3TJ3yI0Cto5RsvyT6V3o.jpg',
    description: 'Profile path',
  })
  profile_path?: string;

  @ApiPropertyOptional({
    type: [AggregateRoleDto],
    description: 'Roles played',
  })
  roles?: AggregateRoleDto[];

  @ApiPropertyOptional({ example: 9, description: 'Total episode count' })
  total_episode_count?: number;

  @ApiPropertyOptional({ example: 0, description: 'Billing order' })
  order?: number;
}

export class AggregateJobDto {
  @ApiPropertyOptional({
    example: '5256c8a019c2956ff6046e1b',
    description: 'Credit ID',
  })
  credit_id?: string;

  @ApiPropertyOptional({ example: 'Director', description: 'Job title' })
  job?: string;

  @ApiPropertyOptional({ example: 22, description: 'Episode count' })
  episode_count?: number;
}

export class AggregateCrewMemberDto {
  @ApiPropertyOptional({ example: false, description: 'Adult content' })
  adult?: boolean;

  @ApiPropertyOptional({ example: 2, description: 'Gender' })
  gender?: number;

  @ApiPropertyOptional({ example: 44797, description: 'Person ID' })
  id?: number;

  @ApiPropertyOptional({
    example: 'Directing',
    description: 'Known for department',
  })
  known_for_department?: string;

  @ApiPropertyOptional({ example: 'Timothy Van Patten', description: 'Name' })
  name?: string;

  @ApiPropertyOptional({
    example: 'Timothy Van Patten',
    description: 'Original name',
  })
  original_name?: string;

  @ApiPropertyOptional({ example: 7.775, description: 'Popularity' })
  popularity?: number;

  @ApiPropertyOptional({
    example: '/MzSOFrd99HRdr6pkSRSctk3kBR.jpg',
    description: 'Profile path',
  })
  profile_path?: string;

  @ApiPropertyOptional({
    type: [AggregateJobDto],
    description: 'Jobs performed',
  })
  jobs?: AggregateJobDto[];

  @ApiPropertyOptional({ example: 'Directing', description: 'Department' })
  department?: string;

  @ApiPropertyOptional({ example: 22, description: 'Total episode count' })
  total_episode_count?: number;
}

export class TvSeriesAggregateCreditsDto {
  @ApiPropertyOptional({ example: 1399, description: 'Series ID' })
  id?: number;

  @ApiPropertyOptional({
    type: [AggregateCastMemberDto],
    description: 'Cast members',
  })
  cast?: AggregateCastMemberDto[];

  @ApiPropertyOptional({
    type: [AggregateCrewMemberDto],
    description: 'Crew members',
  })
  crew?: AggregateCrewMemberDto[];
}

// =====================================================================
// VIDEOS TYPES
// =====================================================================

export class VideoDto {
  @ApiPropertyOptional({
    example: 'en',
    description: 'Language code (ISO 639-1)',
  })
  iso_639_1?: string;

  @ApiPropertyOptional({
    example: 'US',
    description: 'Country code (ISO 3166-1)',
  })
  iso_3166_1?: string;

  @ApiPropertyOptional({
    example: 'Official Trailer',
    description: 'Video title',
  })
  name?: string;

  @ApiPropertyOptional({
    example: 'SUXWAEX2jlg',
    description: 'Video key/ID (e.g., YouTube video ID)',
  })
  key?: string;

  @ApiPropertyOptional({
    example: 'YouTube',
    description: 'Video platform',
  })
  site?: string;

  @ApiPropertyOptional({
    example: 1080,
    description: 'Video resolution (e.g., 720, 1080)',
  })
  size?: number;

  @ApiPropertyOptional({
    example: 'Trailer',
    description: 'Video type',
    enum: [
      'Trailer',
      'Teaser',
      'Clip',
      'Featurette',
      'Behind the Scenes',
      'Bloopers',
    ],
  })
  type?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether it is official content',
  })
  official?: boolean;

  @ApiPropertyOptional({
    example: '2019-04-08T13:00:00.000Z',
    description: 'Publication date (ISO format)',
  })
  published_at?: string;

  @ApiPropertyOptional({
    example: '533ec654c3a36854480003eb',
    description: 'Video ID',
  })
  id?: string;
}

export class MovieVideosDto {
  @ApiPropertyOptional({ example: 550, description: 'Movie ID' })
  id?: number;

  @ApiPropertyOptional({
    type: [VideoDto],
    description: 'Array of videos',
  })
  results?: VideoDto[];
}

export class TvSeriesVideosDto {
  @ApiPropertyOptional({ example: 1399, description: 'Series ID' })
  id?: number;

  @ApiPropertyOptional({
    type: [VideoDto],
    description: 'Array of videos',
  })
  results?: VideoDto[];
}

// =====================================================================
// IMAGES TYPES
// =====================================================================

export class ImageDto {
  @ApiPropertyOptional({ example: 1.778, description: 'Image aspect ratio' })
  aspect_ratio?: number;

  @ApiPropertyOptional({ example: 1080, description: 'Height in pixels' })
  height?: number;

  @ApiPropertyOptional({
    example: 'en',
    description: 'Language code (ISO 639-1), can be null',
  })
  iso_639_1?: any;

  @ApiPropertyOptional({
    example: '/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg',
    description: 'Image file path',
  })
  file_path?: string;

  @ApiPropertyOptional({ example: 5.384, description: 'Vote average' })
  vote_average?: number;

  @ApiPropertyOptional({ example: 4, description: 'Vote count' })
  vote_count?: number;

  @ApiPropertyOptional({ example: 1920, description: 'Width in pixels' })
  width?: number;
}

export class MovieImagesDto {
  @ApiPropertyOptional({
    type: [ImageDto],
    description: 'Backdrop images',
  })
  backdrops?: ImageDto[];

  @ApiPropertyOptional({ example: 550, description: 'Movie ID' })
  id?: number;

  @ApiPropertyOptional({
    type: [ImageDto],
    description: 'Logo images',
  })
  logos?: ImageDto[];

  @ApiPropertyOptional({
    type: [ImageDto],
    description: 'Poster images',
  })
  posters?: ImageDto[];
}

export class TvSeriesImagesDto {
  @ApiPropertyOptional({
    type: [ImageDto],
    description: 'Backdrop images',
  })
  backdrops?: ImageDto[];

  @ApiPropertyOptional({ example: 1399, description: 'Series ID' })
  id?: number;

  @ApiPropertyOptional({
    type: [ImageDto],
    description: 'Logo images',
  })
  logos?: ImageDto[];

  @ApiPropertyOptional({
    type: [ImageDto],
    description: 'Poster images',
  })
  posters?: ImageDto[];
}

// =====================================================================
// EXTERNAL IDS TYPES
// =====================================================================

export class MovieExternalIdsDto {
  @ApiPropertyOptional({ example: 550, description: 'Movie ID' })
  id?: number;

  @ApiPropertyOptional({ example: 'tt0137523', description: 'IMDb ID' })
  imdb_id?: string;

  @ApiPropertyOptional({ description: 'Wikidata ID' })
  wikidata_id?: any;

  @ApiPropertyOptional({
    example: 'FightClub',
    description: 'Facebook page name',
  })
  facebook_id?: string;

  @ApiPropertyOptional({ description: 'Instagram handle' })
  instagram_id?: any;

  @ApiPropertyOptional({ description: 'Twitter handle' })
  twitter_id?: any;
}

export class TvSeriesExternalIdsDto {
  @ApiPropertyOptional({ example: 1399, description: 'Series ID' })
  id?: number;

  @ApiPropertyOptional({ example: 'tt0944947', description: 'IMDb ID' })
  imdb_id?: string;

  @ApiPropertyOptional({
    example: '/m/0524b41',
    description: 'Freebase MID',
  })
  freebase_mid?: string;

  @ApiPropertyOptional({
    example: '/en/game_of_thrones',
    description: 'Freebase ID',
  })
  freebase_id?: string;

  @ApiPropertyOptional({ example: 121361, description: 'TVDB ID' })
  tvdb_id?: number;

  @ApiPropertyOptional({ example: 24493, description: 'TVRage ID' })
  tvrage_id?: number;

  @ApiPropertyOptional({ example: 'Q23572', description: 'Wikidata ID' })
  wikidata_id?: string;

  @ApiPropertyOptional({
    example: 'GameOfThrones',
    description: 'Facebook page name',
  })
  facebook_id?: string;

  @ApiPropertyOptional({
    example: 'gameofthrones',
    description: 'Instagram handle',
  })
  instagram_id?: string;

  @ApiPropertyOptional({
    example: 'GameOfThrones',
    description: 'Twitter handle',
  })
  twitter_id?: string;
}

// =====================================================================
// CONFIGURATION TYPES
// =====================================================================

export class ConfigurationImagesDto {
  @ApiPropertyOptional({
    example: 'http://image.tmdb.org/t/p/',
    description: 'Base URL for images',
  })
  base_url?: string;

  @ApiPropertyOptional({
    example: 'https://image.tmdb.org/t/p/',
    description: 'HTTPS base URL for images',
  })
  secure_base_url?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['w300', 'w780', 'w1280', 'original'],
    description: 'Available backdrop sizes',
  })
  backdrop_sizes?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['w45', 'w92', 'w154', 'w185', 'w300', 'w500', 'original'],
    description: 'Available logo sizes',
  })
  logo_sizes?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original'],
    description: 'Available poster sizes',
  })
  poster_sizes?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['w45', 'w185', 'h632', 'original'],
    description: 'Available profile image sizes',
  })
  profile_sizes?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['w92', 'w185', 'w300', 'original'],
    description: 'Available still image sizes',
  })
  still_sizes?: string[];
}

export class ConfigurationDetailsDto {
  @ApiPropertyOptional({
    type: ConfigurationImagesDto,
    description: 'Image configuration',
  })
  images?: ConfigurationImagesDto;

  @ApiPropertyOptional({
    type: [String],
    example: [
      'adult',
      'air_date',
      'also_known_as',
      'alternative_titles',
      'biography',
      'birthday',
    ],
    description: 'Available change keys',
  })
  change_keys?: string[];
}

// =====================================================================
// MULTI SEARCH TYPES
// =====================================================================

export class MultiSearchResultItemDto {
  @ApiPropertyOptional({ example: false, description: 'Adult content' })
  adult?: boolean;

  @ApiPropertyOptional({
    example: '/aDYSnJAK0BTVeE8osOy22Kz3SXY.jpg',
    description: 'Backdrop path',
  })
  backdrop_path?: string;

  @ApiPropertyOptional({ example: 11, description: 'Item ID' })
  id?: number;

  @ApiPropertyOptional({
    example: 'Star Wars',
    description: 'Title (for movies)',
  })
  title?: string;

  @ApiPropertyOptional({
    example: 'en',
    description: 'Original language',
  })
  original_language?: string;

  @ApiPropertyOptional({
    example: 'Star Wars',
    description: 'Original title (for movies)',
  })
  original_title?: string;

  @ApiPropertyOptional({
    example: 'Princess Leia is captured and held hostage...',
    description: 'Overview',
  })
  overview?: string;

  @ApiPropertyOptional({
    example: '/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg',
    description: 'Poster path',
  })
  poster_path?: string;

  @ApiPropertyOptional({
    example: 'movie',
    description: 'Media type',
    enum: ['movie', 'tv', 'person'],
  })
  media_type?: string;

  @ApiPropertyOptional({
    type: [Number],
    example: [12, 28, 878],
    description: 'Genre IDs',
  })
  genre_ids?: number[];

  @ApiPropertyOptional({ example: 78.047, description: 'Popularity' })
  popularity?: number;

  @ApiPropertyOptional({
    example: '1977-05-25',
    description: 'Release date (for movies)',
  })
  release_date?: string;

  @ApiPropertyOptional({ example: false, description: 'Has video' })
  video?: boolean;

  @ApiPropertyOptional({ example: 8.208, description: 'Vote average' })
  vote_average?: number;

  @ApiPropertyOptional({ example: 18528, description: 'Vote count' })
  vote_count?: number;

  // TV-specific fields
  @ApiPropertyOptional({
    example: 'Breaking Bad',
    description: 'Name (for TV)',
  })
  name?: string;

  @ApiPropertyOptional({
    example: 'Breaking Bad',
    description: 'Original name (for TV)',
  })
  original_name?: string;

  @ApiPropertyOptional({
    example: '2008-01-20',
    description: 'First air date (for TV)',
  })
  first_air_date?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['US'],
    description: 'Origin countries (for TV)',
  })
  origin_country?: string[];

  // Person-specific fields
  @ApiPropertyOptional({
    example: 'Acting',
    description: 'Known for department (for persons)',
  })
  known_for_department?: string;

  @ApiPropertyOptional({
    example: '/xndWFsBlClOJFRdhSt4NBwiPq2o.jpg',
    description: 'Profile path (for persons)',
  })
  profile_path?: string;

  @ApiPropertyOptional({ example: 2, description: 'Gender (for persons)' })
  gender?: number;
}

export class MultiSearchResponseDto {
  @ApiPropertyOptional({ example: 1, description: 'Current page' })
  page?: number;

  @ApiPropertyOptional({
    type: [MultiSearchResultItemDto],
    description: 'Search results',
  })
  results?: MultiSearchResultItemDto[];

  @ApiPropertyOptional({ example: 11, description: 'Total pages' })
  total_pages?: number;

  @ApiPropertyOptional({ example: 201, description: 'Total results' })
  total_results?: number;
}
