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

export interface UserSettingsDto {
  autoplayTrailers: boolean;
  language: string;
  animationDuration: number;
  sonarr: SonarrSettings;
  radarr: RadarrSettings;
  jellyfin: JellyfinSettings;
  tmdb: TmdbSettings;
}

export interface UserDto {
  id: string;
  name: string;
  isAdmin: boolean;
  onboardingDone?: boolean;
  settings: UserSettingsDto;
  profilePicture: string;
}

export interface ErrorResponseDto {
  statusCode: number;
  message: string;
  error?: string;
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
  settings?: UserSettingsDto;
  profilePicture?: string;
  oldPassword?: string;
}

export interface SignInDto {
  name: string;
  password: string;
}

export interface SignInResponseDto {
  accessToken: string;
  user: UserDto;
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

export interface MovieMetadataDto {
  id?: string;
  tmdbId: string;
  tmdbMovie?: TmdbMovieFull;
  name?: string;
  releaseDate?: string;
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

export interface SeriesMetadataDto {
  id?: string;
  tmdbId: string;
  tmdbSeries?: TmdbSeriesFull;
  name?: string;
  firstReleaseDate?: string;
  lastReleaseDate?: string;
  nextReleaseDate?: string;
  lastSeasonNumber?: number;
  lastEpisodeNumber?: number;
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
  /** When the media became watched */
  watchedAt?: string | null;
  /**
   * A number between 0 and 1
   * @default false
   * @example 0.5
   */
  progress: number;
  /** Last time the user played this media */
  lastPlayedAt: string;
}

export interface MovieUserDataDto {
  tmdbId: string;
  inMyList: boolean;
  playState?: PlayStateDto;
}

export interface SeriesUserDataDto {
  tmdbId: string;
  inMyList: boolean;
  playStates: PlayStateDto[];
}

export interface PaginatedResponseDto {
  total: number;
  page: number;
  itemsPerPage: number;
}

export interface MediaRequestDto {
  id: string;
  userId: string;
  tmdbId: string;
  mediaType: "movie" | "series" | "episode";
  /** 0 for movies */
  season: number;
  /** 0 for movies */
  episode: number;
  approved: boolean;
  /** @format date-time */
  neededSince?: string;
  /** @format date-time */
  watchedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MovieRequestStatusDto {
  tmdbId: string;
  request?: MediaRequestDto;
}

export interface SuccessResponseDto {
  success: boolean;
}

export interface EpisodeRefDto {
  season: number;
  episode: number;
}

export interface UpdateSeriesRequestsDto {
  episodes: EpisodeRefDto[];
  /** Whether the episodes are requested */
  requested: boolean;
}

export interface RequestRuleDto {
  /** How many requests after the last episode the user watched are needed */
  keepNext: number | null;
  /** How many of the last watched requests keep their file, while there is more to watch */
  keepWatched: number | null;
  /** For how many hours after it was watched a request keeps its file. With keepWatched, either one keeps it */
  keepWatchedHours: number | null;
}

export interface SetPreferenceDto {
  /** Id of a release from an indexer search */
  releaseId?: string;
  /** Id of a file of the episode in the library */
  mediaFileId?: string;
}

export interface RequesterDto {
  id: string;
  name: string;
}

export interface AdminMediaRequestDto {
  id: string;
  userId: string;
  tmdbId: string;
  mediaType: "movie" | "series" | "episode";
  /** 0 for movies */
  season: number;
  /** 0 for movies */
  episode: number;
  approved: boolean;
  /** @format date-time */
  neededSince?: string;
  /** @format date-time */
  watchedAt?: string;
  createdAt: string;
  updatedAt: string;
  user: RequesterDto;
}

export interface UpdateMediaRequestDto {
  approved: boolean;
}

export interface LibrarySettingsDto {
  movieFolders: string[];
  seriesFolders: string[];
  /** When the managed files that no request holds are deleted: at 4 in the morning every day, on Mondays or on the first of the month */
  cleanup: "off" | "daily" | "weekly" | "monthly";
}

export interface SubtitleFileDto {
  fileName: string;
  /** Language code from the file name */
  lang?: string;
  /** The tags of the file name, such as "en forced" */
  label: string;
}

export interface LibraryFileDto {
  id: string;
  fileName: string;
  size: number;
  /** Subtitle files next to the video */
  subtitles: SubtitleFileDto[];
  /** Whether the cleanup may delete the file when no request holds it */
  managed: boolean;
  /** The torrent the file was imported from */
  infoHash?: string;
}

export interface LibraryEpisodeFileDto {
  id: string;
  fileName: string;
  size: number;
  /** Subtitle files next to the video */
  subtitles: SubtitleFileDto[];
  /** Whether the cleanup may delete the file when no request holds it */
  managed: boolean;
  /** The torrent the file was imported from */
  infoHash?: string;
  season: number;
  episodes: number[];
}

export interface TorrentDto {
  infoHash: string;
  title: string;
  indexer: string;
  /** Bytes */
  size: number;
  /** Bytes downloaded for the data currently in the downloads folder */
  downloadedBytes: number;
  /** Bytes uploaded for that data */
  uploadedBytes: number;
  status:
    | "idle"
    | "starting"
    | "downloading"
    | "seeding"
    | "stopped"
    | "failed";
  error?: string;
  peers: number;
  /** Bytes per second */
  downloadSpeed: number;
  /** Bytes per second */
  uploadSpeed: number;
}

export interface PreferredFileDto {
  /** The id of the file, which the API serves it by */
  id: string;
  /** Whether the file is still in the library. The requests of a file that is not wait until another source is picked */
  inLibrary: boolean;
  /** Unknown when the file is gone */
  fileName?: string;
  /** Bytes, unknown when the file is gone */
  size?: number;
  /** Whether the cleanup may delete the file when no request holds it */
  managed?: boolean;
}

export interface PreferenceDto {
  season: number;
  episode: number;
  torrent?: TorrentDto;
  file?: PreferredFileDto;
}

export interface EpisodeStatusDto {
  season: number;
  episode: number;
  /** Whether the user has requested the episode */
  requested: boolean;
  /** Whether a file of the episode is in the library, from any torrent or found on disk */
  onDisk: boolean;
  /** Where the request of the user stands */
  status?:
    | "waiting-for-approval"
    | "inactive-ahead"
    | "no-preference"
    | "resolving"
    | "no-file-in-torrent"
    | "downloading"
    | "failed"
    | "available";
  /** From 0 to 1 */
  progress?: number;
  error?: string;
  /** The torrent that the request of the user downloads from or has its file from. A request that has its file keeps it when the user selects another torrent for the season */
  torrent?: TorrentDto;
  /**
   * When the next cleanup deletes the files of the episode, if no request of anyone keeps one of them
   * @format date-time
   */
  cleanupAt?: string;
}

export interface SeriesStatusDto {
  /** What the user prefers for the seasons and episodes: torrents, and files for episodes */
  preferences: PreferenceDto[];
  /** The episodes that the user requested or that are on disk */
  episodes: EpisodeStatusDto[];
  /** Info hashes of the torrents that have data on the server or that something is wanted of, and of the torrents files came from */
  onServer: string[];
}

export interface JobDto {
  id: string;
  type: string;
  payload?: object;
  status: "queued" | "running" | "completed" | "failed";
  /** Only one job per key can be running at a time */
  lockKey?: string;
  /** Only one job per key can be queued at a time */
  dedupeKey?: string;
  /** Earliest time the job can be claimed */
  runAt: string;
  error?: string;
  /** How many times it was claimed */
  attempts: number;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface IndexerDto {
  /** Generated when missing */
  id?: string;
  name: string;
  /** Torznab feed URL, as copied from Jackett or Prowlarr */
  url: string;
  apiKey: string;
}

export interface IndexerSettingsDto {
  indexers: IndexerDto[];
}

export interface ReleaseDto {
  id: string;
  title: string;
  indexer: string;
  /** Bytes */
  size: number;
  seeders: number;
  /** Seeders and leechers */
  peers: number;
  publishedAt?: string;
  infoHash?: string;
  seasons: number[];
  /** Empty for season packs */
  episodes: number[];
}

export interface DownloadSettingsDto {
  /** Torrents are seeded until they have uploaded this many times what they downloaded. 0 disables seeding. */
  seedRatio: number;
}

export interface TorrentItemDto {
  id: string;
  infoHash: string;
  mediaType: "movie" | "series";
  tmdbId: string;
  /** 0 for a movie */
  season: number;
  /** 0 for a movie */
  episode: number;
  status:
    | "resolving"
    | "no-match"
    | "downloading"
    | "complete"
    | "failed"
    | "released";
  /** From 0 to 1 */
  progress?: number;
  error?: string;
  /** The name of the file of the torrent that is the item */
  fileName?: string;
}

export interface TorrentWithItemsDto {
  infoHash: string;
  title: string;
  indexer: string;
  /** Bytes */
  size: number;
  /** Bytes downloaded for the data currently in the downloads folder */
  downloadedBytes: number;
  /** Bytes uploaded for that data */
  uploadedBytes: number;
  status:
    | "idle"
    | "starting"
    | "downloading"
    | "seeding"
    | "stopped"
    | "failed";
  error?: string;
  peers: number;
  /** Bytes per second */
  downloadSpeed: number;
  /** Bytes per second */
  uploadSpeed: number;
  items: TorrentItemDto[];
}

export interface LogEntryDto {
  id: string;
  type: "file.deleted" | "download.deleted" | "scan.failed";
  message: string;
  data?: object;
  /** @format date-time */
  createdAt: string;
}

export interface ServerLogSettingsDto {
  /** How many of the newest entries are kept, older ones are deleted. 0 keeps any number of them. */
  maxEntries: number;
  /** Entries older than this many days are deleted. 0 keeps them whatever their age. */
  maxAgeDays: number;
}

export interface ServerLibraryEntryDto {
  /** Where it is in the library folder, with / between the names */
  path: string;
  isDirectory: boolean;
  /** Bytes, 0 for a directory */
  size: number;
  /** The id of the file, when it is a video that is indexed */
  mediaFileId?: string;
  /** For an indexed file, whether it was imported from a torrent, which leaves it to the cleanup */
  managed?: boolean;
  /** Why the entry could not be read. What is in a directory that could not be read is not listed */
  error?: string;
  /** For an indexed file, how many requests it fulfils. They are deleted with the file */
  requests?: number;
}

export interface LibraryScanPreviewDto {
  /** Whether the folder reads as mounted: it can be read, and it has something in it when files are indexed in it */
  available: boolean;
  /** Why it is not available */
  reason?: string;
  /** Indexed files that a scan would forget: all of them when the folder is not available */
  missing: number;
  /** Requests that those files fulfil, which download them again when the files are forgotten */
  requests: number;
}

export interface ScanLibraryDto {
  /** One of the library folders */
  folder: string;
  /** Scan a folder that is not available as it is, which forgets everything indexed in it */
  force?: boolean;
}

export interface FailedLibraryEntryDto {
  path: string;
  error: string;
}

export interface ScanLibraryResultDto {
  /** Files that are new to the index */
  added: number;
  /** Indexed files that changed on disk */
  updated: number;
  /** Indexed files that are no longer on disk */
  forgotten: number;
  /** Title folders with videos that could not be matched to a title, whose files are not indexed */
  unresolved: string[];
  /** Directories that could not be read and why. Indexed files in them are kept */
  failed: FailedLibraryEntryDto[];
}

export interface CleanupPreviewDto {
  /** Managed files that no request holds, which the cleanup deletes. One that is not as it was imported is kept as external instead */
  files: number;
  /** Bytes, of those files */
  size: number;
}

export interface LibraryEntriesDto {
  /** One of the library folders */
  folder: string;
  /** Where the files and directories are in the folder, with / between the names */
  paths: string[];
}

export interface RequestLibraryEntriesResultDto {
  /** Requests that were made or pointed at the files */
  requests: number;
  /** Files of movies and of episodes the series does not have, which were not requested */
  skipped: number;
}

export interface ManageLibraryEntriesResultDto {
  /** Indexed files whose managed flag changed */
  files: number;
}

export interface DeleteLibraryEntriesDto {
  /** One of the library folders */
  folder: string;
  /** Where the files and directories are in the folder, with / between the names */
  paths: string[];
}

export interface DeleteLibraryEntriesResultDto {
  /** How many of the entries were deleted */
  deleted: number;
  /** The entries that could not be deleted, or not completely, and why */
  failed: FailedLibraryEntryDto[];
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

export interface MyListItemDto {
  tmdbId: string;
  mediaType: "movie" | "series";
  playStates?: PlayStateDto[];
  tmdbItem: TmdbItemDto;
  lastPlayState?: PlayStateDto;
  watched?: boolean;
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
     * @name GetUsers
     * @request GET:/api/users
     */
    getUsers: (params: RequestParams = {}) =>
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
      this.request<UserDto, ErrorResponseDto>({
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
     * @name GetUser
     * @request GET:/api/users/{id}
     */
    getUser: (id: string, params: RequestParams = {}) =>
      this.request<UserDto, ErrorResponseDto>({
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
      this.request<UserDto, ErrorResponseDto>({
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
      this.request<void, ErrorResponseDto>({
        path: `/api/users/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name GetMovieUserData
     * @request GET:/api/users/{userId}/user-data/movies/{tmdbId}
     */
    getMovieUserData: (
      userId: string,
      tmdbId: string,
      params: RequestParams = {},
    ) =>
      this.request<MovieUserDataDto, any>({
        path: `/api/users/${userId}/user-data/movies/${tmdbId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name GetSeriesUserData
     * @request GET:/api/users/{userId}/user-data/series/{tmdbId}
     */
    getSeriesUserData: (
      userId: string,
      tmdbId: string,
      params: RequestParams = {},
    ) =>
      this.request<SeriesUserDataDto, any>({
        path: `/api/users/${userId}/user-data/series/${tmdbId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name GetEpisodeUserData
     * @request GET:/api/users/{userId}/user-data/series/{tmdbId}/seasons/{season}/episodes/{episode}
     */
    getEpisodeUserData: (
      userId: string,
      tmdbId: string,
      season: number,
      episode: number,
      params: RequestParams = {},
    ) =>
      this.request<MovieUserDataDto, any>({
        path: `/api/users/${userId}/user-data/series/${tmdbId}/seasons/${season}/episodes/${episode}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name UpdateMoviePlayState
     * @request PUT:/api/users/{userId}/play-states/movies/{tmdbId}
     */
    updateMoviePlayState: (
      userId: string,
      tmdbId: string,
      data: UpdatePlayStateDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/users/${userId}/play-states/movies/${tmdbId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name DeleteMoviePlayState
     * @request DELETE:/api/users/{userId}/play-states/movies/{tmdbId}
     */
    deleteMoviePlayState: (
      userId: string,
      tmdbId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/users/${userId}/play-states/movies/${tmdbId}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name UpdateEpisodePlayState
     * @request PUT:/api/users/{userId}/play-states/series/{tmdbId}/seasons/{season}/episodes/{episode}
     */
    updateEpisodePlayState: (
      userId: string,
      tmdbId: string,
      season: number,
      episode: number,
      data: UpdatePlayStateDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/users/${userId}/play-states/series/${tmdbId}/seasons/${season}/episodes/${episode}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name DeleteEpisodePlayState
     * @request DELETE:/api/users/{userId}/play-states/series/{tmdbId}/seasons/{season}/episodes/{episode}
     */
    deleteEpisodePlayState: (
      userId: string,
      tmdbId: string,
      season: number,
      episode: number,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/users/${userId}/play-states/series/${tmdbId}/seasons/${season}/episodes/${episode}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name UpdateSeriesPlayStates
     * @request PUT:/api/users/{userId}/play-states/series/{tmdbId}
     */
    updateSeriesPlayStates: (
      userId: string,
      tmdbId: string,
      data: BulkUpdatePlayStateDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/users/${userId}/play-states/series/${tmdbId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),
  };
  auth = {
    /**
     * No description
     *
     * @tags auth
     * @name SignIn
     * @request POST:/api/auth
     */
    signIn: (data: SignInDto, params: RequestParams = {}) =>
      this.request<SignInResponseDto, ErrorResponseDto>({
        path: `/api/auth`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  metadata = {
    /**
     * No description
     *
     * @tags metadata
     * @name GetMovie
     * @request GET:/api/metadata/movies/{tmdbId}
     */
    getMovie: (tmdbId: string, params: RequestParams = {}) =>
      this.request<MovieMetadataDto, any>({
        path: `/api/metadata/movies/${tmdbId}`,
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
      this.request<SeriesMetadataDto, any>({
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
  requests = {
    /**
     * No description
     *
     * @tags requests
     * @name GetUserRequests
     * @request GET:/api/users/{userId}/requests
     */
    getUserRequests: (
      userId: string,
      query?: {
        page?: number;
        itemsPerPage?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        PaginatedResponseDto & {
          items: MediaRequestDto[];
        },
        any
      >({
        path: `/api/users/${userId}/requests`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags requests
     * @name GetMovieRequest
     * @request GET:/api/users/{userId}/requests/movies/{tmdbId}
     */
    getMovieRequest: (
      userId: string,
      tmdbId: string,
      params: RequestParams = {},
    ) =>
      this.request<MovieRequestStatusDto, any>({
        path: `/api/users/${userId}/requests/movies/${tmdbId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags requests
     * @name CreateMovieRequest
     * @request PUT:/api/users/{userId}/requests/movies/{tmdbId}
     */
    createMovieRequest: (
      userId: string,
      tmdbId: string,
      params: RequestParams = {},
    ) =>
      this.request<MediaRequestDto, any>({
        path: `/api/users/${userId}/requests/movies/${tmdbId}`,
        method: "PUT",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags requests
     * @name DeleteMovieRequest
     * @request DELETE:/api/users/{userId}/requests/movies/{tmdbId}
     */
    deleteMovieRequest: (
      userId: string,
      tmdbId: string,
      params: RequestParams = {},
    ) =>
      this.request<SuccessResponseDto, any>({
        path: `/api/users/${userId}/requests/movies/${tmdbId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags requests
     * @name GetSeriesRequests
     * @request GET:/api/users/{userId}/requests/series/{tmdbId}
     */
    getSeriesRequests: (
      userId: string,
      tmdbId: string,
      params: RequestParams = {},
    ) =>
      this.request<MediaRequestDto[], any>({
        path: `/api/users/${userId}/requests/series/${tmdbId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags requests
     * @name SetSeriesRequests
     * @request PUT:/api/users/{userId}/requests/series/{tmdbId}
     */
    setSeriesRequests: (
      userId: string,
      tmdbId: string,
      data: UpdateSeriesRequestsDto,
      params: RequestParams = {},
    ) =>
      this.request<MediaRequestDto[], any>({
        path: `/api/users/${userId}/requests/series/${tmdbId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags requests
     * @name GetSeriesRequestRule
     * @request GET:/api/users/{userId}/requests/series/{tmdbId}/rule
     */
    getSeriesRequestRule: (
      userId: string,
      tmdbId: string,
      params: RequestParams = {},
    ) =>
      this.request<RequestRuleDto, any>({
        path: `/api/users/${userId}/requests/series/${tmdbId}/rule`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags requests
     * @name UpdateSeriesRequestRule
     * @request PUT:/api/users/{userId}/requests/series/{tmdbId}/rule
     */
    updateSeriesRequestRule: (
      userId: string,
      tmdbId: string,
      data: RequestRuleDto,
      params: RequestParams = {},
    ) =>
      this.request<RequestRuleDto, any>({
        path: `/api/users/${userId}/requests/series/${tmdbId}/rule`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags requests
     * @name SetSeasonPreference
     * @request PUT:/api/users/{userId}/requests/series/{tmdbId}/preferences/seasons/{season}
     */
    setSeasonPreference: (
      userId: string,
      tmdbId: string,
      season: number,
      data: SetPreferenceDto,
      params: RequestParams = {},
    ) =>
      this.request<SuccessResponseDto, any>({
        path: `/api/users/${userId}/requests/series/${tmdbId}/preferences/seasons/${season}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags requests
     * @name ClearSeasonPreference
     * @request DELETE:/api/users/{userId}/requests/series/{tmdbId}/preferences/seasons/{season}
     */
    clearSeasonPreference: (
      userId: string,
      tmdbId: string,
      season: number,
      params: RequestParams = {},
    ) =>
      this.request<SuccessResponseDto, any>({
        path: `/api/users/${userId}/requests/series/${tmdbId}/preferences/seasons/${season}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags requests
     * @name SetEpisodePreference
     * @request PUT:/api/users/{userId}/requests/series/{tmdbId}/preferences/seasons/{season}/episodes/{episode}
     */
    setEpisodePreference: (
      userId: string,
      tmdbId: string,
      season: number,
      episode: number,
      data: SetPreferenceDto,
      params: RequestParams = {},
    ) =>
      this.request<SuccessResponseDto, any>({
        path: `/api/users/${userId}/requests/series/${tmdbId}/preferences/seasons/${season}/episodes/${episode}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags requests
     * @name ClearEpisodePreference
     * @request DELETE:/api/users/{userId}/requests/series/{tmdbId}/preferences/seasons/{season}/episodes/{episode}
     */
    clearEpisodePreference: (
      userId: string,
      tmdbId: string,
      season: number,
      episode: number,
      params: RequestParams = {},
    ) =>
      this.request<SuccessResponseDto, any>({
        path: `/api/users/${userId}/requests/series/${tmdbId}/preferences/seasons/${season}/episodes/${episode}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags requests
     * @name GetRequests
     * @request GET:/api/requests
     */
    getRequests: (
      query?: {
        approved?: boolean;
        page?: number;
        itemsPerPage?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        PaginatedResponseDto & {
          items: AdminMediaRequestDto[];
        },
        any
      >({
        path: `/api/requests`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags requests
     * @name UpdateRequest
     * @request PUT:/api/requests/{id}
     */
    updateRequest: (
      id: string,
      data: UpdateMediaRequestDto,
      params: RequestParams = {},
    ) =>
      this.request<AdminMediaRequestDto, any>({
        path: `/api/requests/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags requests
     * @name DeleteRequest
     * @request DELETE:/api/requests/{id}
     */
    deleteRequest: (id: string, params: RequestParams = {}) =>
      this.request<SuccessResponseDto, any>({
        path: `/api/requests/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),
  };
  library = {
    /**
     * No description
     *
     * @tags library
     * @name GetLibrarySettings
     * @request GET:/api/library/settings
     */
    getLibrarySettings: (params: RequestParams = {}) =>
      this.request<LibrarySettingsDto, any>({
        path: `/api/library/settings`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags library
     * @name UpdateLibrarySettings
     * @request PUT:/api/library/settings
     */
    updateLibrarySettings: (
      data: LibrarySettingsDto,
      query?: {
        /** Removes library folders that have indexed files in them, forgetting the files */
        force?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<LibrarySettingsDto, any>({
        path: `/api/library/settings`,
        method: "PUT",
        query: query,
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags library
     * @name GetMovieFiles
     * @request GET:/api/library/movies/{tmdbId}
     */
    getMovieFiles: (tmdbId: string, params: RequestParams = {}) =>
      this.request<LibraryFileDto[], any>({
        path: `/api/library/movies/${tmdbId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags library
     * @name GetSeriesFiles
     * @request GET:/api/library/series/{tmdbId}
     */
    getSeriesFiles: (tmdbId: string, params: RequestParams = {}) =>
      this.request<LibraryEpisodeFileDto[], any>({
        path: `/api/library/series/${tmdbId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags library
     * @name GetSeriesStatus
     * @request GET:/api/library/series/{tmdbId}/status
     */
    getSeriesStatus: (tmdbId: string, params: RequestParams = {}) =>
      this.request<SeriesStatusDto, any>({
        path: `/api/library/series/${tmdbId}/status`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags library
     * @name GetEpisodeFiles
     * @request GET:/api/library/series/{tmdbId}/seasons/{season}/episodes/{episode}
     */
    getEpisodeFiles: (
      tmdbId: string,
      season: number,
      episode: number,
      params: RequestParams = {},
    ) =>
      this.request<LibraryEpisodeFileDto[], any>({
        path: `/api/library/series/${tmdbId}/seasons/${season}/episodes/${episode}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags library
     * @name GetSubtitles
     * @request GET:/api/library/files/{id}/subtitles/{fileName}
     */
    getSubtitles: (id: string, fileName: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/library/files/${id}/subtitles/${fileName}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags library
     * @name StreamFile
     * @request GET:/api/library/files/{id}/stream
     */
    streamFile: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/library/files/${id}/stream`,
        method: "GET",
        ...params,
      }),
  };
  server = {
    /**
     * No description
     *
     * @tags server
     * @name GetJobs
     * @request GET:/api/server/jobs
     */
    getJobs: (
      query?: {
        status?: "queued" | "running" | "completed" | "failed";
        type?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<JobDto[], any>({
        path: `/api/server/jobs`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags server
     * @name RetryJob
     * @request POST:/api/server/jobs/{id}/retry
     */
    retryJob: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/server/jobs/${id}/retry`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags server
     * @name DeleteJob
     * @request DELETE:/api/server/jobs/{id}
     */
    deleteJob: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/server/jobs/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags server
     * @name GetLibraryEntries
     * @request GET:/api/server/library
     */
    getLibraryEntries: (
      query: {
        folder: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<ServerLibraryEntryDto[], any>({
        path: `/api/server/library`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags server
     * @name PreviewLibraryScan
     * @request GET:/api/server/library/scan
     */
    previewLibraryScan: (
      query: {
        folder: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<LibraryScanPreviewDto, any>({
        path: `/api/server/library/scan`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags server
     * @name ScanLibrary
     * @request POST:/api/server/library/scan
     */
    scanLibrary: (data: ScanLibraryDto, params: RequestParams = {}) =>
      this.request<ScanLibraryResultDto, any>({
        path: `/api/server/library/scan`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags server
     * @name PreviewCleanup
     * @request GET:/api/server/library/cleanup
     */
    previewCleanup: (params: RequestParams = {}) =>
      this.request<CleanupPreviewDto, any>({
        path: `/api/server/library/cleanup`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags server
     * @name RunCleanup
     * @request POST:/api/server/library/cleanup
     */
    runCleanup: (params: RequestParams = {}) =>
      this.request<CleanupPreviewDto, any>({
        path: `/api/server/library/cleanup`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags server
     * @name RequestLibraryEntries
     * @request POST:/api/server/library/request
     */
    requestLibraryEntries: (
      data: LibraryEntriesDto,
      params: RequestParams = {},
    ) =>
      this.request<RequestLibraryEntriesResultDto, any>({
        path: `/api/server/library/request`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags server
     * @name ManageLibraryEntries
     * @request POST:/api/server/library/manage
     */
    manageLibraryEntries: (
      data: LibraryEntriesDto,
      params: RequestParams = {},
    ) =>
      this.request<ManageLibraryEntriesResultDto, any>({
        path: `/api/server/library/manage`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags server
     * @name UnmanageLibraryEntries
     * @request POST:/api/server/library/unmanage
     */
    unmanageLibraryEntries: (
      data: LibraryEntriesDto,
      params: RequestParams = {},
    ) =>
      this.request<ManageLibraryEntriesResultDto, any>({
        path: `/api/server/library/unmanage`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags server
     * @name DeleteLibraryEntries
     * @request POST:/api/server/library/delete
     */
    deleteLibraryEntries: (
      data: DeleteLibraryEntriesDto,
      params: RequestParams = {},
    ) =>
      this.request<DeleteLibraryEntriesResultDto, any>({
        path: `/api/server/library/delete`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  indexers = {
    /**
     * No description
     *
     * @tags indexers
     * @name GetIndexers
     * @request GET:/api/indexers
     */
    getIndexers: (params: RequestParams = {}) =>
      this.request<IndexerSettingsDto, any>({
        path: `/api/indexers`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags indexers
     * @name UpdateIndexers
     * @request PUT:/api/indexers
     */
    updateIndexers: (data: IndexerSettingsDto, params: RequestParams = {}) =>
      this.request<IndexerSettingsDto, any>({
        path: `/api/indexers`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags indexers
     * @name SearchSeriesReleases
     * @request GET:/api/indexers/search/series/{tmdbId}
     */
    searchSeriesReleases: (
      tmdbId: string,
      query: {
        season: number;
        /** Omit to search for season packs */
        episode?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<ReleaseDto[], any>({
        path: `/api/indexers/search/series/${tmdbId}`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),
  };
  downloads = {
    /**
     * No description
     *
     * @tags downloads
     * @name GetDownloadSettings
     * @request GET:/api/downloads/settings
     */
    getDownloadSettings: (params: RequestParams = {}) =>
      this.request<DownloadSettingsDto, any>({
        path: `/api/downloads/settings`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags downloads
     * @name UpdateDownloadSettings
     * @request PUT:/api/downloads/settings
     */
    updateDownloadSettings: (
      data: DownloadSettingsDto,
      params: RequestParams = {},
    ) =>
      this.request<DownloadSettingsDto, any>({
        path: `/api/downloads/settings`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags downloads
     * @name GetTorrents
     * @request GET:/api/downloads/torrents
     */
    getTorrents: (params: RequestParams = {}) =>
      this.request<TorrentWithItemsDto[], any>({
        path: `/api/downloads/torrents`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  serverLog = {
    /**
     * No description
     *
     * @tags server-log
     * @name GetServerLogEntries
     * @request GET:/api/server-log/entries
     */
    getServerLogEntries: (
      query?: {
        type?: "file.deleted" | "download.deleted" | "scan.failed";
        page?: number;
        itemsPerPage?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        PaginatedResponseDto & {
          items: LogEntryDto[];
        },
        any
      >({
        path: `/api/server-log/entries`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags server-log
     * @name GetServerLogSettings
     * @request GET:/api/server-log/settings
     */
    getServerLogSettings: (params: RequestParams = {}) =>
      this.request<ServerLogSettingsDto, any>({
        path: `/api/server-log/settings`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags server-log
     * @name UpdateServerLogSettings
     * @request PUT:/api/server-log/settings
     */
    updateServerLogSettings: (
      data: ServerLogSettingsDto,
      params: RequestParams = {},
    ) =>
      this.request<ServerLogSettingsDto, any>({
        path: `/api/server-log/settings`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  myList = {
    /**
     * No description
     *
     * @tags myList
     * @name GetMyList
     * @request GET:/api/users/{userId}/my-list
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
          items: MyListItemDto[];
        },
        any
      >({
        path: `/api/users/${userId}/my-list`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags myList
     * @name SetMyListItem
     * @request PUT:/api/users/{userId}/my-list/{tmdbId}
     */
    setMyListItem: (
      userId: string,
      tmdbId: string,
      query: {
        inMyList: boolean;
        mediaType: "movie" | "series";
      },
      params: RequestParams = {},
    ) =>
      this.request<SuccessResponseDto, any>({
        path: `/api/users/${userId}/my-list/${tmdbId}`,
        method: "PUT",
        query: query,
        format: "json",
        ...params,
      }),
  };
}
