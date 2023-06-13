/* eslint-disable */
/* this is a generated file, do not edit */
import client from "$lib/apollo-client";
import type {
        ApolloQueryResult, ObservableQuery, WatchQueryOptions, MutationOptions
      } from "@apollo/client";
import { readable } from "svelte/store";
import type { Readable } from "svelte/store";
import gql from "graphql-tag"
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string | number; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  BigInt: { input: any; output: any; }
  DateTime: { input: any; output: any; }
};

export enum DownloadableMediaState {
  Downloaded = 'DOWNLOADED',
  Downloading = 'DOWNLOADING',
  Missing = 'MISSING',
  Processed = 'PROCESSED',
  Searching = 'SEARCHING'
}

export type DownloadingMedia = {
  __typename?: 'DownloadingMedia';
  id: Scalars['String']['output'];
  quality: Scalars['String']['output'];
  resourceId: Scalars['Float']['output'];
  resourceType: FileType;
  tag: Scalars['String']['output'];
  title: Scalars['String']['output'];
  torrent: Scalars['String']['output'];
};

export type EnrichedMovie = {
  __typename?: 'EnrichedMovie';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['Float']['output'];
  originalTitle?: Maybe<Scalars['String']['output']>;
  overview: Scalars['String']['output'];
  posterPath?: Maybe<Scalars['String']['output']>;
  releaseDate: Scalars['String']['output'];
  runtime?: Maybe<Scalars['Float']['output']>;
  state: DownloadableMediaState;
  title: Scalars['String']['output'];
  tmdbId: Scalars['Float']['output'];
  updatedAt: Scalars['DateTime']['output'];
  voteAverage: Scalars['Float']['output'];
};

export type EnrichedTvEpisode = {
  __typename?: 'EnrichedTVEpisode';
  createdAt: Scalars['DateTime']['output'];
  episodeNumber: Scalars['Float']['output'];
  id: Scalars['Float']['output'];
  releaseDate: Scalars['String']['output'];
  seasonNumber: Scalars['Float']['output'];
  state: DownloadableMediaState;
  tvShow: TvShow;
  updatedAt: Scalars['DateTime']['output'];
  voteAverage?: Maybe<Scalars['Float']['output']>;
};

export type EnrichedTvShow = {
  __typename?: 'EnrichedTVShow';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['Float']['output'];
  originalTitle?: Maybe<Scalars['String']['output']>;
  overview: Scalars['String']['output'];
  posterPath?: Maybe<Scalars['String']['output']>;
  releaseDate: Scalars['String']['output'];
  runtime?: Maybe<Scalars['Float']['output']>;
  title: Scalars['String']['output'];
  tmdbId: Scalars['Float']['output'];
  updatedAt: Scalars['DateTime']['output'];
  voteAverage: Scalars['Float']['output'];
};

export enum Entertainment {
  Movie = 'Movie',
  TvShow = 'TvShow'
}

export enum FileType {
  Episode = 'EPISODE',
  Movie = 'MOVIE',
  Season = 'SEASON'
}

export type GetTorrentStatusInput = {
  resourceId: Scalars['Int']['input'];
  resourceType: FileType;
};

export type GraphQlCommonResponse = {
  __typename?: 'GraphQLCommonResponse';
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type JackettFormattedResult = {
  __typename?: 'JackettFormattedResult';
  downloadLink: Scalars['String']['output'];
  id: Scalars['String']['output'];
  link: Scalars['String']['output'];
  normalizedTitle: Scalars['String']['output'];
  normalizedTitleParts: Array<Scalars['String']['output']>;
  peers: Scalars['Float']['output'];
  publishDate: Scalars['String']['output'];
  quality: Scalars['String']['output'];
  qualityScore: Scalars['Float']['output'];
  seeders: Scalars['Float']['output'];
  size: Scalars['BigInt']['output'];
  tag: Scalars['String']['output'];
  tagScore: Scalars['Float']['output'];
  title: Scalars['String']['output'];
};

export type JackettInput = {
  downloadLink: Scalars['String']['input'];
  quality: Scalars['String']['input'];
  tag: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type LibraryCalendar = {
  __typename?: 'LibraryCalendar';
  movies: Array<EnrichedMovie>;
  tvEpisodes: Array<EnrichedTvEpisode>;
};

export type LibraryFileDetails = {
  __typename?: 'LibraryFileDetails';
  id: Scalars['Float']['output'];
  libraryFileSize?: Maybe<Scalars['BigInt']['output']>;
  libraryPath: Scalars['String']['output'];
  torrentFileName?: Maybe<Scalars['String']['output']>;
};

export type Movie = {
  __typename?: 'Movie';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['Float']['output'];
  state: DownloadableMediaState;
  title: Scalars['String']['output'];
  tmdbId: Scalars['Float']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  clearRedisCache: GraphQlCommonResponse;
  downloadMovie: GraphQlCommonResponse;
  downloadOwnTorrent: GraphQlCommonResponse;
  downloadSeason: GraphQlCommonResponse;
  downloadTVEpisode: GraphQlCommonResponse;
  removeMovie: GraphQlCommonResponse;
  removeTVShow: GraphQlCommonResponse;
  resetLibrary: GraphQlCommonResponse;
  saveQualityParams: GraphQlCommonResponse;
  saveTags: GraphQlCommonResponse;
  startDownloadMissingJob: GraphQlCommonResponse;
  startFindNewEpisodesJob: GraphQlCommonResponse;
  startScanLibraryJob: GraphQlCommonResponse;
  trackMovie: Movie;
  trackTVShow: TvShow;
  updateParams: GraphQlCommonResponse;
};


export type MutationDownloadMovieArgs = {
  jackettResult: JackettInput;
  movieId: Scalars['Int']['input'];
};


export type MutationDownloadOwnTorrentArgs = {
  mediaId: Scalars['Int']['input'];
  mediaType: FileType;
  torrent: Scalars['String']['input'];
};


export type MutationDownloadSeasonArgs = {
  jackettResult: JackettInput;
  seasonNumber: Scalars['Int']['input'];
  tvShowTMDBId: Scalars['Int']['input'];
};


export type MutationDownloadTvEpisodeArgs = {
  episodeId: Scalars['Int']['input'];
  jackettResult: JackettInput;
};


export type MutationRemoveMovieArgs = {
  tmdbId: Scalars['Int']['input'];
};


export type MutationRemoveTvShowArgs = {
  tmdbId: Scalars['Int']['input'];
};


export type MutationResetLibraryArgs = {
  deleteFiles: Scalars['Boolean']['input'];
  resetSettings: Scalars['Boolean']['input'];
};


export type MutationSaveQualityParamsArgs = {
  qualities: Array<QualityInput>;
};


export type MutationSaveTagsArgs = {
  tags: Array<TagInput>;
};


export type MutationTrackMovieArgs = {
  title: Scalars['String']['input'];
  tmdbId: Scalars['Int']['input'];
};


export type MutationTrackTvShowArgs = {
  seasonNumbers: Array<Scalars['Int']['input']>;
  tmdbId: Scalars['Int']['input'];
};


export type MutationUpdateParamsArgs = {
  params: Array<UpdateParamsInput>;
};

export type OmdbInfo = {
  __typename?: 'OMDBInfo';
  ratings: Ratings;
};

export type ParamsHash = {
  __typename?: 'ParamsHash';
  jackett_api_key: Scalars['String']['output'];
  language: Scalars['String']['output'];
  max_movie_download_size: Scalars['String']['output'];
  max_tvshow_episode_download_size: Scalars['String']['output'];
  organize_library_strategy: Scalars['String']['output'];
  region: Scalars['String']['output'];
  tmdb_api_key: Scalars['String']['output'];
};

export type Quality = {
  __typename?: 'Quality';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['Float']['output'];
  match: Array<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  score: Scalars['Float']['output'];
  type: Entertainment;
  updatedAt: Scalars['DateTime']['output'];
};

export type QualityInput = {
  id: Scalars['Float']['input'];
  score: Scalars['Float']['input'];
};

export type Query = {
  __typename?: 'Query';
  discover: TmdbPaginatedResult;
  getCalendar: LibraryCalendar;
  getDownloadingMedias: Array<DownloadingMedia>;
  getGenres: TmdbGenresResults;
  getLanguages: Array<TmdbLanguagesResult>;
  getMissingMovies: Array<EnrichedMovie>;
  getMissingTVEpisodes: Array<EnrichedTvEpisode>;
  getMovieFileDetails: LibraryFileDetails;
  getMovies: Array<EnrichedMovie>;
  getParams: ParamsHash;
  getPopular: TmdbSearchResults;
  getQualityParams: Array<Quality>;
  getRecommendedMovies: Array<TmdbSearchResult>;
  getRecommendedTVShows: Array<TmdbSearchResult>;
  getSearchingMedias: Array<SearchingMedia>;
  getTVSeasonDetails: Array<EnrichedTvEpisode>;
  getTVShowSeasons: Array<TmdbFormattedTvSeason>;
  getTVShows: Array<EnrichedTvShow>;
  getTags: Array<Tag>;
  getTorrentStatus: Array<TorrentStatus>;
  omdbSearch: OmdbInfo;
  search: TmdbSearchResults;
  searchJackett: Array<JackettFormattedResult>;
};


export type QueryDiscoverArgs = {
  entertainment?: InputMaybe<Entertainment>;
  genres?: InputMaybe<Array<Scalars['Float']['input']>>;
  originLanguage?: InputMaybe<Scalars['String']['input']>;
  page?: InputMaybe<Scalars['Float']['input']>;
  primaryReleaseYear?: InputMaybe<Scalars['String']['input']>;
  score?: InputMaybe<Scalars['Float']['input']>;
};


export type QueryGetMovieFileDetailsArgs = {
  tmdbId: Scalars['Int']['input'];
};


export type QueryGetQualityParamsArgs = {
  type: Entertainment;
};


export type QueryGetTvSeasonDetailsArgs = {
  seasonNumber: Scalars['Int']['input'];
  tvShowTMDBId: Scalars['Int']['input'];
};


export type QueryGetTvShowSeasonsArgs = {
  tvShowTMDBId: Scalars['Int']['input'];
};


export type QueryGetTorrentStatusArgs = {
  torrents: Array<GetTorrentStatusInput>;
};


export type QueryOmdbSearchArgs = {
  title: Scalars['String']['input'];
};


export type QuerySearchArgs = {
  query: Scalars['String']['input'];
};


export type QuerySearchJackettArgs = {
  query: Scalars['String']['input'];
};

export type Ratings = {
  __typename?: 'Ratings';
  IMDB?: Maybe<Scalars['String']['output']>;
  metaCritic?: Maybe<Scalars['String']['output']>;
  rottenTomatoes?: Maybe<Scalars['String']['output']>;
};

export type SearchingMedia = {
  __typename?: 'SearchingMedia';
  id: Scalars['String']['output'];
  resourceId: Scalars['Float']['output'];
  resourceType: FileType;
  title: Scalars['String']['output'];
};

export type TmdbFormattedTvEpisode = {
  __typename?: 'TMDBFormattedTVEpisode';
  airDate?: Maybe<Scalars['String']['output']>;
  episodeNumber: Scalars['Float']['output'];
  id: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  overview: Scalars['String']['output'];
  seasonNumber: Scalars['Float']['output'];
  stillPath?: Maybe<Scalars['String']['output']>;
  voteAverage?: Maybe<Scalars['Float']['output']>;
  voteCount?: Maybe<Scalars['Float']['output']>;
};

export type TmdbFormattedTvSeason = {
  __typename?: 'TMDBFormattedTVSeason';
  airDate?: Maybe<Scalars['String']['output']>;
  episodeCount?: Maybe<Scalars['Float']['output']>;
  episodes?: Maybe<Array<TmdbFormattedTvEpisode>>;
  id: Scalars['Float']['output'];
  inLibrary: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  overview?: Maybe<Scalars['String']['output']>;
  posterPath?: Maybe<Scalars['String']['output']>;
  seasonNumber: Scalars['Float']['output'];
};

export type TmdbGenresResult = {
  __typename?: 'TMDBGenresResult';
  id: Scalars['Float']['output'];
  name: Scalars['String']['output'];
};

export type TmdbGenresResults = {
  __typename?: 'TMDBGenresResults';
  movieGenres: Array<TmdbGenresResult>;
  tvShowGenres: Array<TmdbGenresResult>;
};

export type TmdbLanguagesResult = {
  __typename?: 'TMDBLanguagesResult';
  code: Scalars['String']['output'];
  language: Scalars['String']['output'];
};

export type TmdbPaginatedResult = {
  __typename?: 'TMDBPaginatedResult';
  page: Scalars['Float']['output'];
  results: Array<TmdbSearchResult>;
  totalPages: Scalars['Float']['output'];
  totalResults: Scalars['Float']['output'];
};

export type TmdbSearchResult = {
  __typename?: 'TMDBSearchResult';
  id: Scalars['Float']['output'];
  overview: Scalars['String']['output'];
  posterPath?: Maybe<Scalars['String']['output']>;
  releaseDate?: Maybe<Scalars['String']['output']>;
  runtime?: Maybe<Scalars['Float']['output']>;
  title: Scalars['String']['output'];
  tmdbId: Scalars['Float']['output'];
  voteAverage: Scalars['Float']['output'];
};

export type TmdbSearchResults = {
  __typename?: 'TMDBSearchResults';
  movies: Array<TmdbSearchResult>;
  tvShows: Array<TmdbSearchResult>;
};

export type TvShow = {
  __typename?: 'TVShow';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['Float']['output'];
  title: Scalars['String']['output'];
  tmdbId: Scalars['Float']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type Tag = {
  __typename?: 'Tag';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  score: Scalars['Float']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type TagInput = {
  name: Scalars['String']['input'];
  score: Scalars['Float']['input'];
};

export type TorrentStatus = {
  __typename?: 'TorrentStatus';
  id: Scalars['Int']['output'];
  percentDone: Scalars['Float']['output'];
  rateDownload: Scalars['Int']['output'];
  rateUpload: Scalars['Int']['output'];
  resourceId: Scalars['Int']['output'];
  resourceType: FileType;
  status: Scalars['Int']['output'];
  totalSize: Scalars['BigInt']['output'];
  uploadRatio: Scalars['Float']['output'];
  uploadedEver: Scalars['BigInt']['output'];
};

export type UpdateParamsInput = {
  key: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type ClearCacheMutationVariables = Exact<{ [key: string]: never; }>;


export type ClearCacheMutation = { __typename?: 'Mutation', result: { __typename?: 'GraphQLCommonResponse', success: boolean, message?: string | null } };

export type DownloadOwnTorrentMutationVariables = Exact<{
  mediaId: Scalars['Int']['input'];
  mediaType: FileType;
  torrent: Scalars['String']['input'];
}>;


export type DownloadOwnTorrentMutation = { __typename?: 'Mutation', downloadOwnTorrent: { __typename?: 'GraphQLCommonResponse', success: boolean, message?: string | null } };

export type StartScanLibraryMutationVariables = Exact<{ [key: string]: never; }>;


export type StartScanLibraryMutation = { __typename?: 'Mutation', result: { __typename?: 'GraphQLCommonResponse', success: boolean, message?: string | null } };

export type StartFindNewEpisodesMutationVariables = Exact<{ [key: string]: never; }>;


export type StartFindNewEpisodesMutation = { __typename?: 'Mutation', result: { __typename?: 'GraphQLCommonResponse', success: boolean, message?: string | null } };

export type StartDownloadMissingMutationVariables = Exact<{ [key: string]: never; }>;


export type StartDownloadMissingMutation = { __typename?: 'Mutation', result: { __typename?: 'GraphQLCommonResponse', success: boolean, message?: string | null } };

export type DownloadMovieMutationVariables = Exact<{
  movieId: Scalars['Int']['input'];
  jackettResult: JackettInput;
}>;


export type DownloadMovieMutation = { __typename?: 'Mutation', result: { __typename?: 'GraphQLCommonResponse', success: boolean, message?: string | null } };

export type DownloadTvEpisodeMutationVariables = Exact<{
  episodeId: Scalars['Int']['input'];
  jackettResult: JackettInput;
}>;


export type DownloadTvEpisodeMutation = { __typename?: 'Mutation', result: { __typename?: 'GraphQLCommonResponse', success: boolean, message?: string | null } };

export type DownloadSeasonMutationVariables = Exact<{
  tvShowTMDBId: Scalars['Int']['input'];
  seasonNumber: Scalars['Int']['input'];
  jackettResult: JackettInput;
}>;


export type DownloadSeasonMutation = { __typename?: 'Mutation', result: { __typename?: 'GraphQLCommonResponse', success: boolean, message?: string | null } };

export type RemoveMovieMutationVariables = Exact<{
  tmdbId: Scalars['Int']['input'];
}>;


export type RemoveMovieMutation = { __typename?: 'Mutation', result: { __typename?: 'GraphQLCommonResponse', success: boolean, message?: string | null } };

export type RemoveTvShowMutationVariables = Exact<{
  tmdbId: Scalars['Int']['input'];
}>;


export type RemoveTvShowMutation = { __typename?: 'Mutation', result: { __typename?: 'GraphQLCommonResponse', success: boolean, message?: string | null } };

export type ResetLibraryMutationVariables = Exact<{
  deleteFiles: Scalars['Boolean']['input'];
  resetSettings: Scalars['Boolean']['input'];
}>;


export type ResetLibraryMutation = { __typename?: 'Mutation', result: { __typename?: 'GraphQLCommonResponse', success: boolean, message?: string | null } };

export type SaveQualityMutationVariables = Exact<{
  qualities: Array<QualityInput> | QualityInput;
}>;


export type SaveQualityMutation = { __typename?: 'Mutation', result: { __typename?: 'GraphQLCommonResponse', success: boolean, message?: string | null } };

export type SaveTagsMutationVariables = Exact<{
  tags: Array<TagInput> | TagInput;
}>;


export type SaveTagsMutation = { __typename?: 'Mutation', result: { __typename?: 'GraphQLCommonResponse', success: boolean, message?: string | null } };

export type TrackMovieMutationVariables = Exact<{
  title: Scalars['String']['input'];
  tmdbId: Scalars['Int']['input'];
}>;


export type TrackMovieMutation = { __typename?: 'Mutation', movie: { __typename?: 'Movie', id: number } };

export type TrackTvShowMutationVariables = Exact<{
  tmdbId: Scalars['Int']['input'];
  seasonNumbers: Array<Scalars['Int']['input']> | Scalars['Int']['input'];
}>;


export type TrackTvShowMutation = { __typename?: 'Mutation', tvShow: { __typename?: 'TVShow', id: number } };

export type UpdateParamsMutationVariables = Exact<{
  params: Array<UpdateParamsInput> | UpdateParamsInput;
}>;


export type UpdateParamsMutation = { __typename?: 'Mutation', result: { __typename?: 'GraphQLCommonResponse', success: boolean, message?: string | null } };

export type GetCalendarQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCalendarQuery = { __typename?: 'Query', calendar: { __typename?: 'LibraryCalendar', movies: Array<{ __typename?: 'EnrichedMovie', id: number, title: string, state: DownloadableMediaState, releaseDate: string }>, tvEpisodes: Array<{ __typename?: 'EnrichedTVEpisode', id: number, episodeNumber: number, seasonNumber: number, state: DownloadableMediaState, releaseDate: string, tvShow: { __typename?: 'TVShow', id: number, title: string } }> } };

export type GetDiscoverQueryVariables = Exact<{
  entertainment?: InputMaybe<Entertainment>;
  originLanguage?: InputMaybe<Scalars['String']['input']>;
  primaryReleaseYear?: InputMaybe<Scalars['String']['input']>;
  score?: InputMaybe<Scalars['Float']['input']>;
  genres?: InputMaybe<Array<Scalars['Float']['input']> | Scalars['Float']['input']>;
  page?: InputMaybe<Scalars['Float']['input']>;
}>;


export type GetDiscoverQuery = { __typename?: 'Query', TMDBResults: { __typename?: 'TMDBPaginatedResult', page: number, totalResults: number, totalPages: number, results: Array<{ __typename?: 'TMDBSearchResult', id: number, tmdbId: number, title: string, posterPath?: string | null, overview: string, runtime?: number | null, voteAverage: number, releaseDate?: string | null }> } };

export type GetDownloadingQueryVariables = Exact<{ [key: string]: never; }>;


export type GetDownloadingQuery = { __typename?: 'Query', searching: Array<{ __typename?: 'SearchingMedia', id: string, title: string, resourceId: number, resourceType: FileType }>, downloading: Array<{ __typename?: 'DownloadingMedia', id: string, title: string, tag: string, quality: string, torrent: string, resourceId: number, resourceType: FileType }> };

export type GetGenresQueryVariables = Exact<{ [key: string]: never; }>;


export type GetGenresQuery = { __typename?: 'Query', genres: { __typename?: 'TMDBGenresResults', movieGenres: Array<{ __typename?: 'TMDBGenresResult', id: number, name: string }>, tvShowGenres: Array<{ __typename?: 'TMDBGenresResult', id: number, name: string }> } };

export type GetLanguagesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetLanguagesQuery = { __typename?: 'Query', languages: Array<{ __typename?: 'TMDBLanguagesResult', code: string, language: string }> };

export type GetLibraryMoviesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetLibraryMoviesQuery = { __typename?: 'Query', movies: Array<{ __typename?: 'EnrichedMovie', id: number, tmdbId: number, title: string, originalTitle?: string | null, state: DownloadableMediaState, posterPath?: string | null, overview: string, runtime?: number | null, voteAverage: number, releaseDate: string, createdAt: any, updatedAt: any }> };

export type GetLibraryTvShowsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetLibraryTvShowsQuery = { __typename?: 'Query', tvShows: Array<{ __typename?: 'EnrichedTVShow', id: number, tmdbId: number, title: string, originalTitle?: string | null, posterPath?: string | null, runtime?: number | null, overview: string, voteAverage: number, releaseDate: string, createdAt: any, updatedAt: any }> };

export type MissingTvEpisodesFragment = { __typename?: 'EnrichedTVEpisode', id: number, seasonNumber: number, episodeNumber: number, releaseDate: string, tvShow: { __typename?: 'TVShow', id: number, title: string } };

export type MissingMoviesFragment = { __typename?: 'EnrichedMovie', id: number, title: string, releaseDate: string };

export type GetMissingQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMissingQuery = { __typename?: 'Query', tvEpisodes: Array<{ __typename?: 'EnrichedTVEpisode', id: number, seasonNumber: number, episodeNumber: number, releaseDate: string, tvShow: { __typename?: 'TVShow', id: number, title: string } }>, movies: Array<{ __typename?: 'EnrichedMovie', id: number, title: string, releaseDate: string }> };

export type GetMovieFileDetailsQueryVariables = Exact<{
  tmdbId: Scalars['Int']['input'];
}>;


export type GetMovieFileDetailsQuery = { __typename?: 'Query', details: { __typename?: 'LibraryFileDetails', id: number, libraryPath: string, libraryFileSize?: any | null, torrentFileName?: string | null } };

export type GetParamsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetParamsQuery = { __typename?: 'Query', params: { __typename?: 'ParamsHash', region: string, language: string, tmdb_api_key: string, jackett_api_key: string, max_movie_download_size: string, max_tvshow_episode_download_size: string, organize_library_strategy: string } };

export type GetPopularQueryVariables = Exact<{ [key: string]: never; }>;


export type GetPopularQuery = { __typename?: 'Query', results: { __typename?: 'TMDBSearchResults', movies: Array<{ __typename?: 'TMDBSearchResult', id: number, tmdbId: number, title: string, releaseDate?: string | null, posterPath?: string | null, overview: string, runtime?: number | null, voteAverage: number }>, tvShows: Array<{ __typename?: 'TMDBSearchResult', id: number, tmdbId: number, title: string, releaseDate?: string | null, posterPath?: string | null, overview: string, runtime?: number | null, voteAverage: number }> } };

export type GetQualityQueryVariables = Exact<{
  type: Entertainment;
}>;


export type GetQualityQuery = { __typename?: 'Query', qualities: Array<{ __typename?: 'Quality', id: number, name: string, match: Array<string>, score: number, updatedAt: any, createdAt: any, type: Entertainment }> };

export type GetRecommendedQueryVariables = Exact<{ [key: string]: never; }>;


export type GetRecommendedQuery = { __typename?: 'Query', tvShows: Array<{ __typename?: 'TMDBSearchResult', id: number, tmdbId: number, title: string, releaseDate?: string | null, posterPath?: string | null, overview: string, runtime?: number | null, voteAverage: number }>, movies: Array<{ __typename?: 'TMDBSearchResult', id: number, tmdbId: number, title: string, releaseDate?: string | null, posterPath?: string | null, overview: string, runtime?: number | null, voteAverage: number }> };

export type GetTagsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTagsQuery = { __typename?: 'Query', tags: Array<{ __typename?: 'Tag', id: number, name: string, score: number, createdAt: any, updatedAt: any }> };

export type GetTorrentStatusQueryVariables = Exact<{
  torrents: Array<GetTorrentStatusInput> | GetTorrentStatusInput;
}>;


export type GetTorrentStatusQuery = { __typename?: 'Query', torrents: Array<{ __typename?: 'TorrentStatus', id: number, resourceId: number, resourceType: FileType, percentDone: number, rateDownload: number, rateUpload: number, uploadRatio: number, uploadedEver: any, totalSize: any, status: number }> };

export type GetTvSeasonDetailsQueryVariables = Exact<{
  tvShowTMDBId: Scalars['Int']['input'];
  seasonNumber: Scalars['Int']['input'];
}>;


export type GetTvSeasonDetailsQuery = { __typename?: 'Query', episodes: Array<{ __typename?: 'EnrichedTVEpisode', id: number, episodeNumber: number, seasonNumber: number, state: DownloadableMediaState, updatedAt: any, voteAverage?: number | null, releaseDate: string, createdAt: any, tvShow: { __typename?: 'TVShow', id: number, title: string, tmdbId: number, updatedAt: any, createdAt: any } }> };

export type GetTvShowSeasonsQueryVariables = Exact<{
  tvShowTMDBId: Scalars['Int']['input'];
}>;


export type GetTvShowSeasonsQuery = { __typename?: 'Query', seasons: Array<{ __typename?: 'TMDBFormattedTVSeason', id: number, name: string, seasonNumber: number, episodeCount?: number | null, overview?: string | null, posterPath?: string | null, airDate?: string | null, inLibrary: boolean }> };

export type OmdbSearchQueryVariables = Exact<{
  title: Scalars['String']['input'];
}>;


export type OmdbSearchQuery = { __typename?: 'Query', result: { __typename?: 'OMDBInfo', ratings: { __typename?: 'Ratings', IMDB?: string | null, rottenTomatoes?: string | null, metaCritic?: string | null } } };

export type SearchTorrentQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type SearchTorrentQuery = { __typename?: 'Query', results: Array<{ __typename?: 'JackettFormattedResult', id: string, title: string, quality: string, qualityScore: number, seeders: number, peers: number, link: string, downloadLink: string, tag: string, tagScore: number, normalizedTitle: string, normalizedTitleParts: Array<string>, size: any, publishDate: string }> };

export type SearchQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type SearchQuery = { __typename?: 'Query', results: { __typename?: 'TMDBSearchResults', movies: Array<{ __typename?: 'TMDBSearchResult', id: number, tmdbId: number, title: string, releaseDate?: string | null, posterPath?: string | null, overview: string, runtime?: number | null, voteAverage: number }>, tvShows: Array<{ __typename?: 'TMDBSearchResult', id: number, tmdbId: number, title: string, releaseDate?: string | null, posterPath?: string | null, overview: string, runtime?: number | null, voteAverage: number }> } };

export const MissingTvEpisodesFragmentDoc = gql`
    fragment MissingTVEpisodes on EnrichedTVEpisode {
  id
  seasonNumber
  episodeNumber
  releaseDate
  tvShow {
    id
    title
  }
}
    `;
export const MissingMoviesFragmentDoc = gql`
    fragment MissingMovies on EnrichedMovie {
  id
  title
  releaseDate
}
    `;
export const ClearCacheDoc = gql`
    mutation clearCache {
  result: clearRedisCache {
    success
    message
  }
}
    `;
export const DownloadOwnTorrentDoc = gql`
    mutation downloadOwnTorrent($mediaId: Int!, $mediaType: FileType!, $torrent: String!) {
  downloadOwnTorrent(mediaId: $mediaId, mediaType: $mediaType, torrent: $torrent) {
    success
    message
  }
}
    `;
export const StartScanLibraryDoc = gql`
    mutation startScanLibrary {
  result: startScanLibraryJob {
    success
    message
  }
}
    `;
export const StartFindNewEpisodesDoc = gql`
    mutation startFindNewEpisodes {
  result: startFindNewEpisodesJob {
    success
    message
  }
}
    `;
export const StartDownloadMissingDoc = gql`
    mutation startDownloadMissing {
  result: startDownloadMissingJob {
    success
    message
  }
}
    `;
export const DownloadMovieDoc = gql`
    mutation downloadMovie($movieId: Int!, $jackettResult: JackettInput!) {
  result: downloadMovie(movieId: $movieId, jackettResult: $jackettResult) {
    success
    message
  }
}
    `;
export const DownloadTvEpisodeDoc = gql`
    mutation downloadTVEpisode($episodeId: Int!, $jackettResult: JackettInput!) {
  result: downloadTVEpisode(episodeId: $episodeId, jackettResult: $jackettResult) {
    success
    message
  }
}
    `;
export const DownloadSeasonDoc = gql`
    mutation downloadSeason($tvShowTMDBId: Int!, $seasonNumber: Int!, $jackettResult: JackettInput!) {
  result: downloadSeason(
    tvShowTMDBId: $tvShowTMDBId
    seasonNumber: $seasonNumber
    jackettResult: $jackettResult
  ) {
    success
    message
  }
}
    `;
export const RemoveMovieDoc = gql`
    mutation removeMovie($tmdbId: Int!) {
  result: removeMovie(tmdbId: $tmdbId) {
    success
    message
  }
}
    `;
export const RemoveTvShowDoc = gql`
    mutation removeTVShow($tmdbId: Int!) {
  result: removeTVShow(tmdbId: $tmdbId) {
    success
    message
  }
}
    `;
export const ResetLibraryDoc = gql`
    mutation resetLibrary($deleteFiles: Boolean!, $resetSettings: Boolean!) {
  result: resetLibrary(deleteFiles: $deleteFiles, resetSettings: $resetSettings) {
    success
    message
  }
}
    `;
export const SaveQualityDoc = gql`
    mutation saveQuality($qualities: [QualityInput!]!) {
  result: saveQualityParams(qualities: $qualities) {
    success
    message
  }
}
    `;
export const SaveTagsDoc = gql`
    mutation saveTags($tags: [TagInput!]!) {
  result: saveTags(tags: $tags) {
    success
    message
  }
}
    `;
export const TrackMovieDoc = gql`
    mutation trackMovie($title: String!, $tmdbId: Int!) {
  movie: trackMovie(title: $title, tmdbId: $tmdbId) {
    id
  }
}
    `;
export const TrackTvShowDoc = gql`
    mutation trackTVShow($tmdbId: Int!, $seasonNumbers: [Int!]!) {
  tvShow: trackTVShow(tmdbId: $tmdbId, seasonNumbers: $seasonNumbers) {
    id
  }
}
    `;
export const UpdateParamsDoc = gql`
    mutation updateParams($params: [UpdateParamsInput!]!) {
  result: updateParams(params: $params) {
    success
    message
  }
}
    `;
export const GetCalendarDoc = gql`
    query getCalendar {
  calendar: getCalendar {
    movies {
      id
      title
      state
      releaseDate
    }
    tvEpisodes {
      id
      tvShow {
        id
        title
      }
      episodeNumber
      seasonNumber
      state
      releaseDate
    }
  }
}
    `;
export const GetDiscoverDoc = gql`
    query getDiscover($entertainment: Entertainment, $originLanguage: String, $primaryReleaseYear: String, $score: Float, $genres: [Float!], $page: Float) {
  TMDBResults: discover(
    entertainment: $entertainment
    originLanguage: $originLanguage
    primaryReleaseYear: $primaryReleaseYear
    score: $score
    genres: $genres
    page: $page
  ) {
    page
    totalResults
    totalPages
    results {
      id
      tmdbId
      title
      posterPath
      overview
      runtime
      voteAverage
      releaseDate
    }
  }
}
    `;
export const GetDownloadingDoc = gql`
    query getDownloading {
  searching: getSearchingMedias {
    id
    title
    resourceId
    resourceType
  }
  downloading: getDownloadingMedias {
    id
    title
    tag
    quality
    torrent
    resourceId
    resourceType
  }
}
    `;
export const GetGenresDoc = gql`
    query getGenres {
  genres: getGenres {
    movieGenres {
      id
      name
    }
    tvShowGenres {
      id
      name
    }
  }
}
    `;
export const GetLanguagesDoc = gql`
    query getLanguages {
  languages: getLanguages {
    code
    language
  }
}
    `;
export const GetLibraryMoviesDoc = gql`
    query getLibraryMovies {
  movies: getMovies {
    id
    tmdbId
    title
    originalTitle
    state
    posterPath
    overview
    runtime
    voteAverage
    releaseDate
    createdAt
    updatedAt
  }
}
    `;
export const GetLibraryTvShowsDoc = gql`
    query getLibraryTVShows {
  tvShows: getTVShows {
    id
    tmdbId
    title
    originalTitle
    posterPath
    runtime
    overview
    voteAverage
    releaseDate
    createdAt
    updatedAt
  }
}
    `;
export const GetMissingDoc = gql`
    query getMissing {
  tvEpisodes: getMissingTVEpisodes {
    ...MissingTVEpisodes
  }
  movies: getMissingMovies {
    ...MissingMovies
  }
}
    ${MissingTvEpisodesFragmentDoc}
${MissingMoviesFragmentDoc}`;
export const GetMovieFileDetailsDoc = gql`
    query getMovieFileDetails($tmdbId: Int!) {
  details: getMovieFileDetails(tmdbId: $tmdbId) {
    id
    libraryPath
    libraryFileSize
    torrentFileName
  }
}
    `;
export const GetParamsDoc = gql`
    query getParams {
  params: getParams {
    region
    language
    tmdb_api_key
    jackett_api_key
    max_movie_download_size
    max_tvshow_episode_download_size
    organize_library_strategy
  }
}
    `;
export const GetPopularDoc = gql`
    query getPopular {
  results: getPopular {
    movies {
      id
      tmdbId
      title
      releaseDate
      posterPath
      overview
      runtime
      voteAverage
    }
    tvShows {
      id
      tmdbId
      title
      releaseDate
      posterPath
      overview
      runtime
      voteAverage
    }
  }
}
    `;
export const GetQualityDoc = gql`
    query getQuality($type: Entertainment!) {
  qualities: getQualityParams(type: $type) {
    id
    name
    match
    score
    updatedAt
    createdAt
    type
  }
}
    `;
export const GetRecommendedDoc = gql`
    query getRecommended {
  tvShows: getRecommendedTVShows {
    id
    tmdbId
    title
    releaseDate
    posterPath
    overview
    runtime
    voteAverage
  }
  movies: getRecommendedMovies {
    id
    tmdbId
    title
    releaseDate
    posterPath
    overview
    runtime
    voteAverage
  }
}
    `;
export const GetTagsDoc = gql`
    query getTags {
  tags: getTags {
    id
    name
    score
    createdAt
    updatedAt
  }
}
    `;
export const GetTorrentStatusDoc = gql`
    query getTorrentStatus($torrents: [GetTorrentStatusInput!]!) {
  torrents: getTorrentStatus(torrents: $torrents) {
    id
    resourceId
    resourceType
    percentDone
    rateDownload
    rateUpload
    uploadRatio
    uploadedEver
    totalSize
    status
  }
}
    `;
export const GetTvSeasonDetailsDoc = gql`
    query getTVSeasonDetails($tvShowTMDBId: Int!, $seasonNumber: Int!) {
  episodes: getTVSeasonDetails(
    tvShowTMDBId: $tvShowTMDBId
    seasonNumber: $seasonNumber
  ) {
    id
    episodeNumber
    seasonNumber
    state
    updatedAt
    voteAverage
    releaseDate
    createdAt
    tvShow {
      id
      title
      tmdbId
      updatedAt
      createdAt
    }
  }
}
    `;
export const GetTvShowSeasonsDoc = gql`
    query getTVShowSeasons($tvShowTMDBId: Int!) {
  seasons: getTVShowSeasons(tvShowTMDBId: $tvShowTMDBId) {
    id
    name
    seasonNumber
    episodeCount
    overview
    posterPath
    airDate
    inLibrary
  }
}
    `;
export const OmdbSearchDoc = gql`
    query omdbSearch($title: String!) {
  result: omdbSearch(title: $title) {
    ratings {
      IMDB
      rottenTomatoes
      metaCritic
    }
  }
}
    `;
export const SearchTorrentDoc = gql`
    query searchTorrent($query: String!) {
  results: searchJackett(query: $query) {
    id
    title
    quality
    qualityScore
    seeders
    peers
    link
    downloadLink
    tag
    tagScore
    normalizedTitle
    normalizedTitleParts
    size
    publishDate
  }
}
    `;
export const SearchDoc = gql`
    query search($query: String!) {
  results: search(query: $query) {
    movies {
      id
      tmdbId
      title
      releaseDate
      posterPath
      overview
      runtime
      voteAverage
    }
    tvShows {
      id
      tmdbId
      title
      releaseDate
      posterPath
      overview
      runtime
      voteAverage
    }
  }
}
    `;
export const clearCache = (
            options: Omit<
              MutationOptions<any, ClearCacheMutationVariables>, 
              "mutation"
            >
          ) => {
            const m = client.mutate<ClearCacheMutation, ClearCacheMutationVariables>({
              mutation: ClearCacheDoc,
              ...options,
            });
            return m;
          }
export const downloadOwnTorrent = (
            options: Omit<
              MutationOptions<any, DownloadOwnTorrentMutationVariables>, 
              "mutation"
            >
          ) => {
            const m = client.mutate<DownloadOwnTorrentMutation, DownloadOwnTorrentMutationVariables>({
              mutation: DownloadOwnTorrentDoc,
              ...options,
            });
            return m;
          }
export const startScanLibrary = (
            options: Omit<
              MutationOptions<any, StartScanLibraryMutationVariables>, 
              "mutation"
            >
          ) => {
            const m = client.mutate<StartScanLibraryMutation, StartScanLibraryMutationVariables>({
              mutation: StartScanLibraryDoc,
              ...options,
            });
            return m;
          }
export const startFindNewEpisodes = (
            options: Omit<
              MutationOptions<any, StartFindNewEpisodesMutationVariables>, 
              "mutation"
            >
          ) => {
            const m = client.mutate<StartFindNewEpisodesMutation, StartFindNewEpisodesMutationVariables>({
              mutation: StartFindNewEpisodesDoc,
              ...options,
            });
            return m;
          }
export const startDownloadMissing = (
            options: Omit<
              MutationOptions<any, StartDownloadMissingMutationVariables>, 
              "mutation"
            >
          ) => {
            const m = client.mutate<StartDownloadMissingMutation, StartDownloadMissingMutationVariables>({
              mutation: StartDownloadMissingDoc,
              ...options,
            });
            return m;
          }
export const downloadMovie = (
            options: Omit<
              MutationOptions<any, DownloadMovieMutationVariables>, 
              "mutation"
            >
          ) => {
            const m = client.mutate<DownloadMovieMutation, DownloadMovieMutationVariables>({
              mutation: DownloadMovieDoc,
              ...options,
            });
            return m;
          }
export const downloadTVEpisode = (
            options: Omit<
              MutationOptions<any, DownloadTvEpisodeMutationVariables>, 
              "mutation"
            >
          ) => {
            const m = client.mutate<DownloadTvEpisodeMutation, DownloadTvEpisodeMutationVariables>({
              mutation: DownloadTvEpisodeDoc,
              ...options,
            });
            return m;
          }
export const downloadSeason = (
            options: Omit<
              MutationOptions<any, DownloadSeasonMutationVariables>, 
              "mutation"
            >
          ) => {
            const m = client.mutate<DownloadSeasonMutation, DownloadSeasonMutationVariables>({
              mutation: DownloadSeasonDoc,
              ...options,
            });
            return m;
          }
export const removeMovie = (
            options: Omit<
              MutationOptions<any, RemoveMovieMutationVariables>, 
              "mutation"
            >
          ) => {
            const m = client.mutate<RemoveMovieMutation, RemoveMovieMutationVariables>({
              mutation: RemoveMovieDoc,
              ...options,
            });
            return m;
          }
export const removeTVShow = (
            options: Omit<
              MutationOptions<any, RemoveTvShowMutationVariables>, 
              "mutation"
            >
          ) => {
            const m = client.mutate<RemoveTvShowMutation, RemoveTvShowMutationVariables>({
              mutation: RemoveTvShowDoc,
              ...options,
            });
            return m;
          }
export const resetLibrary = (
            options: Omit<
              MutationOptions<any, ResetLibraryMutationVariables>, 
              "mutation"
            >
          ) => {
            const m = client.mutate<ResetLibraryMutation, ResetLibraryMutationVariables>({
              mutation: ResetLibraryDoc,
              ...options,
            });
            return m;
          }
export const saveQuality = (
            options: Omit<
              MutationOptions<any, SaveQualityMutationVariables>, 
              "mutation"
            >
          ) => {
            const m = client.mutate<SaveQualityMutation, SaveQualityMutationVariables>({
              mutation: SaveQualityDoc,
              ...options,
            });
            return m;
          }
export const saveTags = (
            options: Omit<
              MutationOptions<any, SaveTagsMutationVariables>, 
              "mutation"
            >
          ) => {
            const m = client.mutate<SaveTagsMutation, SaveTagsMutationVariables>({
              mutation: SaveTagsDoc,
              ...options,
            });
            return m;
          }
export const trackMovie = (
            options: Omit<
              MutationOptions<any, TrackMovieMutationVariables>, 
              "mutation"
            >
          ) => {
            const m = client.mutate<TrackMovieMutation, TrackMovieMutationVariables>({
              mutation: TrackMovieDoc,
              ...options,
            });
            return m;
          }
export const trackTVShow = (
            options: Omit<
              MutationOptions<any, TrackTvShowMutationVariables>, 
              "mutation"
            >
          ) => {
            const m = client.mutate<TrackTvShowMutation, TrackTvShowMutationVariables>({
              mutation: TrackTvShowDoc,
              ...options,
            });
            return m;
          }
export const updateParams = (
            options: Omit<
              MutationOptions<any, UpdateParamsMutationVariables>, 
              "mutation"
            >
          ) => {
            const m = client.mutate<UpdateParamsMutation, UpdateParamsMutationVariables>({
              mutation: UpdateParamsDoc,
              ...options,
            });
            return m;
          }
export const getCalendar = (
            options: Omit<
              WatchQueryOptions<GetCalendarQueryVariables>, 
              "query"
            >
          ): Readable<
            ApolloQueryResult<GetCalendarQuery> & {
              query: ObservableQuery<
                GetCalendarQuery,
                GetCalendarQueryVariables
              >;
            }
          > => {
            const q = client.watchQuery({
              query: GetCalendarDoc,
              ...options,
            });
            var result = readable<
              ApolloQueryResult<GetCalendarQuery> & {
                query: ObservableQuery<
                  GetCalendarQuery,
                  GetCalendarQueryVariables
                >;
              }
            >(
              { data: {} as any, loading: true, error: undefined, networkStatus: 1, query: q },
              (set) => {
                q.subscribe((v: any) => {
                  set({ ...v, query: q });
                });
              }
            );
            return result;
          }
        
export const getDiscover = (
            options: Omit<
              WatchQueryOptions<GetDiscoverQueryVariables>, 
              "query"
            >
          ): Readable<
            ApolloQueryResult<GetDiscoverQuery> & {
              query: ObservableQuery<
                GetDiscoverQuery,
                GetDiscoverQueryVariables
              >;
            }
          > => {
            const q = client.watchQuery({
              query: GetDiscoverDoc,
              ...options,
            });
            var result = readable<
              ApolloQueryResult<GetDiscoverQuery> & {
                query: ObservableQuery<
                  GetDiscoverQuery,
                  GetDiscoverQueryVariables
                >;
              }
            >(
              { data: {} as any, loading: true, error: undefined, networkStatus: 1, query: q },
              (set) => {
                q.subscribe((v: any) => {
                  set({ ...v, query: q });
                });
              }
            );
            return result;
          }
        
export const getDownloading = (
            options: Omit<
              WatchQueryOptions<GetDownloadingQueryVariables>, 
              "query"
            >
          ): Readable<
            ApolloQueryResult<GetDownloadingQuery> & {
              query: ObservableQuery<
                GetDownloadingQuery,
                GetDownloadingQueryVariables
              >;
            }
          > => {
            const q = client.watchQuery({
              query: GetDownloadingDoc,
              ...options,
            });
            var result = readable<
              ApolloQueryResult<GetDownloadingQuery> & {
                query: ObservableQuery<
                  GetDownloadingQuery,
                  GetDownloadingQueryVariables
                >;
              }
            >(
              { data: {} as any, loading: true, error: undefined, networkStatus: 1, query: q },
              (set) => {
                q.subscribe((v: any) => {
                  set({ ...v, query: q });
                });
              }
            );
            return result;
          }
        
export const getGenres = (
            options: Omit<
              WatchQueryOptions<GetGenresQueryVariables>, 
              "query"
            >
          ): Readable<
            ApolloQueryResult<GetGenresQuery> & {
              query: ObservableQuery<
                GetGenresQuery,
                GetGenresQueryVariables
              >;
            }
          > => {
            const q = client.watchQuery({
              query: GetGenresDoc,
              ...options,
            });
            var result = readable<
              ApolloQueryResult<GetGenresQuery> & {
                query: ObservableQuery<
                  GetGenresQuery,
                  GetGenresQueryVariables
                >;
              }
            >(
              { data: {} as any, loading: true, error: undefined, networkStatus: 1, query: q },
              (set) => {
                q.subscribe((v: any) => {
                  set({ ...v, query: q });
                });
              }
            );
            return result;
          }
        
export const getLanguages = (
            options: Omit<
              WatchQueryOptions<GetLanguagesQueryVariables>, 
              "query"
            >
          ): Readable<
            ApolloQueryResult<GetLanguagesQuery> & {
              query: ObservableQuery<
                GetLanguagesQuery,
                GetLanguagesQueryVariables
              >;
            }
          > => {
            const q = client.watchQuery({
              query: GetLanguagesDoc,
              ...options,
            });
            var result = readable<
              ApolloQueryResult<GetLanguagesQuery> & {
                query: ObservableQuery<
                  GetLanguagesQuery,
                  GetLanguagesQueryVariables
                >;
              }
            >(
              { data: {} as any, loading: true, error: undefined, networkStatus: 1, query: q },
              (set) => {
                q.subscribe((v: any) => {
                  set({ ...v, query: q });
                });
              }
            );
            return result;
          }
        
export const getLibraryMovies = (
            options: Omit<
              WatchQueryOptions<GetLibraryMoviesQueryVariables>, 
              "query"
            >
          ): Readable<
            ApolloQueryResult<GetLibraryMoviesQuery> & {
              query: ObservableQuery<
                GetLibraryMoviesQuery,
                GetLibraryMoviesQueryVariables
              >;
            }
          > => {
            const q = client.watchQuery({
              query: GetLibraryMoviesDoc,
              ...options,
            });
            var result = readable<
              ApolloQueryResult<GetLibraryMoviesQuery> & {
                query: ObservableQuery<
                  GetLibraryMoviesQuery,
                  GetLibraryMoviesQueryVariables
                >;
              }
            >(
              { data: {} as any, loading: true, error: undefined, networkStatus: 1, query: q },
              (set) => {
                q.subscribe((v: any) => {
                  set({ ...v, query: q });
                });
              }
            );
            return result;
          }
        
export const getLibraryTVShows = (
            options: Omit<
              WatchQueryOptions<GetLibraryTvShowsQueryVariables>, 
              "query"
            >
          ): Readable<
            ApolloQueryResult<GetLibraryTvShowsQuery> & {
              query: ObservableQuery<
                GetLibraryTvShowsQuery,
                GetLibraryTvShowsQueryVariables
              >;
            }
          > => {
            const q = client.watchQuery({
              query: GetLibraryTvShowsDoc,
              ...options,
            });
            var result = readable<
              ApolloQueryResult<GetLibraryTvShowsQuery> & {
                query: ObservableQuery<
                  GetLibraryTvShowsQuery,
                  GetLibraryTvShowsQueryVariables
                >;
              }
            >(
              { data: {} as any, loading: true, error: undefined, networkStatus: 1, query: q },
              (set) => {
                q.subscribe((v: any) => {
                  set({ ...v, query: q });
                });
              }
            );
            return result;
          }
        
export const getMissing = (
            options: Omit<
              WatchQueryOptions<GetMissingQueryVariables>, 
              "query"
            >
          ): Readable<
            ApolloQueryResult<GetMissingQuery> & {
              query: ObservableQuery<
                GetMissingQuery,
                GetMissingQueryVariables
              >;
            }
          > => {
            const q = client.watchQuery({
              query: GetMissingDoc,
              ...options,
            });
            var result = readable<
              ApolloQueryResult<GetMissingQuery> & {
                query: ObservableQuery<
                  GetMissingQuery,
                  GetMissingQueryVariables
                >;
              }
            >(
              { data: {} as any, loading: true, error: undefined, networkStatus: 1, query: q },
              (set) => {
                q.subscribe((v: any) => {
                  set({ ...v, query: q });
                });
              }
            );
            return result;
          }
        
export const getMovieFileDetails = (
            options: Omit<
              WatchQueryOptions<GetMovieFileDetailsQueryVariables>, 
              "query"
            >
          ): Readable<
            ApolloQueryResult<GetMovieFileDetailsQuery> & {
              query: ObservableQuery<
                GetMovieFileDetailsQuery,
                GetMovieFileDetailsQueryVariables
              >;
            }
          > => {
            const q = client.watchQuery({
              query: GetMovieFileDetailsDoc,
              ...options,
            });
            var result = readable<
              ApolloQueryResult<GetMovieFileDetailsQuery> & {
                query: ObservableQuery<
                  GetMovieFileDetailsQuery,
                  GetMovieFileDetailsQueryVariables
                >;
              }
            >(
              { data: {} as any, loading: true, error: undefined, networkStatus: 1, query: q },
              (set) => {
                q.subscribe((v: any) => {
                  set({ ...v, query: q });
                });
              }
            );
            return result;
          }
        
export const getParams = (
            options: Omit<
              WatchQueryOptions<GetParamsQueryVariables>, 
              "query"
            >
          ): Readable<
            ApolloQueryResult<GetParamsQuery> & {
              query: ObservableQuery<
                GetParamsQuery,
                GetParamsQueryVariables
              >;
            }
          > => {
            const q = client.watchQuery({
              query: GetParamsDoc,
              ...options,
            });
            var result = readable<
              ApolloQueryResult<GetParamsQuery> & {
                query: ObservableQuery<
                  GetParamsQuery,
                  GetParamsQueryVariables
                >;
              }
            >(
              { data: {} as any, loading: true, error: undefined, networkStatus: 1, query: q },
              (set) => {
                q.subscribe((v: any) => {
                  set({ ...v, query: q });
                });
              }
            );
            return result;
          }
        
export const getPopular = (
            options: Omit<
              WatchQueryOptions<GetPopularQueryVariables>, 
              "query"
            >
          ): Readable<
            ApolloQueryResult<GetPopularQuery> & {
              query: ObservableQuery<
                GetPopularQuery,
                GetPopularQueryVariables
              >;
            }
          > => {
            const q = client.watchQuery({
              query: GetPopularDoc,
              ...options,
            });
            var result = readable<
              ApolloQueryResult<GetPopularQuery> & {
                query: ObservableQuery<
                  GetPopularQuery,
                  GetPopularQueryVariables
                >;
              }
            >(
              { data: {} as any, loading: true, error: undefined, networkStatus: 1, query: q },
              (set) => {
                q.subscribe((v: any) => {
                  set({ ...v, query: q });
                });
              }
            );
            return result;
          }
        
export const getQuality = (
            options: Omit<
              WatchQueryOptions<GetQualityQueryVariables>, 
              "query"
            >
          ): Readable<
            ApolloQueryResult<GetQualityQuery> & {
              query: ObservableQuery<
                GetQualityQuery,
                GetQualityQueryVariables
              >;
            }
          > => {
            const q = client.watchQuery({
              query: GetQualityDoc,
              ...options,
            });
            var result = readable<
              ApolloQueryResult<GetQualityQuery> & {
                query: ObservableQuery<
                  GetQualityQuery,
                  GetQualityQueryVariables
                >;
              }
            >(
              { data: {} as any, loading: true, error: undefined, networkStatus: 1, query: q },
              (set) => {
                q.subscribe((v: any) => {
                  set({ ...v, query: q });
                });
              }
            );
            return result;
          }
        
export const getRecommended = (
            options: Omit<
              WatchQueryOptions<GetRecommendedQueryVariables>, 
              "query"
            >
          ): Readable<
            ApolloQueryResult<GetRecommendedQuery> & {
              query: ObservableQuery<
                GetRecommendedQuery,
                GetRecommendedQueryVariables
              >;
            }
          > => {
            const q = client.watchQuery({
              query: GetRecommendedDoc,
              ...options,
            });
            var result = readable<
              ApolloQueryResult<GetRecommendedQuery> & {
                query: ObservableQuery<
                  GetRecommendedQuery,
                  GetRecommendedQueryVariables
                >;
              }
            >(
              { data: {} as any, loading: true, error: undefined, networkStatus: 1, query: q },
              (set) => {
                q.subscribe((v: any) => {
                  set({ ...v, query: q });
                });
              }
            );
            return result;
          }
        
export const getTags = (
            options: Omit<
              WatchQueryOptions<GetTagsQueryVariables>, 
              "query"
            >
          ): Readable<
            ApolloQueryResult<GetTagsQuery> & {
              query: ObservableQuery<
                GetTagsQuery,
                GetTagsQueryVariables
              >;
            }
          > => {
            const q = client.watchQuery({
              query: GetTagsDoc,
              ...options,
            });
            var result = readable<
              ApolloQueryResult<GetTagsQuery> & {
                query: ObservableQuery<
                  GetTagsQuery,
                  GetTagsQueryVariables
                >;
              }
            >(
              { data: {} as any, loading: true, error: undefined, networkStatus: 1, query: q },
              (set) => {
                q.subscribe((v: any) => {
                  set({ ...v, query: q });
                });
              }
            );
            return result;
          }
        
export const getTorrentStatus = (
            options: Omit<
              WatchQueryOptions<GetTorrentStatusQueryVariables>, 
              "query"
            >
          ): Readable<
            ApolloQueryResult<GetTorrentStatusQuery> & {
              query: ObservableQuery<
                GetTorrentStatusQuery,
                GetTorrentStatusQueryVariables
              >;
            }
          > => {
            const q = client.watchQuery({
              query: GetTorrentStatusDoc,
              ...options,
            });
            var result = readable<
              ApolloQueryResult<GetTorrentStatusQuery> & {
                query: ObservableQuery<
                  GetTorrentStatusQuery,
                  GetTorrentStatusQueryVariables
                >;
              }
            >(
              { data: {} as any, loading: true, error: undefined, networkStatus: 1, query: q },
              (set) => {
                q.subscribe((v: any) => {
                  set({ ...v, query: q });
                });
              }
            );
            return result;
          }
        
export const getTVSeasonDetails = (
            options: Omit<
              WatchQueryOptions<GetTvSeasonDetailsQueryVariables>, 
              "query"
            >
          ): Readable<
            ApolloQueryResult<GetTvSeasonDetailsQuery> & {
              query: ObservableQuery<
                GetTvSeasonDetailsQuery,
                GetTvSeasonDetailsQueryVariables
              >;
            }
          > => {
            const q = client.watchQuery({
              query: GetTvSeasonDetailsDoc,
              ...options,
            });
            var result = readable<
              ApolloQueryResult<GetTvSeasonDetailsQuery> & {
                query: ObservableQuery<
                  GetTvSeasonDetailsQuery,
                  GetTvSeasonDetailsQueryVariables
                >;
              }
            >(
              { data: {} as any, loading: true, error: undefined, networkStatus: 1, query: q },
              (set) => {
                q.subscribe((v: any) => {
                  set({ ...v, query: q });
                });
              }
            );
            return result;
          }
        
export const getTVShowSeasons = (
            options: Omit<
              WatchQueryOptions<GetTvShowSeasonsQueryVariables>, 
              "query"
            >
          ): Readable<
            ApolloQueryResult<GetTvShowSeasonsQuery> & {
              query: ObservableQuery<
                GetTvShowSeasonsQuery,
                GetTvShowSeasonsQueryVariables
              >;
            }
          > => {
            const q = client.watchQuery({
              query: GetTvShowSeasonsDoc,
              ...options,
            });
            var result = readable<
              ApolloQueryResult<GetTvShowSeasonsQuery> & {
                query: ObservableQuery<
                  GetTvShowSeasonsQuery,
                  GetTvShowSeasonsQueryVariables
                >;
              }
            >(
              { data: {} as any, loading: true, error: undefined, networkStatus: 1, query: q },
              (set) => {
                q.subscribe((v: any) => {
                  set({ ...v, query: q });
                });
              }
            );
            return result;
          }
        
export const omdbSearch = (
            options: Omit<
              WatchQueryOptions<OmdbSearchQueryVariables>, 
              "query"
            >
          ): Readable<
            ApolloQueryResult<OmdbSearchQuery> & {
              query: ObservableQuery<
                OmdbSearchQuery,
                OmdbSearchQueryVariables
              >;
            }
          > => {
            const q = client.watchQuery({
              query: OmdbSearchDoc,
              ...options,
            });
            var result = readable<
              ApolloQueryResult<OmdbSearchQuery> & {
                query: ObservableQuery<
                  OmdbSearchQuery,
                  OmdbSearchQueryVariables
                >;
              }
            >(
              { data: {} as any, loading: true, error: undefined, networkStatus: 1, query: q },
              (set) => {
                q.subscribe((v: any) => {
                  set({ ...v, query: q });
                });
              }
            );
            return result;
          }
        
export const searchTorrent = (
            options: Omit<
              WatchQueryOptions<SearchTorrentQueryVariables>, 
              "query"
            >
          ): Readable<
            ApolloQueryResult<SearchTorrentQuery> & {
              query: ObservableQuery<
                SearchTorrentQuery,
                SearchTorrentQueryVariables
              >;
            }
          > => {
            const q = client.watchQuery({
              query: SearchTorrentDoc,
              ...options,
            });
            var result = readable<
              ApolloQueryResult<SearchTorrentQuery> & {
                query: ObservableQuery<
                  SearchTorrentQuery,
                  SearchTorrentQueryVariables
                >;
              }
            >(
              { data: {} as any, loading: true, error: undefined, networkStatus: 1, query: q },
              (set) => {
                q.subscribe((v: any) => {
                  set({ ...v, query: q });
                });
              }
            );
            return result;
          }
        
export const search = (
            options: Omit<
              WatchQueryOptions<SearchQueryVariables>, 
              "query"
            >
          ): Readable<
            ApolloQueryResult<SearchQuery> & {
              query: ObservableQuery<
                SearchQuery,
                SearchQueryVariables
              >;
            }
          > => {
            const q = client.watchQuery({
              query: SearchDoc,
              ...options,
            });
            var result = readable<
              ApolloQueryResult<SearchQuery> & {
                query: ObservableQuery<
                  SearchQuery,
                  SearchQueryVariables
                >;
              }
            >(
              { data: {} as any, loading: true, error: undefined, networkStatus: 1, query: q },
              (set) => {
                q.subscribe((v: any) => {
                  set({ ...v, query: q });
                });
              }
            );
            return result;
          }
        