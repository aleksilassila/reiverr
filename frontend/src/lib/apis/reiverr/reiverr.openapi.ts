/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface SonarrSettings {
  apiKey: string;
  baseUrl: string;
  qualityProfileId: number;
  rootFolderPath: string;
  languageProfileId: number;
}

export interface RadarrSettings {
  apiKey: string;
  baseUrl: string;
  qualityProfileId: number;
  rootFolderPath: string;
}

export interface JellyfinSettings {
  apiKey: string;
  baseUrl: string;
  userId: string;
}

export interface TmdbSettings {
  sessionId: string;
  userId: string;
}

export interface Settings {
  autoplayTrailers: boolean;
  language: string;
  animationDuration: number;
  sonarr: SonarrSettings;
  radarr: RadarrSettings;
  jellyfin: JellyfinSettings;
  tmdb: TmdbSettings;
}

export interface PlayState {
  id: string;
  tmdbId: number;
  mediaType: "movie" | "series" | "episode";
  userId: string;
  season?: number;
  episode?: number;
  /**
   * Whether the user has watched this media
   * @default false
   */
  watched: boolean;
  /**
   * A number between 0 and 1
   * @default false
   * @example 0.5
   */
  progress: number;
  /** Last time the user played this media */
  lastPlayedAt: string;
}

export interface GenreDto {
  /**
   * Genre ID
   * @example 18
   */
  id?: number;
  /**
   * Genre name
   * @example "Drama"
   */
  name?: string;
}

export interface ProductionCompanyDto {
  /**
   * Company ID
   * @example 508
   */
  id?: number;
  /**
   * Company logo path
   * @example "/7cxRWzi4LsVm4Utfpr1hfARNurT.png"
   */
  logo_path?: string;
  /**
   * Company name
   * @example "Regency Enterprises"
   */
  name?: string;
  /**
   * Origin country code
   * @example "US"
   */
  origin_country?: string;
}

export interface ProductionCountryDto {
  /**
   * Country code (ISO 3166-1)
   * @example "US"
   */
  iso_3166_1?: string;
  /**
   * Country name
   * @example "United States of America"
   */
  name?: string;
}

export interface SpokenLanguageDto {
  /**
   * Language name in English
   * @example "English"
   */
  english_name?: string;
  /**
   * Language code (ISO 639-1)
   * @example "en"
   */
  iso_639_1?: string;
  /**
   * Language native name
   * @example "English"
   */
  name?: string;
}

export interface VideoDto {
  /**
   * Language code (ISO 639-1)
   * @example "en"
   */
  iso_639_1?: string;
  /**
   * Country code (ISO 3166-1)
   * @example "US"
   */
  iso_3166_1?: string;
  /**
   * Video title
   * @example "Official Trailer"
   */
  name?: string;
  /**
   * Video key/ID (e.g., YouTube video ID)
   * @example "SUXWAEX2jlg"
   */
  key?: string;
  /**
   * Video platform
   * @example "YouTube"
   */
  site?: string;
  /**
   * Video resolution (e.g., 720, 1080)
   * @example 1080
   */
  size?: number;
  /**
   * Video type
   * @example "Trailer"
   */
  type?:
    | "Trailer"
    | "Teaser"
    | "Clip"
    | "Featurette"
    | "Behind the Scenes"
    | "Bloopers";
  /**
   * Whether it is official content
   * @example true
   */
  official?: boolean;
  /**
   * Publication date (ISO format)
   * @example "2019-04-08T13:00:00.000Z"
   */
  published_at?: string;
  /**
   * Video ID
   * @example "533ec654c3a36854480003eb"
   */
  id?: string;
}

export interface MovieVideosDto {
  /**
   * Movie ID
   * @example 550
   */
  id?: number;
  /** Array of videos */
  results?: VideoDto[];
}

export interface CastMemberDto {
  /**
   * Adult content
   * @example false
   */
  adult?: boolean;
  /**
   * Gender
   * @example 2
   */
  gender?: number;
  /**
   * Actor ID
   * @example 819
   */
  id?: number;
  /**
   * Known for department
   * @example "Acting"
   */
  known_for_department?: string;
  /**
   * Actor name
   * @example "Edward Norton"
   */
  name?: string;
  /**
   * Original name
   * @example "Edward Norton"
   */
  original_name?: string;
  /**
   * Popularity
   * @example 26.99
   */
  popularity?: number;
  /**
   * Profile path
   * @example "/5XBzD5WuTyVQZeS4VI25z2moMeY.jpg"
   */
  profile_path?: string;
  /**
   * Cast ID
   * @example 4
   */
  cast_id?: number;
  /**
   * Character name
   * @example "The Narrator"
   */
  character?: string;
  /**
   * Credit ID
   * @example "52fe4250c3a36847f800068f"
   */
  credit_id?: string;
  /**
   * Billing order
   * @example 0
   */
  order?: number;
}

export interface CrewMemberDto {
  /**
   * Department
   * @example "Directing"
   */
  department?: string;
  /**
   * Job title
   * @example "Director"
   */
  job?: string;
  /**
   * Credit ID
   * @example "5256c8a219c2956ff6046e77"
   */
  credit_id?: string;
  /**
   * Adult content
   * @example false
   */
  adult?: boolean;
  /**
   * Gender
   * @example 2
   */
  gender?: number;
  /**
   * Person ID
   * @example 44797
   */
  id?: number;
  /**
   * Known for department
   * @example "Directing"
   */
  known_for_department?: string;
  /**
   * Name
   * @example "Timothy Van Patten"
   */
  name?: string;
  /**
   * Original name
   * @example "Timothy Van Patten"
   */
  original_name?: string;
  /**
   * Popularity
   * @example 7.775
   */
  popularity?: number;
  /**
   * Profile path
   * @example "/MzSOFrd99HRdr6pkSRSctk3kBR.jpg"
   */
  profile_path?: string;
}

export interface MovieCreditsDto {
  /**
   * Movie ID
   * @example 550
   */
  id?: number;
  /** Cast members */
  cast?: CastMemberDto[];
  /** Crew members */
  crew?: CrewMemberDto[];
}

export interface MovieExternalIdsDto {
  /**
   * Movie ID
   * @example 550
   */
  id?: number;
  /**
   * IMDb ID
   * @example "tt0137523"
   */
  imdb_id?: string;
  /** Wikidata ID */
  wikidata_id?: object;
  /**
   * Facebook page name
   * @example "FightClub"
   */
  facebook_id?: string;
  /** Instagram handle */
  instagram_id?: object;
  /** Twitter handle */
  twitter_id?: object;
}

export interface ImageDto {
  /**
   * Image aspect ratio
   * @example 1.778
   */
  aspect_ratio?: number;
  /**
   * Height in pixels
   * @example 1080
   */
  height?: number;
  /**
   * Language code (ISO 639-1), can be null
   * @example "en"
   */
  iso_639_1?: object;
  /**
   * Image file path
   * @example "/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg"
   */
  file_path?: string;
  /**
   * Vote average
   * @example 5.384
   */
  vote_average?: number;
  /**
   * Vote count
   * @example 4
   */
  vote_count?: number;
  /**
   * Width in pixels
   * @example 1920
   */
  width?: number;
}

export interface MovieImagesDto {
  /** Backdrop images */
  backdrops?: ImageDto[];
  /**
   * Movie ID
   * @example 550
   */
  id?: number;
  /** Logo images */
  logos?: ImageDto[];
  /** Poster images */
  posters?: ImageDto[];
}

export interface TmdbMovieFull {
  /**
   * Whether the movie is adult content
   * @example false
   */
  adult?: boolean;
  /**
   * Path to backdrop image
   * @example "/hZkgoQYus5vegHoetLkCJzb17zJ.jpg"
   */
  backdrop_path?: string;
  /** Collection information if part of a collection */
  belongs_to_collection?: object;
  /**
   * Movie production budget
   * @example 63000000
   */
  budget?: number;
  /** Array of genres */
  genres?: GenreDto[];
  /**
   * Official movie website
   * @example "http://www.foxmovies.com/movies/fight-club"
   */
  homepage?: string;
  /**
   * Movie ID
   * @example 550
   */
  id?: number;
  /**
   * IMDb identifier
   * @example "tt0137523"
   */
  imdb_id?: string;
  /**
   * Original language code (ISO 639-1)
   * @example "en"
   */
  original_language?: string;
  /**
   * Original movie title
   * @example "Fight Club"
   */
  original_title?: string;
  /**
   * Movie plot summary
   * @example "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy."
   */
  overview?: string;
  /**
   * Popularity score
   * @example 61.416
   */
  popularity?: number;
  /**
   * Path to poster image
   * @example "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg"
   */
  poster_path?: string;
  /** Array of production companies */
  production_companies?: ProductionCompanyDto[];
  /** Array of production countries */
  production_countries?: ProductionCountryDto[];
  /**
   * Release date (YYYY-MM-DD)
   * @example "1999-10-15"
   */
  release_date?: string;
  /**
   * Box office revenue
   * @example 100853753
   */
  revenue?: number;
  /**
   * Duration in minutes
   * @example 139
   */
  runtime?: number;
  /** Array of spoken languages */
  spoken_languages?: SpokenLanguageDto[];
  /**
   * Release status
   * @example "Released"
   */
  status?: string;
  /**
   * Movie tagline
   * @example "Mischief. Mayhem. Soap."
   */
  tagline?: string;
  /**
   * Movie title
   * @example "Fight Club"
   */
  title?: string;
  /**
   * Whether video is available
   * @example false
   */
  video?: boolean;
  /**
   * Average rating
   * @example 8.433
   */
  vote_average?: number;
  /**
   * Number of votes
   * @example 26280
   */
  vote_count?: number;
  videos?: MovieVideosDto;
  credits?: MovieCreditsDto;
  external_ids?: MovieExternalIdsDto;
  images?: MovieImagesDto;
}

export interface MovieMetadata {
  id?: string;
  tmdbId: string;
  tmdbMovie?: TmdbMovieFull;
  name?: string;
  releaseDate?: string;
  libraryItems?: any[][];
  updatedAt: string;
}

export interface CreatorDto {
  /**
   * Creator ID
   * @example 9813
   */
  id?: number;
  /**
   * Credit ID
   * @example "5256c8c219c2956ff604858a"
   */
  credit_id?: string;
  /**
   * Creator name
   * @example "David Benioff"
   */
  name?: string;
  /**
   * Gender (0=not specified, 1=female, 2=male)
   * @example 2
   */
  gender?: number;
  /**
   * Profile image path
   * @example "/xvNN5huL0X8yJ7h3IZfGG4O2zBD.jpg"
   */
  profile_path?: string;
}

export interface EpisodeToAirDto {
  /**
   * Episode ID
   * @example 1551830
   */
  id?: number;
  /**
   * Episode name
   * @example "The Iron Throne"
   */
  name?: string;
  /**
   * Episode overview
   * @example "In the aftermath of the devastating attack..."
   */
  overview?: string;
  /**
   * Vote average
   * @example 4.809
   */
  vote_average?: number;
  /**
   * Vote count
   * @example 241
   */
  vote_count?: number;
  /**
   * Air date (YYYY-MM-DD)
   * @example "2019-05-19"
   */
  air_date?: string;
  /**
   * Episode number
   * @example 6
   */
  episode_number?: number;
  /**
   * Production code
   * @example "806"
   */
  production_code?: string;
  /**
   * Runtime in minutes
   * @example 80
   */
  runtime?: number;
  /**
   * Season number
   * @example 8
   */
  season_number?: number;
  /**
   * Show ID
   * @example 1399
   */
  show_id?: number;
  /**
   * Still image path
   * @example "/zBi2O5EJfgTS6Ae0HdAYLm9o2nf.jpg"
   */
  still_path?: string;
}

export interface NextEpisodeToAir {
  air_date?: string;
}

export interface NetworkDto {
  /**
   * Network ID
   * @example 49
   */
  id?: number;
  /**
   * Network logo path
   * @example "/tuomPhY2UtuPTqqFnKMVHvSb724.png"
   */
  logo_path?: string;
  /**
   * Network name
   * @example "HBO"
   */
  name?: string;
  /**
   * Origin country code
   * @example "US"
   */
  origin_country?: string;
}

export interface GuestStarDto {
  /**
   * Character name
   * @example "Benjen Stark"
   */
  character?: string;
  /**
   * Credit ID
   * @example "5256c8b919c2956ff604836a"
   */
  credit_id?: string;
  /**
   * Billing order
   * @example 62
   */
  order?: number;
  /**
   * Adult content
   * @example false
   */
  adult?: boolean;
  /**
   * Gender
   * @example 2
   */
  gender?: number;
  /**
   * Person ID
   * @example 119783
   */
  id?: number;
  /**
   * Known for department
   * @example "Acting"
   */
  known_for_department?: string;
  /**
   * Name
   * @example "Joseph Mawle"
   */
  name?: string;
  /**
   * Original name
   * @example "Joseph Mawle"
   */
  original_name?: string;
  /**
   * Popularity
   * @example 6.758
   */
  popularity?: number;
  /**
   * Profile path
   * @example "/1Ocb9v3h54beGVoJMm4w50UQhLf.jpg"
   */
  profile_path?: string;
}

export interface SeasonEpisodeDto {
  /**
   * Episode air date
   * @example "2011-04-17"
   */
  air_date?: string;
  /**
   * Episode number
   * @example 1
   */
  episode_number?: number;
  /**
   * Episode ID
   * @example 63056
   */
  id?: number;
  /**
   * Episode name
   * @example "Winter Is Coming"
   */
  name?: string;
  /**
   * Overview
   * @example "Jon Arryn, the Hand of the King, is dead..."
   */
  overview?: string;
  /**
   * Production code
   * @example "101"
   */
  production_code?: string;
  /**
   * Runtime in minutes
   * @example 62
   */
  runtime?: number;
  /**
   * Season number
   * @example 1
   */
  season_number?: number;
  /**
   * Show ID
   * @example 1399
   */
  show_id?: number;
  /**
   * Still path
   * @example "/9hGF3WUkBf7cSjMg0cdMDHJkByd.jpg"
   */
  still_path?: string;
  /**
   * Vote average
   * @example 7.838
   */
  vote_average?: number;
  /**
   * Vote count
   * @example 291
   */
  vote_count?: number;
  /** Crew members */
  crew?: CrewMemberDto[];
  /** Guest stars */
  guest_stars?: GuestStarDto[];
}

export interface AggregateRoleDto {
  /**
   * Credit ID
   * @example "52542282760ee313280017f9"
   */
  credit_id?: string;
  /**
   * Character name
   * @example "Eddard Stark"
   */
  character?: string;
  /**
   * Episode count
   * @example 10
   */
  episode_count?: number;
}

export interface AggregateCastMemberDto {
  /**
   * Adult content
   * @example false
   */
  adult?: boolean;
  /**
   * Gender
   * @example 2
   */
  gender?: number;
  /**
   * Actor ID
   * @example 239019
   */
  id?: number;
  /**
   * Known for department
   * @example "Acting"
   */
  known_for_department?: string;
  /**
   * Actor name
   * @example "Sean Bean"
   */
  name?: string;
  /**
   * Original name
   * @example "Sean Bean"
   */
  original_name?: string;
  /**
   * Popularity
   * @example 20.991
   */
  popularity?: number;
  /**
   * Profile path
   * @example "/kTjiABk3TJ3yI0Cto5RsvyT6V3o.jpg"
   */
  profile_path?: string;
  /** Roles played */
  roles?: AggregateRoleDto[];
  /**
   * Total episode count
   * @example 9
   */
  total_episode_count?: number;
  /**
   * Billing order
   * @example 0
   */
  order?: number;
}

export interface AggregateJobDto {
  /**
   * Credit ID
   * @example "5256c8a019c2956ff6046e1b"
   */
  credit_id?: string;
  /**
   * Job title
   * @example "Director"
   */
  job?: string;
  /**
   * Episode count
   * @example 22
   */
  episode_count?: number;
}

export interface AggregateCrewMemberDto {
  /**
   * Adult content
   * @example false
   */
  adult?: boolean;
  /**
   * Gender
   * @example 2
   */
  gender?: number;
  /**
   * Person ID
   * @example 44797
   */
  id?: number;
  /**
   * Known for department
   * @example "Directing"
   */
  known_for_department?: string;
  /**
   * Name
   * @example "Timothy Van Patten"
   */
  name?: string;
  /**
   * Original name
   * @example "Timothy Van Patten"
   */
  original_name?: string;
  /**
   * Popularity
   * @example 7.775
   */
  popularity?: number;
  /**
   * Profile path
   * @example "/MzSOFrd99HRdr6pkSRSctk3kBR.jpg"
   */
  profile_path?: string;
  /** Jobs performed */
  jobs?: AggregateJobDto[];
  /**
   * Department
   * @example "Directing"
   */
  department?: string;
  /**
   * Total episode count
   * @example 22
   */
  total_episode_count?: number;
}

export interface TvSeriesAggregateCreditsDto {
  /**
   * Series ID
   * @example 1399
   */
  id?: number;
  /** Cast members */
  cast?: AggregateCastMemberDto[];
  /** Crew members */
  crew?: AggregateCrewMemberDto[];
}

export interface TmdbSeasonFull {
  /**
   * Internal ID
   * @example "5256c89f19c2956ff6046d47"
   */
  _id?: string;
  /**
   * Season air date
   * @example "2011-04-17"
   */
  air_date?: string;
  /** Episodes in season */
  episodes?: SeasonEpisodeDto[];
  /**
   * Season name
   * @example "Season 1"
   */
  name?: string;
  /**
   * Season overview
   * @example "Trouble is brewing in the Seven Kingdoms of Westeros..."
   */
  overview?: string;
  /**
   * Season ID
   * @example 3624
   */
  id?: number;
  /**
   * Poster path
   * @example "/wgfKiqzuMrFIkU1M68DDDY8kGC1.jpg"
   */
  poster_path?: string;
  /**
   * Season number
   * @example 1
   */
  season_number?: number;
  /**
   * Vote average
   * @example 8.3
   */
  vote_average?: number;
  aggregate_credits?: TvSeriesAggregateCreditsDto;
}

export interface TvSeriesVideosDto {
  /**
   * Series ID
   * @example 1399
   */
  id?: number;
  /** Array of videos */
  results?: VideoDto[];
}

export interface TvSeriesExternalIdsDto {
  /**
   * Series ID
   * @example 1399
   */
  id?: number;
  /**
   * IMDb ID
   * @example "tt0944947"
   */
  imdb_id?: string;
  /**
   * Freebase MID
   * @example "/m/0524b41"
   */
  freebase_mid?: string;
  /**
   * Freebase ID
   * @example "/en/game_of_thrones"
   */
  freebase_id?: string;
  /**
   * TVDB ID
   * @example 121361
   */
  tvdb_id?: number;
  /**
   * TVRage ID
   * @example 24493
   */
  tvrage_id?: number;
  /**
   * Wikidata ID
   * @example "Q23572"
   */
  wikidata_id?: string;
  /**
   * Facebook page name
   * @example "GameOfThrones"
   */
  facebook_id?: string;
  /**
   * Instagram handle
   * @example "gameofthrones"
   */
  instagram_id?: string;
  /**
   * Twitter handle
   * @example "GameOfThrones"
   */
  twitter_id?: string;
}

export interface TvSeriesImagesDto {
  /** Backdrop images */
  backdrops?: ImageDto[];
  /**
   * Series ID
   * @example 1399
   */
  id?: number;
  /** Logo images */
  logos?: ImageDto[];
  /** Poster images */
  posters?: ImageDto[];
}

export interface TmdbSeriesFull {
  /**
   * Whether adult content
   * @example false
   */
  adult?: boolean;
  /**
   * Backdrop path
   * @example "/6LWy0jvMpmjoS9fojNgHIKoWL05.jpg"
   */
  backdrop_path?: string;
  /** Array of series creators */
  created_by?: CreatorDto[];
  /**
   * Array of typical episode durations
   * @example [60,45]
   */
  episode_run_time?: number[];
  /**
   * First air date
   * @example "2011-04-17"
   */
  first_air_date?: string;
  /** Array of genres */
  genres?: GenreDto[];
  /**
   * Official homepage
   * @example "http://www.hbo.com/game-of-thrones"
   */
  homepage?: string;
  /**
   * Series ID
   * @example 1399
   */
  id?: number;
  /**
   * Whether still in production
   * @example false
   */
  in_production?: boolean;
  /**
   * Array of language codes
   * @example ["en","es"]
   */
  languages?: string[];
  /**
   * Most recent air date
   * @example "2019-05-19"
   */
  last_air_date?: string;
  /** Last episode to air */
  last_episode_to_air?: EpisodeToAirDto;
  /**
   * Series name
   * @example "Game of Thrones"
   */
  name?: string;
  /** Next episode to air (if any) */
  next_episode_to_air?: NextEpisodeToAir;
  /** Array of networks */
  networks?: NetworkDto[];
  /**
   * Total number of episodes
   * @example 73
   */
  number_of_episodes?: number;
  /**
   * Total number of seasons
   * @example 8
   */
  number_of_seasons?: number;
  /**
   * Array of origin countries
   * @example ["US","GB"]
   */
  origin_country?: string[];
  /**
   * Original language code
   * @example "en"
   */
  original_language?: string;
  /**
   * Original series name
   * @example "Game of Thrones"
   */
  original_name?: string;
  /**
   * Series description
   * @example "Seven noble families fight for control of the mythical land of Westeros..."
   */
  overview?: string;
  /**
   * Popularity score
   * @example 346.098
   */
  popularity?: number;
  /**
   * Poster path
   * @example "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg"
   */
  poster_path?: string;
  /** Array of production companies */
  production_companies?: ProductionCompanyDto[];
  /** Array of production countries */
  production_countries?: ProductionCountryDto[];
  /** Array of seasons */
  seasons?: TmdbSeasonFull[];
  /** Array of spoken languages */
  spoken_languages?: SpokenLanguageDto[];
  /**
   * Series status
   * @example "Ended"
   */
  status?: string;
  /**
   * Series tagline
   * @example "Winter Is Coming"
   */
  tagline?: string;
  /**
   * Series type
   * @example "Scripted"
   */
  type?: string;
  /**
   * Average rating
   * @example 8.438
   */
  vote_average?: number;
  /**
   * Vote count
   * @example 21390
   */
  vote_count?: number;
  videos?: TvSeriesVideosDto;
  aggregate_credits?: TvSeriesAggregateCreditsDto;
  external_ids?: TvSeriesExternalIdsDto;
  images?: TvSeriesImagesDto;
}

export interface SeriesMetadata {
  id?: string;
  tmdbId: string;
  tmdbSeries?: TmdbSeriesFull;
  name?: string;
  firstReleaseDate?: string;
  lastReleaseDate?: string;
  nextReleaseDate?: string;
  lastSeasonNumber?: number;
  lastEpisodeNumber?: number;
  libraryItems?: any[][];
  updatedAt: string;
}

export interface PlayStateDto {
  id: string;
  tmdbId: number;
  mediaType: "movie" | "series" | "episode";
  userId: string;
  season?: number;
  episode?: number;
  /**
   * Whether the user has watched this media
   * @default false
   */
  watched: boolean;
  /**
   * A number between 0 and 1
   * @default false
   * @example 0.5
   */
  progress: number;
  /** Last time the user played this media */
  lastPlayedAt: string;
}

export interface LibraryItem {
  id?: string;
  tmdbId: string;
  mediaType: "movie" | "series";
  lastPlayedAt?: string;
  movieMetadata?: MovieMetadata;
  seriesMetadata?: SeriesMetadata;
  userId: string;
  user?: string;
  playStates?: PlayStateDto[];
  updatedAt: string;
  createdAt: string;
}

export interface CatalogueOrderDirectionOption {
  label: string;
  value: string;
}

export interface OrderOptionDto {
  label: string;
  value: string;
  directions: CatalogueOrderDirectionOption[];
}

export interface CatalogueCapability {
  isSupported: boolean;
  orderOptions: OrderOptionDto[];
}

export interface CatalogueCapabilitiesDto {
  combinedCatalogue: CatalogueCapability;
  missingCatalogue: CatalogueCapability;
  moviesCatalogue: CatalogueCapability;
  seriesCatalogue: CatalogueCapability;
}

export interface MediaSourceDto {
  id: string;
  pluginId: string;
  name: string;
  userId: string;
  /** @default false */
  enabled?: boolean;
  /** @default false */
  adminControlled?: boolean;
  priority: number;
  pluginSettings?: Record<string, any>;
  catalogueCapabilities: CatalogueCapabilitiesDto;
}

export interface UserDto {
  id: string;
  name: string;
  isAdmin: boolean;
  onboardingDone?: boolean;
  settings: Settings;
  playStates?: PlayState[];
  libraryItems?: LibraryItem[];
  profilePicture: string;
  mediaSources: MediaSourceDto[];
}

export interface CreateUserDto {
  name: string;
  password: string;
  isAdmin: boolean;
  profilePicture?: string;
}

export interface UpdateUserDto {
  name?: string;
  password?: string;
  isAdmin?: boolean;
  onboardingDone?: boolean;
  settings?: Settings;
  profilePicture?: string;
  oldPassword?: string;
}

export interface PaginatedResponseDto {
  total: number;
  page: number;
  itemsPerPage: number;
}

export interface VideoStreamPropertyDto {
  label: string;
  value: string | number;
  formatted?: string;
}

export interface StreamActionDto {
  label: string;
  type: string;
}

export interface StreamCandidateDto {
  streamId: string;
  title: string;
  properties: VideoStreamPropertyDto[];
  actions: StreamActionDto[];
}

export interface ProviderWithStreamsDto {
  provider: MediaSourceDto;
  streams: StreamCandidateDto[];
}

export interface ViewBaseDto {
  id: string;
  type: "general" | "list-with-details";
  label: string;
  priority?: number;
}

export interface ViewProviderDto {
  view: ViewBaseDto;
  sourceId: string;
}

export interface ViewGroupDto {
  label: string;
  viewProviders: ViewProviderDto[];
}

export interface ViewProvidersResponseDto {
  viewGroups: ViewGroupDto[];
}

export interface HeadingElementDto {
  type: "heading";
  label: string;
  description?: string;
}

export interface ToggleElementDto {
  type: "toggle";
  label: string;
  description?: string;
  value: boolean;
  style: "checkbox" | "switch";
}

export interface SelectOptionDto {
  label: string;
  value: string;
}

export interface SelectElementDto {
  type: "select";
  label: string;
  description?: string;
  value: string;
  options: SelectOptionDto[];
  style: "dropdown" | "radio";
}

export interface StreamActionIconDto {
  type: "play";
  size?: "lg" | "md" | "sm";
}

export interface StreamActionElementDto {
  type: "action";
  label: "Stream";
  action: "stream";
  icon: StreamActionIconDto;
  disabled?: boolean;
}

export interface IconDto {
  type: "play" | "download" | "delete" | "info" | "external-link";
  size?: "lg" | "md" | "sm";
}

export interface ActionElementDto {
  type: "action";
  label: string;
  action: string;
  disabled?: boolean;
  icon?: IconDto;
}

export interface InputElementDto {
  type: "input";
  label: string;
  description?: string;
  value?: string;
  placeholder?: string;
  style: "number" | "text" | "email" | "password";
  min?: number;
  max?: number;
  maxLength?: number;
  minLength?: number;
  disabled?: boolean;
}

export interface ExternalLinkElementDto {
  type: "external-link";
  label: string;
  url: string;
  icon?: IconDto;
}

export interface OpenViewElementDto {
  type: "open-view";
  label: string;
  viewId: string;
  icon?: IconDto;
}

export interface GeneralViewDto {
  type: "general";
  elements: (
    | HeadingElementDto
    | ToggleElementDto
    | SelectElementDto
    | StreamActionElementDto
    | ActionElementDto
    | InputElementDto
    | ExternalLinkElementDto
    | OpenViewElementDto
  )[];
}

export interface SortablePropertyDto {
  label: string;
  value: string | number;
  formatted: string;
  secondary?: boolean;
}

export interface ListWithDetailsItemDto {
  id: string;
  label: string;
  description: string;
  properties: SortablePropertyDto[];
  actions: (StreamActionElementDto | ActionElementDto | OpenViewElementDto)[];
}

export interface ListWithDetailsViewDto {
  id: string;
  type: "list-with-details";
  label: string;
  priority?: number;
  items: ListWithDetailsItemDto[];
  order?: OrderOptionDto;
  orderOptions: OrderOptionDto[];
}

export interface MediaSourceViewResponseDto {
  view: GeneralViewDto | ListWithDetailsViewDto;
}

export interface StreamCandidatesDto {
  candidates: StreamCandidateDto[];
}

export interface StreamBaseDto {
  streamId: string;
  title: string;
  properties: VideoStreamPropertyDto[];
}

export interface AutoplayResponseDto {
  candidate?: StreamBaseDto;
}

export interface DirectPlayProfileDto {
  /** Gets or sets the container. */
  Container?: string | null;
  /** Gets or sets the audio codec. */
  AudioCodec?: string | null;
  /** Gets or sets the video codec. */
  VideoCodec?: string | null;
  /** Gets or sets the Dlna profile type. */
  Type?: "Audio" | "Video" | "Photo" | "Subtitle" | "Lyric";
}

export interface ProfileConditionDto {
  /** Gets or sets the condition. */
  Condition?:
    | "Equals"
    | "NotEquals"
    | "LessThanEqual"
    | "GreaterThanEqual"
    | "EqualsAny"
    | null;
  /** Gets or sets the property. */
  Property?:
    | "AudioChannels"
    | "AudioBitrate"
    | "AudioProfile"
    | "Width"
    | "Height"
    | "Has64BitOffsets"
    | "PacketLength"
    | "VideoBitDepth"
    | "VideoBitrate"
    | "VideoFramerate"
    | "VideoLevel"
    | "VideoProfile"
    | "VideoTimestamp"
    | "IsAnamorphic"
    | "RefFrames"
    | "NumAudioStreams"
    | "NumVideoStreams"
    | "IsSecondaryAudio"
    | "VideoCodecTag"
    | "IsAvc"
    | "IsInterlaced"
    | "AudioSampleRate"
    | "AudioBitDepth"
    | "VideoRangeType"
    | null;
  /** Gets or sets the value. */
  Value?: string | null;
  /** Indicates if the condition is required. */
  IsRequired?: boolean | null;
}

export interface TranscodingProfileDto {
  /** Gets or sets the container. */
  Container?: string | null;
  /** Gets or sets the DLNA profile type. */
  Type?: "Audio" | "Video" | "Photo" | "Subtitle" | "Lyric";
  /** Gets or sets the video codec. */
  VideoCodec?: string | null;
  /** Gets or sets the audio codec. */
  AudioCodec?: string | null;
  /** Media streaming protocol. */
  Protocol?: "http" | "hls";
  /**
   * Indicates if the content length should be estimated.
   * @default false
   */
  EstimateContentLength?: boolean;
  /**
   * Indicates if M2TS mode is enabled.
   * @default false
   */
  EnableMpegtsM2TsMode?: boolean;
  /**
   * Gets or sets the transcoding seek info mode.
   * @default "Auto"
   */
  TranscodeSeekInfo?: "Auto" | "Bytes";
  /**
   * Indicates if timestamps should be copied.
   * @default false
   */
  CopyTimestamps?: boolean;
  /**
   * Gets or sets the encoding context.
   * @default "Streaming"
   */
  Context?: "Streaming" | "Static";
  /**
   * Indicates if subtitles are allowed in the manifest.
   * @default false
   */
  EnableSubtitlesInManifest?: boolean;
  /** Gets or sets the maximum audio channels. */
  MaxAudioChannels?: string | null;
  /**
   * Gets or sets the minimum amount of segments.
   * @format int32
   * @default 0
   */
  MinSegments?: number;
  /**
   * Gets or sets the segment length.
   * @format int32
   * @default 0
   */
  SegmentLength?: number;
  /**
   * Indicates if breaking the video stream on non-keyframes is supported.
   * @default false
   */
  BreakOnNonKeyFrames?: boolean;
  /** Gets or sets the profile conditions. */
  Conditions?: ProfileConditionDto[] | null;
  /**
   * Indicates if variable bitrate encoding is supported.
   * @default true
   */
  EnableAudioVbrEncoding?: boolean;
}

export interface ContainerProfileDto {
  /** Gets or sets the MediaBrowser.Model.Dlna.DlnaProfileType which this container must meet. */
  Type?: "Audio" | "Video" | "Photo" | "Subtitle" | "Lyric" | null;
  /** Gets or sets the profile conditions. */
  Conditions?: ProfileConditionDto[] | null;
  /** Gets or sets the container(s) which this container must meet. */
  Container?: string | null;
  /** Gets or sets the sub container(s) which this container must meet. */
  SubContainer?: string | null;
}

export interface CodecProfileDto {
  /** Gets or sets the MediaBrowser.Model.Dlna.CodecType which this container must meet. */
  Type?: "Video" | "VideoAudio" | "Audio" | null;
  /** Gets or sets the profile conditions. */
  Conditions?: ProfileConditionDto[] | null;
  /** Gets or sets the apply conditions if this profile is met. */
  ApplyConditions?: ProfileConditionDto[] | null;
  /** Gets or sets the codec(s) that this profile applies to. */
  Codec?: string | null;
  /** Gets or sets the container(s) which this profile will be applied to. */
  Container?: string | null;
  /** Gets or sets the sub-container(s) which this profile will be applied to. */
  SubContainer?: string | null;
}

export interface SubtitleProfileDto {
  /** Gets or sets the format. */
  Format?: string | null;
  /** Gets or sets the delivery method. */
  Method?: "Encode" | "Embed" | "External" | "Hls" | "Drop" | null;
  /** Gets or sets the DIDL mode. */
  DidlMode?: string | null;
  /** Gets or sets the language. */
  Language?: string | null;
  /** Gets or sets the container. */
  Container?: string | null;
}

export interface DeviceProfileDto {
  /** Gets or sets the name of this device profile. User profiles must have a unique name. */
  Name?: string | null;
  /**
   * Gets or sets the unique internal identifier.
   * @format uuid
   */
  Id?: string | null;
  /**
   * Gets or sets the maximum allowed bitrate for all streamed content.
   * @format int32
   */
  MaxStreamingBitrate?: number | null;
  /**
   * Gets or sets the maximum allowed bitrate for statically streamed content (= direct played files).
   * @format int32
   */
  MaxStaticBitrate?: number | null;
  /**
   * Gets or sets the maximum allowed bitrate for transcoded music streams.
   * @format int32
   */
  MusicStreamingTranscodingBitrate?: number | null;
  /**
   * Gets or sets the maximum allowed bitrate for statically streamed (= direct played) music files.
   * @format int32
   */
  MaxStaticMusicBitrate?: number | null;
  /** Gets or sets the direct play profiles. */
  DirectPlayProfiles?: DirectPlayProfileDto[] | null;
  /** Gets or sets the transcoding profiles. */
  TranscodingProfiles?: TranscodingProfileDto[] | null;
  /** Gets or sets the container profiles. */
  ContainerProfiles?: ContainerProfileDto[] | null;
  /** Gets or sets the codec profiles. */
  CodecProfiles?: CodecProfileDto[] | null;
  /** Gets or sets the subtitle profiles. */
  SubtitleProfiles?: SubtitleProfileDto[] | null;
}

export interface PlaybackConfigDto {
  /** @example 0 */
  bitrate?: number;
  /** @example 0 */
  audioStreamIndex?: number;
  /** @example 0 */
  progress?: number;
  /** @example "en" */
  deviceProfile?: DeviceProfileDto;
  /** @example "en" */
  defaultLanguage?: string;
}

export interface MediaSourceActionBodyDto {
  playbackConfig?: PlaybackConfigDto;
}

export interface ActionResponseErrorDto {
  /** @example "Stream not found" */
  message: string;
}

export interface ToastDto {
  title: string;
  message: string;
  type: "info" | "success" | "error";
}

export interface AudioStreamDto {
  index: number;
  label: string;
  /** @example "aac" */
  codec?: string;
  /** @example 96000 */
  bitrate?: number;
}

export interface QualityDto {
  index: number;
  bitrate: number;
  label: string;
  codec?: string;
  original: boolean;
}

export interface SubtitlesDto {
  src: string;
  lang: string;
  kind: "subtitles" | "captions" | "descriptions";
  label: string;
  default: boolean;
}

export interface StreamDto {
  videoTracks: VideoTrackDto[];
  subtitleTracks: SubtitleTrackDto[];
}

export interface StreamActionResponseDto {
  error?: ActionResponseErrorDto;
  toast?: ToastDto;
  stream?: StreamDto;
}

export interface ActionResponseResultDto {
  success: boolean;
  message?: string;
}

export interface ActionResponseDto {
  error?: ActionResponseErrorDto;
  toast?: ToastDto;
  result?: ActionResponseResultDto;
}

export interface UpdateOrCreateMediaSourceDto {
  pluginId: string;
  pluginSettings?: Record<string, any>;
  id?: string;
  name?: string;
  /** @default false */
  adminControlled?: boolean;
  priority?: number;
}

export interface ValidationResponseDto {
  /** @example true */
  isValid: boolean;
  /** @example {"setting1":"error message","setting2":"another error message"} */
  errors: Record<string, string>;
  /** @example {"setting1":"new value","setting2":"another new value"} */
  settings: Record<string, any>;
}

export interface UpdateMediaSourceResponseDto {
  mediaSource: MediaSourceDto;
  validationResponse?: ValidationResponseDto;
}

export interface SignInDto {
  name: string;
  password: string;
}

export interface SignInResponse {
  accessToken: string;
  user: UserDto;
}

export interface PluginSettingsTemplateDto {
  /** @example {"setting1":"string","setting2":{"type":"link","url":"https://example.com"}} */
  settings: Record<string, any>;
}

export interface PluginSettingsDto {
  /** @example {"setting1":"some value","setting2":12345,"setting3":true,"setting4":{"nestedKey":"nestedValue"}} */
  settings: Record<string, any>;
}

export interface MovieUserDataDto {
  tmdbId: string;
  inLibrary: boolean;
  playState?: PlayStateDto;
}

export interface SeriesUserDataDto {
  tmdbId: string;
  inLibrary: boolean;
  playStates: PlayStateDto[];
}

export interface StreamableDto {
  id: string;
  label: string;
}

export interface StreamablesDto {
  pluginId: string;
  label: string;
  streamables: StreamableDto[];
}

export interface VideoTrackDto {
  label: string;
  url: string;
  type: "direct" | "hls" | "dash";
  lang?: string;
  proxy?: boolean;
}

export interface SubtitleTrackDto {
  label: string;
  url: string;
  lang: string;
  kind: string;
  proxy?: boolean;
}

export interface CatalogueDto {
  id: string;
  label: string;
  orderOptions: OrderOptionDto[];
  pluginId: string;
  pluginLabel: string;
}

export interface SeasonDto {
  /**
   * Season air date
   * @example "2010-12-05"
   */
  air_date?: string;
  /**
   * Episode count
   * @example 272
   */
  episode_count?: number;
  /**
   * Season ID
   * @example 3627
   */
  id?: number;
  /**
   * Season name
   * @example "Specials"
   */
  name?: string;
  /**
   * Season overview
   * @example ""
   */
  overview?: string;
  /**
   * Poster path
   * @example "/kMTcwNRfFKCZ0O2OaBZS0nZ2AIe.jpg"
   */
  poster_path?: string;
  /**
   * Season number
   * @example 0
   */
  season_number?: number;
  /**
   * Vote average
   * @example 0
   */
  vote_average?: number;
}

export interface TmdbItemDto {
  id?: number;
  poster_path?: string;
  vote_average?: number;
  title?: string;
  release_date?: string;
  runtime?: number;
  name?: string;
  first_air_date?: string;
  last_air_date?: string;
  next_episode_to_air?: NextEpisodeToAir;
  seasons?: SeasonDto[];
}

export interface CatalogueItemsDto {
  items: TmdbItemDto[];
}

export interface UpdatePlayStateDto {
  season?: number;
  episode?: number;
  /**
   * Whether the user has watched this media
   * @default false
   */
  watched?: boolean;
  /**
   * A number between 0 and 1
   * @default false
   * @example 0.5
   */
  progress?: number;
}

export interface BulkUpdatePlayStateDto {
  playStates: UpdatePlayStateDto[];
}

export interface LibraryItemDto {
  tmdbId: string;
  mediaType: "movie" | "series";
  playStates?: PlayStateDto[];
  tmdbItem: TmdbItemDto;
  lastPlayState?: PlayStateDto;
  watched?: boolean;
}

export interface SuccessResponseDto {
  success: boolean;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title No title
 * @version 1.0.0
 * @contact
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  users = {
    /**
     * No description
     *
     * @tags users
     * @name FindAllUsers
     * @request GET:/api/users
     */
    findAllUsers: (params: RequestParams = {}) =>
      this.request<UserDto[], any>({
        path: `/api/users`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name CreateUser
     * @request POST:/api/users
     */
    createUser: (data: CreateUserDto, params: RequestParams = {}) =>
      this.request<
        UserDto,
        | {
            /** @example 400 */
            statusCode: number;
            /** @example "Bad Request" */
            message: string;
            /** @example "Bad Request" */
            error?: string;
          }
        | {
            /** @example 401 */
            statusCode: number;
            /** @example "Unauthorized" */
            message: string;
            /** @example "Unauthorized" */
            error?: string;
          }
      >({
        path: `/api/users`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name FindUserById
     * @request GET:/api/users/{id}
     */
    findUserById: (id: string, params: RequestParams = {}) =>
      this.request<
        UserDto,
        {
          /** @example 404 */
          statusCode: number;
          /** @example "Not Found" */
          message: string;
          /** @example "Not Found" */
          error?: string;
        }
      >({
        path: `/api/users/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name UpdateUser
     * @request PUT:/api/users/{id}
     */
    updateUser: (id: string, data: UpdateUserDto, params: RequestParams = {}) =>
      this.request<
        UserDto,
        {
          /** @example 404 */
          statusCode: number;
          /** @example "Not Found" */
          message: string;
          /** @example "Not Found" */
          error?: string;
        }
      >({
        path: `/api/users/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name DeleteUser
     * @request DELETE:/api/users/{id}
     */
    deleteUser: (id: string, params: RequestParams = {}) =>
      this.request<
        void,
        {
          /** @example 404 */
          statusCode: number;
          /** @example "Not Found" */
          message: string;
          /** @example "Not Found" */
          error?: string;
        }
      >({
        path: `/api/users/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name UpdateSource
     * @request PUT:/api/users/{userId}/sources
     */
    updateSource: (
      userId: string,
      data: UpdateOrCreateMediaSourceDto,
      params: RequestParams = {},
    ) =>
      this.request<UpdateMediaSourceResponseDto, any>({
        path: `/api/users/${userId}/sources`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name DeleteSource
     * @request DELETE:/api/users/{userId}/sources/{sourceId}
     */
    deleteSource: (
      sourceId: string,
      userId: string,
      params: RequestParams = {},
    ) =>
      this.request<UserDto, any>({
        path: `/api/users/${userId}/sources/${sourceId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name GetMovieUserData
     * @request GET:/api/users/{userId}/user-data/movie/tmdb/{tmdbId}
     */
    getMovieUserData: (
      userId: string,
      tmdbId: string,
      params: RequestParams = {},
    ) =>
      this.request<MovieUserDataDto, any>({
        path: `/api/users/${userId}/user-data/movie/tmdb/${tmdbId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name GetSeriesUserData
     * @request GET:/api/users/{userId}/user-data/series/tmdb/{tmdbId}
     */
    getSeriesUserData: (
      userId: string,
      tmdbId: string,
      params: RequestParams = {},
    ) =>
      this.request<SeriesUserDataDto, any>({
        path: `/api/users/${userId}/user-data/series/tmdb/${tmdbId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name GetEpisodeUserData
     * @request GET:/api/users/{userId}/user-data/series/tmdb/{tmdbId}/season/{season}/episode/{episode}
     */
    getEpisodeUserData: (
      userId: string,
      tmdbId: string,
      season: number,
      episode: number,
      params: RequestParams = {},
    ) =>
      this.request<MovieUserDataDto, any>({
        path: `/api/users/${userId}/user-data/series/tmdb/${tmdbId}/season/${season}/episode/${episode}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name UpdateMoviePlayStateByTmdbId
     * @request PUT:/api/users/{userId}/play-state/movie/tmdb/{tmdbId}
     */
    updateMoviePlayStateByTmdbId: (
      userId: string,
      tmdbId: string,
      data: UpdatePlayStateDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/users/${userId}/play-state/movie/tmdb/${tmdbId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name DeleteMoviePlayStateByTmdbId
     * @request DELETE:/api/users/{userId}/play-state/movie/tmdb/{tmdbId}
     */
    deleteMoviePlayStateByTmdbId: (
      userId: string,
      tmdbId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/users/${userId}/play-state/movie/tmdb/${tmdbId}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name UpdateEpisodePlayStateByTmdbId
     * @request PUT:/api/users/{userId}/play-state/series/tmdb/{tmdbId}/season/{season}/episode/{episode}
     */
    updateEpisodePlayStateByTmdbId: (
      userId: string,
      tmdbId: string,
      season: number,
      episode: number,
      data: UpdatePlayStateDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/users/${userId}/play-state/series/tmdb/${tmdbId}/season/${season}/episode/${episode}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name DeleteEpisodePlayStateByTmdbId
     * @request DELETE:/api/users/{userId}/play-state/series/tmdb/{tmdbId}/season/{season}/episode/{episode}
     */
    deleteEpisodePlayStateByTmdbId: (
      userId: string,
      tmdbId: string,
      season: number,
      episode: number,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/users/${userId}/play-state/series/tmdb/${tmdbId}/season/${season}/episode/${episode}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name UpdateSeriesPlayStatesByTmdbId
     * @request PUT:/api/users/{userId}/play-state/series/tmdb/{tmdbId}
     */
    updateSeriesPlayStatesByTmdbId: (
      userId: string,
      tmdbId: string,
      data: BulkUpdatePlayStateDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/users/${userId}/play-state/series/tmdb/${tmdbId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),
  };
  sources = {
    /**
     * No description
     *
     * @tags sources
     * @name GetTmdbEpisodeMedia
     * @request GET:/api/sources/candidates
     */
    getTmdbEpisodeMedia: (
      query: {
        tmdbId: string;
        season?: number;
        episode?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        PaginatedResponseDto & {
          items: ProviderWithStreamsDto[];
        },
        any
      >({
        path: `/api/sources/candidates`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags sources
     * @name GetMediaSourceViewGroups
     * @request GET:/api/sources/views
     */
    getMediaSourceViewGroups: (
      query: {
        tmdbId: string;
        season?: number;
        episode?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<ViewProvidersResponseDto, any>({
        path: `/api/sources/views`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags sources
     * @name GetView
     * @request GET:/api/sources/{sourceId}/views/{viewId}
     */
    getView: (
      sourceId: string,
      viewId: string,
      query: {
        tmdbId: string;
        season?: number;
        episode?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<MediaSourceViewResponseDto, any>({
        path: `/api/sources/${sourceId}/views/${viewId}`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags sources
     * @name GetTmdbMovieCandidates
     * @request GET:/api/sources/{sourceId}/candidates/tmdb/{tmdbId}
     */
    getTmdbMovieCandidates: (
      sourceId: string,
      tmdbId: string,
      params: RequestParams = {},
    ) =>
      this.request<StreamCandidatesDto, any>({
        path: `/api/sources/${sourceId}/candidates/tmdb/${tmdbId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags sources
     * @name GetTmdbEpisodeCandidates
     * @request GET:/api/sources/{sourceId}/candidates/tmdb/{tmdbId}/season/{season}/episode/{episode}
     */
    getTmdbEpisodeCandidates: (
      sourceId: string,
      tmdbId: string,
      season: number,
      episode: number,
      params: RequestParams = {},
    ) =>
      this.request<StreamCandidatesDto, any>({
        path: `/api/sources/${sourceId}/candidates/tmdb/${tmdbId}/season/${season}/episode/${episode}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags sources
     * @name GetAutoplayStream
     * @request POST:/api/sources/{sourceId}/autoplay-stream
     */
    getAutoplayStream: (
      sourceId: string,
      query: {
        tmdbId: string;
        season?: number;
        episode?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<AutoplayResponseDto, any>({
        path: `/api/sources/${sourceId}/autoplay-stream`,
        method: "POST",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags sources
     * @name GetStream
     * @request POST:/api/sources/{sourceId}/stream/{streamId}
     */
    getStream: (
      sourceId: string,
      streamId: string,
      data?: MediaSourceActionBodyDto,
      params: RequestParams = {},
    ) =>
      this.request<StreamActionResponseDto, any>({
        path: `/api/sources/${sourceId}/stream/${streamId}`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags sources
     * @name HandleViewAction
     * @request POST:/api/sources/{sourceId}/action/{action}/{targetId}
     */
    handleViewAction: (
      sourceId: string,
      targetId: string,
      action: string,
      params: RequestParams = {},
    ) =>
      this.request<ActionResponseDto, any>({
        path: `/api/sources/${sourceId}/action/${action}/${targetId}`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags sources
     * @name ProxyHandlerGet
     * @request GET:/api/sources/{sourceId}/proxy
     */
    proxyHandlerGet: (sourceId: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/sources/${sourceId}/proxy`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags sources
     * @name ProxyHandlerPost
     * @request POST:/api/sources/{sourceId}/proxy
     */
    proxyHandlerPost: (sourceId: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/sources/${sourceId}/proxy`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags sources
     * @name ProxyHandlerPut
     * @request PUT:/api/sources/{sourceId}/proxy
     */
    proxyHandlerPut: (sourceId: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/sources/${sourceId}/proxy`,
        method: "PUT",
        ...params,
      }),

    /**
     * No description
     *
     * @tags sources
     * @name ProxyHandlerDelete
     * @request DELETE:/api/sources/{sourceId}/proxy
     */
    proxyHandlerDelete: (sourceId: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/sources/${sourceId}/proxy`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags sources
     * @name ProxyHandlerPatch
     * @request PATCH:/api/sources/{sourceId}/proxy
     */
    proxyHandlerPatch: (sourceId: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/sources/${sourceId}/proxy`,
        method: "PATCH",
        ...params,
      }),

    /**
     * No description
     *
     * @tags sources
     * @name ProxyHandlerOptions
     * @request OPTIONS:/api/sources/{sourceId}/proxy
     */
    proxyHandlerOptions: (sourceId: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/sources/${sourceId}/proxy`,
        method: "OPTIONS",
        ...params,
      }),

    /**
     * No description
     *
     * @tags sources
     * @name ProxyHandlerHead
     * @request HEAD:/api/sources/{sourceId}/proxy
     */
    proxyHandlerHead: (sourceId: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/sources/${sourceId}/proxy`,
        method: "HEAD",
        ...params,
      }),

    /**
     * No description
     *
     * @tags sources
     * @name ProxyHandlerSearch
     * @request SEARCH:/api/sources/{sourceId}/proxy
     */
    proxyHandlerSearch: (sourceId: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/sources/${sourceId}/proxy`,
        method: "SEARCH",
        ...params,
      }),

    /**
     * No description
     *
     * @tags sources
     * @name ProxyHandlerGet2
     * @request GET:/api/sources/{sourceId}/proxy/*
     * @originalName proxyHandlerGet
     * @duplicate
     */
    proxyHandlerGet2: (sourceId: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/sources/${sourceId}/proxy/*`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags sources
     * @name ProxyHandlerPost2
     * @request POST:/api/sources/{sourceId}/proxy/*
     * @originalName proxyHandlerPost
     * @duplicate
     */
    proxyHandlerPost2: (sourceId: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/sources/${sourceId}/proxy/*`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags sources
     * @name ProxyHandlerPut2
     * @request PUT:/api/sources/{sourceId}/proxy/*
     * @originalName proxyHandlerPut
     * @duplicate
     */
    proxyHandlerPut2: (sourceId: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/sources/${sourceId}/proxy/*`,
        method: "PUT",
        ...params,
      }),

    /**
     * No description
     *
     * @tags sources
     * @name ProxyHandlerDelete2
     * @request DELETE:/api/sources/{sourceId}/proxy/*
     * @originalName proxyHandlerDelete
     * @duplicate
     */
    proxyHandlerDelete2: (sourceId: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/sources/${sourceId}/proxy/*`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags sources
     * @name ProxyHandlerPatch2
     * @request PATCH:/api/sources/{sourceId}/proxy/*
     * @originalName proxyHandlerPatch
     * @duplicate
     */
    proxyHandlerPatch2: (sourceId: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/sources/${sourceId}/proxy/*`,
        method: "PATCH",
        ...params,
      }),

    /**
     * No description
     *
     * @tags sources
     * @name ProxyHandlerOptions2
     * @request OPTIONS:/api/sources/{sourceId}/proxy/*
     * @originalName proxyHandlerOptions
     * @duplicate
     */
    proxyHandlerOptions2: (sourceId: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/sources/${sourceId}/proxy/*`,
        method: "OPTIONS",
        ...params,
      }),

    /**
     * No description
     *
     * @tags sources
     * @name ProxyHandlerHead2
     * @request HEAD:/api/sources/{sourceId}/proxy/*
     * @originalName proxyHandlerHead
     * @duplicate
     */
    proxyHandlerHead2: (sourceId: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/sources/${sourceId}/proxy/*`,
        method: "HEAD",
        ...params,
      }),

    /**
     * No description
     *
     * @tags sources
     * @name ProxyHandlerSearch2
     * @request SEARCH:/api/sources/{sourceId}/proxy/*
     * @originalName proxyHandlerSearch
     * @duplicate
     */
    proxyHandlerSearch2: (sourceId: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/sources/${sourceId}/proxy/*`,
        method: "SEARCH",
        ...params,
      }),
  };
  api = {
    /**
     * No description
     *
     * @name SignIn
     * @request POST:/api/auth
     */
    signIn: (data: SignInDto, params: RequestParams = {}) =>
      this.request<
        SignInResponse,
        {
          /** @example 401 */
          statusCode: number;
          /** @example "Unauthorized" */
          message: string;
          /** @example "Unauthorized" */
          error?: string;
        }
      >({
        path: `/api/auth`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name TmdbProxyGet
     * @request GET:/api/tmdb/v3/proxy/*
     */
    tmdbProxyGet: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/tmdb/v3/proxy/*`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @name TmdbProxyPost
     * @request POST:/api/tmdb/v3/proxy/*
     */
    tmdbProxyPost: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/tmdb/v3/proxy/*`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @name TmdbProxyPut
     * @request PUT:/api/tmdb/v3/proxy/*
     */
    tmdbProxyPut: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/tmdb/v3/proxy/*`,
        method: "PUT",
        ...params,
      }),

    /**
     * No description
     *
     * @name TmdbProxyDelete
     * @request DELETE:/api/tmdb/v3/proxy/*
     */
    tmdbProxyDelete: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/tmdb/v3/proxy/*`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @name TmdbProxyPatch
     * @request PATCH:/api/tmdb/v3/proxy/*
     */
    tmdbProxyPatch: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/tmdb/v3/proxy/*`,
        method: "PATCH",
        ...params,
      }),

    /**
     * No description
     *
     * @name TmdbProxyOptions
     * @request OPTIONS:/api/tmdb/v3/proxy/*
     */
    tmdbProxyOptions: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/tmdb/v3/proxy/*`,
        method: "OPTIONS",
        ...params,
      }),

    /**
     * No description
     *
     * @name TmdbProxyHead
     * @request HEAD:/api/tmdb/v3/proxy/*
     */
    tmdbProxyHead: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/tmdb/v3/proxy/*`,
        method: "HEAD",
        ...params,
      }),

    /**
     * No description
     *
     * @name TmdbProxySearch
     * @request SEARCH:/api/tmdb/v3/proxy/*
     */
    tmdbProxySearch: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/tmdb/v3/proxy/*`,
        method: "SEARCH",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetDefaultPermissions
     * @request GET:/api/permissions/default
     */
    getDefaultPermissions: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/permissions/default`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @name SaveDefaultPermissions
     * @request POST:/api/permissions/default
     */
    saveDefaultPermissions: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/permissions/default`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetHello
     * @request GET:/api
     */
    getHello: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api`,
        method: "GET",
        ...params,
      }),
  };
  metadata = {
    /**
     * No description
     *
     * @tags metadata
     * @name GetMovie
     * @request GET:/api/metadata/movie/{tmdbId}
     */
    getMovie: (tmdbId: string, params: RequestParams = {}) =>
      this.request<MovieMetadata, any>({
        path: `/api/metadata/movie/${tmdbId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags metadata
     * @name GetSeries
     * @request GET:/api/metadata/series/{tmdbId}
     */
    getSeries: (tmdbId: string, params: RequestParams = {}) =>
      this.request<SeriesMetadata, any>({
        path: `/api/metadata/series/${tmdbId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags metadata
     * @name ClearCache
     * @request POST:/api/metadata/clear-cache
     */
    clearCache: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/metadata/clear-cache`,
        method: "POST",
        ...params,
      }),
  };
  providers = {
    /**
     * No description
     *
     * @tags providers
     * @name GetSourceProviders
     * @request GET:/api/providers
     */
    getSourceProviders: (params: RequestParams = {}) =>
      this.request<string[], any>({
        path: `/api/providers`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags providers
     * @name GetSourceSettingsTemplate
     * @request GET:/api/providers/{providerId}/settings/template
     */
    getSourceSettingsTemplate: (
      providerId: string,
      params: RequestParams = {},
    ) =>
      this.request<PluginSettingsTemplateDto, any>({
        path: `/api/providers/${providerId}/settings/template`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags providers
     * @name ValidateSourceSettings
     * @request POST:/api/providers/{providerId}/settings/validate
     */
    validateSourceSettings: (
      providerId: string,
      data: PluginSettingsDto,
      params: RequestParams = {},
    ) =>
      this.request<ValidationResponseDto, any>({
        path: `/api/providers/${providerId}/settings/validate`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  media = {
    /**
     * No description
     *
     * @tags media
     * @name GetStreamables
     * @request GET:/api/media/streamables
     */
    getStreamables: (
      query: {
        tmdbId: string;
        season?: number;
        episode?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        PaginatedResponseDto & {
          items: StreamablesDto[];
        },
        any
      >({
        path: `/api/media/streamables`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags media
     * @name GetStream
     * @request GET:/api/media/stream
     */
    getStream: (
      query: {
        pluginId: string;
        streamId: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<StreamDto, any>({
        path: `/api/media/stream`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),
  };
  catalogues = {
    /**
     * No description
     *
     * @tags catalogues
     * @name GetCatalogues
     * @request GET:/api/catalogues
     */
    getCatalogues: (params: RequestParams = {}) =>
      this.request<
        PaginatedResponseDto & {
          items: CatalogueDto[];
        },
        any
      >({
        path: `/api/catalogues`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags catalogues
     * @name GetCatalogue
     * @request GET:/api/catalogues/catalogue
     */
    getCatalogue: (
      query: {
        pluginId: string;
        catalogueId: string;
        order?: string;
        page?: number;
        itemsPerPage?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<CatalogueItemsDto, any>({
        path: `/api/catalogues/catalogue`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),
  };
  proxy = {
    /**
     * @description Forwards all HTTP requests (GET, POST, PUT, DELETE, etc.) to the specified destination URL. The URL should be provided in the path after /proxy/
     *
     * @tags proxy
     * @name ProxyAllGet
     * @summary Proxy all requests to a destination URL
     * @request GET:/api/proxy/*
     */
    proxyAllGet: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/proxy/*`,
        method: "GET",
        ...params,
      }),

    /**
     * @description Forwards all HTTP requests (GET, POST, PUT, DELETE, etc.) to the specified destination URL. The URL should be provided in the path after /proxy/
     *
     * @tags proxy
     * @name ProxyAllPost
     * @summary Proxy all requests to a destination URL
     * @request POST:/api/proxy/*
     */
    proxyAllPost: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/proxy/*`,
        method: "POST",
        ...params,
      }),

    /**
     * @description Forwards all HTTP requests (GET, POST, PUT, DELETE, etc.) to the specified destination URL. The URL should be provided in the path after /proxy/
     *
     * @tags proxy
     * @name ProxyAllPut
     * @summary Proxy all requests to a destination URL
     * @request PUT:/api/proxy/*
     */
    proxyAllPut: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/proxy/*`,
        method: "PUT",
        ...params,
      }),

    /**
     * @description Forwards all HTTP requests (GET, POST, PUT, DELETE, etc.) to the specified destination URL. The URL should be provided in the path after /proxy/
     *
     * @tags proxy
     * @name ProxyAllDelete
     * @summary Proxy all requests to a destination URL
     * @request DELETE:/api/proxy/*
     */
    proxyAllDelete: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/proxy/*`,
        method: "DELETE",
        ...params,
      }),

    /**
     * @description Forwards all HTTP requests (GET, POST, PUT, DELETE, etc.) to the specified destination URL. The URL should be provided in the path after /proxy/
     *
     * @tags proxy
     * @name ProxyAllPatch
     * @summary Proxy all requests to a destination URL
     * @request PATCH:/api/proxy/*
     */
    proxyAllPatch: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/proxy/*`,
        method: "PATCH",
        ...params,
      }),

    /**
     * @description Forwards all HTTP requests (GET, POST, PUT, DELETE, etc.) to the specified destination URL. The URL should be provided in the path after /proxy/
     *
     * @tags proxy
     * @name ProxyAllOptions
     * @summary Proxy all requests to a destination URL
     * @request OPTIONS:/api/proxy/*
     */
    proxyAllOptions: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/proxy/*`,
        method: "OPTIONS",
        ...params,
      }),

    /**
     * @description Forwards all HTTP requests (GET, POST, PUT, DELETE, etc.) to the specified destination URL. The URL should be provided in the path after /proxy/
     *
     * @tags proxy
     * @name ProxyAllHead
     * @summary Proxy all requests to a destination URL
     * @request HEAD:/api/proxy/*
     */
    proxyAllHead: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/proxy/*`,
        method: "HEAD",
        ...params,
      }),

    /**
     * @description Forwards all HTTP requests (GET, POST, PUT, DELETE, etc.) to the specified destination URL. The URL should be provided in the path after /proxy/
     *
     * @tags proxy
     * @name ProxyAllSearch
     * @summary Proxy all requests to a destination URL
     * @request SEARCH:/api/proxy/*
     */
    proxyAllSearch: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/proxy/*`,
        method: "SEARCH",
        ...params,
      }),
  };
  library = {
    /**
     * No description
     *
     * @tags library
     * @name GetMyList
     * @request GET:/api/users/{userId}/library/my-list
     */
    getMyList: (
      userId: string,
      query?: {
        status?:
          | "all"
          | "upcoming"
          | "unwatched"
          | "watched"
          | "continue-watching";
        type?: "movies" | "series" | "all";
        order?:
          | "date-added"
          | "name"
          | "first-release-date"
          | "last-release-date"
          | "last-played";
        direction?: "asc" | "desc";
        page?: number;
        itemsPerPage?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        PaginatedResponseDto & {
          items: LibraryItemDto[];
        },
        any
      >({
        path: `/api/users/${userId}/library/my-list`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags library
     * @name GetCatalogue
     * @request GET:/api/users/{userId}/library/catalogue/{sourceId}
     */
    getCatalogue: (
      userId: string,
      sourceId: string,
      query?: {
        type?: "all" | "movies" | "series" | "missing";
        order?: string;
        direction?: string;
        page?: number;
        itemsPerPage?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        PaginatedResponseDto & {
          items: LibraryItemDto[];
        },
        any
      >({
        path: `/api/users/${userId}/library/catalogue/${sourceId}`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags library
     * @name UpdateLibraryItem
     * @request PUT:/api/users/{userId}/library/tmdb/{tmdbId}
     */
    updateLibraryItem: (
      userId: string,
      tmdbId: string,
      query: {
        inLibrary: boolean;
        mediaType: "movie" | "series";
      },
      params: RequestParams = {},
    ) =>
      this.request<SuccessResponseDto, any>({
        path: `/api/users/${userId}/library/tmdb/${tmdbId}`,
        method: "PUT",
        query: query,
        format: "json",
        ...params,
      }),
  };
}
