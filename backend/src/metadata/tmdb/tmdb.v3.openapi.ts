/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from 'axios';
import axios from 'axios';

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, 'data' | 'params' | 'url' | 'responseType'> {
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
  'body' | 'method' | 'query' | 'path'
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, 'data' | 'cancelToken'> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = 'application/json',
  FormData = 'multipart/form-data',
  UrlEncoded = 'application/x-www-form-urlencoded',
  Text = 'text/plain',
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>['securityWorker'];
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
      baseURL: axiosConfig.baseURL || 'https://api.themoviedb.org',
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
    if (typeof formItem === 'object' && formItem !== null) {
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
      ((typeof secure === 'boolean' ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === 'object'
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== 'string'
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { 'Content-Type': type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title TMDB API
 * @version 3
 * @baseUrl https://api.themoviedb.org
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  v3 = {
    /**
     * @description Search for movies by their original, translated and alternative titles.
     *
     * @name SearchMovie
     * @summary Movie
     * @request GET:/3/search/movie
     * @secure
     */
    searchMovie: (
      query: {
        query: string;
        /** @default false */
        include_adult?: boolean;
        /** @default "en-US" */
        language?: string;
        primary_release_year?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        region?: string;
        year?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/hZkgoQYus5vegHoetLkCJzb17zJ.jpg" */
            backdrop_path?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 550
             */
            id?: number;
            /** @example "en" */
            original_language?: string;
            /** @example "Fight Club" */
            original_title?: string;
            /** @example "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground "fight clubs" forming in every town, until an eccentric gets in the way and ignites an out-of-control spiral toward oblivion." */
            overview?: string;
            /**
             * @default 0
             * @example 73.433
             */
            popularity?: number;
            /** @example "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg" */
            poster_path?: string;
            /** @example "1999-10-15" */
            release_date?: string;
            /** @example "Fight Club" */
            title?: string;
            /**
             * @default true
             * @example false
             */
            video?: boolean;
            /**
             * @default 0
             * @example 8.433
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 26279
             */
            vote_count?: number;
          }[];
          /**
           * @default 0
           * @example 2
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 39
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/search/movie`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Find movies using over 30 filters and sort options.
     *
     * @name DiscoverMovie
     * @summary Movie
     * @request GET:/3/discover/movie
     * @secure
     */
    discoverMovie: (
      query?: {
        /** use in conjunction with `region` */
        certification?: string;
        /** use in conjunction with `region` */
        certificationGte?: string;
        /** use in conjunction with `region` */
        certificationLte?: string;
        /** use in conjunction with the `certification`, `certification.gte` and `certification.lte` filters */
        certification_country?: string;
        /** @default false */
        include_adult?: boolean;
        /** @default false */
        include_video?: boolean;
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        /** @format int32 */
        primary_release_year?: number;
        /** @format date */
        primaryReleaseDateGte?: string;
        /** @format date */
        primaryReleaseDateLte?: string;
        region?: string;
        /** @format date */
        releaseDateGte?: string;
        /** @format date */
        releaseDateLte?: string;
        /** @default "popularity.desc" */
        sort_by?:
          | 'original_title.asc'
          | 'original_title.desc'
          | 'popularity.asc'
          | 'popularity.desc'
          | 'revenue.asc'
          | 'revenue.desc'
          | 'primary_release_date.asc'
          | 'title.asc'
          | 'title.desc'
          | 'primary_release_date.desc'
          | 'vote_average.asc'
          | 'vote_average.desc'
          | 'vote_count.asc'
          | 'vote_count.desc';
        /** @format float */
        voteAverageGte?: number;
        /** @format float */
        voteAverageLte?: number;
        /** @format float */
        voteCountGte?: number;
        /** @format float */
        voteCountLte?: number;
        /** use in conjunction with `with_watch_monetization_types ` or `with_watch_providers ` */
        watch_region?: string;
        /** can be a comma (`AND`) or pipe (`OR`) separated query */
        with_cast?: string;
        /** can be a comma (`AND`) or pipe (`OR`) separated query */
        with_companies?: string;
        /** can be a comma (`AND`) or pipe (`OR`) separated query */
        with_crew?: string;
        /** can be a comma (`AND`) or pipe (`OR`) separated query */
        with_genres?: string;
        /** can be a comma (`AND`) or pipe (`OR`) separated query */
        with_keywords?: string;
        with_origin_country?: string;
        with_original_language?: string;
        /** can be a comma (`AND`) or pipe (`OR`) separated query */
        with_people?: string;
        /**
         * possible values are: [1, 2, 3, 4, 5, 6] can be a comma (`AND`) or pipe (`OR`) separated query, can be used in conjunction with `region`
         * @format int32
         */
        with_release_type?: number;
        /** @format int32 */
        withRuntimeGte?: number;
        /** @format int32 */
        withRuntimeLte?: number;
        /** possible values are: [flatrate, free, ads, rent, buy] use in conjunction with `watch_region`, can be a comma (`AND`) or pipe (`OR`) separated query */
        with_watch_monetization_types?: string;
        /** use in conjunction with `watch_region`, can be a comma (`AND`) or pipe (`OR`) separated query */
        with_watch_providers?: string;
        without_companies?: string;
        without_genres?: string;
        without_keywords?: string;
        without_watch_providers?: string;
        /** @format int32 */
        year?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/8YFL5QQVPy3AgrEQxNYVSgiPEbe.jpg" */
            backdrop_path?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 640146
             */
            id?: number;
            /** @example "en" */
            original_language?: string;
            /** @example "Ant-Man and the Wasp: Quantumania" */
            original_title?: string;
            /** @example "Super-Hero partners Scott Lang and Hope van Dyne, along with with Hope's parents Janet van Dyne and Hank Pym, and Scott's daughter Cassie Lang, find themselves exploring the Quantum Realm, interacting with strange new creatures and embarking on an adventure that will push them beyond the limits of what they thought possible." */
            overview?: string;
            /**
             * @default 0
             * @example 9272.643
             */
            popularity?: number;
            /** @example "/ngl2FKBlU4fhbdsrtdom9LVLBXw.jpg" */
            poster_path?: string;
            /** @example "2023-02-15" */
            release_date?: string;
            /** @example "Ant-Man and the Wasp: Quantumania" */
            title?: string;
            /**
             * @default true
             * @example false
             */
            video?: boolean;
            /**
             * @default 0
             * @example 6.5
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 1856
             */
            vote_count?: number;
          }[];
          /**
           * @default 0
           * @example 38020
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 760385
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/discover/movie`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the top level details of a movie by ID.
     *
     * @name MovieDetails
     * @summary Details
     * @request GET:/3/movie/{movie_id}
     * @secure
     */
    movieDetails: (
      movieId: number,
      query?: {
        /** comma separated list of endpoints within this namespace, 20 items max */
        append_to_response?: string;
        /** @default "en-US" */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default true
           * @example false
           */
          adult?: boolean;
          /** @example "/hZkgoQYus5vegHoetLkCJzb17zJ.jpg" */
          backdrop_path?: string;
          belongs_to_collection?: any;
          /**
           * @default 0
           * @example 63000000
           */
          budget?: number;
          genres?: {
            /**
             * @default 0
             * @example 18
             */
            id?: number;
            /** @example "Drama" */
            name?: string;
          }[];
          /** @example "http://www.foxmovies.com/movies/fight-club" */
          homepage?: string;
          /**
           * @default 0
           * @example 550
           */
          id?: number;
          /** @example "tt0137523" */
          imdb_id?: string;
          /** @example "en" */
          original_language?: string;
          /** @example "Fight Club" */
          original_title?: string;
          /** @example "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground "fight clubs" forming in every town, until an eccentric gets in the way and ignites an out-of-control spiral toward oblivion." */
          overview?: string;
          /**
           * @default 0
           * @example 61.416
           */
          popularity?: number;
          /** @example "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg" */
          poster_path?: string;
          production_companies?: {
            /**
             * @default 0
             * @example 508
             */
            id?: number;
            /** @example "/7cxRWzi4LsVm4Utfpr1hfARNurT.png" */
            logo_path?: string;
            /** @example "Regency Enterprises" */
            name?: string;
            /** @example "US" */
            origin_country?: string;
          }[];
          production_countries?: {
            /** @example "US" */
            iso_3166_1?: string;
            /** @example "United States of America" */
            name?: string;
          }[];
          /** @example "1999-10-15" */
          release_date?: string;
          /**
           * @default 0
           * @example 100853753
           */
          revenue?: number;
          /**
           * @default 0
           * @example 139
           */
          runtime?: number;
          spoken_languages?: {
            /** @example "English" */
            english_name?: string;
            /** @example "en" */
            iso_639_1?: string;
            /** @example "English" */
            name?: string;
          }[];
          /** @example "Released" */
          status?: string;
          /** @example "Mischief. Mayhem. Soap." */
          tagline?: string;
          /** @example "Fight Club" */
          title?: string;
          /**
           * @default true
           * @example false
           */
          video?: boolean;
          /**
           * @default 0
           * @example 8.433
           */
          vote_average?: number;
          /**
           * @default 0
           * @example 26280
           */
          vote_count?: number;
        },
        any
      >({
        path: `/3/movie/${movieId}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the details of a TV show.
     *
     * @name TvSeriesDetails
     * @summary Details
     * @request GET:/3/tv/{series_id}
     * @secure
     */
    tvSeriesDetails: (
      seriesId: number,
      query?: {
        /** comma separated list of endpoints within this namespace, 20 items max */
        append_to_response?: string;
        /** @default "en-US" */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default true
           * @example false
           */
          adult?: boolean;
          /** @example "/6LWy0jvMpmjoS9fojNgHIKoWL05.jpg" */
          backdrop_path?: string;
          created_by?: {
            /**
             * @default 0
             * @example 9813
             */
            id?: number;
            /** @example "5256c8c219c2956ff604858a" */
            credit_id?: string;
            /** @example "David Benioff" */
            name?: string;
            /**
             * @default 0
             * @example 2
             */
            gender?: number;
            /** @example "/xvNN5huL0X8yJ7h3IZfGG4O2zBD.jpg" */
            profile_path?: string;
          }[];
          episode_run_time?: number[];
          /** @example "2011-04-17" */
          first_air_date?: string;
          genres?: {
            /**
             * @default 0
             * @example 10765
             */
            id?: number;
            /** @example "Sci-Fi & Fantasy" */
            name?: string;
          }[];
          /** @example "http://www.hbo.com/game-of-thrones" */
          homepage?: string;
          /**
           * @default 0
           * @example 1399
           */
          id?: number;
          /**
           * @default true
           * @example false
           */
          in_production?: boolean;
          languages?: string[];
          /** @example "2019-05-19" */
          last_air_date?: string;
          last_episode_to_air?: {
            /**
             * @default 0
             * @example 1551830
             */
            id?: number;
            /** @example "The Iron Throne" */
            name?: string;
            /** @example "In the aftermath of the devastating attack on King's Landing, Daenerys must face the survivors." */
            overview?: string;
            /**
             * @default 0
             * @example 4.809
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 241
             */
            vote_count?: number;
            /** @example "2019-05-19" */
            air_date?: string;
            /**
             * @default 0
             * @example 6
             */
            episode_number?: number;
            /** @example "806" */
            production_code?: string;
            /**
             * @default 0
             * @example 80
             */
            runtime?: number;
            /**
             * @default 0
             * @example 8
             */
            season_number?: number;
            /**
             * @default 0
             * @example 1399
             */
            show_id?: number;
            /** @example "/zBi2O5EJfgTS6Ae0HdAYLm9o2nf.jpg" */
            still_path?: string;
          };
          /** @example "Game of Thrones" */
          name?: string;
          next_episode_to_air?: any;
          networks?: {
            /**
             * @default 0
             * @example 49
             */
            id?: number;
            /** @example "/tuomPhY2UtuPTqqFnKMVHvSb724.png" */
            logo_path?: string;
            /** @example "HBO" */
            name?: string;
            /** @example "US" */
            origin_country?: string;
          }[];
          /**
           * @default 0
           * @example 73
           */
          number_of_episodes?: number;
          /**
           * @default 0
           * @example 8
           */
          number_of_seasons?: number;
          origin_country?: string[];
          /** @example "en" */
          original_language?: string;
          /** @example "Game of Thrones" */
          original_name?: string;
          /** @example "Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war. All while a very ancient evil awakens in the farthest north. Amidst the war, a neglected military order of misfits, the Night's Watch, is all that stands between the realms of men and icy horrors beyond." */
          overview?: string;
          /**
           * @default 0
           * @example 346.098
           */
          popularity?: number;
          /** @example "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg" */
          poster_path?: string;
          production_companies?: {
            /**
             * @default 0
             * @example 76043
             */
            id?: number;
            /** @example "/9RO2vbQ67otPrBLXCaC8UMp3Qat.png" */
            logo_path?: string;
            /** @example "Revolution Sun Studios" */
            name?: string;
            /** @example "US" */
            origin_country?: string;
          }[];
          production_countries?: {
            /** @example "GB" */
            iso_3166_1?: string;
            /** @example "United Kingdom" */
            name?: string;
          }[];
          seasons?: {
            /** @example "2010-12-05" */
            air_date?: string;
            /**
             * @default 0
             * @example 272
             */
            episode_count?: number;
            /**
             * @default 0
             * @example 3627
             */
            id?: number;
            /** @example "Specials" */
            name?: string;
            /** @example "" */
            overview?: string;
            /** @example "/kMTcwNRfFKCZ0O2OaBZS0nZ2AIe.jpg" */
            poster_path?: string;
            /**
             * @default 0
             * @example 0
             */
            season_number?: number;
            /**
             * @default 0
             * @example 0
             */
            vote_average?: number;
          }[];
          spoken_languages?: {
            /** @example "English" */
            english_name?: string;
            /** @example "en" */
            iso_639_1?: string;
            /** @example "English" */
            name?: string;
          }[];
          /** @example "Ended" */
          status?: string;
          /** @example "Winter Is Coming" */
          tagline?: string;
          /** @example "Scripted" */
          type?: string;
          /**
           * @default 0
           * @example 8.438
           */
          vote_average?: number;
          /**
           * @default 0
           * @example 21390
           */
          vote_count?: number;
        },
        any
      >({
        path: `/3/tv/${seriesId}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Search for TV shows by their original, translated and also known as names.
     *
     * @name SearchTv
     * @summary TV
     * @request GET:/3/search/tv
     * @secure
     */
    searchTv: (
      query: {
        query: string;
        /**
         * Search only the first air date. Valid values are: 1000..9999
         * @format int32
         */
        first_air_date_year?: number;
        /** @default false */
        include_adult?: boolean;
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        /**
         * Search the first air date and all episode air dates. Valid values are: 1000..9999
         * @format int32
         */
        year?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/bsNm9z2TJfe0WO3RedPGWQ8mG1X.jpg" */
            backdrop_path?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 1396
             */
            id?: number;
            origin_country?: string[];
            /** @example "en" */
            original_language?: string;
            /** @example "Breaking Bad" */
            original_name?: string;
            /** @example "When Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer and given a prognosis of only two years left to live. He becomes filled with a sense of fearlessness and an unrelenting desire to secure his family's financial future at any cost as he enters the dangerous world of drugs and crime." */
            overview?: string;
            /**
             * @default 0
             * @example 298.884
             */
            popularity?: number;
            /** @example "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg" */
            poster_path?: string;
            /** @example "2008-01-20" */
            first_air_date?: string;
            /** @example "Breaking Bad" */
            name?: string;
            /**
             * @default 0
             * @example 8.879
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 11536
             */
            vote_count?: number;
          }[];
          /**
           * @default 0
           * @example 1
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 1
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/search/tv`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Use multi search when you want to search for movies, TV shows and people in a single request.
     *
     * @name SearchMulti
     * @summary Multi
     * @request GET:/3/search/multi
     * @secure
     */
    searchMulti: (
      query: {
        query: string;
        /** @default false */
        include_adult?: boolean;
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/aDYSnJAK0BTVeE8osOy22Kz3SXY.jpg" */
            backdrop_path?: string;
            /**
             * @default 0
             * @example 11
             */
            id?: number;
            /** @example "Star Wars" */
            title?: string;
            /** @example "en" */
            original_language?: string;
            /** @example "Star Wars" */
            original_title?: string;
            /** @example "Princess Leia is captured and held hostage by the evil Imperial forces in their effort to take over the galactic Empire. Venturesome Luke Skywalker and dashing captain Han Solo team together with the loveable robot duo R2-D2 and C-3PO to rescue the beautiful princess and restore peace and justice in the Empire." */
            overview?: string;
            /** @example "/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg" */
            poster_path?: string;
            /** @example "movie" */
            media_type?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 78.047
             */
            popularity?: number;
            /** @example "1977-05-25" */
            release_date?: string;
            /**
             * @default true
             * @example false
             */
            video?: boolean;
            /**
             * @default 0
             * @example 8.208
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 18528
             */
            vote_count?: number;
          }[];
          /**
           * @default 0
           * @example 11
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 201
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/search/multi`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Search for people by their name and also known as names.
     *
     * @name SearchPerson
     * @summary Person
     * @request GET:/3/search/person
     * @secure
     */
    searchPerson: (
      query: {
        query: string;
        /** @default false */
        include_adult?: boolean;
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /**
             * @default 0
             * @example 2
             */
            gender?: number;
            /**
             * @default 0
             * @example 31
             */
            id?: number;
            /** @example "Acting" */
            known_for_department?: string;
            /** @example "Tom Hanks" */
            name?: string;
            /** @example "Tom Hanks" */
            original_name?: string;
            /**
             * @default 0
             * @example 84.631
             */
            popularity?: number;
            /** @example "/xndWFsBlClOJFRdhSt4NBwiPq2o.jpg" */
            profile_path?: string;
            known_for?: {
              /**
               * @default true
               * @example false
               */
              adult?: boolean;
              /** @example "/3h1JZGDhZ8nzxdgvkxha0qBqi05.jpg" */
              backdrop_path?: string;
              /**
               * @default 0
               * @example 13
               */
              id?: number;
              /** @example "Forrest Gump" */
              title?: string;
              /** @example "en" */
              original_language?: string;
              /** @example "Forrest Gump" */
              original_title?: string;
              /** @example "A man with a low IQ has accomplished great things in his life and been present during significant historic events—in each case, far exceeding what anyone imagined he could do. But despite all he has achieved, his one true love eludes him." */
              overview?: string;
              /** @example "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg" */
              poster_path?: string;
              /** @example "movie" */
              media_type?: string;
              genre_ids?: number[];
              /**
               * @default 0
               * @example 67.209
               */
              popularity?: number;
              /** @example "1994-06-23" */
              release_date?: string;
              /**
               * @default true
               * @example false
               */
              video?: boolean;
              /**
               * @default 0
               * @example 8.481
               */
              vote_average?: number;
              /**
               * @default 0
               * @example 24525
               */
              vote_count?: number;
            }[];
          }[];
          /**
           * @default 0
           * @example 1
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 1
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/search/person`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Query the API configuration details.
     *
     * @name ConfigurationDetails
     * @summary Details
     * @request GET:/3/configuration
     * @secure
     */
    configurationDetails: (params: RequestParams = {}) =>
      this.request<
        {
          images?: {
            /** @example "http://image.tmdb.org/t/p/" */
            base_url?: string;
            /** @example "https://image.tmdb.org/t/p/" */
            secure_base_url?: string;
            backdrop_sizes?: string[];
            logo_sizes?: string[];
            poster_sizes?: string[];
            profile_sizes?: string[];
            still_sizes?: string[];
          };
          change_keys?: string[];
        },
        any
      >({
        path: `/3/configuration`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Query the details of a TV season.
     *
     * @name TvSeasonDetails
     * @summary Details
     * @request GET:/3/tv/{series_id}/season/{season_number}
     * @secure
     */
    tvSeasonDetails: (
      seriesId: number,
      seasonNumber: number,
      query?: {
        /** comma separated list of endpoints within this namespace, 20 items max */
        append_to_response?: string;
        /** @default "en-US" */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "5256c89f19c2956ff6046d47" */
          _id?: string;
          /** @example "2011-04-17" */
          air_date?: string;
          episodes?: {
            /** @example "2011-04-17" */
            air_date?: string;
            /**
             * @default 0
             * @example 1
             */
            episode_number?: number;
            /**
             * @default 0
             * @example 63056
             */
            id?: number;
            /** @example "Winter Is Coming" */
            name?: string;
            /** @example "Jon Arryn, the Hand of the King, is dead. King Robert Baratheon plans to ask his oldest friend, Eddard Stark, to take Jon's place. Across the sea, Viserys Targaryen plans to wed his sister to a nomadic warlord in exchange for an army." */
            overview?: string;
            /** @example "101" */
            production_code?: string;
            /**
             * @default 0
             * @example 62
             */
            runtime?: number;
            /**
             * @default 0
             * @example 1
             */
            season_number?: number;
            /**
             * @default 0
             * @example 1399
             */
            show_id?: number;
            /** @example "/9hGF3WUkBf7cSjMg0cdMDHJkByd.jpg" */
            still_path?: string;
            /**
             * @default 0
             * @example 7.838
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 291
             */
            vote_count?: number;
            crew?: {
              /** @example "Directing" */
              department?: string;
              /** @example "Director" */
              job?: string;
              /** @example "5256c8a219c2956ff6046e77" */
              credit_id?: string;
              /**
               * @default true
               * @example false
               */
              adult?: boolean;
              /**
               * @default 0
               * @example 2
               */
              gender?: number;
              /**
               * @default 0
               * @example 44797
               */
              id?: number;
              /** @example "Directing" */
              known_for_department?: string;
              /** @example "Timothy Van Patten" */
              name?: string;
              /** @example "Timothy Van Patten" */
              original_name?: string;
              /**
               * @default 0
               * @example 6.048
               */
              popularity?: number;
              /** @example "/MzSOFrd99HRdr6pkSRSctk3kBR.jpg" */
              profile_path?: string;
            }[];
            guest_stars?: {
              /** @example "Benjen Stark" */
              character?: string;
              /** @example "5256c8b919c2956ff604836a" */
              credit_id?: string;
              /**
               * @default 0
               * @example 62
               */
              order?: number;
              /**
               * @default true
               * @example false
               */
              adult?: boolean;
              /**
               * @default 0
               * @example 2
               */
              gender?: number;
              /**
               * @default 0
               * @example 119783
               */
              id?: number;
              /** @example "Acting" */
              known_for_department?: string;
              /** @example "Joseph Mawle" */
              name?: string;
              /** @example "Joseph Mawle" */
              original_name?: string;
              /**
               * @default 0
               * @example 13.517
               */
              popularity?: number;
              /** @example "/1Ocb9v3h54beGVoJMm4w50UQhLf.jpg" */
              profile_path?: string;
            }[];
          }[];
          /** @example "Season 1" */
          name?: string;
          /** @example "Trouble is brewing in the Seven Kingdoms of Westeros. For the driven inhabitants of this visionary world, control of Westeros' Iron Throne holds the lure of great power. But in a land where the seasons can last a lifetime, winter is coming...and beyond the Great Wall that protects them, an ancient evil has returned. In Season One, the story centers on three primary areas: the Stark and the Lannister families, whose designs on controlling the throne threaten a tenuous peace; the dragon princess Daenerys, heir to the former dynasty, who waits just over the Narrow Sea with her malevolent brother Viserys; and the Great Wall--a massive barrier of ice where a forgotten danger is stirring." */
          overview?: string;
          /**
           * @default 0
           * @example 3624
           */
          id?: number;
          /** @example "/wgfKiqzuMrFIkU1M68DDDY8kGC1.jpg" */
          poster_path?: string;
          /**
           * @default 0
           * @example 1
           */
          season_number?: number;
          /**
           * @default 0
           * @example 8.3
           */
          vote_average?: number;
        },
        any
      >({
        path: `/3/tv/${seriesId}/season/${seasonNumber}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Query the details of a TV episode.
     *
     * @name TvEpisodeDetails
     * @summary Details
     * @request GET:/3/tv/{series_id}/season/{season_number}/episode/{episode_number}
     * @secure
     */
    tvEpisodeDetails: (
      seriesId: number,
      seasonNumber: number,
      episodeNumber: number,
      query?: {
        /** comma separated list of endpoints within this namespace, 20 items max */
        append_to_response?: string;
        /** @default "en-US" */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "2011-04-17" */
          air_date?: string;
          crew?: {
            /** @example "Directing" */
            department?: string;
            /** @example "Director" */
            job?: string;
            /** @example "5256c8a219c2956ff6046e77" */
            credit_id?: string;
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /**
             * @default 0
             * @example 2
             */
            gender?: number;
            /**
             * @default 0
             * @example 44797
             */
            id?: number;
            /** @example "Directing" */
            known_for_department?: string;
            /** @example "Timothy Van Patten" */
            name?: string;
            /** @example "Timothy Van Patten" */
            original_name?: string;
            /**
             * @default 0
             * @example 7.775
             */
            popularity?: number;
            /** @example "/MzSOFrd99HRdr6pkSRSctk3kBR.jpg" */
            profile_path?: string;
          }[];
          /**
           * @default 0
           * @example 1
           */
          episode_number?: number;
          guest_stars?: {
            /** @example "Benjen Stark" */
            character?: string;
            /** @example "5256c8b919c2956ff604836a" */
            credit_id?: string;
            /**
             * @default 0
             * @example 62
             */
            order?: number;
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /**
             * @default 0
             * @example 2
             */
            gender?: number;
            /**
             * @default 0
             * @example 119783
             */
            id?: number;
            /** @example "Acting" */
            known_for_department?: string;
            /** @example "Joseph Mawle" */
            name?: string;
            /** @example "Joseph Mawle" */
            original_name?: string;
            /**
             * @default 0
             * @example 6.758
             */
            popularity?: number;
            /** @example "/1Ocb9v3h54beGVoJMm4w50UQhLf.jpg" */
            profile_path?: string;
          }[];
          /** @example "Winter Is Coming" */
          name?: string;
          /** @example "Jon Arryn, the Hand of the King, is dead. King Robert Baratheon plans to ask his oldest friend, Eddard Stark, to take Jon's place. Across the sea, Viserys Targaryen plans to wed his sister to a nomadic warlord in exchange for an army." */
          overview?: string;
          /**
           * @default 0
           * @example 63056
           */
          id?: number;
          /** @example "101" */
          production_code?: string;
          /**
           * @default 0
           * @example 62
           */
          runtime?: number;
          /**
           * @default 0
           * @example 1
           */
          season_number?: number;
          /** @example "/9hGF3WUkBf7cSjMg0cdMDHJkByd.jpg" */
          still_path?: string;
          /**
           * @default 0
           * @example 7.8
           */
          vote_average?: number;
          /**
           * @default 0
           * @example 286
           */
          vote_count?: number;
        },
        any
      >({
        path: `/3/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Find TV shows using over 30 filters and sort options.
     *
     * @name DiscoverTv
     * @summary TV
     * @request GET:/3/discover/tv
     * @secure
     */
    discoverTv: (
      query?: {
        /** @format date */
        airDateGte?: string;
        /** @format date */
        airDateLte?: string;
        /** @format int32 */
        first_air_date_year?: number;
        /** @format date */
        firstAirDateGte?: string;
        /** @format date */
        firstAirDateLte?: string;
        /** @default false */
        include_adult?: boolean;
        /** @default false */
        include_null_first_air_dates?: boolean;
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        screened_theatrically?: boolean;
        /** @default "popularity.desc" */
        sort_by?:
          | 'first_air_date.asc'
          | 'first_air_date.desc'
          | 'name.asc'
          | 'name.desc'
          | 'original_name.asc'
          | 'original_name.desc'
          | 'popularity.asc'
          | 'popularity.desc'
          | 'vote_average.asc'
          | 'vote_average.desc'
          | 'vote_count.asc'
          | 'vote_count.desc';
        timezone?: string;
        /** @format float */
        voteAverageGte?: number;
        /** @format float */
        voteAverageLte?: number;
        /** @format float */
        voteCountGte?: number;
        /** @format float */
        voteCountLte?: number;
        /** use in conjunction with `with_watch_monetization_types ` or `with_watch_providers ` */
        watch_region?: string;
        /** can be a comma (`AND`) or pipe (`OR`) separated query */
        with_companies?: string;
        /** can be a comma (`AND`) or pipe (`OR`) separated query */
        with_genres?: string;
        /** can be a comma (`AND`) or pipe (`OR`) separated query */
        with_keywords?: string;
        /** @format int32 */
        with_networks?: number;
        with_origin_country?: string;
        with_original_language?: string;
        /** @format int32 */
        withRuntimeGte?: number;
        /** @format int32 */
        withRuntimeLte?: number;
        /** possible values are: [0, 1, 2, 3, 4, 5], can be a comma (`AND`) or pipe (`OR`) separated query */
        with_status?: string;
        /** possible values are: [flatrate, free, ads, rent, buy] use in conjunction with `watch_region`, can be a comma (`AND`) or pipe (`OR`) separated query */
        with_watch_monetization_types?: string;
        /** use in conjunction with `watch_region`, can be a comma (`AND`) or pipe (`OR`) separated query */
        with_watch_providers?: string;
        without_companies?: string;
        without_genres?: string;
        without_keywords?: string;
        without_watch_providers?: string;
        /** possible values are: [0, 1, 2, 3, 4, 5, 6], can be a comma (`AND`) or pipe (`OR`) separated query */
        with_type?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /** @example "/mAJ84W6I8I272Da87qplS2Dp9ST.jpg" */
            backdrop_path?: string;
            /** @example "2023-01-23" */
            first_air_date?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 202250
             */
            id?: number;
            /** @example "Dirty Linen" */
            name?: string;
            origin_country?: string[];
            /** @example "tl" */
            original_language?: string;
            /** @example "Dirty Linen" */
            original_name?: string;
            /** @example "To exact vengeance, a young woman infiltrates the household of an influential family as a housemaid to expose their dirty secrets. However, love will get in the way of her revenge plot." */
            overview?: string;
            /**
             * @default 0
             * @example 2684.061
             */
            popularity?: number;
            /** @example "/ujlkQtHAVShWyWTloGU2Vh5Jbo9.jpg" */
            poster_path?: string;
            /**
             * @default 0
             * @example 5
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 13
             */
            vote_count?: number;
          }[];
          /**
           * @default 0
           * @example 7414
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 148265
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/discover/tv`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the images that belong to a movie.
     *
     * @name MovieImages
     * @summary Images
     * @request GET:/3/movie/{movie_id}/images
     * @secure
     */
    movieImages: (
      movieId: number,
      query?: {
        /** specify a comma separated list of ISO-639-1 values to query, for example: `en,null` */
        include_image_language?: string;
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          backdrops?: {
            /**
             * @default 0
             * @example 1.778
             */
            aspect_ratio?: number;
            /**
             * @default 0
             * @example 800
             */
            height?: number;
            iso_639_1?: any;
            /** @example "/hZkgoQYus5vegHoetLkCJzb17zJ.jpg" */
            file_path?: string;
            /**
             * @default 0
             * @example 5.622
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 20
             */
            vote_count?: number;
            /**
             * @default 0
             * @example 1422
             */
            width?: number;
          }[];
          /**
           * @default 0
           * @example 550
           */
          id?: number;
          logos?: {
            /**
             * @default 0
             * @example 5.203
             */
            aspect_ratio?: number;
            /**
             * @default 0
             * @example 79
             */
            height?: number;
            /** @example "he" */
            iso_639_1?: string;
            /** @example "/c1KLulrIhUqY5fT42nmC5aERGCp.png" */
            file_path?: string;
            /**
             * @default 0
             * @example 5.312
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 1
             */
            vote_count?: number;
            /**
             * @default 0
             * @example 411
             */
            width?: number;
          }[];
          posters?: {
            /**
             * @default 0
             * @example 0.667
             */
            aspect_ratio?: number;
            /**
             * @default 0
             * @example 900
             */
            height?: number;
            /** @example "pt" */
            iso_639_1?: string;
            /** @example "/r3pPehX4ik8NLYPpbDRAh0YRtMb.jpg" */
            file_path?: string;
            /**
             * @default 0
             * @example 5.258
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 6
             */
            vote_count?: number;
            /**
             * @default 0
             * @example 600
             */
            width?: number;
          }[];
        },
        any
      >({
        path: `/3/movie/${movieId}/images`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the images that belong to a TV series.
     *
     * @name TvSeriesImages
     * @summary Images
     * @request GET:/3/tv/{series_id}/images
     * @secure
     */
    tvSeriesImages: (
      seriesId: number,
      query?: {
        /** specify a comma separated list of ISO-639-1 values to query, for example: `en,null` */
        include_image_language?: string;
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          backdrops?: {
            /**
             * @default 0
             * @example 1.778
             */
            aspect_ratio?: number;
            /**
             * @default 0
             * @example 800
             */
            height?: number;
            iso_639_1?: any;
            /** @example "/hZkgoQYus5vegHoetLkCJzb17zJ.jpg" */
            file_path?: string;
            /**
             * @default 0
             * @example 5.622
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 20
             */
            vote_count?: number;
            /**
             * @default 0
             * @example 1422
             */
            width?: number;
          }[];
          /**
           * @default 0
           * @example 550
           */
          id?: number;
          logos?: {
            /**
             * @default 0
             * @example 5.203
             */
            aspect_ratio?: number;
            /**
             * @default 0
             * @example 79
             */
            height?: number;
            /** @example "he" */
            iso_639_1?: string;
            /** @example "/c1KLulrIhUqY5fT42nmC5aERGCp.png" */
            file_path?: string;
            /**
             * @default 0
             * @example 5.312
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 1
             */
            vote_count?: number;
            /**
             * @default 0
             * @example 411
             */
            width?: number;
          }[];
          posters?: {
            /**
             * @default 0
             * @example 0.667
             */
            aspect_ratio?: number;
            /**
             * @default 0
             * @example 900
             */
            height?: number;
            /** @example "pt" */
            iso_639_1?: string;
            /** @example "/r3pPehX4ik8NLYPpbDRAh0YRtMb.jpg" */
            file_path?: string;
            /**
             * @default 0
             * @example 5.258
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 6
             */
            vote_count?: number;
            /**
             * @default 0
             * @example 600
             */
            width?: number;
          }[];
        },
        any
      >({
        path: `/3/tv/${seriesId}/images`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the images that belong to a TV season.
     *
     * @name TvSeasonImages
     * @summary Images
     * @request GET:/3/tv/{series_id}/season/{season_number}/images
     * @secure
     */
    tvSeasonImages: (
      seriesId: number,
      seasonNumber: number,
      query?: {
        /** specify a comma separated list of ISO-639-1 values to query, for example: `en,null` */
        include_image_language?: string;
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 3624
           */
          id?: number;
          posters?: {
            /**
             * @default 0
             * @example 0.667
             */
            aspect_ratio?: number;
            /**
             * @default 0
             * @example 1500
             */
            height?: number;
            /** @example "en" */
            iso_639_1?: string;
            /** @example "/wgfKiqzuMrFIkU1M68DDDY8kGC1.jpg" */
            file_path?: string;
            /**
             * @default 0
             * @example 5.514
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 18
             */
            vote_count?: number;
            /**
             * @default 0
             * @example 1000
             */
            width?: number;
          }[];
        },
        any
      >({
        path: `/3/tv/${seriesId}/season/${seasonNumber}/images`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the images that belong to a TV episode.
     *
     * @name TvEpisodeImages
     * @summary Images
     * @request GET:/3/tv/{series_id}/season/{season_number}/episode/{episode_number}/images
     * @secure
     */
    tvEpisodeImages: (
      seriesId: number,
      seasonNumber: number,
      episodeNumber: number,
      query?: {
        /** specify a comma separated list of ISO-639-1 values to query, for example: `en,null` */
        include_image_language?: string;
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 63056
           */
          id?: number;
          stills?: {
            /**
             * @default 0
             * @example 1.778
             */
            aspect_ratio?: number;
            /**
             * @default 0
             * @example 1080
             */
            height?: number;
            iso_639_1?: any;
            /** @example "/9hGF3WUkBf7cSjMg0cdMDHJkByd.jpg" */
            file_path?: string;
            /**
             * @default 0
             * @example 5.454
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 3
             */
            vote_count?: number;
            /**
             * @default 0
             * @example 1920
             */
            width?: number;
          }[];
        },
        any
      >({
        path: `/3/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}/images`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the trending movies, TV shows and people.
     *
     * @name TrendingAll
     * @summary All
     * @request GET:/3/trending/all/{time_window}
     * @secure
     */
    trendingAll: (
      timeWindow: 'day' | 'week',
      query?: {
        /**
         * `ISO-639-1`-`ISO-3166-1` code
         * @default "en-US"
         */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/44immBwzhDVyjn87b3x3l9mlhAD.jpg" */
            backdrop_path?: string;
            /**
             * @default 0
             * @example 934433
             */
            id?: number;
            /** @example "Scream VI" */
            title?: string;
            /** @example "en" */
            original_language?: string;
            /** @example "Scream VI" */
            original_title?: string;
            /** @example "Following the latest Ghostface killings, the four survivors leave Woodsboro behind and start a fresh chapter." */
            overview?: string;
            /** @example "/wDWwtvkRRlgTiUr6TyLSMX8FCuZ.jpg" */
            poster_path?: string;
            /** @example "movie" */
            media_type?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 609.941
             */
            popularity?: number;
            /** @example "2023-03-08" */
            release_date?: string;
            /**
             * @default true
             * @example false
             */
            video?: boolean;
            /**
             * @default 0
             * @example 7.374
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 684
             */
            vote_count?: number;
          }[];
          /**
           * @default 0
           * @example 1000
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 20000
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/trending/all/${timeWindow}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the trending movies on TMDB.
     *
     * @name TrendingMovies
     * @summary Movies
     * @request GET:/3/trending/movie/{time_window}
     * @secure
     */
    trendingMovies: (
      timeWindow: 'day' | 'week',
      query?: {
        /**
         * `ISO-639-1`-`ISO-3166-1` code
         * @default "en-US"
         */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/44immBwzhDVyjn87b3x3l9mlhAD.jpg" */
            backdrop_path?: string;
            /**
             * @default 0
             * @example 934433
             */
            id?: number;
            /** @example "Scream VI" */
            title?: string;
            /** @example "en" */
            original_language?: string;
            /** @example "Scream VI" */
            original_title?: string;
            /** @example "Following the latest Ghostface killings, the four survivors leave Woodsboro behind and start a fresh chapter." */
            overview?: string;
            /** @example "/wDWwtvkRRlgTiUr6TyLSMX8FCuZ.jpg" */
            poster_path?: string;
            /** @example "movie" */
            media_type?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 609.941
             */
            popularity?: number;
            /** @example "2023-03-08" */
            release_date?: string;
            /**
             * @default true
             * @example false
             */
            video?: boolean;
            /**
             * @default 0
             * @example 7.374
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 684
             */
            vote_count?: number;
          }[];
          /**
           * @default 0
           * @example 1000
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 20000
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/trending/movie/${timeWindow}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the trending TV shows on TMDB.
     *
     * @name TrendingTv
     * @summary TV
     * @request GET:/3/trending/tv/{time_window}
     * @secure
     */
    trendingTv: (
      timeWindow: 'day' | 'week',
      query?: {
        /**
         * `ISO-639-1`-`ISO-3166-1` code
         * @default "en-US"
         */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/8P15FsYcTwQZ4G5rRMd1TKD14Aq.jpg" */
            backdrop_path?: string;
            /**
             * @default 0
             * @example 103768
             */
            id?: number;
            /** @example "Sweet Tooth" */
            name?: string;
            /** @example "en" */
            original_language?: string;
            /** @example "Sweet Tooth" */
            original_name?: string;
            /** @example "On a perilous adventure across a post-apocalyptic world, a lovable boy who's half-human and half-deer searches for a new beginning with a gruff protector." */
            overview?: string;
            /** @example "/dBxxtfhC4vYrxB2fLsSxOTY2dQc.jpg" */
            poster_path?: string;
            /** @example "tv" */
            media_type?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 137.498
             */
            popularity?: number;
            /** @example "2021-06-04" */
            first_air_date?: string;
            /**
             * @default 0
             * @example 7.928
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 1094
             */
            vote_count?: number;
            origin_country?: string[];
          }[];
          /**
           * @default 0
           * @example 1000
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 20000
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/trending/tv/${timeWindow}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the rating, watchlist and favourite status of an account.
     *
     * @name MovieAccountStates
     * @summary Account States
     * @request GET:/3/movie/{movie_id}/account_states
     * @secure
     */
    movieAccountStates: (
      movieId: number,
      query?: {
        session_id?: string;
        guest_session_id?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 550
           */
          id?: number;
          /**
           * @default true
           * @example true
           */
          favorite?: boolean;
          rated?: {
            /**
             * @default 0
             * @example 9
             */
            value?: number;
          };
          /**
           * @default true
           * @example false
           */
          watchlist?: boolean;
        },
        any
      >({
        path: `/3/movie/${movieId}/account_states`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the rating, watchlist and favourite status.
     *
     * @name TvSeriesAccountStates
     * @summary Account States
     * @request GET:/3/tv/{series_id}/account_states
     * @secure
     */
    tvSeriesAccountStates: (
      seriesId: number,
      query?: {
        session_id?: string;
        guest_session_id?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 550
           */
          id?: number;
          /**
           * @default true
           * @example true
           */
          favorite?: boolean;
          rated?: {
            /**
             * @default 0
             * @example 9
             */
            value?: number;
          };
          /**
           * @default true
           * @example false
           */
          watchlist?: boolean;
        },
        any
      >({
        path: `/3/tv/${seriesId}/account_states`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the rating, watchlist and favourite status.
     *
     * @name TvEpisodeAccountStates
     * @summary Account States
     * @request GET:/3/tv/{series_id}/season/{season_number}/episode/{episode_number}/account_states
     * @secure
     */
    tvEpisodeAccountStates: (
      seriesId: number,
      seasonNumber: number,
      episodeNumber: number,
      query?: {
        session_id?: string;
        guest_session_id?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 550
           */
          id?: number;
          /**
           * @default true
           * @example true
           */
          favorite?: boolean;
          rated?: {
            /**
             * @default 0
             * @example 9
             */
            value?: number;
          };
          /**
           * @default true
           * @example false
           */
          watchlist?: boolean;
        },
        any
      >({
        path: `/3/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}/account_states`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the trending people on TMDB.
     *
     * @name TrendingPeople
     * @summary People
     * @request GET:/3/trending/person/{time_window}
     * @secure
     */
    trendingPeople: (
      timeWindow: 'day' | 'week',
      query?: {
        /**
         * `ISO-639-1`-`ISO-3166-1` code
         * @default "en-US"
         */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /**
             * @default 0
             * @example 224513
             */
            id?: number;
            /** @example "Ana de Armas" */
            name?: string;
            /** @example "Ana de Armas" */
            original_name?: string;
            /** @example "person" */
            media_type?: string;
            /**
             * @default 0
             * @example 349.766
             */
            popularity?: number;
            /**
             * @default 0
             * @example 1
             */
            gender?: number;
            /** @example "Acting" */
            known_for_department?: string;
            /** @example "/3vxvsmYLTf4jnr163SUlBIw51ee.jpg" */
            profile_path?: string;
            known_for?: {
              /**
               * @default true
               * @example false
               */
              adult?: boolean;
              /** @example "/ilRyazdMJwN05exqhwK4tMKBYZs.jpg" */
              backdrop_path?: string;
              /**
               * @default 0
               * @example 335984
               */
              id?: number;
              /** @example "Blade Runner 2049" */
              title?: string;
              /** @example "en" */
              original_language?: string;
              /** @example "Blade Runner 2049" */
              original_title?: string;
              /** @example "Thirty years after the events of the first film, a new blade runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what's left of society into chaos. K's discovery leads him on a quest to find Rick Deckard, a former LAPD blade runner who has been missing for 30 years." */
              overview?: string;
              /** @example "/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg" */
              poster_path?: string;
              /** @example "movie" */
              media_type?: string;
              genre_ids?: number[];
              /**
               * @default 0
               * @example 79.571
               */
              popularity?: number;
              /** @example "2017-10-04" */
              release_date?: string;
              /**
               * @default true
               * @example false
               */
              video?: boolean;
              /**
               * @default 0
               * @example 7.531
               */
              vote_average?: number;
              /**
               * @default 0
               * @example 11771
               */
              vote_count?: number;
            }[];
          }[];
          /**
           * @default 0
           * @example 1000
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 20000
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/trending/person/${timeWindow}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the alternative titles for a movie.
     *
     * @name MovieAlternativeTitles
     * @summary Alternative Titles
     * @request GET:/3/movie/{movie_id}/alternative_titles
     * @secure
     */
    movieAlternativeTitles: (
      movieId: number,
      query?: {
        /** specify a ISO-3166-1 value to filter the results */
        country?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 550
           */
          id?: number;
          titles?: {
            /** @example "RS" */
            iso_3166_1?: string;
            /** @example "Borilački klub" */
            title?: string;
            /** @example "" */
            type?: string;
          }[];
        },
        any
      >({
        path: `/3/movie/${movieId}/alternative_titles`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the recent changes for a movie.
     *
     * @name MovieChanges
     * @summary Changes
     * @request GET:/3/movie/{movie_id}/changes
     * @secure
     */
    movieChanges: (
      movieId: number,
      query?: {
        /** @format date */
        end_date?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        /** @format date */
        start_date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          changes?: {
            /** @example "images" */
            key?: string;
            items?: {
              /** @example "643197b96dea3a00d4377270" */
              id?: string;
              /** @example "added" */
              action?: string;
              /** @example "2023-04-08 16:35:05 UTC" */
              time?: string;
              /** @example "" */
              iso_639_1?: string;
              /** @example "" */
              iso_3166_1?: string;
              value?: {
                poster?: {
                  /** @example "/s9ZrHprviFCx3azfWNBtt1LPSnL.jpg" */
                  file_path?: string;
                };
              };
            }[];
          }[];
        },
        any
      >({
        path: `/3/movie/${movieId}/changes`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @name MovieCredits
     * @summary Credits
     * @request GET:/3/movie/{movie_id}/credits
     * @secure
     */
    movieCredits: (
      movieId: number,
      query?: {
        /** @default "en-US" */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 550
           */
          id?: number;
          cast?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /**
             * @default 0
             * @example 2
             */
            gender?: number;
            /**
             * @default 0
             * @example 819
             */
            id?: number;
            /** @example "Acting" */
            known_for_department?: string;
            /** @example "Edward Norton" */
            name?: string;
            /** @example "Edward Norton" */
            original_name?: string;
            /**
             * @default 0
             * @example 26.99
             */
            popularity?: number;
            /** @example "/8nytsqL59SFJTVYVrN72k6qkGgJ.jpg" */
            profile_path?: string;
            /**
             * @default 0
             * @example 4
             */
            cast_id?: number;
            /** @example "The Narrator" */
            character?: string;
            /** @example "52fe4250c3a36847f80149f3" */
            credit_id?: string;
            /**
             * @default 0
             * @example 0
             */
            order?: number;
          }[];
          crew?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /**
             * @default 0
             * @example 2
             */
            gender?: number;
            /**
             * @default 0
             * @example 376
             */
            id?: number;
            /** @example "Production" */
            known_for_department?: string;
            /** @example "Arnon Milchan" */
            name?: string;
            /** @example "Arnon Milchan" */
            original_name?: string;
            /**
             * @default 0
             * @example 2.931
             */
            popularity?: number;
            /** @example "/b2hBExX4NnczNAnLuTBF4kmNhZm.jpg" */
            profile_path?: string;
            /** @example "55731b8192514111610027d7" */
            credit_id?: string;
            /** @example "Production" */
            department?: string;
            /** @example "Executive Producer" */
            job?: string;
          }[];
        },
        any
      >({
        path: `/3/movie/${movieId}/credits`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @name MovieExternalIds
     * @summary External IDs
     * @request GET:/3/movie/{movie_id}/external_ids
     * @secure
     */
    movieExternalIds: (movieId: number, params: RequestParams = {}) =>
      this.request<
        {
          /**
           * @default 0
           * @example 550
           */
          id?: number;
          /** @example "tt0137523" */
          imdb_id?: string;
          wikidata_id?: any;
          /** @example "FightClub" */
          facebook_id?: string;
          instagram_id?: any;
          twitter_id?: any;
        },
        any
      >({
        path: `/3/movie/${movieId}/external_ids`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @name MovieKeywords
     * @summary Keywords
     * @request GET:/3/movie/{movie_id}/keywords
     * @secure
     */
    movieKeywords: (movieId: string, params: RequestParams = {}) =>
      this.request<
        {
          /**
           * @default 0
           * @example 550
           */
          id?: number;
          keywords?: {
            /**
             * @default 0
             * @example 818
             */
            id?: number;
            /** @example "based on novel or book" */
            name?: string;
          }[];
        },
        any
      >({
        path: `/3/movie/${movieId}/keywords`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the lists that a movie has been added to.
     *
     * @name MovieLists
     * @summary Lists
     * @request GET:/3/movie/{movie_id}/lists
     * @secure
     */
    movieLists: (
      movieId: number,
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 550
           */
          id?: number;
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /** @example "Movies I own" */
            description?: string;
            /**
             * @default 0
             * @example 0
             */
            favorite_count?: number;
            /**
             * @default 0
             * @example 8248696
             */
            id?: number;
            /**
             * @default 0
             * @example 409
             */
            item_count?: number;
            /** @example "en" */
            iso_639_1?: string;
            /** @example "movie" */
            list_type?: string;
            /** @example "My Movies" */
            name?: string;
            poster_path?: any;
          }[];
          /**
           * @default 0
           * @example 122
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 2422
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/movie/${movieId}/lists`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @name MovieRecommendations
     * @summary Recommendations
     * @request GET:/3/movie/{movie_id}/recommendations
     * @secure
     */
    movieRecommendations: (
      movieId: number,
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<object, any>({
        path: `/3/movie/${movieId}/recommendations`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the release dates and certifications for a movie.
     *
     * @name MovieReleaseDates
     * @summary Release Dates
     * @request GET:/3/movie/{movie_id}/release_dates
     * @secure
     */
    movieReleaseDates: (movieId: number, params: RequestParams = {}) =>
      this.request<
        {
          /**
           * @default 0
           * @example 550
           */
          id?: number;
          results?: {
            /** @example "BG" */
            iso_3166_1?: string;
            release_dates?: {
              /** @example "c" */
              certification?: string;
              descriptors?: any[];
              /** @example "" */
              iso_639_1?: string;
              /** @example "" */
              note?: string;
              /** @example "2012-08-28T00:00:00.000Z" */
              release_date?: string;
              /**
               * @default 0
               * @example 3
               */
              type?: number;
            }[];
          }[];
        },
        any
      >({
        path: `/3/movie/${movieId}/release_dates`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the user reviews for a movie.
     *
     * @name MovieReviews
     * @summary Reviews
     * @request GET:/3/movie/{movie_id}/reviews
     * @secure
     */
    movieReviews: (
      movieId: number,
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 550
           */
          id?: number;
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /** @example "Goddard" */
            author?: string;
            author_details?: {
              /** @example "" */
              name?: string;
              /** @example "Goddard" */
              username?: string;
              /** @example "/https://secure.gravatar.com/avatar/f248ec34f953bc62cafcbdd81fddd6b6.jpg" */
              avatar_path?: string;
              rating?: any;
            };
            /** @example "Pretty awesome movie.  It shows what one crazy person can convince other crazy people to do.  Everyone needs something to believe in.  I recommend Jesus Christ, but they want Tyler Durden." */
            content?: string;
            /** @example "2018-06-09T17:51:53.359Z" */
            created_at?: string;
            /** @example "5b1c13b9c3a36848f2026384" */
            id?: string;
            /** @example "2021-06-23T15:58:09.421Z" */
            updated_at?: string;
            /** @example "https://www.themoviedb.org/review/5b1c13b9c3a36848f2026384" */
            url?: string;
          }[];
          /**
           * @default 0
           * @example 1
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 8
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/movie/${movieId}/reviews`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the similar movies based on genres and keywords.
     *
     * @name MovieSimilar
     * @summary Similar
     * @request GET:/3/movie/{movie_id}/similar
     * @secure
     */
    movieSimilar: (
      movieId: number,
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/3YAldML4EDyoC6RBpzceALigrAZ.jpg" */
            backdrop_path?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 9300
             */
            id?: number;
            /** @example "en" */
            original_language?: string;
            /** @example "Orlando" */
            original_title?: string;
            /** @example "England, 1600. Queen Elizabeth I promises Orlando, a young nobleman obsessed with poetry, that she will grant him land and fortune if he agrees to satisfy a very particular request." */
            overview?: string;
            /**
             * @default 0
             * @example 7.768
             */
            popularity?: number;
            /** @example "/xvz0qZkXXMq3dH2Revxii8drxWc.jpg" */
            poster_path?: string;
            /** @example "1992-12-11" */
            release_date?: string;
            /** @example "Orlando" */
            title?: string;
            /**
             * @default true
             * @example false
             */
            video?: boolean;
            /**
             * @default 0
             * @example 6.966
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 262
             */
            vote_count?: number;
          }[];
          /**
           * @default 0
           * @example 364
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 7269
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/movie/${movieId}/similar`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the translations for a movie.
     *
     * @name MovieTranslations
     * @summary Translations
     * @request GET:/3/movie/{movie_id}/translations
     * @secure
     */
    movieTranslations: (movieId: number, params: RequestParams = {}) =>
      this.request<
        {
          /**
           * @default 0
           * @example 550
           */
          id?: number;
          translations?: {
            /** @example "SA" */
            iso_3166_1?: string;
            /** @example "ar" */
            iso_639_1?: string;
            /** @example "العربية" */
            name?: string;
            /** @example "Arabic" */
            english_name?: string;
            data?: {
              /** @example "" */
              homepage?: string;
              /** @example "إدوارد يتعرض لضغوط حتى يصل به الحال إلى أنه لا يستطيع النوم لفتراتٍ طويلة، لكنه يجد بعض السلام في جلسات العلاج النفسي الجماعي، يتعرف إدوارد على أحد الأشخاص وهو (تايلر ديردن) الذي يحرره من تعلقه بالأشياء الذي تستعبده ،ثم يحرره من خوفه من الناس. يقومان معًا بإنشاء نادي القتال الذي يجذب الكثير من الأفراد المحبطين ،الذين يقومون بإخراج طاقة غضبهم وكرههم للعالم في القتال." */
              overview?: string;
              /**
               * @default 0
               * @example 0
               */
              runtime?: number;
              /** @example "" */
              tagline?: string;
              /** @example "" */
              title?: string;
            };
          }[];
        },
        any
      >({
        path: `/3/movie/${movieId}/translations`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @name MovieVideos
     * @summary Videos
     * @request GET:/3/movie/{movie_id}/videos
     * @secure
     */
    movieVideos: (
      movieId: number,
      query?: {
        /** @default "en-US" */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 550
           */
          id?: number;
          results?: {
            /** @example "en" */
            iso_639_1?: string;
            /** @example "US" */
            iso_3166_1?: string;
            /** @example "Fight Club (1999) Trailer - Starring Brad Pitt, Edward Norton, Helena Bonham Carter" */
            name?: string;
            /** @example "O-b2VfmmbyA" */
            key?: string;
            /** @example "YouTube" */
            site?: string;
            /**
             * @default 0
             * @example 720
             */
            size?: number;
            /** @example "Trailer" */
            type?: string;
            /**
             * @default true
             * @example false
             */
            official?: boolean;
            /** @example "2016-03-05T02:03:14.000Z" */
            published_at?: string;
            /** @example "639d5326be6d88007f170f44" */
            id?: string;
          }[];
        },
        any
      >({
        path: `/3/movie/${movieId}/videos`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the list of streaming providers we have for a movie.
     *
     * @name MovieWatchProviders
     * @summary Watch Providers
     * @request GET:/3/movie/{movie_id}/watch/providers
     * @secure
     */
    movieWatchProviders: (movieId: number, params: RequestParams = {}) =>
      this.request<
        {
          /**
           * @default 0
           * @example 550
           */
          id?: number;
          results?: {
            AE?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=AE" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 12
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            AL?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=AL" */
              link?: string;
              buy?: {
                /** @example "/5GEbAhFW2S5T8zVc1MNvz00pIzM.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 35
                 */
                provider_id?: number;
                /** @example "Rakuten TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 9
                 */
                display_priority?: number;
              }[];
            };
            AR?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=AR" */
              link?: string;
              buy?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 6
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 6
                 */
                display_priority?: number;
              }[];
            };
            AT?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=AT" */
              link?: string;
              flatrate?: {
                /** @example "/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 337
                 */
                provider_id?: number;
                /** @example "Disney Plus" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/5NyLm42TmCqCMOZFvH4fcoSNKEW.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 10
                 */
                provider_id?: number;
                /** @example "Amazon Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/5NyLm42TmCqCMOZFvH4fcoSNKEW.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 10
                 */
                provider_id?: number;
                /** @example "Amazon Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
            };
            AU?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=AU" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 10
                 */
                display_priority?: number;
              }[];
            };
            BA?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=BA" */
              link?: string;
              buy?: {
                /** @example "/5GEbAhFW2S5T8zVc1MNvz00pIzM.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 35
                 */
                provider_id?: number;
                /** @example "Rakuten TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 9
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            BB?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=BB" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 28
                 */
                display_priority?: number;
              }[];
            };
            BE?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=BE" */
              link?: string;
              rent?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 6
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 337
                 */
                provider_id?: number;
                /** @example "Disney Plus" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 6
                 */
                display_priority?: number;
              }[];
            };
            BG?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=BG" */
              link?: string;
              rent?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            BH?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=BH" */
              link?: string;
              buy?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1000
                 */
                display_priority?: number;
              }[];
            };
            BO?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=BO" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            BR?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=BR" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                display_priority?: number;
              }[];
            };
            BS?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=BS" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 28
                 */
                display_priority?: number;
              }[];
            };
            CA?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=CA" */
              link?: string;
              rent?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 8
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 6
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/sB5vHrmYmliwUvBwZe8HpXo9r8m.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 305
                 */
                provider_id?: number;
                /** @example "Crave Starz" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 5
                 */
                display_priority?: number;
              }[];
            };
            CH?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=CH" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/rVOOhp6V8FheEAKtFAJMLMbnaMZ.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 150
                 */
                provider_id?: number;
                /** @example "blue TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/rVOOhp6V8FheEAKtFAJMLMbnaMZ.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 150
                 */
                provider_id?: number;
                /** @example "blue TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
            };
            CL?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=CL" */
              link?: string;
              buy?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
            };
            CO?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=CO" */
              link?: string;
              buy?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
            };
            CR?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=CR" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            CV?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=CV" */
              link?: string;
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 13
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 13
                 */
                display_priority?: number;
              }[];
            };
            CZ?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=CZ" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/wTF37o4jOkQfjnWe41gmeuASYZA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 308
                 */
                provider_id?: number;
                /** @example "O2 TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
            };
            DE?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=DE" */
              link?: string;
              flatrate?: {
                /** @example "/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 337
                 */
                provider_id?: number;
                /** @example "Disney Plus" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
            };
            DK?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=DK" */
              link?: string;
              rent?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 7
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 337
                 */
                provider_id?: number;
                /** @example "Disney Plus" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 7
                 */
                display_priority?: number;
              }[];
            };
            DO?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=DO" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            EC?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=EC" */
              link?: string;
              buy?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 11
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 11
                 */
                display_priority?: number;
              }[];
            };
            EE?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=EE" */
              link?: string;
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
            };
            EG?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=EG" */
              link?: string;
              rent?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                display_priority?: number;
              }[];
            };
            ES?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=ES" */
              link?: string;
              rent?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
              ads?: {
                /** @example "/5GEbAhFW2S5T8zVc1MNvz00pIzM.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 35
                 */
                provider_id?: number;
                /** @example "Rakuten TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 11
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
            };
            FI?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=FI" */
              link?: string;
              flatrate?: {
                /** @example "/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 337
                 */
                provider_id?: number;
                /** @example "Disney Plus" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 10
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 10
                 */
                display_priority?: number;
              }[];
            };
            FJ?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=FJ" */
              link?: string;
              buy?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1000
                 */
                display_priority?: number;
              }[];
            };
            FR?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=FR" */
              link?: string;
              rent?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 5
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 5
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            GB?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=GB" */
              link?: string;
              flatrate?: {
                /** @example "/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 337
                 */
                provider_id?: number;
                /** @example "Disney Plus" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/5NyLm42TmCqCMOZFvH4fcoSNKEW.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 10
                 */
                provider_id?: number;
                /** @example "Amazon Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/5NyLm42TmCqCMOZFvH4fcoSNKEW.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 10
                 */
                provider_id?: number;
                /** @example "Amazon Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
            };
            GF?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=GF" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 30
                 */
                display_priority?: number;
              }[];
            };
            GI?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=GI" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            GR?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=GR" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                display_priority?: number;
              }[];
            };
            GT?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=GT" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            HK?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=HK" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 7
                 */
                display_priority?: number;
              }[];
            };
            HN?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=HN" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            HR?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=HR" */
              link?: string;
              buy?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
              ads?: {
                /** @example "/xrHrIraInfRXnrz1zHhY1tXJowg.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 572
                 */
                provider_id?: number;
                /** @example "RTL Play" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 30
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            HU?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=HU" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
            };
            ID?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=ID" */
              link?: string;
              flatrate?: {
                /** @example "/7Fl8ylPDclt3ZYgNbW2t7rbZE9I.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 122
                 */
                provider_id?: number;
                /** @example "Hotstar" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
            };
            IE?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=IE" */
              link?: string;
              rent?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
            };
            IL?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=IL" */
              link?: string;
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 28
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            IN?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=IN" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 8
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 8
                 */
                display_priority?: number;
              }[];
            };
            IQ?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=IQ" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            IS?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=IS" */
              link?: string;
              buy?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 337
                 */
                provider_id?: number;
                /** @example "Disney Plus" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            IT?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=IT" */
              link?: string;
              buy?: {
                /** @example "/5GEbAhFW2S5T8zVc1MNvz00pIzM.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 35
                 */
                provider_id?: number;
                /** @example "Rakuten TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/5GEbAhFW2S5T8zVc1MNvz00pIzM.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 35
                 */
                provider_id?: number;
                /** @example "Rakuten TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            JM?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=JM" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 27
                 */
                display_priority?: number;
              }[];
            };
            JO?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=JO" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1000
                 */
                display_priority?: number;
              }[];
            };
            JP?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=JP" */
              link?: string;
              flatrate?: {
                /** @example "/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 337
                 */
                provider_id?: number;
                /** @example "Disney Plus" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/g8jqHtXJsMlc8B1Gb0Rt8AvUJMn.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 85
                 */
                provider_id?: number;
                /** @example "dTV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 7
                 */
                display_priority?: number;
              }[];
            };
            KR?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=KR" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/2ioan5BX5L9tz4fIGU93blTeFhv.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 356
                 */
                provider_id?: number;
                /** @example "wavve" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
            };
            KW?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=KW" */
              link?: string;
              buy?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1000
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            LB?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=LB" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1000
                 */
                display_priority?: number;
              }[];
            };
            LI?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=LI" */
              link?: string;
              flatrate?: {
                /** @example "/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 337
                 */
                provider_id?: number;
                /** @example "Disney Plus" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 30
                 */
                display_priority?: number;
              }[];
            };
            LT?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=LT" */
              link?: string;
              rent?: {
                /** @example "/xTVM8uXT9QocigQ07LE7Irc65W2.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 553
                 */
                provider_id?: number;
                /** @example "Telia Play" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 15
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            LV?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=LV" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
            };
            MD?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=MD" */
              link?: string;
              buy?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1000
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 26
                 */
                display_priority?: number;
              }[];
            };
            MK?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=MK" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 29
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/5GEbAhFW2S5T8zVc1MNvz00pIzM.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 35
                 */
                provider_id?: number;
                /** @example "Rakuten TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 9
                 */
                display_priority?: number;
              }[];
            };
            MT?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=MT" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/5GEbAhFW2S5T8zVc1MNvz00pIzM.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 35
                 */
                provider_id?: number;
                /** @example "Rakuten TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 9
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/5GEbAhFW2S5T8zVc1MNvz00pIzM.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 35
                 */
                provider_id?: number;
                /** @example "Rakuten TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 9
                 */
                display_priority?: number;
              }[];
            };
            MU?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=MU" */
              link?: string;
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 15
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 15
                 */
                display_priority?: number;
              }[];
            };
            MX?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=MX" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            MY?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=MY" */
              link?: string;
              flatrate?: {
                /** @example "/7Fl8ylPDclt3ZYgNbW2t7rbZE9I.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 122
                 */
                provider_id?: number;
                /** @example "Hotstar" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 0
                 */
                display_priority?: number;
              }[];
            };
            MZ?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=MZ" */
              link?: string;
              rent?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 16
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 16
                 */
                display_priority?: number;
              }[];
            };
            NL?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=NL" */
              link?: string;
              buy?: {
                /** @example "/llmnYOyknekZsXtkCaazKjhTLvG.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 71
                 */
                provider_id?: number;
                /** @example "Pathé Thuis" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 7
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/llmnYOyknekZsXtkCaazKjhTLvG.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 71
                 */
                provider_id?: number;
                /** @example "Pathé Thuis" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 7
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 337
                 */
                provider_id?: number;
                /** @example "Disney Plus" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            NO?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=NO" */
              link?: string;
              rent?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 6
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 6
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 337
                 */
                provider_id?: number;
                /** @example "Disney Plus" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            NZ?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=NZ" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
            };
            OM?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=OM" */
              link?: string;
              buy?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1000
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1000
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            PA?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=PA" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            PE?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=PE" */
              link?: string;
              rent?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 5
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 5
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                display_priority?: number;
              }[];
            };
            PH?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=PH" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            PK?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=PK" */
              link?: string;
              flatrate?: {
                /** @example "/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 8
                 */
                provider_id?: number;
                /** @example "Netflix" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 0
                 */
                display_priority?: number;
              }[];
            };
            PL?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=PL" */
              link?: string;
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            PS?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=PS" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            PT?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=PT" */
              link?: string;
              buy?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 5
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/dUeHhim2WUZz8S7EWjv0Ws6anRP.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 242
                 */
                provider_id?: number;
                /** @example "Meo" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 337
                 */
                provider_id?: number;
                /** @example "Disney Plus" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            PY?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=PY" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            QA?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=QA" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1000
                 */
                display_priority?: number;
              }[];
            };
            RO?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=RO" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            RS?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=RS" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/5GEbAhFW2S5T8zVc1MNvz00pIzM.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 35
                 */
                provider_id?: number;
                /** @example "Rakuten TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 9
                 */
                display_priority?: number;
              }[];
            };
            RU?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=RU" */
              link?: string;
              rent?: {
                /** @example "/o9ExgOSLF3OTwR6T3DJOuwOKJgq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 113
                 */
                provider_id?: number;
                /** @example "Ivi" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1000
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/o9ExgOSLF3OTwR6T3DJOuwOKJgq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 113
                 */
                provider_id?: number;
                /** @example "Ivi" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1000
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/zLM7f1w2L8TU2Fspzns72m6h3yY.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 501
                 */
                provider_id?: number;
                /** @example "Wink" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1000
                 */
                display_priority?: number;
              }[];
            };
            SA?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=SA" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 28
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            SE?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=SE" */
              link?: string;
              buy?: {
                /** @example "/shq88b09gTBYC4hA7K7MUL8Q4zP.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 68
                 */
                provider_id?: number;
                /** @example "Microsoft Store" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 7
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/shq88b09gTBYC4hA7K7MUL8Q4zP.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 68
                 */
                provider_id?: number;
                /** @example "Microsoft Store" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 7
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 337
                 */
                provider_id?: number;
                /** @example "Disney Plus" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            SG?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=SG" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            SI?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=SI" */
              link?: string;
              buy?: {
                /** @example "/5GEbAhFW2S5T8zVc1MNvz00pIzM.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 35
                 */
                provider_id?: number;
                /** @example "Rakuten TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 9
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            SK?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=SK" */
              link?: string;
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
            };
            SM?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=SM" */
              link?: string;
              flatrate?: {
                /** @example "/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 337
                 */
                provider_id?: number;
                /** @example "Disney Plus" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 30
                 */
                display_priority?: number;
              }[];
            };
            SV?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=SV" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            TH?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=TH" */
              link?: string;
              flatrate?: {
                /** @example "/7Fl8ylPDclt3ZYgNbW2t7rbZE9I.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 122
                 */
                provider_id?: number;
                /** @example "Hotstar" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 0
                 */
                display_priority?: number;
              }[];
            };
            TR?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=TR" */
              link?: string;
              rent?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 5
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 5
                 */
                display_priority?: number;
              }[];
            };
            TT?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=TT" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 11
                 */
                display_priority?: number;
              }[];
            };
            TW?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=TW" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            UG?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=UG" */
              link?: string;
              rent?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 16
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 16
                 */
                display_priority?: number;
              }[];
            };
            US?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=US" */
              link?: string;
              rent?: {
                /** @example "/5NyLm42TmCqCMOZFvH4fcoSNKEW.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 10
                 */
                provider_id?: number;
                /** @example "Amazon Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 13
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/jPXksae158ukMLFhhlNvzsvaEyt.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 257
                 */
                provider_id?: number;
                /** @example "fuboTV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 5
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
            };
            UY?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=UY" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            VE?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=VE" */
              link?: string;
              rent?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
            };
            YE?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=YE" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
            };
            ZA?: {
              /** @example "https://www.themoviedb.org/movie/550-fight-club/watch?locale=ZA" */
              link?: string;
              flatrate?: {
                /** @example "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 119
                 */
                provider_id?: number;
                /** @example "Amazon Prime Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 1
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                display_priority?: number;
              }[];
            };
          };
        },
        any
      >({
        path: `/3/movie/${movieId}/watch/providers`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Rate a movie and save it to your rated list.
     *
     * @name MovieAddRating
     * @summary Add Rating
     * @request POST:/3/movie/{movie_id}/rating
     * @secure
     */
    movieAddRating: (
      movieId: number,
      data: {
        /** @format json */
        RAW_BODY: string;
      },
      query?: {
        guest_session_id?: string;
        session_id?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          status_code?: number;
          /** @example "Success." */
          status_message?: string;
        },
        any
      >({
        path: `/3/movie/${movieId}/rating`,
        method: 'POST',
        query: query,
        body: data,
        secure: true,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * @description Delete a user rating.
     *
     * @name MovieDeleteRating
     * @summary Delete Rating
     * @request DELETE:/3/movie/{movie_id}/rating
     * @secure
     */
    movieDeleteRating: (
      movieId: number,
      query?: {
        guest_session_id?: string;
        session_id?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 13
           */
          status_code?: number;
          /** @example "The item/record was deleted successfully." */
          status_message?: string;
        },
        any
      >({
        path: `/3/movie/${movieId}/rating`,
        method: 'DELETE',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @name AuthenticationCreateGuestSession
     * @summary Create Guest Session
     * @request GET:/3/authentication/guest_session/new
     * @secure
     */
    authenticationCreateGuestSession: (params: RequestParams = {}) =>
      this.request<
        {
          /**
           * @default true
           * @example true
           */
          success?: boolean;
          /** @example "1ce82ec1223641636ad4a60b07de3581" */
          guest_session_id?: string;
          /** @example "2016-08-27 16:26:40 UTC" */
          expires_at?: string;
        },
        any
      >({
        path: `/3/authentication/guest_session/new`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @name AuthenticationCreateRequestToken
     * @summary Create Request Token
     * @request GET:/3/authentication/token/new
     * @secure
     */
    authenticationCreateRequestToken: (params: RequestParams = {}) =>
      this.request<
        {
          /**
           * @default true
           * @example true
           */
          success?: boolean;
          /** @example "2016-08-26 17:04:39 UTC" */
          expires_at?: string;
          /** @example "ff5c7eeb5a8870efe3cd7fc5c282cffd26800ecd" */
          request_token?: string;
        },
        any
      >({
        path: `/3/authentication/token/new`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @name AuthenticationCreateSession
     * @summary Create Session
     * @request POST:/3/authentication/session/new
     * @secure
     */
    authenticationCreateSession: (
      data: {
        /** @format json */
        RAW_BODY: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default true
           * @example true
           */
          success?: boolean;
          /** @example "79191836ddaa0da3df76a5ffef6f07ad6ab0c641" */
          session_id?: string;
        },
        any
      >({
        path: `/3/authentication/session/new`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @name AuthenticationCreateSessionFromV4Token
     * @summary Create Session (from v4 token)
     * @request POST:/3/authentication/session/convert/4
     * @secure
     */
    authenticationCreateSessionFromV4Token: (
      data: {
        /** @format json */
        RAW_BODY: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default true
           * @example true
           */
          success?: boolean;
          /** @example "2629f70fb498edc263a0adb99118ac41f0053e8c" */
          session_id?: string;
        },
        any
      >({
        path: `/3/authentication/session/convert/4`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @name AuthenticationDeleteSession
     * @summary Delete Session
     * @request DELETE:/3/authentication/session
     * @secure
     */
    authenticationDeleteSession: (
      data: {
        /** @format json */
        RAW_BODY: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default true
           * @example true
           */
          success?: boolean;
        },
        any
      >({
        path: `/3/authentication/session`,
        method: 'DELETE',
        body: data,
        secure: true,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * @description Find data by external ID's.
     *
     * @name FindById
     * @summary Find By ID
     * @request GET:/3/find/{external_id}
     * @secure
     */
    findById: (
      externalId: string,
      query: {
        external_source:
          | ''
          | 'imdb_id'
          | 'facebook_id'
          | 'instagram_id'
          | 'tvdb_id'
          | 'tiktok_id'
          | 'twitter_id'
          | 'wikidata_id'
          | 'youtube_id';
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          movie_results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/44immBwzhDVyjn87b3x3l9mlhAD.jpg" */
            backdrop_path?: string;
            /**
             * @default 0
             * @example 934433
             */
            id?: number;
            /** @example "Scream VI" */
            title?: string;
            /** @example "en" */
            original_language?: string;
            /** @example "Scream VI" */
            original_title?: string;
            /** @example "Following the latest Ghostface killings, the four survivors leave Woodsboro behind and start a fresh chapter." */
            overview?: string;
            /** @example "/wDWwtvkRRlgTiUr6TyLSMX8FCuZ.jpg" */
            poster_path?: string;
            /** @example "movie" */
            media_type?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 853.917
             */
            popularity?: number;
            /** @example "2023-03-08" */
            release_date?: string;
            /**
             * @default true
             * @example false
             */
            video?: boolean;
            /**
             * @default 0
             * @example 7.388
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 708
             */
            vote_count?: number;
          }[];
          person_results?: any[];
          tv_results?: any[];
          tv_episode_results?: any[];
          tv_season_results?: any[];
        },
        any
      >({
        path: `/3/find/${externalId}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Query the top level details of a person.
     *
     * @name PersonDetails
     * @summary Details
     * @request GET:/3/person/{person_id}
     * @secure
     */
    personDetails: (
      personId: number,
      query?: {
        /** comma separated list of endpoints within this namespace, 20 items max */
        append_to_response?: string;
        /** @default "en-US" */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default true
           * @example false
           */
          adult?: boolean;
          also_known_as?: string[];
          /**
           * @example "Thomas Jeffrey Hanks (born July 9, 1956) is an American actor and filmmaker. Known for both his comedic and dramatic roles, Hanks is one of the most popular and recognizable film stars worldwide, and is widely regarded as an American cultural icon.
           *
           * Hanks made his breakthrough with leading roles in the comedies Splash (1984) and Big (1988). He won two consecutive Academy Awards for Best Actor for starring as a gay lawyer suffering from AIDS in Philadelphia (1993) and a young man with below-average IQ in Forrest Gump (1994). Hanks collaborated with film director Steven Spielberg on five films: Saving Private Ryan (1998), Catch Me If You Can (2002), The Terminal (2004), Bridge of Spies (2015), and The Post (2017), as well as the 2001 miniseries Band of Brothers, which launched him as a director, producer, and screenwriter.
           *
           * Hanks' other notable films include the romantic comedies Sleepless in Seattle (1993) and You've Got Mail (1998); the dramas Apollo 13 (1995), The Green Mile (1999), Cast Away (2000), Road to Perdition (2002), and Cloud Atlas (2012); and the biographical dramas Saving Mr. Banks (2013), Captain Phillips (2013), Sully (2016), and A Beautiful Day in the Neighborhood (2019). He has also appeared as the title character in the Robert Langdon film series, and has voiced Sheriff Woody in the Toy Story film series.
           *
           * Description above from the Wikipedia article Tom Hanks, licensed under CC-BY-SA, full list of contributors on Wikipedia."
           */
          biography?: string;
          /** @example "1956-07-09" */
          birthday?: string;
          deathday?: any;
          /**
           * @default 0
           * @example 2
           */
          gender?: number;
          homepage?: any;
          /**
           * @default 0
           * @example 31
           */
          id?: number;
          /** @example "nm0000158" */
          imdb_id?: string;
          /** @example "Acting" */
          known_for_department?: string;
          /** @example "Tom Hanks" */
          name?: string;
          /** @example "Concord, California, USA" */
          place_of_birth?: string;
          /**
           * @default 0
           * @example 82.989
           */
          popularity?: number;
          /** @example "/xndWFsBlClOJFRdhSt4NBwiPq2o.jpg" */
          profile_path?: string;
        },
        any
      >({
        path: `/3/person/${personId}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the recent changes for a person.
     *
     * @name PersonChanges
     * @summary Changes
     * @request GET:/3/person/{person_id}/changes
     * @secure
     */
    personChanges: (
      personId: number,
      query?: {
        /** @format date */
        end_date?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        /** @format date */
        start_date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          changes?: {
            /** @example "biography" */
            key?: string;
            items?: {
              /** @example "640469b113654500ba4e859a" */
              id?: string;
              /** @example "added" */
              action?: string;
              /** @example "2023-03-05 10:06:41 UTC" */
              time?: string;
              /** @example "ca" */
              iso_639_1?: string;
              /** @example "ES" */
              iso_3166_1?: string;
              /**
               * @example "Thomas "Tom" Jeffrey Hanks (Concord, Califòrnia, 9 de juliol de 1956) és un actor de cinema i productor estatunidenc, guanyador dues vegades de l'Oscar al millor actor i considerat un dels més versàtils i talentosos del cinema actual.
               *
               * Hanks és l'actor que més diners ha guanyat de tota la història del cinema amb un total de gairebé sis mil milions de dòlars (setembre 2006). És també copropietari de Playtone, una companyia de producció de pel·lícules."
               */
              value?: string;
            }[];
          }[];
        },
        any
      >({
        path: `/3/person/${personId}/changes`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the recent changes for a TV show.
     *
     * @name TvSeriesChanges
     * @summary Changes
     * @request GET:/3/tv/{series_id}/changes
     * @secure
     */
    tvSeriesChanges: (
      seriesId: number,
      query?: {
        end_date?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        start_date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          changes?: {
            /** @example "images" */
            key?: string;
            items?: {
              /** @example "640435cf021cee0084710972" */
              id?: string;
              /** @example "updated" */
              action?: string;
              /** @example "2023-03-05 06:25:19 UTC" */
              time?: string;
              /** @example "en" */
              iso_639_1?: string;
              /** @example "" */
              iso_3166_1?: string;
              value?: {
                poster?: {
                  /** @example "/ouudK6RCNnsbT1CSXrlATXQIQTG.jpg" */
                  file_path?: string;
                  /** @example "en" */
                  iso_639_1?: string;
                };
              };
              original_value?: {
                poster?: {
                  /** @example "/ouudK6RCNnsbT1CSXrlATXQIQTG.jpg" */
                  file_path?: string;
                  /** @example "fr" */
                  iso_639_1?: string;
                };
              };
            }[];
          }[];
        },
        any
      >({
        path: `/3/tv/${seriesId}/changes`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the profile images that belong to a person.
     *
     * @name PersonImages
     * @summary Images
     * @request GET:/3/person/{person_id}/images
     * @secure
     */
    personImages: (personId: number, params: RequestParams = {}) =>
      this.request<
        {
          /**
           * @default 0
           * @example 287
           */
          id?: number;
          profiles?: {
            /**
             * @default 0
             * @example 0.666
             */
            aspect_ratio?: number;
            /**
             * @default 0
             * @example 980
             */
            height?: number;
            iso_639_1?: any;
            /** @example "/cckcYc2v0yh1tc9QjRelptcOBko.jpg" */
            file_path?: string;
            /**
             * @default 0
             * @example 5.288
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 89
             */
            vote_count?: number;
            /**
             * @default 0
             * @example 653
             */
            width?: number;
          }[];
        },
        any
      >({
        path: `/3/person/${personId}/images`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the movie credits for a person.
     *
     * @name PersonMovieCredits
     * @summary Movie Credits
     * @request GET:/3/person/{person_id}/movie_credits
     * @secure
     */
    personMovieCredits: (
      personId: number,
      query?: {
        /** @default "en-US" */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          cast?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/3h1JZGDhZ8nzxdgvkxha0qBqi05.jpg" */
            backdrop_path?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 13
             */
            id?: number;
            /** @example "en" */
            original_language?: string;
            /** @example "Forrest Gump" */
            original_title?: string;
            /** @example "A man with a low IQ has accomplished great things in his life and been present during significant historic events—in each case, far exceeding what anyone imagined he could do. But despite all he has achieved, his one true love eludes him." */
            overview?: string;
            /**
             * @default 0
             * @example 62.225
             */
            popularity?: number;
            /** @example "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg" */
            poster_path?: string;
            /** @example "1994-06-23" */
            release_date?: string;
            /** @example "Forrest Gump" */
            title?: string;
            /**
             * @default true
             * @example false
             */
            video?: boolean;
            /**
             * @default 0
             * @example 8.481
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 24535
             */
            vote_count?: number;
            /** @example "Forrest Gump" */
            character?: string;
            /** @example "52fe420ec3a36847f800074f" */
            credit_id?: string;
            /**
             * @default 0
             * @example 0
             */
            order?: number;
          }[];
          crew?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/tx3uj8GPWf5pzb0gWATJ4bokNHI.jpg" */
            backdrop_path?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 87061
             */
            id?: number;
            /** @example "fr" */
            original_language?: string;
            /** @example "Le Voyage extraordinaire" */
            original_title?: string;
            /** @example "An account of the extraordinary life of film pioneer Georges Méliès (1861-1938) and the amazing story of the copy in color of his masterpiece “A Trip to the Moon” (1902), unexpectedly found in Spain and restored thanks to the heroic efforts of a group of true cinema lovers." */
            overview?: string;
            /**
             * @default 0
             * @example 6.007
             */
            popularity?: number;
            /** @example "/zHNNT9gfiGsuadR6x38KYOp6ekq.jpg" */
            poster_path?: string;
            /** @example "2011-12-08" */
            release_date?: string;
            /** @example "The Extraordinary Voyage" */
            title?: string;
            /**
             * @default true
             * @example false
             */
            video?: boolean;
            /**
             * @default 0
             * @example 7.6
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 47
             */
            vote_count?: number;
            /** @example "5d818a63d34eb3002c4f8fea" */
            credit_id?: string;
            /** @example "Crew" */
            department?: string;
            /** @example "Thanks" */
            job?: string;
          }[];
          /**
           * @default 0
           * @example 31
           */
          id?: number;
        },
        any
      >({
        path: `/3/person/${personId}/movie_credits`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the TV credits that belong to a person.
     *
     * @name PersonTvCredits
     * @summary TV Credits
     * @request GET:/3/person/{person_id}/tv_credits
     * @secure
     */
    personTvCredits: (
      personId: number,
      query?: {
        /** @default "en-US" */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          cast?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/ttvojTMgaIN7U8gqB5LlNqO4vPN.jpg" */
            backdrop_path?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 1900
             */
            id?: number;
            origin_country?: string[];
            /** @example "en" */
            original_language?: string;
            /** @example "LIVE with Kelly and Mark" */
            original_name?: string;
            /** @example "A morning talk show with A-list celebrity guests, top-notch performances and one-of-a-kind segments that are unrivaled on daytime television, plus spontaneous, hilarious and unpredictable talk." */
            overview?: string;
            /**
             * @default 0
             * @example 700.508
             */
            popularity?: number;
            /** @example "/l5y8egG27p2fSTyq8s21SQMmQLy.jpg" */
            poster_path?: string;
            /** @example "1988-09-05" */
            first_air_date?: string;
            /** @example "LIVE with Kelly and Mark" */
            name?: string;
            /**
             * @default 0
             * @example 5.4
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 25
             */
            vote_count?: number;
            /** @example "" */
            character?: string;
            /** @example "52571af019c29571140d5c92" */
            credit_id?: string;
            /**
             * @default 0
             * @example 1
             */
            episode_count?: number;
          }[];
          crew?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/6uMA6EAiwcsCqQJwWgYwtORvE0v.jpg" */
            backdrop_path?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 2391
             */
            id?: number;
            origin_country?: string[];
            /** @example "en" */
            original_language?: string;
            /** @example "Tales from the Crypt" */
            original_name?: string;
            /** @example "Cadaverous scream legend the Crypt Keeper is your macabre host for these forays of fright and fun based on the classic E.C. Comics tales from back in the day. So shamble up to the bar and pick your poison. Will it be an insane Santa on a personal slay ride? Honeymooners out to fulfill the "til death do we part" vow ASAP?" */
            overview?: string;
            /**
             * @default 0
             * @example 24.88
             */
            popularity?: number;
            /** @example "/dDfXQH6Kg2JNASI0dqNALukjhk1.jpg" */
            poster_path?: string;
            /** @example "1989-06-10" */
            first_air_date?: string;
            /** @example "Tales from the Crypt" */
            name?: string;
            /**
             * @default 0
             * @example 7.978
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 757
             */
            vote_count?: number;
            /** @example "525734f3760ee3776a397211" */
            credit_id?: string;
            /** @example "Directing" */
            department?: string;
            /**
             * @default 0
             * @example 1
             */
            episode_count?: number;
            /** @example "Director" */
            job?: string;
          }[];
          /**
           * @default 0
           * @example 31
           */
          id?: number;
        },
        any
      >({
        path: `/3/person/${personId}/tv_credits`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the combined movie and TV credits that belong to a person.
     *
     * @name PersonCombinedCredits
     * @summary Combined Credits
     * @request GET:/3/person/{person_id}/combined_credits
     * @secure
     */
    personCombinedCredits: (
      personId: string,
      query?: {
        /** @default "en-US" */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          cast?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/3h1JZGDhZ8nzxdgvkxha0qBqi05.jpg" */
            backdrop_path?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 13
             */
            id?: number;
            /** @example "en" */
            original_language?: string;
            /** @example "Forrest Gump" */
            original_title?: string;
            /** @example "A man with a low IQ has accomplished great things in his life and been present during significant historic events—in each case, far exceeding what anyone imagined he could do. But despite all he has achieved, his one true love eludes him." */
            overview?: string;
            /**
             * @default 0
             * @example 62.225
             */
            popularity?: number;
            /** @example "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg" */
            poster_path?: string;
            /** @example "1994-06-23" */
            release_date?: string;
            /** @example "Forrest Gump" */
            title?: string;
            /**
             * @default true
             * @example false
             */
            video?: boolean;
            /**
             * @default 0
             * @example 8.481
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 24535
             */
            vote_count?: number;
            /** @example "Forrest Gump" */
            character?: string;
            /** @example "52fe420ec3a36847f800074f" */
            credit_id?: string;
            /**
             * @default 0
             * @example 0
             */
            order?: number;
            /** @example "movie" */
            media_type?: string;
          }[];
          crew?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/tx3uj8GPWf5pzb0gWATJ4bokNHI.jpg" */
            backdrop_path?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 87061
             */
            id?: number;
            /** @example "fr" */
            original_language?: string;
            /** @example "Le Voyage extraordinaire" */
            original_title?: string;
            /** @example "An account of the extraordinary life of film pioneer Georges Méliès (1861-1938) and the amazing story of the copy in color of his masterpiece “A Trip to the Moon” (1902), unexpectedly found in Spain and restored thanks to the heroic efforts of a group of true cinema lovers." */
            overview?: string;
            /**
             * @default 0
             * @example 6.007
             */
            popularity?: number;
            /** @example "/zHNNT9gfiGsuadR6x38KYOp6ekq.jpg" */
            poster_path?: string;
            /** @example "2011-12-08" */
            release_date?: string;
            /** @example "The Extraordinary Voyage" */
            title?: string;
            /**
             * @default true
             * @example false
             */
            video?: boolean;
            /**
             * @default 0
             * @example 7.6
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 47
             */
            vote_count?: number;
            /** @example "5d818a63d34eb3002c4f8fea" */
            credit_id?: string;
            /** @example "Crew" */
            department?: string;
            /** @example "Thanks" */
            job?: string;
            /** @example "movie" */
            media_type?: string;
          }[];
          /**
           * @default 0
           * @example 31
           */
          id?: number;
        },
        any
      >({
        path: `/3/person/${personId}/combined_credits`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the external ID's that belong to a person.
     *
     * @name PersonExternalIds
     * @summary External IDs
     * @request GET:/3/person/{person_id}/external_ids
     * @secure
     */
    personExternalIds: (personId: number, params: RequestParams = {}) =>
      this.request<
        {
          /**
           * @default 0
           * @example 31
           */
          id?: number;
          /** @example "/m/0bxtg" */
          freebase_mid?: string;
          /** @example "/en/tom_hanks" */
          freebase_id?: string;
          /** @example "nm0000158" */
          imdb_id?: string;
          /**
           * @default 0
           * @example 14293
           */
          tvrage_id?: number;
          /** @example "Q2263" */
          wikidata_id?: string;
          /** @example "TomHanks" */
          facebook_id?: string;
          /** @example "tomhanks" */
          instagram_id?: string;
          /** @example "tomhanks" */
          tiktok_id?: string;
          /** @example "tomhanks" */
          twitter_id?: string;
          youtube_id?: any;
        },
        any
      >({
        path: `/3/person/${personId}/external_ids`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the tagged images for a person.
     *
     * @name PersonTaggedImages
     * @summary Tagged Images
     * @request GET:/3/person/{person_id}/tagged_images
     * @secure
     */
    personTaggedImages: (
      personId: number,
      query?: {
        /**
         * @format int32
         * @default 1
         */
        page?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 31
           */
          id?: number;
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default 0
             * @example 0.6666666666666666
             */
            aspect_ratio?: number;
            /** @example "/1wY4psJ5NVEhCuOYROwLH2XExM2.jpg" */
            file_path?: string;
            /**
             * @default 0
             * @example 1500
             */
            height?: number;
            /** @example "5b235d740e0a265b5d0031d9" */
            id?: string;
            /** @example "en" */
            iso_639_1?: string;
            /**
             * @default 0
             * @example 5.456
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 7
             */
            vote_count?: number;
            /**
             * @default 0
             * @example 1000
             */
            width?: number;
            /** @example "poster" */
            image_type?: string;
            media?: {
              /**
               * @default true
               * @example false
               */
              adult?: boolean;
              /** @example "/bdD39MpSVhKjxarTxLSfX6baoMP.jpg" */
              backdrop_path?: string;
              /**
               * @default 0
               * @example 857
               */
              id?: number;
              /** @example "Saving Private Ryan" */
              title?: string;
              /** @example "en" */
              original_language?: string;
              /** @example "Saving Private Ryan" */
              original_title?: string;
              /** @example "As U.S. troops storm the beaches of Normandy, three brothers lie dead on the battlefield, with a fourth trapped behind enemy lines. Ranger captain John Miller and seven men are tasked with penetrating German-held territory and bringing the boy home." */
              overview?: string;
              /** @example "/uqx37cS8cpHg8U35f9U5IBlrCV3.jpg" */
              poster_path?: string;
              /** @example "movie" */
              media_type?: string;
              genre_ids?: number[];
              /**
               * @default 0
               * @example 70.45
               */
              popularity?: number;
              /** @example "1998-07-24" */
              release_date?: string;
              /**
               * @default true
               * @example false
               */
              video?: boolean;
              /**
               * @default 0
               * @example 8.208
               */
              vote_average?: number;
              /**
               * @default 0
               * @example 14134
               */
              vote_count?: number;
            };
            /** @example "movie" */
            media_type?: string;
          }[];
          /**
           * @default 0
           * @example 1
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 13
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/person/${personId}/tagged_images`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the translations that belong to a person.
     *
     * @name Translations
     * @summary Translations
     * @request GET:/3/person/{person_id}/translations
     * @secure
     */
    translations: (personId: number, params: RequestParams = {}) =>
      this.request<
        {
          /**
           * @default 0
           * @example 31
           */
          id?: number;
          translations?: {
            /** @example "US" */
            iso_3166_1?: string;
            /** @example "en" */
            iso_639_1?: string;
            /** @example "English" */
            name?: string;
            /** @example "English" */
            english_name?: string;
            data?: {
              /**
               * @example "Thomas Jeffrey Hanks (born July 9, 1956) is an American actor and filmmaker. Known for both his comedic and dramatic roles, Hanks is one of the most popular and recognizable film stars worldwide, and is widely regarded as an American cultural icon.
               *
               * Hanks made his breakthrough with leading roles in the comedies Splash (1984) and Big (1988). He won two consecutive Academy Awards for Best Actor for starring as a gay lawyer suffering from AIDS in Philadelphia (1993) and a young man with below-average IQ in Forrest Gump (1994). Hanks collaborated with film director Steven Spielberg on five films: Saving Private Ryan (1998), Catch Me If You Can (2002), The Terminal (2004), Bridge of Spies (2015), and The Post (2017), as well as the 2001 miniseries Band of Brothers, which launched him as a director, producer, and screenwriter.
               *
               * Hanks' other notable films include the romantic comedies Sleepless in Seattle (1993) and You've Got Mail (1998); the dramas Apollo 13 (1995), The Green Mile (1999), Cast Away (2000), Road to Perdition (2002), and Cloud Atlas (2012); and the biographical dramas Saving Mr. Banks (2013), Captain Phillips (2013), Sully (2016), and A Beautiful Day in the Neighborhood (2019). He has also appeared as the title character in the Robert Langdon film series, and has voiced Sheriff Woody in the Toy Story film series.
               *
               * Description above from the Wikipedia article Tom Hanks, licensed under CC-BY-SA, full list of contributors on Wikipedia."
               */
              biography?: string;
              /** @example "Tom Hanks" */
              name?: string;
            };
          }[];
        },
        any
      >({
        path: `/3/person/${personId}/translations`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get a list of people ordered by popularity.
     *
     * @name PersonPopularList
     * @summary Popular
     * @request GET:/3/person/popular
     * @secure
     */
    personPopularList: (
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /**
             * @default 0
             * @example 1
             */
            gender?: number;
            /**
             * @default 0
             * @example 224513
             */
            id?: number;
            known_for?: {
              /**
               * @default true
               * @example false
               */
              adult?: boolean;
              /** @example "/ilRyazdMJwN05exqhwK4tMKBYZs.jpg" */
              backdrop_path?: string;
              genre_ids?: number[];
              /**
               * @default 0
               * @example 335984
               */
              id?: number;
              /** @example "movie" */
              media_type?: string;
              /** @example "en" */
              original_language?: string;
              /** @example "Blade Runner 2049" */
              original_title?: string;
              /** @example "Thirty years after the events of the first film, a new blade runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what's left of society into chaos. K's discovery leads him on a quest to find Rick Deckard, a former LAPD blade runner who has been missing for 30 years." */
              overview?: string;
              /** @example "/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg" */
              poster_path?: string;
              /** @example "2017-10-04" */
              release_date?: string;
              /** @example "Blade Runner 2049" */
              title?: string;
              /**
               * @default true
               * @example false
               */
              video?: boolean;
              /**
               * @default 0
               * @example 7.5
               */
              vote_average?: number;
              /**
               * @default 0
               * @example 11771
               */
              vote_count?: number;
            }[];
            /** @example "Acting" */
            known_for_department?: string;
            /** @example "Ana de Armas" */
            name?: string;
            /**
             * @default 0
             * @example 343.33
             */
            popularity?: number;
            /** @example "/3vxvsmYLTf4jnr163SUlBIw51ee.jpg" */
            profile_path?: string;
          }[];
          /**
           * @default 0
           * @example 500
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 10000
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/person/popular`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get a list of movies ordered by popularity.
     *
     * @name MoviePopularList
     * @summary Popular
     * @request GET:/3/movie/popular
     * @secure
     */
    moviePopularList: (
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        /** ISO-3166-1 code */
        region?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/gMJngTNfaqCSCqGD4y8lVMZXKDn.jpg" */
            backdrop_path?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 640146
             */
            id?: number;
            /** @example "en" */
            original_language?: string;
            /** @example "Ant-Man and the Wasp: Quantumania" */
            original_title?: string;
            /** @example "Super-Hero partners Scott Lang and Hope van Dyne, along with with Hope's parents Janet van Dyne and Hank Pym, and Scott's daughter Cassie Lang, find themselves exploring the Quantum Realm, interacting with strange new creatures and embarking on an adventure that will push them beyond the limits of what they thought possible." */
            overview?: string;
            /**
             * @default 0
             * @example 8567.865
             */
            popularity?: number;
            /** @example "/ngl2FKBlU4fhbdsrtdom9LVLBXw.jpg" */
            poster_path?: string;
            /** @example "2023-02-15" */
            release_date?: string;
            /** @example "Ant-Man and the Wasp: Quantumania" */
            title?: string;
            /**
             * @default true
             * @example false
             */
            video?: boolean;
            /**
             * @default 0
             * @example 6.5
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 1886
             */
            vote_count?: number;
          }[];
          /**
           * @default 0
           * @example 38029
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 760569
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/movie/popular`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get a list of movies ordered by rating.
     *
     * @name MovieTopRatedList
     * @summary Top Rated
     * @request GET:/3/movie/top_rated
     * @secure
     */
    movieTopRatedList: (
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        /** ISO-3166-1 code */
        region?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/tmU7GeKVybMWFButWEGl2M4GeiP.jpg" */
            backdrop_path?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 238
             */
            id?: number;
            /** @example "en" */
            original_language?: string;
            /** @example "The Godfather" */
            original_title?: string;
            /** @example "Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family. When organized crime family patriarch, Vito Corleone barely survives an attempt on his life, his youngest son, Michael steps in to take care of the would-be killers, launching a campaign of bloody revenge." */
            overview?: string;
            /**
             * @default 0
             * @example 100.932
             */
            popularity?: number;
            /** @example "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg" */
            poster_path?: string;
            /** @example "1972-03-14" */
            release_date?: string;
            /** @example "The Godfather" */
            title?: string;
            /**
             * @default true
             * @example false
             */
            video?: boolean;
            /**
             * @default 0
             * @example 8.7
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 17806
             */
            vote_count?: number;
          }[];
          /**
           * @default 0
           * @example 552
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 11032
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/movie/top_rated`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get a list of movies that are being released soon.
     *
     * @name MovieUpcomingList
     * @summary Upcoming
     * @request GET:/3/movie/upcoming
     * @secure
     */
    movieUpcomingList: (
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        /** ISO-3166-1 code */
        region?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          dates?: {
            /** @example "2023-05-23" */
            maximum?: string;
            /** @example "2023-05-04" */
            minimum?: string;
          };
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/7bWxAsNPv9CXHOhZbJVlj2KxgfP.jpg" */
            backdrop_path?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 713704
             */
            id?: number;
            /** @example "en" */
            original_language?: string;
            /** @example "Evil Dead Rise" */
            original_title?: string;
            /** @example "Two sisters find an ancient vinyl that gives birth to bloodthirsty demons that run amok in a Los Angeles apartment building and thrusts them into a primal battle for survival as they face the most nightmarish version of family imaginable." */
            overview?: string;
            /**
             * @default 0
             * @example 1696.367
             */
            popularity?: number;
            /** @example "/mIBCtPvKZQlxubxKMeViO2UrP3q.jpg" */
            poster_path?: string;
            /** @example "2023-04-12" */
            release_date?: string;
            /** @example "Evil Dead Rise" */
            title?: string;
            /**
             * @default true
             * @example false
             */
            video?: boolean;
            /**
             * @default 0
             * @example 7
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 207
             */
            vote_count?: number;
          }[];
          /**
           * @default 0
           * @example 19
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 369
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/movie/upcoming`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get a list of movies that are currently in theatres.
     *
     * @name MovieNowPlayingList
     * @summary Now Playing
     * @request GET:/3/movie/now_playing
     * @secure
     */
    movieNowPlayingList: (
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        /** ISO-3166-1 code */
        region?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          dates?: {
            /** @example "2023-05-03" */
            maximum?: string;
            /** @example "2023-03-16" */
            minimum?: string;
          };
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/iJQIbOPm81fPEGKt5BPuZmfnA54.jpg" */
            backdrop_path?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 502356
             */
            id?: number;
            /** @example "en" */
            original_language?: string;
            /** @example "The Super Mario Bros. Movie" */
            original_title?: string;
            /** @example "While working underground to fix a water main, Brooklyn plumbers—and brothers—Mario and Luigi are transported down a mysterious pipe and wander into a magical new world. But when the brothers are separated, Mario embarks on an epic quest to find Luigi." */
            overview?: string;
            /**
             * @default 0
             * @example 6572.614
             */
            popularity?: number;
            /** @example "/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg" */
            poster_path?: string;
            /** @example "2023-04-05" */
            release_date?: string;
            /** @example "The Super Mario Bros. Movie" */
            title?: string;
            /**
             * @default true
             * @example false
             */
            video?: boolean;
            /**
             * @default 0
             * @example 7.5
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 1456
             */
            vote_count?: number;
          }[];
          /**
           * @default 0
           * @example 87
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 1734
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/movie/now_playing`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get a list of TV shows airing today.
     *
     * @name TvSeriesAiringTodayList
     * @summary Airing Today
     * @request GET:/3/tv/airing_today
     * @secure
     */
    tvSeriesAiringTodayList: (
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        timezone?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /** @example "/mAJ84W6I8I272Da87qplS2Dp9ST.jpg" */
            backdrop_path?: string;
            /** @example "2023-01-23" */
            first_air_date?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 202250
             */
            id?: number;
            /** @example "Dirty Linen" */
            name?: string;
            origin_country?: string[];
            /** @example "tl" */
            original_language?: string;
            /** @example "Dirty Linen" */
            original_name?: string;
            /** @example "To exact vengeance, a young woman infiltrates the household of an influential family as a housemaid to expose their dirty secrets. However, love will get in the way of her revenge plot." */
            overview?: string;
            /**
             * @default 0
             * @example 2797.914
             */
            popularity?: number;
            /** @example "/aoAZgnmMzY9vVy9VWnO3U5PZENh.jpg" */
            poster_path?: string;
            /**
             * @default 0
             * @example 5
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 13
             */
            vote_count?: number;
          }[];
          /**
           * @default 0
           * @example 14
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 265
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/tv/airing_today`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get a list of TV shows that air in the next 7 days.
     *
     * @name TvSeriesOnTheAirList
     * @summary On The Air
     * @request GET:/3/tv/on_the_air
     * @secure
     */
    tvSeriesOnTheAirList: (
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        timezone?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /** @example "/mAJ84W6I8I272Da87qplS2Dp9ST.jpg" */
            backdrop_path?: string;
            /** @example "2023-01-23" */
            first_air_date?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 202250
             */
            id?: number;
            /** @example "Dirty Linen" */
            name?: string;
            origin_country?: string[];
            /** @example "tl" */
            original_language?: string;
            /** @example "Dirty Linen" */
            original_name?: string;
            /** @example "To exact vengeance, a young woman infiltrates the household of an influential family as a housemaid to expose their dirty secrets. However, love will get in the way of her revenge plot." */
            overview?: string;
            /**
             * @default 0
             * @example 2797.914
             */
            popularity?: number;
            /** @example "/aoAZgnmMzY9vVy9VWnO3U5PZENh.jpg" */
            poster_path?: string;
            /**
             * @default 0
             * @example 5
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 13
             */
            vote_count?: number;
          }[];
          /**
           * @default 0
           * @example 58
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 1151
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/tv/on_the_air`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get a list of TV shows ordered by popularity.
     *
     * @name TvSeriesPopularList
     * @summary Popular
     * @request GET:/3/tv/popular
     * @secure
     */
    tvSeriesPopularList: (
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /** @example "/mAJ84W6I8I272Da87qplS2Dp9ST.jpg" */
            backdrop_path?: string;
            /** @example "2023-01-23" */
            first_air_date?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 202250
             */
            id?: number;
            /** @example "Dirty Linen" */
            name?: string;
            origin_country?: string[];
            /** @example "tl" */
            original_language?: string;
            /** @example "Dirty Linen" */
            original_name?: string;
            /** @example "To exact vengeance, a young woman infiltrates the household of an influential family as a housemaid to expose their dirty secrets. However, love will get in the way of her revenge plot." */
            overview?: string;
            /**
             * @default 0
             * @example 2797.914
             */
            popularity?: number;
            /** @example "/aoAZgnmMzY9vVy9VWnO3U5PZENh.jpg" */
            poster_path?: string;
            /**
             * @default 0
             * @example 5
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 13
             */
            vote_count?: number;
          }[];
          /**
           * @default 0
           * @example 7416
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 148302
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/tv/popular`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get a list of TV shows ordered by rating.
     *
     * @name TvSeriesTopRatedList
     * @summary Top Rated
     * @request GET:/3/tv/top_rated
     * @secure
     */
    tvSeriesTopRatedList: (
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /** @example "/99vBORZixICa32Pwdwj0lWcr8K.jpg" */
            backdrop_path?: string;
            /** @example "2021-09-03" */
            first_air_date?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 130392
             */
            id?: number;
            /** @example "The D'Amelio Show" */
            name?: string;
            origin_country?: string[];
            /** @example "en" */
            original_language?: string;
            /** @example "The D'Amelio Show" */
            original_name?: string;
            /** @example "From relative obscurity and a seemingly normal life, to overnight success and thrust into the Hollywood limelight overnight, the D’Amelios are faced with new challenges and opportunities they could not have imagined." */
            overview?: string;
            /**
             * @default 0
             * @example 12.459
             */
            popularity?: number;
            /** @example "/phv2Jc4H8cvRzvTKb9X1uKMboTu.jpg" */
            poster_path?: string;
            /**
             * @default 0
             * @example 8.9
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 3190
             */
            vote_count?: number;
          }[];
          /**
           * @default 0
           * @example 142
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 2833
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/tv/top_rated`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the newest movie ID.
     *
     * @name MovieLatestId
     * @summary Latest
     * @request GET:/3/movie/latest
     * @secure
     */
    movieLatestId: (params: RequestParams = {}) =>
      this.request<
        {
          /**
           * @default true
           * @example false
           */
          adult?: boolean;
          backdrop_path?: any;
          belongs_to_collection?: any;
          /**
           * @default 0
           * @example 0
           */
          budget?: number;
          genres?: any[];
          /** @example "" */
          homepage?: string;
          /**
           * @default 0
           * @example 1119232
           */
          id?: number;
          imdb_id?: any;
          /** @example "fr" */
          original_language?: string;
          /** @example "König Charles III" */
          original_title?: string;
          /** @example "" */
          overview?: string;
          /**
           * @default 0
           * @example 0
           */
          popularity?: number;
          poster_path?: any;
          production_companies?: any[];
          production_countries?: any[];
          /** @example "" */
          release_date?: string;
          /**
           * @default 0
           * @example 0
           */
          revenue?: number;
          /**
           * @default 0
           * @example 0
           */
          runtime?: number;
          spoken_languages?: any[];
          /** @example "Released" */
          status?: string;
          /** @example "" */
          tagline?: string;
          /** @example "König Charles III" */
          title?: string;
          /**
           * @default true
           * @example false
           */
          video?: boolean;
          /**
           * @default 0
           * @example 0
           */
          vote_average?: number;
          /**
           * @default 0
           * @example 0
           */
          vote_count?: number;
        },
        any
      >({
        path: `/3/movie/latest`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the newest TV show ID.
     *
     * @name TvSeriesLatestId
     * @summary Latest
     * @request GET:/3/tv/latest
     * @secure
     */
    tvSeriesLatestId: (params: RequestParams = {}) =>
      this.request<
        {
          /**
           * @default true
           * @example false
           */
          adult?: boolean;
          backdrop_path?: any;
          created_by?: any[];
          episode_run_time?: any[];
          /** @example "" */
          first_air_date?: string;
          genres?: any[];
          /** @example "" */
          homepage?: string;
          /**
           * @default 0
           * @example 225491
           */
          id?: number;
          /**
           * @default true
           * @example true
           */
          in_production?: boolean;
          languages?: any[];
          /** @example "2023-04-21" */
          last_air_date?: string;
          last_episode_to_air?: {
            /**
             * @default 0
             * @example 4398801
             */
            id?: number;
            /** @example "Episode 8" */
            name?: string;
            /** @example "" */
            overview?: string;
            /**
             * @default 0
             * @example 0
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 0
             */
            vote_count?: number;
            /** @example "2023-04-21" */
            air_date?: string;
            /**
             * @default 0
             * @example 8
             */
            episode_number?: number;
            /** @example "" */
            production_code?: string;
            runtime?: any;
            /**
             * @default 0
             * @example 1
             */
            season_number?: number;
            /**
             * @default 0
             * @example 225491
             */
            show_id?: number;
            still_path?: any;
          };
          /** @example "妖怪传" */
          name?: string;
          next_episode_to_air?: any;
          networks?: any[];
          /**
           * @default 0
           * @example 1
           */
          number_of_episodes?: number;
          /**
           * @default 0
           * @example 1
           */
          number_of_seasons?: number;
          origin_country?: string[];
          /** @example "zh" */
          original_language?: string;
          /** @example "妖怪传" */
          original_name?: string;
          /** @example "" */
          overview?: string;
          /**
           * @default 0
           * @example 0
           */
          popularity?: number;
          poster_path?: any;
          production_companies?: any[];
          production_countries?: any[];
          seasons?: {
            air_date?: any;
            /**
             * @default 0
             * @example 1
             */
            episode_count?: number;
            /**
             * @default 0
             * @example 338956
             */
            id?: number;
            /** @example "Season 1" */
            name?: string;
            /** @example "" */
            overview?: string;
            poster_path?: any;
            /**
             * @default 0
             * @example 1
             */
            season_number?: number;
          }[];
          spoken_languages?: any[];
          /** @example "Returning Series" */
          status?: string;
          /** @example "" */
          tagline?: string;
          /** @example "Scripted" */
          type?: string;
          /**
           * @default 0
           * @example 0
           */
          vote_average?: number;
          /**
           * @default 0
           * @example 0
           */
          vote_count?: number;
        },
        any
      >({
        path: `/3/tv/latest`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the aggregate credits (cast and crew) that have been added to a TV show.
     *
     * @name TvSeriesAggregateCredits
     * @summary Aggregate Credits
     * @request GET:/3/tv/{series_id}/aggregate_credits
     * @secure
     */
    tvSeriesAggregateCredits: (
      seriesId: number,
      query?: {
        /** @default "en-US" */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          cast?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /**
             * @default 0
             * @example 1
             */
            gender?: number;
            /**
             * @default 0
             * @example 1223786
             */
            id?: number;
            /** @example "Acting" */
            known_for_department?: string;
            /** @example "Emilia Clarke" */
            name?: string;
            /** @example "Emilia Clarke" */
            original_name?: string;
            /**
             * @default 0
             * @example 42.737
             */
            popularity?: number;
            /** @example "/u59kTmNHXzaGZqokivxLPiBVIML.jpg" */
            profile_path?: string;
            roles?: {
              /** @example "5256c8af19c2956ff60479f6" */
              credit_id?: string;
              /** @example "Daenerys Targaryen" */
              character?: string;
              /**
               * @default 0
               * @example 78
               */
              episode_count?: number;
            }[];
            /**
             * @default 0
             * @example 78
             */
            total_episode_count?: number;
            /**
             * @default 0
             * @example 6
             */
            order?: number;
          }[];
          crew?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /**
             * @default 0
             * @example 1
             */
            gender?: number;
            /**
             * @default 0
             * @example 6411
             */
            id?: number;
            /** @example "Art" */
            known_for_department?: string;
            /** @example "Deborah Riley" */
            name?: string;
            /** @example "Deborah Riley" */
            original_name?: string;
            /**
             * @default 0
             * @example 1.4
             */
            popularity?: number;
            /** @example "/cjhADpqdrnwB1PdDUKaBnWrIj2Q.jpg" */
            profile_path?: string;
            jobs?: {
              /** @example "54eee9e5c3a3686d5800584e" */
              credit_id?: string;
              /** @example "Production Design" */
              job?: string;
              /**
               * @default 0
               * @example 43
               */
              episode_count?: number;
            }[];
            /** @example "Art" */
            department?: string;
            /**
             * @default 0
             * @example 43
             */
            total_episode_count?: number;
          }[];
          /**
           * @default 0
           * @example 1399
           */
          id?: number;
        },
        any
      >({
        path: `/3/tv/${seriesId}/aggregate_credits`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the alternative titles that have been added to a TV show.
     *
     * @name TvSeriesAlternativeTitles
     * @summary Alternative Titles
     * @request GET:/3/tv/{series_id}/alternative_titles
     * @secure
     */
    tvSeriesAlternativeTitles: (seriesId: number, params: RequestParams = {}) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1399
           */
          id?: number;
          results?: {
            /** @example "AL" */
            iso_3166_1?: string;
            /** @example "Froni i shpatave" */
            title?: string;
            /** @example "" */
            type?: string;
          }[];
        },
        any
      >({
        path: `/3/tv/${seriesId}/alternative_titles`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the content ratings that have been added to a TV show.
     *
     * @name TvSeriesContentRatings
     * @summary Content Ratings
     * @request GET:/3/tv/{series_id}/content_ratings
     * @secure
     */
    tvSeriesContentRatings: (seriesId: number, params: RequestParams = {}) =>
      this.request<
        {
          results?: {
            descriptors?: any[];
            /** @example "DE" */
            iso_3166_1?: string;
            /** @example "16" */
            rating?: string;
          }[];
          /**
           * @default 0
           * @example 1399
           */
          id?: number;
        },
        any
      >({
        path: `/3/tv/${seriesId}/content_ratings`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the latest season credits of a TV show.
     *
     * @name TvSeriesCredits
     * @summary Credits
     * @request GET:/3/tv/{series_id}/credits
     * @secure
     */
    tvSeriesCredits: (
      seriesId: number,
      query?: {
        /** @default "en-US" */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          cast?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /**
             * @default 0
             * @example 2
             */
            gender?: number;
            /**
             * @default 0
             * @example 22970
             */
            id?: number;
            /** @example "Acting" */
            known_for_department?: string;
            /** @example "Peter Dinklage" */
            name?: string;
            /** @example "Peter Dinklage" */
            original_name?: string;
            /**
             * @default 0
             * @example 30.6
             */
            popularity?: number;
            /** @example "/lRsRgnksAhBRXwAB68MFjmTtLrk.jpg" */
            profile_path?: string;
            /** @example "Tyrion Lannister" */
            character?: string;
            /** @example "5256c8b219c2956ff6047cd8" */
            credit_id?: string;
            /**
             * @default 0
             * @example 0
             */
            order?: number;
          }[];
          crew?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /**
             * @default 0
             * @example 2
             */
            gender?: number;
            /**
             * @default 0
             * @example 1406855
             */
            id?: number;
            /** @example "Production" */
            known_for_department?: string;
            /** @example "Duncan Muggoch" */
            name?: string;
            /** @example "Duncan Muggoch" */
            original_name?: string;
            /**
             * @default 0
             * @example 1.592
             */
            popularity?: number;
            /** @example "/ukGjJ62Ejd4cFziald03G34Fsrp.jpg" */
            profile_path?: string;
            /** @example "5ceab029c3a3682e93217a85" */
            credit_id?: string;
            /** @example "Production" */
            department?: string;
            /** @example "Producer" */
            job?: string;
          }[];
          /**
           * @default 0
           * @example 1399
           */
          id?: number;
        },
        any
      >({
        path: `/3/tv/${seriesId}/credits`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the episode groups that have been added to a TV show.
     *
     * @name TvSeriesEpisodeGroups
     * @summary Episode Groups
     * @request GET:/3/tv/{series_id}/episode_groups
     * @secure
     */
    tvSeriesEpisodeGroups: (seriesId: number, params: RequestParams = {}) =>
      this.request<
        {
          results?: {
            /** @example "" */
            description?: string;
            /**
             * @default 0
             * @example 102
             */
            episode_count?: number;
            /**
             * @default 0
             * @example 9
             */
            group_count?: number;
            /** @example "5e9077d2e640d600151f32bd" */
            id?: string;
            /** @example "Aired Order" */
            name?: string;
            network?: {
              /**
               * @default 0
               * @example 49
               */
              id?: number;
              /** @example "/tuomPhY2UtuPTqqFnKMVHvSb724.png" */
              logo_path?: string;
              /** @example "HBO" */
              name?: string;
              /** @example "US" */
              origin_country?: string;
            };
            /**
             * @default 0
             * @example 1
             */
            type?: number;
          }[];
          /**
           * @default 0
           * @example 1399
           */
          id?: number;
        },
        any
      >({
        path: `/3/tv/${seriesId}/episode_groups`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get a list of external IDs that have been added to a TV show.
     *
     * @name TvSeriesExternalIds
     * @summary External IDs
     * @request GET:/3/tv/{series_id}/external_ids
     * @secure
     */
    tvSeriesExternalIds: (seriesId: number, params: RequestParams = {}) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1399
           */
          id?: number;
          /** @example "tt0944947" */
          imdb_id?: string;
          /** @example "/m/0524b41" */
          freebase_mid?: string;
          /** @example "/en/game_of_thrones" */
          freebase_id?: string;
          /**
           * @default 0
           * @example 121361
           */
          tvdb_id?: number;
          /**
           * @default 0
           * @example 24493
           */
          tvrage_id?: number;
          /** @example "Q23572" */
          wikidata_id?: string;
          /** @example "GameOfThrones" */
          facebook_id?: string;
          /** @example "gameofthrones" */
          instagram_id?: string;
          /** @example "GameOfThrones" */
          twitter_id?: string;
        },
        any
      >({
        path: `/3/tv/${seriesId}/external_ids`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get a list of keywords that have been added to a TV show.
     *
     * @name TvSeriesKeywords
     * @summary Keywords
     * @request GET:/3/tv/{series_id}/keywords
     * @secure
     */
    tvSeriesKeywords: (seriesId: number, params: RequestParams = {}) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1399
           */
          id?: number;
          results?: {
            /** @example "based on novel or book" */
            name?: string;
            /**
             * @default 0
             * @example 818
             */
            id?: number;
          }[];
        },
        any
      >({
        path: `/3/tv/${seriesId}/keywords`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @name TvSeriesRecommendations
     * @summary Recommendations
     * @request GET:/3/tv/{series_id}/recommendations
     * @secure
     */
    tvSeriesRecommendations: (
      seriesId: number,
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/bsNm9z2TJfe0WO3RedPGWQ8mG1X.jpg" */
            backdrop_path?: string;
            /**
             * @default 0
             * @example 1396
             */
            id?: number;
            /** @example "Breaking Bad" */
            name?: string;
            /** @example "en" */
            original_language?: string;
            /** @example "Breaking Bad" */
            original_name?: string;
            /** @example "When Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer and given a prognosis of only two years left to live. He becomes filled with a sense of fearlessness and an unrelenting desire to secure his family's financial future at any cost as he enters the dangerous world of drugs and crime." */
            overview?: string;
            /** @example "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg" */
            poster_path?: string;
            /** @example "tv" */
            media_type?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 292.904
             */
            popularity?: number;
            /** @example "2008-01-20" */
            first_air_date?: string;
            /**
             * @default 0
             * @example 8.878
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 11544
             */
            vote_count?: number;
            origin_country?: string[];
          }[];
          /**
           * @default 0
           * @example 2
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 40
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/tv/${seriesId}/recommendations`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the reviews that have been added to a TV show.
     *
     * @name TvSeriesReviews
     * @summary Reviews
     * @request GET:/3/tv/{series_id}/reviews
     * @secure
     */
    tvSeriesReviews: (
      seriesId: number,
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1399
           */
          id?: number;
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /** @example "lmao7" */
            author?: string;
            author_details?: {
              /** @example "lmao7" */
              name?: string;
              /** @example "lmao7" */
              username?: string;
              /** @example "/ekmYOUU4tfx9zGGadjRdE7UPce.jpg" */
              avatar_path?: string;
              /**
               * @default 0
               * @example 9
               */
              rating?: number;
            };
            /**
             * @example "I started watching when it came out as I heard that fans of LOTR also liked this. I stopped watching after Season 1 as I was devastated lol kinda. Only 2015 I decided to continue watching and got addicted like it seemed complicated at first, too many stories and characters. I even used a guide from internet like family tree per house while watching or GOT wiki so I can have more background on the characters. For a TV series, this show can really take you to a different world and never knowing what will happen. It is very daring that any time anybody can just die (I learned not to be attached and have accepted that they will all die so I won't be devastated hehe). I have never read the books but the show is entertaining and you will really root for your faves and really hate on those you hate.
             *
             * Fantasy, action, drama, comedy, love...and lots of surprises!"
             */
            content?: string;
            /** @example "2017-02-20T05:47:28.872Z" */
            created_at?: string;
            /** @example "58aa82f09251416f92006a3a" */
            id?: string;
            /** @example "2021-06-23T15:57:54.649Z" */
            updated_at?: string;
            /** @example "https://www.themoviedb.org/review/58aa82f09251416f92006a3a" */
            url?: string;
          }[];
          /**
           * @default 0
           * @example 1
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 11
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/tv/${seriesId}/reviews`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the seasons and episodes that have screened theatrically.
     *
     * @name TvSeriesScreenedTheatrically
     * @summary Screened Theatrically
     * @request GET:/3/tv/{series_id}/screened_theatrically
     * @secure
     */
    tvSeriesScreenedTheatrically: (
      seriesId: number,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1399
           */
          id?: number;
          results?: {
            /**
             * @default 0
             * @example 1159054
             */
            id?: number;
            /**
             * @default 0
             * @example 10
             */
            episode_number?: number;
            /**
             * @default 0
             * @example 5
             */
            season_number?: number;
          }[];
        },
        any
      >({
        path: `/3/tv/${seriesId}/screened_theatrically`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the similar TV shows.
     *
     * @name TvSeriesSimilar
     * @summary Similar
     * @request GET:/3/tv/{series_id}/similar
     * @secure
     */
    tvSeriesSimilar: (
      seriesId: string,
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/zcFSvWa34nDn2NcqOPuthyOIBWT.jpg" */
            backdrop_path?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 197063
             */
            id?: number;
            origin_country?: string[];
            /** @example "ko" */
            original_language?: string;
            /** @example "종이달" */
            original_name?: string;
            /** @example "A thriller drama about Yoo I-hwa, a stay-at-home mom living her comfortable and contented life without desires, but to her husband's indifference. While working as a bank contract employee, she unexpectedly touches money from VIP clients and gradually falls into an irreversible collapse." */
            overview?: string;
            /**
             * @default 0
             * @example 12.299
             */
            popularity?: number;
            /** @example "/xXWynVdMGyJXBUDvIN27AXM3iJJ.jpg" */
            poster_path?: string;
            /** @example "2023-04-10" */
            first_air_date?: string;
            /** @example "Pale Moon" */
            name?: string;
            /**
             * @default 0
             * @example 7
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 2
             */
            vote_count?: number;
          }[];
          /**
           * @default 0
           * @example 82
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 1639
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/tv/${seriesId}/similar`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the translations that have been added to a TV show.
     *
     * @name TvSeriesTranslations
     * @summary Translations
     * @request GET:/3/tv/{series_id}/translations
     * @secure
     */
    tvSeriesTranslations: (seriesId: number, params: RequestParams = {}) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1399
           */
          id?: number;
          translations?: {
            /** @example "SA" */
            iso_3166_1?: string;
            /** @example "ar" */
            iso_639_1?: string;
            /** @example "العربية" */
            name?: string;
            /** @example "Arabic" */
            english_name?: string;
            data?: {
              /** @example "صراع العروش" */
              name?: string;
              /** @example "تتقاتل سبع عائلات نبيلة من أجل السيطرة على أرض - ويستيروس - الأسطورية. الاحتكاك بين العوائل يؤدي إلى حرب واسعة النطاق.  في حين يستيقظ الشر القديم في أقصى الشمال. وفي خضم الحرب، نظام عسكري مهمَل - حرس الليل - هم كل ما يقف بين عالم الإنسان والأهوال الجليدية." */
              overview?: string;
              /** @example "" */
              homepage?: string;
              /** @example "الشتاء قادم" */
              tagline?: string;
            };
          }[];
        },
        any
      >({
        path: `/3/tv/${seriesId}/translations`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the videos that belong to a TV show.
     *
     * @name TvSeriesVideos
     * @summary Videos
     * @request GET:/3/tv/{series_id}/videos
     * @secure
     */
    tvSeriesVideos: (
      seriesId: number,
      query?: {
        /** filter the list results by language, supports more than one value by using a comma */
        include_video_language?: string;
        /** @default "en-US" */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1399
           */
          id?: number;
          results?: {
            /** @example "en" */
            iso_639_1?: string;
            /** @example "US" */
            iso_3166_1?: string;
            /** @example "Inside Game of Thrones: A Story in Camera Work – BTS (HBO)" */
            name?: string;
            /** @example "y2ZJ3lTaREY" */
            key?: string;
            /** @example "YouTube" */
            site?: string;
            /**
             * @default 0
             * @example 1080
             */
            size?: number;
            /** @example "Behind the Scenes" */
            type?: string;
            /**
             * @default true
             * @example true
             */
            official?: boolean;
            /** @example "2019-03-25T14:00:06.000Z" */
            published_at?: string;
            /** @example "5c999b48c3a36863b73b9d42" */
            id?: string;
          }[];
        },
        any
      >({
        path: `/3/tv/${seriesId}/videos`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the list of streaming providers we have for a TV show.
     *
     * @name TvSeriesWatchProviders
     * @summary Watch Providers
     * @request GET:/3/tv/{series_id}/watch/providers
     * @secure
     */
    tvSeriesWatchProviders: (seriesId: number, params: RequestParams = {}) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1399
           */
          id?: number;
          results?: {
            AE?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=AE" */
              link?: string;
              flatrate?: {
                /** @example "/xEPXbwbfABzPrUTWbgtDFH1NOa.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 629
                 */
                provider_id?: number;
                /** @example "OSN" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 11
                 */
                display_priority?: number;
              }[];
            };
            AR?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=AR" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 5
                 */
                display_priority?: number;
              }[];
            };
            AT?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=AT" */
              link?: string;
              buy?: {
                /** @example "/5NyLm42TmCqCMOZFvH4fcoSNKEW.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 10
                 */
                provider_id?: number;
                /** @example "Amazon Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/y0kyIFElN5sJAsmW8Txj69wzrD2.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 321
                 */
                provider_id?: number;
                /** @example "Sky X" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 23
                 */
                display_priority?: number;
              }[];
            };
            AU?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=AU" */
              link?: string;
              flatrate?: {
                /** @example "/d3ixI1no0EpTj2i7u0Sd2DBXVlG.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 385
                 */
                provider_id?: number;
                /** @example "BINGE" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 10
                 */
                display_priority?: number;
              }[];
            };
            BA?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=BA" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 28
                 */
                display_priority?: number;
              }[];
            };
            BB?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=BB" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 28
                 */
                display_priority?: number;
              }[];
            };
            BE?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=BE" */
              link?: string;
              flatrate?: {
                /** @example "/pq8p1umEnJjdFAP1nFvNArTR61X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 311
                 */
                provider_id?: number;
                /** @example "Be TV Go" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
            };
            BG?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=BG" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 15
                 */
                display_priority?: number;
              }[];
            };
            BO?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=BO" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
            };
            BR?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=BR" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 7
                 */
                display_priority?: number;
              }[];
            };
            BS?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=BS" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 28
                 */
                display_priority?: number;
              }[];
            };
            CA?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=CA" */
              link?: string;
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 6
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/gJ3yVMWouaVj6iHd59TISJ1TlM5.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 230
                 */
                provider_id?: number;
                /** @example "Crave" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
            };
            CH?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=CH" */
              link?: string;
              flatrate?: {
                /** @example "/sHP8XLo4Ac4WMbziRyAdRQdb76q.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 210
                 */
                provider_id?: number;
                /** @example "Sky" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 7
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 5
                 */
                display_priority?: number;
              }[];
            };
            CI?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=CI" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 25
                 */
                display_priority?: number;
              }[];
            };
            CL?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=CL" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 7
                 */
                display_priority?: number;
              }[];
            };
            CO?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=CO" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 6
                 */
                display_priority?: number;
              }[];
            };
            CR?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=CR" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
            };
            CZ?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=CZ" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 22
                 */
                display_priority?: number;
              }[];
            };
            DE?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=DE" */
              link?: string;
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/MiVcYLkztM6qqLeVSYWHFCUcXx.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 30
                 */
                provider_id?: number;
                /** @example "WOW" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 5
                 */
                display_priority?: number;
              }[];
            };
            DK?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=DK" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
            };
            DO?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=DO" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 28
                 */
                display_priority?: number;
              }[];
            };
            DZ?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=DZ" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 27
                 */
                display_priority?: number;
              }[];
            };
            EC?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=EC" */
              link?: string;
              flatrate?: {
                /** @example "/cDzkhgvozSr4GW2aRdV22uDuFpw.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 339
                 */
                provider_id?: number;
                /** @example "Movistar Play" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
            };
            EG?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=EG" */
              link?: string;
              flatrate?: {
                /** @example "/xEPXbwbfABzPrUTWbgtDFH1NOa.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 629
                 */
                provider_id?: number;
                /** @example "OSN" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 27
                 */
                display_priority?: number;
              }[];
            };
            ES?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=ES" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 9
                 */
                display_priority?: number;
              }[];
            };
            FI?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=FI" */
              link?: string;
              buy?: {
                /** @example "/shq88b09gTBYC4hA7K7MUL8Q4zP.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 68
                 */
                provider_id?: number;
                /** @example "Microsoft Store" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 12
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
            };
            FR?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=FR" */
              link?: string;
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 5
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/loOaayvNiLnD0zKl70TO2L5vlAL.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 1870
                 */
                provider_id?: number;
                /** @example "Pass Warner Amazon Channel" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 95
                 */
                display_priority?: number;
              }[];
            };
            GB?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=GB" */
              link?: string;
              flatrate?: {
                /** @example "/fBHHXKC34ffxAsQvDe0ZJbvmTEQ.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 29
                 */
                provider_id?: number;
                /** @example "Sky Go" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 9
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/5NyLm42TmCqCMOZFvH4fcoSNKEW.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 10
                 */
                provider_id?: number;
                /** @example "Amazon Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
            };
            GF?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=GF" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 30
                 */
                display_priority?: number;
              }[];
            };
            GH?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=GH" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 11
                 */
                display_priority?: number;
              }[];
            };
            GQ?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=GQ" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 11
                 */
                display_priority?: number;
              }[];
            };
            GT?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=GT" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
            };
            HK?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=HK" */
              link?: string;
              flatrate?: {
                /** @example "/bxdNcDbk1ohVeOMmM3eusAAiTLw.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 425
                 */
                provider_id?: number;
                /** @example "HBO Go" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 40
                 */
                display_priority?: number;
              }[];
            };
            HN?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=HN" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
            };
            HR?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=HR" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 34
                 */
                display_priority?: number;
              }[];
            };
            HU?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=HU" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 22
                 */
                display_priority?: number;
              }[];
            };
            ID?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=ID" */
              link?: string;
              flatrate?: {
                /** @example "/bxdNcDbk1ohVeOMmM3eusAAiTLw.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 425
                 */
                provider_id?: number;
                /** @example "HBO Go" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 14
                 */
                display_priority?: number;
              }[];
            };
            IE?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=IE" */
              link?: string;
              flatrate?: {
                /** @example "/fBHHXKC34ffxAsQvDe0ZJbvmTEQ.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 29
                 */
                provider_id?: number;
                /** @example "Sky Go" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 8
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/2pCbao1J9s0DMak2KKnEzmzHni8.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 130
                 */
                provider_id?: number;
                /** @example "Sky Store" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 9
                 */
                display_priority?: number;
              }[];
            };
            IL?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=IL" */
              link?: string;
              flatrate?: {
                /** @example "/xEPXbwbfABzPrUTWbgtDFH1NOa.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 629
                 */
                provider_id?: number;
                /** @example "OSN" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 13
                 */
                display_priority?: number;
              }[];
            };
            IQ?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=IQ" */
              link?: string;
              flatrate?: {
                /** @example "/xEPXbwbfABzPrUTWbgtDFH1NOa.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 629
                 */
                provider_id?: number;
                /** @example "OSN" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 12
                 */
                display_priority?: number;
              }[];
            };
            IT?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=IT" */
              link?: string;
              buy?: {
                /** @example "/cksgBjTHV3rzAVaO2zUyS1mH4Ke.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 40
                 */
                provider_id?: number;
                /** @example "Chili" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 11
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/fBHHXKC34ffxAsQvDe0ZJbvmTEQ.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 29
                 */
                provider_id?: number;
                /** @example "Sky Go" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 8
                 */
                display_priority?: number;
              }[];
            };
            JM?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=JM" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 27
                 */
                display_priority?: number;
              }[];
            };
            JP?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=JP" */
              link?: string;
              flatrate?: {
                /** @example "/npg1OiBidQSndMsBZwgEPOYU6Jq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 84
                 */
                provider_id?: number;
                /** @example "U-NEXT" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/5NyLm42TmCqCMOZFvH4fcoSNKEW.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 10
                 */
                provider_id?: number;
                /** @example "Amazon Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 6
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/5NyLm42TmCqCMOZFvH4fcoSNKEW.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 10
                 */
                provider_id?: number;
                /** @example "Amazon Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 6
                 */
                display_priority?: number;
              }[];
            };
            KE?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=KE" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 10
                 */
                display_priority?: number;
              }[];
            };
            KR?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=KR" */
              link?: string;
              flatrate?: {
                /** @example "/2ioan5BX5L9tz4fIGU93blTeFhv.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 356
                 */
                provider_id?: number;
                /** @example "wavve" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
            };
            LB?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=LB" */
              link?: string;
              flatrate?: {
                /** @example "/xEPXbwbfABzPrUTWbgtDFH1NOa.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 629
                 */
                provider_id?: number;
                /** @example "OSN" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 13
                 */
                display_priority?: number;
              }[];
            };
            LT?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=LT" */
              link?: string;
              flatrate?: {
                /** @example "/xTVM8uXT9QocigQ07LE7Irc65W2.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 553
                 */
                provider_id?: number;
                /** @example "Telia Play" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 15
                 */
                display_priority?: number;
              }[];
            };
            LY?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=LY" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 27
                 */
                display_priority?: number;
              }[];
            };
            MD?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=MD" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 26
                 */
                display_priority?: number;
              }[];
            };
            MK?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=MK" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 29
                 */
                display_priority?: number;
              }[];
            };
            MU?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=MU" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 8
                 */
                display_priority?: number;
              }[];
            };
            MX?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=MX" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 11
                 */
                display_priority?: number;
              }[];
            };
            MY?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=MY" */
              link?: string;
              flatrate?: {
                /** @example "/bxdNcDbk1ohVeOMmM3eusAAiTLw.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 425
                 */
                provider_id?: number;
                /** @example "HBO Go" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 14
                 */
                display_priority?: number;
              }[];
            };
            MZ?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=MZ" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 10
                 */
                display_priority?: number;
              }[];
            };
            NE?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=NE" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 25
                 */
                display_priority?: number;
              }[];
            };
            NG?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=NG" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 27
                 */
                display_priority?: number;
              }[];
            };
            NL?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=NL" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 47
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/shq88b09gTBYC4hA7K7MUL8Q4zP.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 68
                 */
                provider_id?: number;
                /** @example "Microsoft Store" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 12
                 */
                display_priority?: number;
              }[];
            };
            NO?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=NO" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 5
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/shq88b09gTBYC4hA7K7MUL8Q4zP.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 68
                 */
                provider_id?: number;
                /** @example "Microsoft Store" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 9
                 */
                display_priority?: number;
              }[];
            };
            NZ?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=NZ" */
              link?: string;
              flatrate?: {
                /** @example "/od4YNSSLgOP3p8EtQTnEYfrPa77.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 273
                 */
                provider_id?: number;
                /** @example "Neon TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                display_priority?: number;
              }[];
            };
            PA?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=PA" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 27
                 */
                display_priority?: number;
              }[];
            };
            PE?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=PE" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 8
                 */
                display_priority?: number;
              }[];
            };
            PH?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=PH" */
              link?: string;
              flatrate?: {
                /** @example "/bxdNcDbk1ohVeOMmM3eusAAiTLw.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 425
                 */
                provider_id?: number;
                /** @example "HBO Go" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 12
                 */
                display_priority?: number;
              }[];
            };
            PL?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=PL" */
              link?: string;
              flatrate?: {
                /** @example "/l5Wxbsgral716BOtZsGyPVNn8GC.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 250
                 */
                provider_id?: number;
                /** @example "Horizon" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 7
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/bZNXgd8fwVTD68aAGlElkpAtu7b.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 549
                 */
                provider_id?: number;
                /** @example "IPLA" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 17
                 */
                display_priority?: number;
              }[];
            };
            PS?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=PS" */
              link?: string;
              flatrate?: {
                /** @example "/xEPXbwbfABzPrUTWbgtDFH1NOa.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 629
                 */
                provider_id?: number;
                /** @example "OSN" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 12
                 */
                display_priority?: number;
              }[];
            };
            PT?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=PT" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 28
                 */
                display_priority?: number;
              }[];
            };
            PY?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=PY" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
            };
            RO?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=RO" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 17
                 */
                display_priority?: number;
              }[];
            };
            RS?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=RS" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 32
                 */
                display_priority?: number;
              }[];
            };
            RU?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=RU" */
              link?: string;
              flatrate?: {
                /** @example "/w1T8s7FqakcfucR8cgOvbe6UeXN.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 115
                 */
                provider_id?: number;
                /** @example "Okko" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 0
                 */
                display_priority?: number;
              }[];
              ads?: {
                /** @example "/3jJtMOIwtvcrCyeRMUvv4wsfhJk.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 577
                 */
                provider_id?: number;
                /** @example "TvIgle" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 22
                 */
                display_priority?: number;
              }[];
            };
            SA?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=SA" */
              link?: string;
              flatrate?: {
                /** @example "/xEPXbwbfABzPrUTWbgtDFH1NOa.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 629
                 */
                provider_id?: number;
                /** @example "OSN" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 25
                 */
                display_priority?: number;
              }[];
            };
            SC?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=SC" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 9
                 */
                display_priority?: number;
              }[];
            };
            SE?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=SE" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/shq88b09gTBYC4hA7K7MUL8Q4zP.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 68
                 */
                provider_id?: number;
                /** @example "Microsoft Store" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 7
                 */
                display_priority?: number;
              }[];
            };
            SG?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=SG" */
              link?: string;
              flatrate?: {
                /** @example "/bxdNcDbk1ohVeOMmM3eusAAiTLw.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 425
                 */
                provider_id?: number;
                /** @example "HBO Go" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 13
                 */
                display_priority?: number;
              }[];
            };
            SI?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=SI" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 29
                 */
                display_priority?: number;
              }[];
            };
            SK?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=SK" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 37
                 */
                display_priority?: number;
              }[];
            };
            SN?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=SN" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 11
                 */
                display_priority?: number;
              }[];
            };
            SV?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=SV" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 25
                 */
                display_priority?: number;
              }[];
            };
            TH?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=TH" */
              link?: string;
              flatrate?: {
                /** @example "/bxdNcDbk1ohVeOMmM3eusAAiTLw.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 425
                 */
                provider_id?: number;
                /** @example "HBO Go" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 12
                 */
                display_priority?: number;
              }[];
            };
            TR?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=TR" */
              link?: string;
              flatrate?: {
                /** @example "/z3XAGCCbDD3KTZFvc96Ytr3XR56.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 341
                 */
                provider_id?: number;
                /** @example "blutv" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                display_priority?: number;
              }[];
            };
            TT?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=TT" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 11
                 */
                display_priority?: number;
              }[];
            };
            TW?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=TW" */
              link?: string;
              flatrate?: {
                /** @example "/bxdNcDbk1ohVeOMmM3eusAAiTLw.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 425
                 */
                provider_id?: number;
                /** @example "HBO Go" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 40
                 */
                display_priority?: number;
              }[];
            };
            TZ?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=TZ" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 9
                 */
                display_priority?: number;
              }[];
            };
            UG?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=UG" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 10
                 */
                display_priority?: number;
              }[];
            };
            US?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=US" */
              link?: string;
              free?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 7
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 7
                 */
                display_priority?: number;
              }[];
            };
            UY?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=UY" */
              link?: string;
              flatrate?: {
                /** @example "/kV8XFGI5OLJKl72dI8DtnKplfFr.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 467
                 */
                provider_id?: number;
                /** @example "DIRECTV GO" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 9
                 */
                display_priority?: number;
              }[];
            };
            VE?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=VE" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 8
                 */
                display_priority?: number;
              }[];
            };
            ZA?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=ZA" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
            };
            ZM?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/watch?locale=ZM" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 10
                 */
                display_priority?: number;
              }[];
            };
          };
        },
        any
      >({
        path: `/3/tv/${seriesId}/watch/providers`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Rate a TV show and save it to your rated list.
     *
     * @name TvSeriesAddRating
     * @summary Add Rating
     * @request POST:/3/tv/{series_id}/rating
     * @secure
     */
    tvSeriesAddRating: (
      seriesId: number,
      data: {
        /** @format json */
        RAW_BODY: string;
      },
      query?: {
        guest_session_id?: string;
        session_id?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          status_code?: number;
          /** @example "Success." */
          status_message?: string;
        },
        any
      >({
        path: `/3/tv/${seriesId}/rating`,
        method: 'POST',
        query: query,
        body: data,
        secure: true,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @name TvSeriesDeleteRating
     * @summary Delete Rating
     * @request DELETE:/3/tv/{series_id}/rating
     * @secure
     */
    tvSeriesDeleteRating: (
      seriesId: number,
      query?: {
        guest_session_id?: string;
        session_id?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 13
           */
          status_code?: number;
          /** @example "The item/record was deleted successfully." */
          status_message?: string;
        },
        any
      >({
        path: `/3/tv/${seriesId}/rating`,
        method: 'DELETE',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the rating, watchlist and favourite status.
     *
     * @name TvSeasonAccountStates
     * @summary Account States
     * @request GET:/3/tv/{series_id}/season/{season_number}/account_states
     * @secure
     */
    tvSeasonAccountStates: (
      seriesId: number,
      seasonNumber: number,
      query?: {
        session_id?: string;
        guest_session_id?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 3624
           */
          id?: number;
          results?: {
            /**
             * @default 0
             * @example 63056
             */
            id?: number;
            /**
             * @default 0
             * @example 1
             */
            episode_number?: number;
            rated?: {
              /**
               * @default 0
               * @example 9
               */
              value?: number;
            };
          }[];
        },
        any
      >({
        path: `/3/tv/${seriesId}/season/${seasonNumber}/account_states`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the aggregate credits (cast and crew) that have been added to a TV season.
     *
     * @name TvSeasonAggregateCredits
     * @summary Aggregate Credits
     * @request GET:/3/tv/{series_id}/season/{season_number}/aggregate_credits
     * @secure
     */
    tvSeasonAggregateCredits: (
      seriesId: number,
      seasonNumber: number,
      query?: {
        /** @default "en-US" */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          cast?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /**
             * @default 0
             * @example 2
             */
            gender?: number;
            /**
             * @default 0
             * @example 22970
             */
            id?: number;
            /** @example "Acting" */
            known_for_department?: string;
            /** @example "Peter Dinklage" */
            name?: string;
            /** @example "Peter Dinklage" */
            original_name?: string;
            /**
             * @default 0
             * @example 30.6
             */
            popularity?: number;
            /** @example "/lRsRgnksAhBRXwAB68MFjmTtLrk.jpg" */
            profile_path?: string;
            roles?: {
              /** @example "5256c8b219c2956ff6047cd8" */
              credit_id?: string;
              /** @example "Tyrion Lannister" */
              character?: string;
              /**
               * @default 0
               * @example 10
               */
              episode_count?: number;
            }[];
            /**
             * @default 0
             * @example 10
             */
            total_episode_count?: number;
            /**
             * @default 0
             * @example 0
             */
            order?: number;
          }[];
          crew?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /**
             * @default 0
             * @example 1
             */
            gender?: number;
            /**
             * @default 0
             * @example 9153
             */
            id?: number;
            /** @example "Art" */
            known_for_department?: string;
            /** @example "Gemma Jackson" */
            name?: string;
            /** @example "Gemma Jackson" */
            original_name?: string;
            /**
             * @default 0
             * @example 0.995
             */
            popularity?: number;
            profile_path?: any;
            jobs?: {
              /** @example "54eee8b8c3a3686d5e005430" */
              credit_id?: string;
              /** @example "Production Design" */
              job?: string;
              /**
               * @default 0
               * @example 10
               */
              episode_count?: number;
            }[];
            /** @example "Art" */
            department?: string;
            /**
             * @default 0
             * @example 10
             */
            total_episode_count?: number;
          }[];
          /**
           * @default 0
           * @example 3624
           */
          id?: number;
        },
        any
      >({
        path: `/3/tv/${seriesId}/season/${seasonNumber}/aggregate_credits`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the recent changes for a TV season.
     *
     * @name TvSeasonChangesById
     * @summary Changes
     * @request GET:/3/tv/season/{season_id}/changes
     * @secure
     */
    tvSeasonChangesById: (
      seasonId: number,
      query?: {
        end_date?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        start_date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          changes?: {
            /** @example "episode" */
            key?: string;
            items?: {
              /** @example "5717c8c69251414cfd00250f" */
              id?: string;
              /** @example "updated" */
              action?: string;
              /** @example "2016-04-20 18:21:58 UTC" */
              time?: string;
              value?: {
                /**
                 * @default 0
                 * @example 63056
                 */
                episode_id?: number;
                /**
                 * @default 0
                 * @example 1
                 */
                episode_number?: number;
              };
            }[];
          }[];
        },
        any
      >({
        path: `/3/tv/season/${seasonId}/changes`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @name TvSeasonCredits
     * @summary Credits
     * @request GET:/3/tv/{series_id}/season/{season_number}/credits
     * @secure
     */
    tvSeasonCredits: (
      seriesId: number,
      seasonNumber: number,
      query?: {
        /** @default "en-US" */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          cast?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /**
             * @default 0
             * @example 2
             */
            gender?: number;
            /**
             * @default 0
             * @example 22970
             */
            id?: number;
            /** @example "Acting" */
            known_for_department?: string;
            /** @example "Peter Dinklage" */
            name?: string;
            /** @example "Peter Dinklage" */
            original_name?: string;
            /**
             * @default 0
             * @example 30.6
             */
            popularity?: number;
            /** @example "/lRsRgnksAhBRXwAB68MFjmTtLrk.jpg" */
            profile_path?: string;
            /** @example "Tyrion Lannister" */
            character?: string;
            /** @example "5256c8b219c2956ff6047cd8" */
            credit_id?: string;
            /**
             * @default 0
             * @example 0
             */
            order?: number;
          }[];
          crew?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /**
             * @default 0
             * @example 0
             */
            gender?: number;
            /**
             * @default 0
             * @example 1223796
             */
            id?: number;
            /** @example "Production" */
            known_for_department?: string;
            /** @example "Frank Doelger" */
            name?: string;
            /** @example "Frank Doelger" */
            original_name?: string;
            /**
             * @default 0
             * @example 0.694
             */
            popularity?: number;
            profile_path?: any;
            /** @example "5256c8c419c2956ff604867c" */
            credit_id?: string;
            /** @example "Production" */
            department?: string;
            /** @example "Producer" */
            job?: string;
          }[];
          /**
           * @default 0
           * @example 3624
           */
          id?: number;
        },
        any
      >({
        path: `/3/tv/${seriesId}/season/${seasonNumber}/credits`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get a list of external IDs that have been added to a TV season.
     *
     * @name TvSeasonExternalIds
     * @summary External IDs
     * @request GET:/3/tv/{series_id}/season/{season_number}/external_ids
     * @secure
     */
    tvSeasonExternalIds: (
      seriesId: number,
      seasonNumber: number,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 3624
           */
          id?: number;
          /** @example "/m/0gmd1gd" */
          freebase_mid?: string;
          /** @example "/m/0gmd1gd" */
          freebase_id?: string;
          /**
           * @default 0
           * @example 364731
           */
          tvdb_id?: number;
          tvrage_id?: any;
          /** @example "Q1658029" */
          wikidata_id?: string;
        },
        any
      >({
        path: `/3/tv/${seriesId}/season/${seasonNumber}/external_ids`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the translations for a TV season.
     *
     * @name TvSeasonTranslations
     * @summary Translations
     * @request GET:/3/tv/{series_id}/season/{season_number}/translations
     * @secure
     */
    tvSeasonTranslations: (
      seriesId: number,
      seasonNumber: number,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 3624
           */
          id?: number;
          translations?: {
            /** @example "SA" */
            iso_3166_1?: string;
            /** @example "ar" */
            iso_639_1?: string;
            /** @example "العربية" */
            name?: string;
            /** @example "Arabic" */
            english_name?: string;
            data?: {
              /** @example "" */
              name?: string;
              /** @example "سلسلة درامية مبنية على سلسلة روايات لـ جورج آر آر مارتن بعنوان "إيه سونغ أوف آيس أن فاير" والتي حققت مبيعات كبيرة وتتمحور حول الصراعات التي كانت تحدث في العصور الوسطى بين العائلات النبيلة للسيطرة على عرش وستيروس." */
              overview?: string;
            };
          }[];
        },
        any
      >({
        path: `/3/tv/${seriesId}/season/${seasonNumber}/translations`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the videos that belong to a TV season.
     *
     * @name TvSeasonVideos
     * @summary Videos
     * @request GET:/3/tv/{series_id}/season/{season_number}/videos
     * @secure
     */
    tvSeasonVideos: (
      seriesId: number,
      seasonNumber: number,
      query?: {
        /** filter the list results by language, supports more than one value by using a comma */
        include_video_language?: string;
        /** @default "en-US" */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 3624
           */
          id?: number;
          results?: {
            /** @example "en" */
            iso_639_1?: string;
            /** @example "US" */
            iso_3166_1?: string;
            /** @example "Game Of Thrones - Season 1 Recap - Official HBO UK" */
            name?: string;
            /** @example "e0Y8KpQpW8c" */
            key?: string;
            /** @example "YouTube" */
            site?: string;
            /**
             * @default 0
             * @example 1080
             */
            size?: number;
            /** @example "Recap" */
            type?: string;
            /**
             * @default true
             * @example true
             */
            official?: boolean;
            /** @example "2015-05-19T16:31:23.000Z" */
            published_at?: string;
            /** @example "5ce71a920e0a265ac0cfe497" */
            id?: string;
          }[];
        },
        any
      >({
        path: `/3/tv/${seriesId}/season/${seasonNumber}/videos`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @name TvEpisodeCredits
     * @summary Credits
     * @request GET:/3/tv/{series_id}/season/{season_number}/episode/{episode_number}/credits
     * @secure
     */
    tvEpisodeCredits: (
      seriesId: number,
      seasonNumber: number,
      episodeNumber: number,
      query?: {
        /** @default "en-US" */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          cast?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /**
             * @default 0
             * @example 2
             */
            gender?: number;
            /**
             * @default 0
             * @example 22970
             */
            id?: number;
            /** @example "Acting" */
            known_for_department?: string;
            /** @example "Peter Dinklage" */
            name?: string;
            /** @example "Peter Dinklage" */
            original_name?: string;
            /**
             * @default 0
             * @example 30.6
             */
            popularity?: number;
            /** @example "/lRsRgnksAhBRXwAB68MFjmTtLrk.jpg" */
            profile_path?: string;
            /** @example "Tyrion Lannister" */
            character?: string;
            /** @example "5256c8b219c2956ff6047cd8" */
            credit_id?: string;
            /**
             * @default 0
             * @example 0
             */
            order?: number;
          }[];
          crew?: {
            /** @example "Directing" */
            department?: string;
            /** @example "Director" */
            job?: string;
            /** @example "5256c8a219c2956ff6046e77" */
            credit_id?: string;
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /**
             * @default 0
             * @example 2
             */
            gender?: number;
            /**
             * @default 0
             * @example 44797
             */
            id?: number;
            /** @example "Directing" */
            known_for_department?: string;
            /** @example "Timothy Van Patten" */
            name?: string;
            /** @example "Timothy Van Patten" */
            original_name?: string;
            /**
             * @default 0
             * @example 8.292
             */
            popularity?: number;
            /** @example "/MzSOFrd99HRdr6pkSRSctk3kBR.jpg" */
            profile_path?: string;
          }[];
          guest_stars?: {
            /** @example "Benjen Stark" */
            character?: string;
            /** @example "5256c8b919c2956ff604836a" */
            credit_id?: string;
            /**
             * @default 0
             * @example 62
             */
            order?: number;
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /**
             * @default 0
             * @example 2
             */
            gender?: number;
            /**
             * @default 0
             * @example 119783
             */
            id?: number;
            /** @example "Acting" */
            known_for_department?: string;
            /** @example "Joseph Mawle" */
            name?: string;
            /** @example "Joseph Mawle" */
            original_name?: string;
            /**
             * @default 0
             * @example 8.559
             */
            popularity?: number;
            /** @example "/1Ocb9v3h54beGVoJMm4w50UQhLf.jpg" */
            profile_path?: string;
          }[];
          /**
           * @default 0
           * @example 63056
           */
          id?: number;
        },
        any
      >({
        path: `/3/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}/credits`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get a list of external IDs that have been added to a TV episode.
     *
     * @name TvEpisodeExternalIds
     * @summary External IDs
     * @request GET:/3/tv/{series_id}/season/{season_number}/episode/{episode_number}/external_ids
     * @secure
     */
    tvEpisodeExternalIds: (
      seriesId: number,
      seasonNumber: number,
      episodeNumber: string,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 63056
           */
          id?: number;
          /** @example "tt1480055" */
          imdb_id?: string;
          /** @example "/m/0gmc6ph" */
          freebase_mid?: string;
          /** @example "/en/winter_is_coming" */
          freebase_id?: string;
          /**
           * @default 0
           * @example 3254641
           */
          tvdb_id?: number;
          /**
           * @default 0
           * @example 1065008299
           */
          tvrage_id?: number;
          /** @example "Q2614622" */
          wikidata_id?: string;
        },
        any
      >({
        path: `/3/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}/external_ids`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the translations that have been added to a TV episode.
     *
     * @name TvEpisodeTranslations
     * @summary Translations
     * @request GET:/3/tv/{series_id}/season/{season_number}/episode/{episode_number}/translations
     * @secure
     */
    tvEpisodeTranslations: (
      seriesId: number,
      seasonNumber: number,
      episodeNumber: number,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 63056
           */
          id?: number;
          translations?: {
            /** @example "SA" */
            iso_3166_1?: string;
            /** @example "ar" */
            iso_639_1?: string;
            /** @example "العربية" */
            name?: string;
            /** @example "Arabic" */
            english_name?: string;
            data?: {
              /** @example "" */
              name?: string;
              /** @example "خلف باب واسع من الجليد في شمالي وستيروس هناك شيء يحدث. تتلقى عائلة ستارك التي من وينترفيل زيارة من العائلة المالكة، بينما يشكل أمير عائلة تارغارين المنفي تحالفاً جديداً للسيطرة على العرش من جديد." */
              overview?: string;
            };
          }[];
        },
        any
      >({
        path: `/3/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}/translations`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the videos that belong to a TV episode.
     *
     * @name TvEpisodeVideos
     * @summary Videos
     * @request GET:/3/tv/{series_id}/season/{season_number}/episode/{episode_number}/videos
     * @secure
     */
    tvEpisodeVideos: (
      seriesId: number,
      seasonNumber: number,
      episodeNumber: number,
      query?: {
        /** filter the list results by language, supports more than one value by using a comma */
        include_video_language?: string;
        /** @default "en-US" */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 3624
           */
          id?: number;
          results?: {
            /** @example "en" */
            iso_639_1?: string;
            /** @example "US" */
            iso_3166_1?: string;
            /** @example "Game Of Thrones - Season 1 Recap - Official HBO UK" */
            name?: string;
            /** @example "e0Y8KpQpW8c" */
            key?: string;
            /** @example "YouTube" */
            site?: string;
            /**
             * @default 0
             * @example 1080
             */
            size?: number;
            /** @example "Recap" */
            type?: string;
            /**
             * @default true
             * @example true
             */
            official?: boolean;
            /** @example "2015-05-19T16:31:23.000Z" */
            published_at?: string;
            /** @example "5ce71a920e0a265ac0cfe497" */
            id?: string;
          }[];
        },
        any
      >({
        path: `/3/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}/videos`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Rate a TV episode and save it to your rated list.
     *
     * @name TvEpisodeAddRating
     * @summary Add Rating
     * @request POST:/3/tv/{series_id}/season/{season_number}/episode/{episode_number}/rating
     * @secure
     */
    tvEpisodeAddRating: (
      seriesId: number,
      seasonNumber: number,
      episodeNumber: number,
      data: {
        /** @format json */
        RAW_BODY: string;
      },
      query?: {
        guest_session_id?: string;
        session_id?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          status_code?: number;
          /** @example "Success." */
          status_message?: string;
        },
        any
      >({
        path: `/3/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}/rating`,
        method: 'POST',
        query: query,
        body: data,
        secure: true,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * @description Delete your rating on a TV episode.
     *
     * @name TvEpisodeDeleteRating
     * @summary Delete Rating
     * @request DELETE:/3/tv/{series_id}/season/{season_number}/episode/{episode_number}/rating
     * @secure
     */
    tvEpisodeDeleteRating: (
      seriesId: number,
      seasonNumber: number,
      episodeNumber: number,
      query?: {
        guest_session_id?: string;
        session_id?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 13
           */
          status_code?: number;
          /** @example "The item/record was deleted successfully." */
          status_message?: string;
        },
        any
      >({
        path: `/3/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}/rating`,
        method: 'DELETE',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the public details of an account on TMDB.
     *
     * @name AccountDetails
     * @summary Details
     * @request GET:/3/account/{account_id}
     * @secure
     */
    accountDetails: (
      accountId: number,
      query?: {
        session_id?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          avatar?: {
            gravatar?: {
              /** @example "c9e9fc152ee756a900db85757c29815d" */
              hash?: string;
            };
            tmdb?: {
              /** @example "/xy44UvpbTgzs9kWmp4C3fEaCl5h.png" */
              avatar_path?: string;
            };
          };
          /**
           * @default 0
           * @example 548
           */
          id?: number;
          /** @example "en" */
          iso_639_1?: string;
          /** @example "CA" */
          iso_3166_1?: string;
          /** @example "Travis Bell" */
          name?: string;
          /**
           * @default true
           * @example false
           */
          include_adult?: boolean;
          /** @example "travisbell" */
          username?: string;
        },
        any
      >({
        path: `/3/account/${accountId}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get a users list of custom lists.
     *
     * @name AccountLists
     * @summary Lists
     * @request GET:/3/account/{account_id}/lists
     * @secure
     */
    accountLists: (
      accountId: number,
      query?: {
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        session_id?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /** @example "" */
            description?: string;
            /**
             * @default 0
             * @example 0
             */
            favorite_count?: number;
            /**
             * @default 0
             * @example 120174
             */
            id?: number;
            /**
             * @default 0
             * @example 5
             */
            item_count?: number;
            /** @example "en" */
            iso_639_1?: string;
            /** @example "movie" */
            list_type?: string;
            /** @example "Test Alpha Sort" */
            name?: string;
            poster_path?: any;
          }[];
          /**
           * @default 0
           * @example 2
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 25
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/account/${accountId}/lists`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get a users list of favourite movies.
     *
     * @name AccountGetFavorites
     * @summary Favorite Movies
     * @request GET:/3/account/{account_id}/favorite/movies
     * @secure
     */
    accountGetFavorites: (
      accountId: number,
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        session_id?: string;
        /** @default "created_at.asc" */
        sort_by?: 'created_at.asc' | 'created_at.desc';
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/se5Hxz7PArQZOG3Nx2bpfOhLhtV.jpg" */
            backdrop_path?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 9806
             */
            id?: number;
            /** @example "en" */
            original_language?: string;
            /** @example "The Incredibles" */
            original_title?: string;
            /** @example "Bob Parr has given up his superhero days to log in time as an insurance adjuster and raise his three children with his formerly heroic wife in suburbia. But when he receives a mysterious assignment, it's time to get back into costume." */
            overview?: string;
            /**
             * @default 0
             * @example 71.477
             */
            popularity?: number;
            /** @example "/2LqaLgk4Z226KkgPJuiOQ58wvrm.jpg" */
            poster_path?: string;
            /** @example "2004-10-27" */
            release_date?: string;
            /** @example "The Incredibles" */
            title?: string;
            /**
             * @default true
             * @example false
             */
            video?: boolean;
            /**
             * @default 0
             * @example 7.702
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 16162
             */
            vote_count?: number;
          }[];
          /**
           * @default 0
           * @example 4
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 80
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/account/${accountId}/favorite/movies`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get a users list of favourite TV shows.
     *
     * @name AccountFavoriteTv
     * @summary Favorite TV
     * @request GET:/3/account/{account_id}/favorite/tv
     * @secure
     */
    accountFavoriteTv: (
      accountId: number,
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        session_id?: string;
        /** @default "created_at.asc" */
        sort_by?: 'created_at.asc' | 'created_at.desc';
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/bsNm9z2TJfe0WO3RedPGWQ8mG1X.jpg" */
            backdrop_path?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 1396
             */
            id?: number;
            origin_country?: string[];
            /** @example "en" */
            original_language?: string;
            /** @example "Breaking Bad" */
            original_name?: string;
            /** @example "When Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer and given a prognosis of only two years left to live. He becomes filled with a sense of fearlessness and an unrelenting desire to secure his family's financial future at any cost as he enters the dangerous world of drugs and crime." */
            overview?: string;
            /**
             * @default 0
             * @example 292.904
             */
            popularity?: number;
            /** @example "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg" */
            poster_path?: string;
            /** @example "2008-01-20" */
            first_air_date?: string;
            /** @example "Breaking Bad" */
            name?: string;
            /**
             * @default 0
             * @example 8.878
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 11548
             */
            vote_count?: number;
          }[];
          /**
           * @default 0
           * @example 4
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 68
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/account/${accountId}/favorite/tv`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get a users list of rated movies.
     *
     * @name AccountRatedMovies
     * @summary Rated Movies
     * @request GET:/3/account/{account_id}/rated/movies
     * @secure
     */
    accountRatedMovies: (
      accountId: number,
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        session_id?: string;
        /** @default "created_at.asc" */
        sort_by?: 'created_at.asc' | 'created_at.desc';
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/dUVbWINfRMGojGZRcO6GF1Z2nV8.jpg" */
            backdrop_path?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 120
             */
            id?: number;
            /** @example "en" */
            original_language?: string;
            /** @example "The Lord of the Rings: The Fellowship of the Ring" */
            original_title?: string;
            /** @example "Young hobbit Frodo Baggins, after inheriting a mysterious ring from his uncle Bilbo, must leave his home in order to keep it from falling into the hands of its evil creator. Along the way, a fellowship is formed to protect the ringbearer and make sure that the ring arrives at its final destination: Mt. Doom, the only place where it can be destroyed." */
            overview?: string;
            /**
             * @default 0
             * @example 84.737
             */
            popularity?: number;
            /** @example "/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg" */
            poster_path?: string;
            /** @example "2001-12-18" */
            release_date?: string;
            /** @example "The Lord of the Rings: The Fellowship of the Ring" */
            title?: string;
            /**
             * @default true
             * @example false
             */
            video?: boolean;
            /**
             * @default 0
             * @example 8.396
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 22579
             */
            vote_count?: number;
            /**
             * @default 0
             * @example 8
             */
            rating?: number;
          }[];
          /**
           * @default 0
           * @example 47
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 940
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/account/${accountId}/rated/movies`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get a users list of rated TV shows.
     *
     * @name AccountRatedTv
     * @summary Rated TV
     * @request GET:/3/account/{account_id}/rated/tv
     * @secure
     */
    accountRatedTv: (
      accountId: number,
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        session_id?: string;
        /** @default "created_at.asc" */
        sort_by?: 'created_at.asc' | 'created_at.desc';
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/2yZXtM2Kky1Sy0kachbDlwybl3y.jpg" */
            backdrop_path?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 1705
             */
            id?: number;
            origin_country?: string[];
            /** @example "en" */
            original_language?: string;
            /** @example "Fringe" */
            original_name?: string;
            /** @example "FBI Special Agent Olivia Dunham, brilliant but formerly institutionalized scientist Walter Bishop and his scheming, reluctant son Peter uncover a deadly mystery involving a series of unbelievable events and realize they may be a part of a larger, more disturbing pattern that blurs the line between science fiction and technology." */
            overview?: string;
            /**
             * @default 0
             * @example 151.906
             */
            popularity?: number;
            /** @example "/sY9hg5dLJ93RJOyKEiu1nAtBRND.jpg" */
            poster_path?: string;
            /** @example "2008-09-09" */
            first_air_date?: string;
            /** @example "Fringe" */
            name?: string;
            /**
             * @default 0
             * @example 8.109
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 2050
             */
            vote_count?: number;
            /**
             * @default 0
             * @example 9
             */
            rating?: number;
          }[];
          /**
           * @default 0
           * @example 15
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 290
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/account/${accountId}/rated/tv`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get a users list of rated TV episodes.
     *
     * @name AccountRatedTvEpisodes
     * @summary Rated TV Episodes
     * @request GET:/3/account/{account_id}/rated/tv/episodes
     * @secure
     */
    accountRatedTvEpisodes: (
      accountId: number,
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        session_id?: string;
        /** @default "created_at.asc" */
        sort_by?: 'created_at.asc' | 'created_at.desc';
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /** @example "2013-10-17" */
            air_date?: string;
            /**
             * @default 0
             * @example 5
             */
            episode_number?: number;
            /**
             * @default 0
             * @example 64782
             */
            id?: number;
            /** @example "The Workplace Proximity" */
            name?: string;
            /** @example "Amy starts working at Caltech which causes friction with Sheldon. Howard agrees with Sheldon who mentions this to Bernadette causing a big fight for the Wolowitzes." */
            overview?: string;
            /** @example "4X5305" */
            production_code?: string;
            /**
             * @default 0
             * @example 22
             */
            runtime?: number;
            /**
             * @default 0
             * @example 7
             */
            season_number?: number;
            /**
             * @default 0
             * @example 1418
             */
            show_id?: number;
            /** @example "/k8atjbd5gAsntuhbPnFpvnvo0qn.jpg" */
            still_path?: string;
            /**
             * @default 0
             * @example 7.242
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 31
             */
            vote_count?: number;
            /**
             * @default 0
             * @example 8
             */
            rating?: number;
          }[];
          /**
           * @default 0
           * @example 10
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 186
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/account/${accountId}/rated/tv/episodes`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get a list of movies added to a users watchlist.
     *
     * @name AccountWatchlistMovies
     * @summary Watchlist Movies
     * @request GET:/3/account/{account_id}/watchlist/movies
     * @secure
     */
    accountWatchlistMovies: (
      accountId: number,
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        session_id?: string;
        /** @default "created_at.asc" */
        sort_by?: 'created_at.asc' | 'created_at.desc';
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/rgNzvSagnlc32TuMEBa529QFIig.jpg" */
            backdrop_path?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 76726
             */
            id?: number;
            /** @example "en" */
            original_language?: string;
            /** @example "Chronicle" */
            original_title?: string;
            /** @example "Three high school students make an incredible discovery, leading to their developing uncanny powers beyond their understanding. As they learn to control their abilities and use them to their advantage, their lives start to spin out of control, and their darker sides begin to take over." */
            overview?: string;
            /**
             * @default 0
             * @example 37.148
             */
            popularity?: number;
            /** @example "/xENglsVIIWEEhhB5lgpy33tGcKI.jpg" */
            poster_path?: string;
            /** @example "2012-02-01" */
            release_date?: string;
            /** @example "Chronicle" */
            title?: string;
            /**
             * @default true
             * @example false
             */
            video?: boolean;
            /**
             * @default 0
             * @example 6.822
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 4741
             */
            vote_count?: number;
          }[];
          /**
           * @default 0
           * @example 34
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 677
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/account/${accountId}/watchlist/movies`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get a list of TV shows added to a users watchlist.
     *
     * @name AccountWatchlistTv
     * @summary Watchlist TV
     * @request GET:/3/account/{account_id}/watchlist/tv
     * @secure
     */
    accountWatchlistTv: (
      accountId: number,
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        session_id?: string;
        /** @default "created_at.asc" */
        sort_by?: 'created_at.asc' | 'created_at.desc';
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/7phlGHRupo38EnuwmkAHdNUqov3.jpg" */
            backdrop_path?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 58932
             */
            id?: number;
            origin_country?: string[];
            /** @example "en" */
            original_language?: string;
            /** @example "The Crazy Ones" */
            original_name?: string;
            /** @example "The Crazy Ones is an American situation comedy series created by David E. Kelley that stars Robin Williams and Sarah Michelle Gellar. The single-camera project premiered on CBS on September 26, 2013, as part of the 2013–14 American television season as a Thursday night 9 pm entry. Bill D'Elia, Dean Lorey, Jason Winer, John Montgomery and Mark Teitelbaum serve as executive producers for 20th Century Fox Television." */
            overview?: string;
            /**
             * @default 0
             * @example 8.939
             */
            popularity?: number;
            /** @example "/s2e7hTrdmNUaJDf0yDP5b4AHvrD.jpg" */
            poster_path?: string;
            /** @example "2013-09-26" */
            first_air_date?: string;
            /** @example "The Crazy Ones" */
            name?: string;
            /**
             * @default 0
             * @example 6.176
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 94
             */
            vote_count?: number;
          }[];
          /**
           * @default 0
           * @example 17
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 325
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/account/${accountId}/watchlist/tv`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Mark a movie or TV show as a favourite.
     *
     * @name AccountAddFavorite
     * @summary Add Favorite
     * @request POST:/3/account/{account_id}/favorite
     * @secure
     */
    accountAddFavorite: (
      accountId: number,
      data: {
        /** @format json */
        RAW_BODY: string;
      },
      query?: {
        session_id?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          status_code?: number;
          /** @example "Success." */
          status_message?: string;
        },
        any
      >({
        path: `/3/account/${accountId}/favorite`,
        method: 'POST',
        query: query,
        body: data,
        secure: true,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * @description Add a movie or TV show to your watchlist.
     *
     * @name AccountAddToWatchlist
     * @summary Add To Watchlist
     * @request POST:/3/account/{account_id}/watchlist
     * @secure
     */
    accountAddToWatchlist: (
      accountId: number,
      data: {
        /** @format json */
        RAW_BODY: string;
      },
      query?: {
        session_id?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          status_code?: number;
          /** @example "Success." */
          status_message?: string;
        },
        any
      >({
        path: `/3/account/${accountId}/watchlist`,
        method: 'POST',
        query: query,
        body: data,
        secure: true,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get an up to date list of the officially supported movie certifications on TMDB.
     *
     * @name CertificationMovieList
     * @summary Movie Certifications
     * @request GET:/3/certification/movie/list
     * @secure
     */
    certificationMovieList: (params: RequestParams = {}) =>
      this.request<
        {
          certifications?: {
            AU?: {
              /** @example "E" */
              certification?: string;
              /** @example "Exempt from classification. Films that are exempt from classification must not contain contentious material (i.e. material that would ordinarily be rated M or higher)." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            BG?: {
              /** @example "D" */
              certification?: string;
              /** @example "Prohibited for persons under 16." */
              meaning?: string;
              /**
               * @default 0
               * @example 4
               */
              order?: number;
            }[];
            BR?: {
              /** @example "14" */
              certification?: string;
              /** @example "Not recommended for minors under fourteen. More violent material, stronger sex references and/or nudity." */
              meaning?: string;
              /**
               * @default 0
               * @example 4
               */
              order?: number;
            }[];
            CA?: {
              /** @example "G" */
              certification?: string;
              /** @example "All ages." */
              meaning?: string;
              /**
               * @default 0
               * @example 2
               */
              order?: number;
            }[];
            'CA-QC'?: {
              /** @example "NR" */
              certification?: string;
              /** @example "No rating information." */
              meaning?: string;
              /**
               * @default 0
               * @example 0
               */
              order?: number;
            }[];
            DE?: {
              /** @example "12" */
              certification?: string;
              /** @example "Children 12 or older admitted, children between 6 and 11 only when accompanied by parent or a legal guardian." */
              meaning?: string;
              /**
               * @default 0
               * @example 3
               */
              order?: number;
            }[];
            DK?: {
              /** @example "NR" */
              certification?: string;
              /** @example "No rating information." */
              meaning?: string;
              /**
               * @default 0
               * @example 0
               */
              order?: number;
            }[];
            ES?: {
              /** @example "A" */
              certification?: string;
              /** @example "General admission." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            FI?: {
              /** @example "K-16" */
              certification?: string;
              /** @example "Over 16 years." */
              meaning?: string;
              /**
               * @default 0
               * @example 4
               */
              order?: number;
            }[];
            FR?: {
              /** @example "TP" */
              certification?: string;
              /** @example "Valid for all audiences." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            GB?: {
              /** @example "15" */
              certification?: string;
              /** @example "Only those over 15 years are admitted. Nobody younger than 15 can rent or buy a 15-rated VHS, DVD, Blu-ray Disc, UMD or game, or watch a film in the cinema with this rating. Films under this category can contain adult themes, hard drugs, frequent strong language and limited use of very strong language, strong violence and strong sex references, and nudity without graphic detail. Sexual activity may be portrayed but without any strong detail. Sexual violence may be shown if discreet and justified by context." */
              meaning?: string;
              /**
               * @default 0
               * @example 5
               */
              order?: number;
            }[];
            HU?: {
              /** @example "6" */
              certification?: string;
              /** @example "Not recommended below age of 6." */
              meaning?: string;
              /**
               * @default 0
               * @example 2
               */
              order?: number;
            }[];
            IN?: {
              /** @example "U" */
              certification?: string;
              /** @example "Unrestricted Public Exhibition throughout India, suitable for all age groups. Films under this category should not upset children over 4. Such films may contain educational, social or family-oriented themes. Films under this category may also contain fantasy violence and/or mild bad language." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            IT?: {
              /** @example "NR" */
              certification?: string;
              /** @example "No rating information." */
              meaning?: string;
              /**
               * @default 0
               * @example 0
               */
              order?: number;
            }[];
            LT?: {
              /** @example "NR" */
              certification?: string;
              /** @example "No rating information." */
              meaning?: string;
              /**
               * @default 0
               * @example 0
               */
              order?: number;
            }[];
            MY?: {
              /** @example "NR" */
              certification?: string;
              /** @example "No rating information." */
              meaning?: string;
              /**
               * @default 0
               * @example 0
               */
              order?: number;
            }[];
            NL?: {
              /** @example "AL" */
              certification?: string;
              /** @example "All ages." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            NO?: {
              /** @example "6" */
              certification?: string;
              /** @example "6 years (no restriction for children accompanied by an adult)." */
              meaning?: string;
              /**
               * @default 0
               * @example 2
               */
              order?: number;
            }[];
            NZ?: {
              /** @example "G" */
              certification?: string;
              /** @example "Suitable for general audiences." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            PH?: {
              /** @example "NR" */
              certification?: string;
              /** @example "No rating information." */
              meaning?: string;
              /**
               * @default 0
               * @example 0
               */
              order?: number;
            }[];
            PT?: {
              /** @example "Públicos" */
              certification?: string;
              /** @example "For all the public (especially designed for children under 3 years of age)." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            RU?: {
              /** @example "6+" */
              certification?: string;
              /** @example "(For children above 6) – Unsuitable for children under 6." */
              meaning?: string;
              /**
               * @default 0
               * @example 2
               */
              order?: number;
            }[];
            SE?: {
              /** @example "11" */
              certification?: string;
              /** @example "Children over the age of 7, who are accompanied by an adult, are admitted to films that have been passed for children from the age of 11." */
              meaning?: string;
              /**
               * @default 0
               * @example 3
               */
              order?: number;
            }[];
            US?: {
              /** @example "R" */
              certification?: string;
              /** @example "Under 17 requires accompanying parent or adult guardian 21 or older. The parent/guardian is required to stay with the child under 17 through the entire movie, even if the parent gives the child/teenager permission to see the film alone. These films may contain strong profanity, graphic sexuality, nudity, strong violence, horror, gore, and strong drug use. A movie rated R for profanity often has more severe or frequent language than the PG-13 rating would permit. An R-rated movie may have more blood, gore, drug use, nudity, or graphic sexuality than a PG-13 movie would admit." */
              meaning?: string;
              /**
               * @default 0
               * @example 4
               */
              order?: number;
            }[];
            KR?: {
              /** @example "All" */
              certification?: string;
              /** @example "Film suitable for all ages." */
              meaning?: string;
              /**
               * @default 0
               * @example 0
               */
              order?: number;
            }[];
            SK?: {
              /** @example "U" */
              certification?: string;
              /** @example "General audience." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            TH?: {
              /** @example "P" */
              certification?: string;
              /** @example "Educational." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            MX?: {
              /** @example "AA" */
              certification?: string;
              /** @example "Informative-only rating: Understandable for children under 7 years." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            ID?: {
              /** @example "SU" */
              certification?: string;
              /** @example "All ages." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            TR?: {
              /** @example "Genel İzleyici Kitlesi" */
              certification?: string;
              /** @example "General audience." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            AR?: {
              /** @example "ATP" */
              certification?: string;
              /** @example "For all public." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            GR?: {
              /** @example "K" */
              certification?: string;
              /** @example "No restrictions." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            TW?: {
              /** @example "0+" */
              certification?: string;
              /** @example "Viewing is permitted for audiences of all ages." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            ZA?: {
              /** @example "A" */
              certification?: string;
              /** @example "Suitable for all." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            SG?: {
              /** @example "G" */
              certification?: string;
              /** @example "Suitable for all ages." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            IE?: {
              /** @example "G" */
              certification?: string;
              /** @example "Suitable for children of school going age (note: children can be enrolled in school from the age of 4)." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            PR?: {
              /** @example "G" */
              certification?: string;
              /** @example "" */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            JP?: {
              /** @example "G" */
              certification?: string;
              /** @example "General, suitable for all ages." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            VI?: {
              /** @example "G" */
              certification?: string;
              /** @example "All ages admitted." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            CH?: {
              /** @example "0" */
              certification?: string;
              /** @example "" */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            IL?: {
              /** @example "All" */
              certification?: string;
              /** @example "" */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            HK?: {
              /** @example "I" */
              certification?: string;
              /** @example "" */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            MO?: {
              /** @example "A" */
              certification?: string;
              /** @example "" */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            LV?: {
              /** @example "U" */
              certification?: string;
              /** @example "" */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            LU?: {
              /** @example "EA" */
              certification?: string;
              /** @example "" */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
          };
        },
        any
      >({
        path: `/3/certification/movie/list`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @name CertificationsTvList
     * @summary TV Certifications
     * @request GET:/3/certification/tv/list
     * @secure
     */
    certificationsTvList: (params: RequestParams = {}) =>
      this.request<
        {
          certifications?: {
            AU?: {
              /** @example "P" */
              certification?: string;
              /** @example "Programming is intended for younger children 2–11; commercial stations must show at least 30 minutes of P-rated content each weekday and weekends at all times. No advertisements may be shown during P-rated programs." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            BR?: {
              /** @example "14" */
              certification?: string;
              /** @example "Content suitable for viewers over the age of 14." */
              meaning?: string;
              /**
               * @default 0
               * @example 3
               */
              order?: number;
            }[];
            CA?: {
              /** @example "Exempt" */
              certification?: string;
              /** @example "Shows which are exempt from ratings (such as news and sports programming) will not display an on-screen rating at all." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            'CA-QC'?: {
              /** @example "18+" */
              certification?: string;
              /** @example "Only to be viewed by adults and may contain extreme violence and graphic sexual content. It is mostly used for 18+ movies and pornography." */
              meaning?: string;
              /**
               * @default 0
               * @example 5
               */
              order?: number;
            }[];
            DE?: {
              /** @example "0" */
              certification?: string;
              /** @example "Can be aired at any time." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            ES?: {
              /** @example "NR" */
              certification?: string;
              /** @example "No rating information." */
              meaning?: string;
              /**
               * @default 0
               * @example 0
               */
              order?: number;
            }[];
            FR?: {
              /** @example "NR" */
              certification?: string;
              /** @example "No rating information." */
              meaning?: string;
              /**
               * @default 0
               * @example 0
               */
              order?: number;
            }[];
            GB?: {
              /** @example "U" */
              certification?: string;
              /** @example "The U symbol stands for Universal. A U film should be suitable for audiences aged four years and over." */
              meaning?: string;
              /**
               * @default 0
               * @example 0
               */
              order?: number;
            }[];
            HU?: {
              /** @example "Unrated" */
              certification?: string;
              /** @example "Without age restriction." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            KR?: {
              /** @example "Exempt" */
              certification?: string;
              /** @example "This rating is only for knowledge based game shows; lifestyle shows; documentary shows; news; current topic discussion shows; education/culture shows; sports that excludes MMA or other violent sports; and other programs that Korea Communications Standards Commission recognizes." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            LT?: {
              /** @example "S" */
              certification?: string;
              /** @example "Intended for adult viewers from the age of 18 (corresponding to the age-appropriate index N-18) and broadcast between 23 (11pm) and 6 (6am) hours; Limited to minors and intended for adult audiences." */
              meaning?: string;
              /**
               * @default 0
               * @example 3
               */
              order?: number;
            }[];
            NL?: {
              /** @example "NR" */
              certification?: string;
              /** @example "No rating information." */
              meaning?: string;
              /**
               * @default 0
               * @example 0
               */
              order?: number;
            }[];
            PH?: {
              /** @example "NR" */
              certification?: string;
              /** @example "No rating information." */
              meaning?: string;
              /**
               * @default 0
               * @example 0
               */
              order?: number;
            }[];
            PT?: {
              /** @example "12AP" */
              certification?: string;
              /** @example "Acompanhamento Parental (may not be suitable for children under 12, parental guidance advised)." */
              meaning?: string;
              /**
               * @default 0
               * @example 3
               */
              order?: number;
            }[];
            RU?: {
              /** @example "16+" */
              certification?: string;
              /** @example "Only teens the age of 16 or older can watch." */
              meaning?: string;
              /**
               * @default 0
               * @example 4
               */
              order?: number;
            }[];
            SK?: {
              /** @example "NR" */
              certification?: string;
              /** @example "No rating information." */
              meaning?: string;
              /**
               * @default 0
               * @example 0
               */
              order?: number;
            }[];
            TH?: {
              /** @example "ส" */
              certification?: string;
              /** @example "Sor - Educational movies which the public should be encouraged to see." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            US?: {
              /** @example "TV-MA" */
              certification?: string;
              /** @example "This program is specifically designed to be viewed by adults and therefore may be unsuitable for children under 17." */
              meaning?: string;
              /**
               * @default 0
               * @example 6
               */
              order?: number;
            }[];
            IT?: {
              /** @example "T" */
              certification?: string;
              /** @example "All ages admitted." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            FI?: {
              /** @example "S" */
              certification?: string;
              /** @example "Allowed at all times." */
              meaning?: string;
              /**
               * @default 0
               * @example 0
               */
              order?: number;
            }[];
            MY?: {
              /** @example "U" */
              certification?: string;
              /** @example "No age limit. Can be broadcast anytime." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            NZ?: {
              /** @example "G" */
              certification?: string;
              /** @example "Approved for general viewing." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            NO?: {
              /** @example "A" */
              certification?: string;
              /** @example "Allowed at all times." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            BG?: {
              /** @example "Unrated" */
              certification?: string;
              /** @example "Can be viewed for each age." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            MX?: {
              /** @example "AA" */
              certification?: string;
              /** @example "Aimed at children (can be broadcast anytime)." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            IN?: {
              /** @example "U" */
              certification?: string;
              /** @example "Viewable for all ages." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            DK?: {
              /** @example "A" */
              certification?: string;
              /** @example "Suitable for a general audience." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            SE?: {
              /** @example "Btl" */
              certification?: string;
              /** @example "" */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            ID?: {
              /** @example "SU" */
              certification?: string;
              /** @example "Suitable for general audiences over the age of 2 years." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            TR?: {
              /** @example "Genel İzleyici" */
              certification?: string;
              /** @example "General audience. Suitable for all ages." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            AR?: {
              /** @example "ATP" */
              certification?: string;
              /** @example "Suitable for all audiences." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            PL?: {
              /** @example "0" */
              certification?: string;
              /** @example "Positive or neutral view of the world, little to no violence, non-sexual love, and no sexual content." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            MA?: {
              /** @example "NR" */
              certification?: string;
              /** @example "All audiences." */
              meaning?: string;
              /**
               * @default 0
               * @example 0
               */
              order?: number;
            }[];
            GR?: {
              /** @example "K" */
              certification?: string;
              /** @example "Suitable for all ages." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            IL?: {
              /** @example "E" */
              certification?: string;
              /** @example "Exempt from classification. This rating is usually applied to live broadcasts." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            TW?: {
              /** @example "0+" */
              certification?: string;
              /** @example "Suitable for watching by general audiences." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            ZA?: {
              /** @example "All" */
              certification?: string;
              /** @example "This is a programme/film that does not contain any obscenity, and is suitable for family viewing. A logo must be displayed in the corner of the screen for 30 seconds after each commercial break." */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            SG?: {
              /** @example "G" */
              certification?: string;
              /** @example "" */
              meaning?: string;
              /**
               * @default 0
               * @example 1
               */
              order?: number;
            }[];
            PR?: {
              /** @example "NR" */
              certification?: string;
              /** @example "" */
              meaning?: string;
              /**
               * @default 0
               * @example 0
               */
              order?: number;
            }[];
            VI?: {
              /** @example "NR" */
              certification?: string;
              /** @example "" */
              meaning?: string;
              /**
               * @default 0
               * @example 0
               */
              order?: number;
            }[];
          };
        },
        any
      >({
        path: `/3/certification/tv/list`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get a list of all of the movie ids that have been changed in the past 24 hours.
     *
     * @name ChangesMovieList
     * @summary Movie List
     * @request GET:/3/movie/changes
     * @secure
     */
    changesMovieList: (
      query?: {
        /** @format date */
        end_date?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        /** @format date */
        start_date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          results?: {
            /**
             * @default 0
             * @example 1120293
             */
            id?: number;
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
          }[];
          /**
           * @default 0
           * @example 3
           */
          page?: number;
          /**
           * @default 0
           * @example 57
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 5700
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/movie/changes`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @name ChangesTvList
     * @summary TV List
     * @request GET:/3/tv/changes
     * @secure
     */
    changesTvList: (
      query?: {
        /** @format date */
        end_date?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        /** @format date */
        start_date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          results?: {
            /**
             * @default 0
             * @example 225591
             */
            id?: number;
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
          }[];
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          /**
           * @default 0
           * @example 18
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 1763
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/tv/changes`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @name ChangesPeopleList
     * @summary People List
     * @request GET:/3/person/changes
     * @secure
     */
    changesPeopleList: (
      query?: {
        /** @format date */
        end_date?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        /** @format date */
        start_date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          results?: {
            /**
             * @default 0
             * @example 4037513
             */
            id?: number;
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
          }[];
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          /**
           * @default 0
           * @example 53
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 5292
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/person/changes`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get collection details by ID.
     *
     * @name CollectionDetails
     * @summary Details
     * @request GET:/3/collection/{collection_id}
     * @secure
     */
    collectionDetails: (
      collectionId: number,
      query?: {
        /** @default "en-US" */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 10
           */
          id?: number;
          /** @example "Star Wars Collection" */
          name?: string;
          /** @example "An epic space-opera theatrical film series, which depicts the adventures of various characters "a long time ago in a galaxy far, far away…."" */
          overview?: string;
          /** @example "/r8Ph5MYXL04Qzu4QBbq2KjqwtkQ.jpg" */
          poster_path?: string;
          /** @example "/d8duYyyC9J5T825Hg7grmaabfxQ.jpg" */
          backdrop_path?: string;
          parts?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/2w4xG178RpB4MDAIfTkqAuSJzec.jpg" */
            backdrop_path?: string;
            /**
             * @default 0
             * @example 11
             */
            id?: number;
            /** @example "Star Wars" */
            title?: string;
            /** @example "en" */
            original_language?: string;
            /** @example "Star Wars" */
            original_title?: string;
            /** @example "Princess Leia is captured and held hostage by the evil Imperial forces in their effort to take over the galactic Empire. Venturesome Luke Skywalker and dashing captain Han Solo team together with the loveable robot duo R2-D2 and C-3PO to rescue the beautiful princess and restore peace and justice in the Empire." */
            overview?: string;
            /** @example "/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg" */
            poster_path?: string;
            /** @example "movie" */
            media_type?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 100.492
             */
            popularity?: number;
            /** @example "1977-05-25" */
            release_date?: string;
            /**
             * @default true
             * @example false
             */
            video?: boolean;
            /**
             * @default 0
             * @example 8.207
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 18549
             */
            vote_count?: number;
          }[];
        },
        any
      >({
        path: `/3/collection/${collectionId}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the images that belong to a collection.
     *
     * @name CollectionImages
     * @summary Images
     * @request GET:/3/collection/{collection_id}/images
     * @secure
     */
    collectionImages: (
      collectionId: number,
      query?: {
        /** specify a comma separated list of ISO-639-1 values to query, for example: `en,null` */
        include_image_language?: string;
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 10
           */
          id?: number;
          backdrops?: {
            /**
             * @default 0
             * @example 1.778
             */
            aspect_ratio?: number;
            /**
             * @default 0
             * @example 1080
             */
            height?: number;
            iso_639_1?: any;
            /** @example "/d8duYyyC9J5T825Hg7grmaabfxQ.jpg" */
            file_path?: string;
            /**
             * @default 0
             * @example 5.464
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 30
             */
            vote_count?: number;
            /**
             * @default 0
             * @example 1920
             */
            width?: number;
          }[];
          posters?: {
            /**
             * @default 0
             * @example 0.667
             */
            aspect_ratio?: number;
            /**
             * @default 0
             * @example 3000
             */
            height?: number;
            /** @example "en" */
            iso_639_1?: string;
            /** @example "/r8Ph5MYXL04Qzu4QBbq2KjqwtkQ.jpg" */
            file_path?: string;
            /**
             * @default 0
             * @example 5.516
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 14
             */
            vote_count?: number;
            /**
             * @default 0
             * @example 2000
             */
            width?: number;
          }[];
        },
        any
      >({
        path: `/3/collection/${collectionId}/images`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @name CollectionTranslations
     * @summary Translations
     * @request GET:/3/collection/{collection_id}/translations
     * @secure
     */
    collectionTranslations: (
      collectionId: number,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 10
           */
          id?: number;
          translations?: {
            /** @example "AE" */
            iso_3166_1?: string;
            /** @example "ar" */
            iso_639_1?: string;
            /** @example "العربية" */
            name?: string;
            /** @example "Arabic" */
            english_name?: string;
            data?: {
              /** @example "" */
              title?: string;
              /** @example "" */
              overview?: string;
              /** @example "" */
              homepage?: string;
            };
          }[];
        },
        any
      >({
        path: `/3/collection/${collectionId}/translations`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the company details by ID.
     *
     * @name CompanyDetails
     * @summary Details
     * @request GET:/3/company/{company_id}
     * @secure
     */
    companyDetails: (companyId: number, params: RequestParams = {}) =>
      this.request<
        {
          /** @example "" */
          description?: string;
          /** @example "San Francisco, California" */
          headquarters?: string;
          /** @example "https://www.lucasfilm.com" */
          homepage?: string;
          /**
           * @default 0
           * @example 1
           */
          id?: number;
          /** @example "/o86DbpburjxrqAzEDhXZcyE8pDb.png" */
          logo_path?: string;
          /** @example "Lucasfilm Ltd." */
          name?: string;
          /** @example "US" */
          origin_country?: string;
          parent_company?: any;
        },
        any
      >({
        path: `/3/company/${companyId}`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the company details by ID.
     *
     * @name CompanyAlternativeNames
     * @summary Alternative Names
     * @request GET:/3/company/{company_id}/alternative_names
     * @secure
     */
    companyAlternativeNames: (companyId: number, params: RequestParams = {}) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          id?: number;
          results?: {
            /** @example "루카스필름" */
            name?: string;
            /** @example "" */
            type?: string;
          }[];
        },
        any
      >({
        path: `/3/company/${companyId}/alternative_names`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the company logos by id.
     *
     * @name CompanyImages
     * @summary Images
     * @request GET:/3/company/{company_id}/images
     * @secure
     */
    companyImages: (companyId: number, params: RequestParams = {}) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          id?: number;
          logos?: {
            /**
             * @default 0
             * @example 2.97979797979798
             */
            aspect_ratio?: number;
            /** @example "/o86DbpburjxrqAzEDhXZcyE8pDb.png" */
            file_path?: string;
            /**
             * @default 0
             * @example 99
             */
            height?: number;
            /** @example "5aa080d6c3a3683fea00011e" */
            id?: string;
            /** @example ".svg" */
            file_type?: string;
            /**
             * @default 0
             * @example 5.384
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 2
             */
            vote_count?: number;
            /**
             * @default 0
             * @example 295
             */
            width?: number;
          }[];
        },
        any
      >({
        path: `/3/company/${companyId}/images`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get a movie or TV credit details by ID.
     *
     * @name CreditDetails
     * @summary Details
     * @request GET:/3/credit/{credit_id}
     * @secure
     */
    creditDetails: (creditId: string, params: RequestParams = {}) =>
      this.request<
        {
          /** @example "cast" */
          credit_type?: string;
          /** @example "Acting" */
          department?: string;
          /** @example "Actor" */
          job?: string;
          media?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg" */
            backdrop_path?: string;
            /**
             * @default 0
             * @example 100088
             */
            id?: number;
            /** @example "The Last of Us" */
            name?: string;
            /** @example "en" */
            original_language?: string;
            /** @example "The Last of Us" */
            original_name?: string;
            /** @example "Zwanzig Jahre nachdem die moderne Zivilisation zerstört wurde. – Joel, ein abgehärteter Überlebender, wird angeheuert, um Ellie, ein 14-jähriges Mädchen, aus einer bedrückenden Quarantänezone zu schmuggeln. Was als kleiner Job beginnt, wird bald zu einer brutalen, herzzerreißenden Reise, bei der die beiden die USA durchqueren müssen und aufeinander angewiesen sind, um zu überleben." */
            overview?: string;
            /** @example "/igwIPNClQpGVzb61QlGqcpT5zUy.jpg" */
            poster_path?: string;
            /** @example "tv" */
            media_type?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 898.378
             */
            popularity?: number;
            /** @example "2023-01-15" */
            first_air_date?: string;
            /**
             * @default 0
             * @example 8.749
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 3341
             */
            vote_count?: number;
            origin_country?: string[];
            /** @example "Joel Miller" */
            character?: string;
            episodes?: any[];
            seasons?: {
              /** @example "2023-01-15" */
              air_date?: string;
              /**
               * @default 0
               * @example 9
               */
              episode_count?: number;
              /**
               * @default 0
               * @example 144593
               */
              id?: number;
              /** @example "Staffel 1" */
              name?: string;
              /** @example "Die 1. Staffel der Endzeit-Horrorserie The Last of Us feierte ihre Premiere am 15. Januar 2023 bei HBO. In Staffel 1 beginnt für den Überlebenden Joel und das Mädchen Ellie eine Reise durch das postapokalyptische Amerika, in dem Plünderer und mutierte Wesen ihnen nach dem Leben trachten." */
              overview?: string;
              /** @example "/aUQKIpZZ31KWbpdHMCmaV76u78T.jpg" */
              poster_path?: string;
              /**
               * @default 0
               * @example 1
               */
              season_number?: number;
              /**
               * @default 0
               * @example 100088
               */
              show_id?: number;
            }[];
          };
          /** @example "tv" */
          media_type?: string;
          /** @example "6024a814c0ae36003d59cc3c" */
          id?: string;
          person?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /**
             * @default 0
             * @example 1253360
             */
            id?: number;
            /** @example "Pedro Pascal" */
            name?: string;
            /** @example "Pedro Pascal" */
            original_name?: string;
            /** @example "person" */
            media_type?: string;
            /**
             * @default 0
             * @example 106.095
             */
            popularity?: number;
            /**
             * @default 0
             * @example 2
             */
            gender?: number;
            /** @example "Acting" */
            known_for_department?: string;
            /** @example "/dBOrm29cr7NUrjiDQMTtrTyDpfy.jpg" */
            profile_path?: string;
          };
        },
        any
      >({
        path: `/3/credit/${creditId}`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the list of official genres for movies.
     *
     * @name GenreMovieList
     * @summary Movie List
     * @request GET:/3/genre/movie/list
     * @secure
     */
    genreMovieList: (
      query?: {
        /** @default "en" */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          genres?: {
            /**
             * @default 0
             * @example 28
             */
            id?: number;
            /** @example "Action" */
            name?: string;
          }[];
        },
        any
      >({
        path: `/3/genre/movie/list`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the list of official genres for TV shows.
     *
     * @name GenreTvList
     * @summary TV List
     * @request GET:/3/genre/tv/list
     * @secure
     */
    genreTvList: (
      query?: {
        /** @default "en" */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          genres?: {
            /**
             * @default 0
             * @example 10759
             */
            id?: number;
            /** @example "Action & Adventure" */
            name?: string;
          }[];
        },
        any
      >({
        path: `/3/genre/tv/list`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the rated movies for a guest session.
     *
     * @name GuestSessionRatedMovies
     * @summary Rated Movies
     * @request GET:/3/guest_session/{guest_session_id}/rated/movies
     * @secure
     */
    guestSessionRatedMovies: (
      guestSessionId: string,
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        /** @default "created_at.asc" */
        sort_by?: 'created_at.asc' | 'created_at.desc';
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/ikR2qy9xJCHX7M8i5rcvuNfdYXs.jpg" */
            backdrop_path?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 16
             */
            id?: number;
            /** @example "en" */
            original_language?: string;
            /** @example "Dancer in the Dark" */
            original_title?: string;
            /** @example "Selma, a Czech immigrant on the verge of blindness, struggles to make ends meet for herself and her son, who has inherited the same genetic disorder and will suffer the same fate without an expensive operation. When life gets too difficult, Selma learns to cope through her love of musicals, escaping life's troubles - even if just for a moment - by dreaming up little numbers to the rhythmic beats of her surroundings." */
            overview?: string;
            /**
             * @default 0
             * @example 14.684
             */
            popularity?: number;
            /** @example "/8Wdd3fQfbbQeoSfWpHrDfaFNhBU.jpg" */
            poster_path?: string;
            /** @example "2000-06-30" */
            release_date?: string;
            /** @example "Dancer in the Dark" */
            title?: string;
            /**
             * @default true
             * @example false
             */
            video?: boolean;
            /**
             * @default 0
             * @example 7.885
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 1549
             */
            vote_count?: number;
            /**
             * @default 0
             * @example 8.5
             */
            rating?: number;
          }[];
          /**
           * @default 0
           * @example 1
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 1
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/guest_session/${guestSessionId}/rated/movies`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the rated TV shows for a guest session.
     *
     * @name GuestSessionRatedTv
     * @summary Rated TV
     * @request GET:/3/guest_session/{guest_session_id}/rated/tv
     * @secure
     */
    guestSessionRatedTv: (
      guestSessionId: string,
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        /** @default "created_at.asc" */
        sort_by?: 'created_at.asc' | 'created_at.desc';
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg" */
            backdrop_path?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 1399
             */
            id?: number;
            origin_country?: string[];
            /** @example "en" */
            original_language?: string;
            /** @example "Game of Thrones" */
            original_name?: string;
            /** @example "Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war. All while a very ancient evil awakens in the farthest north. Amidst the war, a neglected military order of misfits, the Night's Watch, is all that stands between the realms of men and icy horrors beyond." */
            overview?: string;
            /**
             * @default 0
             * @example 404.299
             */
            popularity?: number;
            /** @example "/7WUHnWGx5OO145IRxPDUkQSh4C7.jpg" */
            poster_path?: string;
            /** @example "2011-04-17" */
            first_air_date?: string;
            /** @example "Game of Thrones" */
            name?: string;
            /**
             * @default 0
             * @example 8.436
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 21025
             */
            vote_count?: number;
            /**
             * @default 0
             * @example 8.5
             */
            rating?: number;
          }[];
          /**
           * @default 0
           * @example 1
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 1
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/guest_session/${guestSessionId}/rated/tv`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the rated TV episodes for a guest session.
     *
     * @name GuestSessionRatedTvEpisodes
     * @summary Rated TV Episodes
     * @request GET:/3/guest_session/{guest_session_id}/rated/tv/episodes
     * @secure
     */
    guestSessionRatedTvEpisodes: (
      guestSessionId: string,
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        /** @default "created_at.asc" */
        sort_by?: 'created_at.asc' | 'created_at.desc';
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /** @example "2011-04-17" */
            air_date?: string;
            /**
             * @default 0
             * @example 1
             */
            episode_number?: number;
            /**
             * @default 0
             * @example 63056
             */
            id?: number;
            /** @example "Winter Is Coming" */
            name?: string;
            /** @example "Jon Arryn, the Hand of the King, is dead. King Robert Baratheon plans to ask his oldest friend, Eddard Stark, to take Jon's place. Across the sea, Viserys Targaryen plans to wed his sister to a nomadic warlord in exchange for an army." */
            overview?: string;
            /** @example "101" */
            production_code?: string;
            /**
             * @default 0
             * @example 62
             */
            runtime?: number;
            /**
             * @default 0
             * @example 1
             */
            season_number?: number;
            /**
             * @default 0
             * @example 1399
             */
            show_id?: number;
            /** @example "/9hGF3WUkBf7cSjMg0cdMDHJkByd.jpg" */
            still_path?: string;
            /**
             * @default 0
             * @example 7.843
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 286
             */
            vote_count?: number;
            /**
             * @default 0
             * @example 8.5
             */
            rating?: number;
          }[];
          /**
           * @default 0
           * @example 1
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 1
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/guest_session/${guestSessionId}/rated/tv/episodes`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the list of the countries we have watch provider (OTT/streaming) data for.
     *
     * @name WatchProvidersAvailableRegions
     * @summary Available Regions
     * @request GET:/3/watch/providers/regions
     * @secure
     */
    watchProvidersAvailableRegions: (
      query?: {
        /** @default "en-US" */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          results?: {
            /** @example "AD" */
            iso_3166_1?: string;
            /** @example "Andorra" */
            english_name?: string;
            /** @example "Andorra" */
            native_name?: string;
          }[];
        },
        any
      >({
        path: `/3/watch/providers/regions`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the list of streaming providers we have for movies.
     *
     * @name WatchProvidersMovieList
     * @summary Movie Providers
     * @request GET:/3/watch/providers/movie
     * @secure
     */
    watchProvidersMovieList: (
      query?: {
        /** @default "en-US" */
        language?: string;
        watch_region?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          results?: {
            display_priorities?: {
              /**
               * @default 0
               * @example 6
               */
              CA?: number;
              /**
               * @default 0
               * @example 1
               */
              AE?: number;
              /**
               * @default 0
               * @example 3
               */
              AR?: number;
              /**
               * @default 0
               * @example 4
               */
              AT?: number;
              /**
               * @default 0
               * @example 10
               */
              AU?: number;
              /**
               * @default 0
               * @example 6
               */
              BE?: number;
              /**
               * @default 0
               * @example 6
               */
              BO?: number;
              /**
               * @default 0
               * @example 8
               */
              BR?: number;
              /**
               * @default 0
               * @example 2
               */
              BG?: number;
              /**
               * @default 0
               * @example 4
               */
              CH?: number;
              /**
               * @default 0
               * @example 3
               */
              CL?: number;
              /**
               * @default 0
               * @example 4
               */
              CO?: number;
              /**
               * @default 0
               * @example 5
               */
              CR?: number;
              /**
               * @default 0
               * @example 3
               */
              CZ?: number;
              /**
               * @default 0
               * @example 4
               */
              DE?: number;
              /**
               * @default 0
               * @example 7
               */
              DK?: number;
              /**
               * @default 0
               * @example 7
               */
              EC?: number;
              /**
               * @default 0
               * @example 3
               */
              EE?: number;
              /**
               * @default 0
               * @example 2
               */
              EG?: number;
              /**
               * @default 0
               * @example 4
               */
              ES?: number;
              /**
               * @default 0
               * @example 10
               */
              FI?: number;
              /**
               * @default 0
               * @example 5
               */
              FR?: number;
              /**
               * @default 0
               * @example 5
               */
              GB?: number;
              /**
               * @default 0
               * @example 2
               */
              GR?: number;
              /**
               * @default 0
               * @example 7
               */
              GT?: number;
              /**
               * @default 0
               * @example 5
               */
              HK?: number;
              /**
               * @default 0
               * @example 7
               */
              HN?: number;
              /**
               * @default 0
               * @example 3
               */
              HU?: number;
              /**
               * @default 0
               * @example 4
               */
              ID?: number;
              /**
               * @default 0
               * @example 4
               */
              IE?: number;
              /**
               * @default 0
               * @example 8
               */
              IN?: number;
              /**
               * @default 0
               * @example 4
               */
              IT?: number;
              /**
               * @default 0
               * @example 7
               */
              JP?: number;
              /**
               * @default 0
               * @example 3
               */
              LT?: number;
              /**
               * @default 0
               * @example 3
               */
              LV?: number;
              /**
               * @default 0
               * @example 4
               */
              MX?: number;
              /**
               * @default 0
               * @example 4
               */
              MY?: number;
              /**
               * @default 0
               * @example 8
               */
              NL?: number;
              /**
               * @default 0
               * @example 6
               */
              NO?: number;
              /**
               * @default 0
               * @example 4
               */
              NZ?: number;
              /**
               * @default 0
               * @example 3
               */
              PE?: number;
              /**
               * @default 0
               * @example 4
               */
              PH?: number;
              /**
               * @default 0
               * @example 1
               */
              PL?: number;
              /**
               * @default 0
               * @example 4
               */
              PT?: number;
              /**
               * @default 0
               * @example 7
               */
              PY?: number;
              /**
               * @default 0
               * @example 2
               */
              RU?: number;
              /**
               * @default 0
               * @example 1
               */
              SA?: number;
              /**
               * @default 0
               * @example 8
               */
              SE?: number;
              /**
               * @default 0
               * @example 5
               */
              SG?: number;
              /**
               * @default 0
               * @example 3
               */
              SK?: number;
              /**
               * @default 0
               * @example 4
               */
              TH?: number;
              /**
               * @default 0
               * @example 6
               */
              TR?: number;
              /**
               * @default 0
               * @example 7
               */
              TW?: number;
              /**
               * @default 0
               * @example 4
               */
              US?: number;
              /**
               * @default 0
               * @example 4
               */
              VE?: number;
              /**
               * @default 0
               * @example 2
               */
              ZA?: number;
              /**
               * @default 0
               * @example 31
               */
              SI?: number;
              /**
               * @default 0
               * @example 13
               */
              CV?: number;
              /**
               * @default 0
               * @example 17
               */
              GH?: number;
              /**
               * @default 0
               * @example 15
               */
              MU?: number;
              /**
               * @default 0
               * @example 16
               */
              MZ?: number;
              /**
               * @default 0
               * @example 16
               */
              UG?: number;
              /**
               * @default 0
               * @example 28
               */
              IL?: number;
            };
            /**
             * @default 0
             * @example 2
             */
            display_priority?: number;
            /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
            logo_path?: string;
            /** @example "Apple TV" */
            provider_name?: string;
            /**
             * @default 0
             * @example 2
             */
            provider_id?: number;
          }[];
        },
        any
      >({
        path: `/3/watch/providers/movie`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the list of streaming providers we have for TV shows.
     *
     * @name WatchProviderTvList
     * @summary TV Providers
     * @request GET:/3/watch/providers/tv
     * @secure
     */
    watchProviderTvList: (
      query?: {
        /** @default "en-US" */
        language?: string;
        watch_region?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          results?: {
            display_priorities?: {
              /**
               * @default 0
               * @example 6
               */
              CA?: number;
              /**
               * @default 0
               * @example 1
               */
              AE?: number;
              /**
               * @default 0
               * @example 3
               */
              AR?: number;
              /**
               * @default 0
               * @example 4
               */
              AT?: number;
              /**
               * @default 0
               * @example 10
               */
              AU?: number;
              /**
               * @default 0
               * @example 6
               */
              BE?: number;
              /**
               * @default 0
               * @example 6
               */
              BO?: number;
              /**
               * @default 0
               * @example 8
               */
              BR?: number;
              /**
               * @default 0
               * @example 2
               */
              BG?: number;
              /**
               * @default 0
               * @example 4
               */
              CH?: number;
              /**
               * @default 0
               * @example 3
               */
              CL?: number;
              /**
               * @default 0
               * @example 4
               */
              CO?: number;
              /**
               * @default 0
               * @example 5
               */
              CR?: number;
              /**
               * @default 0
               * @example 3
               */
              CZ?: number;
              /**
               * @default 0
               * @example 4
               */
              DE?: number;
              /**
               * @default 0
               * @example 7
               */
              DK?: number;
              /**
               * @default 0
               * @example 7
               */
              EC?: number;
              /**
               * @default 0
               * @example 3
               */
              EE?: number;
              /**
               * @default 0
               * @example 2
               */
              EG?: number;
              /**
               * @default 0
               * @example 4
               */
              ES?: number;
              /**
               * @default 0
               * @example 10
               */
              FI?: number;
              /**
               * @default 0
               * @example 5
               */
              FR?: number;
              /**
               * @default 0
               * @example 5
               */
              GB?: number;
              /**
               * @default 0
               * @example 2
               */
              GR?: number;
              /**
               * @default 0
               * @example 7
               */
              GT?: number;
              /**
               * @default 0
               * @example 5
               */
              HK?: number;
              /**
               * @default 0
               * @example 7
               */
              HN?: number;
              /**
               * @default 0
               * @example 3
               */
              HU?: number;
              /**
               * @default 0
               * @example 4
               */
              ID?: number;
              /**
               * @default 0
               * @example 4
               */
              IE?: number;
              /**
               * @default 0
               * @example 8
               */
              IN?: number;
              /**
               * @default 0
               * @example 4
               */
              IT?: number;
              /**
               * @default 0
               * @example 7
               */
              JP?: number;
              /**
               * @default 0
               * @example 3
               */
              LT?: number;
              /**
               * @default 0
               * @example 3
               */
              LV?: number;
              /**
               * @default 0
               * @example 4
               */
              MX?: number;
              /**
               * @default 0
               * @example 4
               */
              MY?: number;
              /**
               * @default 0
               * @example 8
               */
              NL?: number;
              /**
               * @default 0
               * @example 6
               */
              NO?: number;
              /**
               * @default 0
               * @example 4
               */
              NZ?: number;
              /**
               * @default 0
               * @example 3
               */
              PE?: number;
              /**
               * @default 0
               * @example 4
               */
              PH?: number;
              /**
               * @default 0
               * @example 1
               */
              PL?: number;
              /**
               * @default 0
               * @example 4
               */
              PT?: number;
              /**
               * @default 0
               * @example 7
               */
              PY?: number;
              /**
               * @default 0
               * @example 2
               */
              RU?: number;
              /**
               * @default 0
               * @example 1
               */
              SA?: number;
              /**
               * @default 0
               * @example 8
               */
              SE?: number;
              /**
               * @default 0
               * @example 5
               */
              SG?: number;
              /**
               * @default 0
               * @example 3
               */
              SK?: number;
              /**
               * @default 0
               * @example 4
               */
              TH?: number;
              /**
               * @default 0
               * @example 6
               */
              TR?: number;
              /**
               * @default 0
               * @example 7
               */
              TW?: number;
              /**
               * @default 0
               * @example 4
               */
              US?: number;
              /**
               * @default 0
               * @example 4
               */
              VE?: number;
              /**
               * @default 0
               * @example 2
               */
              ZA?: number;
              /**
               * @default 0
               * @example 31
               */
              SI?: number;
              /**
               * @default 0
               * @example 13
               */
              CV?: number;
              /**
               * @default 0
               * @example 17
               */
              GH?: number;
              /**
               * @default 0
               * @example 15
               */
              MU?: number;
              /**
               * @default 0
               * @example 16
               */
              MZ?: number;
              /**
               * @default 0
               * @example 16
               */
              UG?: number;
              /**
               * @default 0
               * @example 28
               */
              IL?: number;
            };
            /**
             * @default 0
             * @example 2
             */
            display_priority?: number;
            /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
            logo_path?: string;
            /** @example "Apple TV" */
            provider_name?: string;
            /**
             * @default 0
             * @example 2
             */
            provider_id?: number;
          }[];
        },
        any
      >({
        path: `/3/watch/providers/tv`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @name KeywordDetails
     * @summary Details
     * @request GET:/3/keyword/{keyword_id}
     * @secure
     */
    keywordDetails: (keywordId: number, params: RequestParams = {}) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1701
           */
          id?: number;
          /** @example "hero" */
          name?: string;
        },
        any
      >({
        path: `/3/keyword/${keywordId}`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @name KeywordMovies
     * @summary Movies
     * @request GET:/3/keyword/{keyword_id}/movies
     * @secure
     */
    keywordMovies: (
      keywordId: string,
      query?: {
        /** @default false */
        include_adult?: boolean;
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1701
           */
          id?: number;
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/3CxUndGhUcZdt1Zggjdb2HkLLQX.jpg" */
            backdrop_path?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 640146
             */
            id?: number;
            /** @example "en" */
            original_language?: string;
            /** @example "Ant-Man and the Wasp: Quantumania" */
            original_title?: string;
            /** @example "Das Superhelden-Duo Scott Lang und Hope Van Dyne erkundet zusammen mit Hopes Eltern Hank Pym und Janet Van Dyne das Quantenreich, interagiert mit seltsamen neuen Kreaturen und begibt sich auf ein Abenteuer, das sie über die Grenzen dessen hinaustreiben wird, was sie für möglich gehalten haben." */
            overview?: string;
            /**
             * @default 0
             * @example 9200.005
             */
            popularity?: number;
            /** @example "/nA5otwVxAfpBP4PVgeuBk3qHcLY.jpg" */
            poster_path?: string;
            /** @example "2023-02-15" */
            release_date?: string;
            /** @example "Ant-Man and the Wasp: Quantumania" */
            title?: string;
            /**
             * @default true
             * @example false
             */
            video?: boolean;
            /**
             * @default 0
             * @example 6.5
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 2079
             */
            vote_count?: number;
          }[];
          /**
           * @default 0
           * @example 11
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 211
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/keyword/${keywordId}/movies`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @name ListDetails
     * @summary Details
     * @request GET:/3/list/{list_id}
     * @secure
     */
    listDetails: (
      listId: number,
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "travisbell" */
          created_by?: string;
          /** @example "The idea behind this list is to collect the live action comic book movies from within the Marvel franchise." */
          description?: string;
          /**
           * @default 0
           * @example 0
           */
          favorite_count?: number;
          /** @example "1" */
          id?: string;
          items?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/14QbnygCuTO0vl7CAFmPf1fgZfV.jpg" */
            backdrop_path?: string;
            genre_ids?: number[];
            /**
             * @default 0
             * @example 634649
             */
            id?: number;
            /** @example "movie" */
            media_type?: string;
            /** @example "en" */
            original_language?: string;
            /** @example "Spider-Man: No Way Home" */
            original_title?: string;
            /** @example "Peter Parker ist demaskiert und kann sein normales Leben nicht mehr von den hohen Einsätzen als Superheld trennen. Als er Doctor Strange um Hilfe bittet, wird die Lage noch gefährlicher und er muss entdecken, was es wirklich bedeutet, Spider-Man zu sein." */
            overview?: string;
            /**
             * @default 0
             * @example 398.217
             */
            popularity?: number;
            /** @example "/iNKf4D0AzOj9GLq8ZyG3WZaqibL.jpg" */
            poster_path?: string;
            /** @example "2021-12-15" */
            release_date?: string;
            /** @example "Spider-Man: No Way Home" */
            title?: string;
            /**
             * @default true
             * @example false
             */
            video?: boolean;
            /**
             * @default 0
             * @example 8
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 17267
             */
            vote_count?: number;
          }[];
          /**
           * @default 0
           * @example 59
           */
          item_count?: number;
          /** @example "en" */
          iso_639_1?: string;
          /** @example "The Marvel Universe" */
          name?: string;
          /** @example "/coJVIUEOToAEGViuhclM7pXC75R.jpg" */
          poster_path?: string;
        },
        any
      >({
        path: `/3/list/${listId}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Delete a list.
     *
     * @name ListDelete
     * @summary Delete
     * @request DELETE:/3/list/{list_id}
     * @secure
     */
    listDelete: (
      listId: number,
      query: {
        session_id: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 12
           */
          status_code?: number;
          /** @example "The item/record was updated successfully." */
          status_message?: string;
        },
        any
      >({
        path: `/3/list/${listId}`,
        method: 'DELETE',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Use this method to check if an item has already been added to the list.
     *
     * @name ListCheckItemStatus
     * @summary Check Item Status
     * @request GET:/3/list/{list_id}/item_status
     * @secure
     */
    listCheckItemStatus: (
      listId: number,
      query?: {
        /** @default "en-US" */
        language?: string;
        /** @format int32 */
        movie_id?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          id?: number;
          /**
           * @default true
           * @example true
           */
          item_present?: boolean;
        },
        any
      >({
        path: `/3/list/${listId}/item_status`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @name ListCreate
     * @summary Create
     * @request POST:/3/list
     * @secure
     */
    listCreate: (
      query: {
        session_id: string;
      },
      data: {
        /** @format json */
        RAW_BODY: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "The item/record was created successfully." */
          status_message?: string;
          /**
           * @default true
           * @example true
           */
          success?: boolean;
          /**
           * @default 0
           * @example 1
           */
          status_code?: number;
          /**
           * @default 0
           * @example 5861
           */
          list_id?: number;
        },
        any
      >({
        path: `/3/list`,
        method: 'POST',
        query: query,
        body: data,
        secure: true,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * @description Add a movie to a list.
     *
     * @name ListAddMovie
     * @summary Add Movie
     * @request POST:/3/list/{list_id}/add_item
     * @secure
     */
    listAddMovie: (
      listId: number,
      query: {
        session_id: string;
      },
      data: {
        /** @format json */
        RAW_BODY?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 12
           */
          status_code?: number;
          /** @example "The item/record was updated successfully." */
          status_message?: string;
        },
        any
      >({
        path: `/3/list/${listId}/add_item`,
        method: 'POST',
        query: query,
        body: data,
        secure: true,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * @description Remove a movie from a list.
     *
     * @name ListRemoveMovie
     * @summary Remove Movie
     * @request POST:/3/list/{list_id}/remove_item
     * @secure
     */
    listRemoveMovie: (
      listId: number,
      query: {
        session_id: string;
      },
      data: {
        /** @format json */
        RAW_BODY: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 13
           */
          status_code?: number;
          /** @example "The item/record was deleted successfully." */
          status_message?: string;
        },
        any
      >({
        path: `/3/list/${listId}/remove_item`,
        method: 'POST',
        query: query,
        body: data,
        secure: true,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * @description Clear all items from a list.
     *
     * @name ListClear
     * @summary Clear
     * @request POST:/3/list/{list_id}/clear
     * @secure
     */
    listClear: (
      listId: number,
      query: {
        session_id: string;
        /** @default false */
        confirm: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 12
           */
          status_code?: number;
          /** @example "The item/record was updated successfully." */
          status_message?: string;
        },
        any
      >({
        path: `/3/list/${listId}/clear`,
        method: 'POST',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @name NetworkDetails
     * @summary Details
     * @request GET:/3/network/{network_id}
     * @secure
     */
    networkDetails: (networkId: number, params: RequestParams = {}) =>
      this.request<
        {
          /** @example "New York City, New York" */
          headquarters?: string;
          /** @example "https://www.hbo.com" */
          homepage?: string;
          /**
           * @default 0
           * @example 49
           */
          id?: number;
          /** @example "/tuomPhY2UtuPTqqFnKMVHvSb724.png" */
          logo_path?: string;
          /** @example "HBO" */
          name?: string;
          /** @example "US" */
          origin_country?: string;
        },
        any
      >({
        path: `/3/network/${networkId}`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the alternative names of a network.
     *
     * @name DetailsCopy
     * @summary Alternative Names
     * @request GET:/3/network/{network_id}/alternative_names
     * @secure
     */
    detailsCopy: (networkId: number, params: RequestParams = {}) =>
      this.request<
        {
          /**
           * @default 0
           * @example 49
           */
          id?: number;
          results?: {
            /** @example "Home Box Office" */
            name?: string;
            /** @example "" */
            type?: string;
          }[];
        },
        any
      >({
        path: `/3/network/${networkId}/alternative_names`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the TV network logos by id.
     *
     * @name AlternativeNamesCopy
     * @summary Images
     * @request GET:/3/network/{network_id}/images
     * @secure
     */
    alternativeNamesCopy: (networkId: number, params: RequestParams = {}) =>
      this.request<
        {
          /**
           * @default 0
           * @example 49
           */
          id?: number;
          logos?: {
            /**
             * @default 0
             * @example 2.425287356321839
             */
            aspect_ratio?: number;
            /** @example "/tuomPhY2UtuPTqqFnKMVHvSb724.png" */
            file_path?: string;
            /**
             * @default 0
             * @example 174
             */
            height?: number;
            /** @example "5a7a67a40e0a26020a000091" */
            id?: string;
            /** @example ".svg" */
            file_type?: string;
            /**
             * @default 0
             * @example 5.318
             */
            vote_average?: number;
            /**
             * @default 0
             * @example 3
             */
            vote_count?: number;
            /**
             * @default 0
             * @example 422
             */
            width?: number;
          }[];
        },
        any
      >({
        path: `/3/network/${networkId}/images`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Retrieve the details of a movie or TV show review.
     *
     * @name ReviewDetails
     * @summary Details
     * @request GET:/3/review/{review_id}
     * @secure
     */
    reviewDetails: (reviewId: string, params: RequestParams = {}) =>
      this.request<
        {
          /** @example "640b2aeecaaca20079decdcc" */
          id?: string;
          /** @example "Ricardo Oliveira" */
          author?: string;
          author_details?: {
            /** @example "Ricardo Oliveira" */
            name?: string;
            /** @example "RSOliveira" */
            username?: string;
            /** @example "/23Cl7rhsknc7IIAcZZAGKzovjTu.jpg" */
            avatar_path?: string;
            /**
             * @default 0
             * @example 9
             */
            rating?: number;
          };
          /**
           * @example ""The Last of Us" is a post-apocalyptic TV series based on the popular video game of the same name. The story follows the journey of Joel, a smuggler, and Ellie, a teenage girl who may be the key to finding a cure for a deadly fungal infection that has ravaged the world.
           *
           * The series features outstanding performances from Pedro Pascal as Joel, Bella Ramsey as Ellie, and Anna Torv as Tess. The chemistry between the main characters is excellent, and the casting is spot-on.
           *
           * The show's writing is superb, and it captures the essence of the video game while adding a fresh perspective. The narrative is engaging, and the pacing is just right, with each episode leaving you on the edge of your seat, eager to see what happens next.
           *
           * The show's production value is top-notch, with stunning visuals and cinematography that capture the bleak and haunting atmosphere of a post-apocalyptic world. The use of practical effects and makeup is impressive and adds to the overall immersion of the story.
           *
           * Overall, "The Last of Us" is an outstanding TV series that does justice to the source material. It's a must-watch for fans of the video game and anyone who enjoys gripping and emotional storytelling. I would rate it a 9 out of 10.
           *
           *
           *
           * Written and Reviewed by RSOliveira"
           */
          content?: string;
          /** @example "2023-03-10T13:04:46.674Z" */
          created_at?: string;
          /** @example "en" */
          iso_639_1?: string;
          /**
           * @default 0
           * @example 100088
           */
          media_id?: number;
          /** @example "The Last of Us" */
          media_title?: string;
          /** @example "tv" */
          media_type?: string;
          /** @example "2023-03-10T13:04:46.734Z" */
          updated_at?: string;
          /** @example "https://www.themoviedb.org/review/640b2aeecaaca20079decdcc" */
          url?: string;
        },
        any
      >({
        path: `/3/review/${reviewId}`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Test your API Key to see if it's valid.
     *
     * @name AuthenticationValidateKey
     * @summary Validate Key
     * @request GET:/3/authentication
     * @secure
     */
    authenticationValidateKey: (params: RequestParams = {}) =>
      this.request<
        {
          /**
           * @default true
           * @example true
           */
          success?: boolean;
          /**
           * @default 0
           * @example 1
           */
          status_code?: number;
          /** @example "Success." */
          status_message?: string;
        },
        {
          /**
           * @default 0
           * @example 7
           */
          status_code?: number;
          /** @example "Invalid API key: You must be granted a valid key." */
          status_message?: string;
          /**
           * @default true
           * @example false
           */
          success?: boolean;
        }
      >({
        path: `/3/authentication`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the list of streaming providers we have for a TV season.
     *
     * @name TvSeasonWatchProviders
     * @summary Watch Providers
     * @request GET:/3/tv/{series_id}/season/{season_number}/watch/providers
     * @secure
     */
    tvSeasonWatchProviders: (
      seriesId: number,
      seasonNumber: number,
      query?: {
        /** @default "en-US" */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 3624
           */
          id?: number;
          results?: {
            AE?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=AE" */
              link?: string;
              flatrate?: {
                /** @example "/xEPXbwbfABzPrUTWbgtDFH1NOa.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 629
                 */
                provider_id?: number;
                /** @example "OSN" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 11
                 */
                display_priority?: number;
              }[];
            };
            AR?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=AR" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 5
                 */
                display_priority?: number;
              }[];
            };
            AT?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=AT" */
              link?: string;
              flatrate?: {
                /** @example "/y0kyIFElN5sJAsmW8Txj69wzrD2.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 321
                 */
                provider_id?: number;
                /** @example "Sky X" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 23
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/5NyLm42TmCqCMOZFvH4fcoSNKEW.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 10
                 */
                provider_id?: number;
                /** @example "Amazon Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
            };
            AU?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=AU" */
              link?: string;
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 10
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/d3ixI1no0EpTj2i7u0Sd2DBXVlG.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 385
                 */
                provider_id?: number;
                /** @example "BINGE" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
            };
            BA?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=BA" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 28
                 */
                display_priority?: number;
              }[];
            };
            BB?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=BB" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 28
                 */
                display_priority?: number;
              }[];
            };
            BE?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=BE" */
              link?: string;
              flatrate?: {
                /** @example "/pq8p1umEnJjdFAP1nFvNArTR61X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 311
                 */
                provider_id?: number;
                /** @example "Be TV Go" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
            };
            BG?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=BG" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 15
                 */
                display_priority?: number;
              }[];
            };
            BO?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=BO" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
            };
            BR?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=BR" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 7
                 */
                display_priority?: number;
              }[];
            };
            BS?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=BS" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 28
                 */
                display_priority?: number;
              }[];
            };
            CA?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=CA" */
              link?: string;
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 6
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/gJ3yVMWouaVj6iHd59TISJ1TlM5.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 230
                 */
                provider_id?: number;
                /** @example "Crave" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
            };
            CH?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=CH" */
              link?: string;
              buy?: {
                /** @example "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                provider_id?: number;
                /** @example "Google Play Movies" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 5
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/sHP8XLo4Ac4WMbziRyAdRQdb76q.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 210
                 */
                provider_id?: number;
                /** @example "Sky" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 7
                 */
                display_priority?: number;
              }[];
            };
            CI?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=CI" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 25
                 */
                display_priority?: number;
              }[];
            };
            CL?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=CL" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 7
                 */
                display_priority?: number;
              }[];
            };
            CO?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=CO" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 6
                 */
                display_priority?: number;
              }[];
            };
            CR?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=CR" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
            };
            CZ?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=CZ" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 22
                 */
                display_priority?: number;
              }[];
            };
            DE?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=DE" */
              link?: string;
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/MiVcYLkztM6qqLeVSYWHFCUcXx.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 30
                 */
                provider_id?: number;
                /** @example "WOW" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 5
                 */
                display_priority?: number;
              }[];
            };
            DK?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=DK" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
            };
            DO?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=DO" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 28
                 */
                display_priority?: number;
              }[];
            };
            DZ?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=DZ" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 27
                 */
                display_priority?: number;
              }[];
            };
            EC?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=EC" */
              link?: string;
              flatrate?: {
                /** @example "/cDzkhgvozSr4GW2aRdV22uDuFpw.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 339
                 */
                provider_id?: number;
                /** @example "Movistar Play" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
            };
            EG?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=EG" */
              link?: string;
              flatrate?: {
                /** @example "/xEPXbwbfABzPrUTWbgtDFH1NOa.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 629
                 */
                provider_id?: number;
                /** @example "OSN" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 28
                 */
                display_priority?: number;
              }[];
            };
            ES?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=ES" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 9
                 */
                display_priority?: number;
              }[];
            };
            FI?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=FI" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/shq88b09gTBYC4hA7K7MUL8Q4zP.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 68
                 */
                provider_id?: number;
                /** @example "Microsoft Store" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 12
                 */
                display_priority?: number;
              }[];
            };
            FR?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=FR" */
              link?: string;
              flatrate?: {
                /** @example "/loOaayvNiLnD0zKl70TO2L5vlAL.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 1870
                 */
                provider_id?: number;
                /** @example "Pass Warner Amazon Channel" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 95
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 5
                 */
                display_priority?: number;
              }[];
            };
            GB?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=GB" */
              link?: string;
              flatrate?: {
                /** @example "/fBHHXKC34ffxAsQvDe0ZJbvmTEQ.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 29
                 */
                provider_id?: number;
                /** @example "Sky Go" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 9
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/5NyLm42TmCqCMOZFvH4fcoSNKEW.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 10
                 */
                provider_id?: number;
                /** @example "Amazon Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
            };
            GF?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=GF" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 30
                 */
                display_priority?: number;
              }[];
            };
            GH?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=GH" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 11
                 */
                display_priority?: number;
              }[];
            };
            GQ?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=GQ" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 11
                 */
                display_priority?: number;
              }[];
            };
            GT?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=GT" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
            };
            HK?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=HK" */
              link?: string;
              flatrate?: {
                /** @example "/bxdNcDbk1ohVeOMmM3eusAAiTLw.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 425
                 */
                provider_id?: number;
                /** @example "HBO Go" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 40
                 */
                display_priority?: number;
              }[];
            };
            HN?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=HN" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
            };
            HR?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=HR" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 34
                 */
                display_priority?: number;
              }[];
            };
            HU?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=HU" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 22
                 */
                display_priority?: number;
              }[];
            };
            ID?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=ID" */
              link?: string;
              flatrate?: {
                /** @example "/bxdNcDbk1ohVeOMmM3eusAAiTLw.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 425
                 */
                provider_id?: number;
                /** @example "HBO Go" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 14
                 */
                display_priority?: number;
              }[];
            };
            IE?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=IE" */
              link?: string;
              buy?: {
                /** @example "/2pCbao1J9s0DMak2KKnEzmzHni8.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 130
                 */
                provider_id?: number;
                /** @example "Sky Store" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 9
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/fBHHXKC34ffxAsQvDe0ZJbvmTEQ.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 29
                 */
                provider_id?: number;
                /** @example "Sky Go" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 8
                 */
                display_priority?: number;
              }[];
            };
            IL?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=IL" */
              link?: string;
              flatrate?: {
                /** @example "/xEPXbwbfABzPrUTWbgtDFH1NOa.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 629
                 */
                provider_id?: number;
                /** @example "OSN" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 13
                 */
                display_priority?: number;
              }[];
            };
            IQ?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=IQ" */
              link?: string;
              flatrate?: {
                /** @example "/xEPXbwbfABzPrUTWbgtDFH1NOa.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 629
                 */
                provider_id?: number;
                /** @example "OSN" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 12
                 */
                display_priority?: number;
              }[];
            };
            IT?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=IT" */
              link?: string;
              flatrate?: {
                /** @example "/fBHHXKC34ffxAsQvDe0ZJbvmTEQ.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 29
                 */
                provider_id?: number;
                /** @example "Sky Go" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 8
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/cksgBjTHV3rzAVaO2zUyS1mH4Ke.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 40
                 */
                provider_id?: number;
                /** @example "Chili" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 11
                 */
                display_priority?: number;
              }[];
            };
            JM?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=JM" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 27
                 */
                display_priority?: number;
              }[];
            };
            JP?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=JP" */
              link?: string;
              buy?: {
                /** @example "/5NyLm42TmCqCMOZFvH4fcoSNKEW.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 10
                 */
                provider_id?: number;
                /** @example "Amazon Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 6
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/npg1OiBidQSndMsBZwgEPOYU6Jq.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 84
                 */
                provider_id?: number;
                /** @example "U-NEXT" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
              rent?: {
                /** @example "/5NyLm42TmCqCMOZFvH4fcoSNKEW.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 10
                 */
                provider_id?: number;
                /** @example "Amazon Video" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 6
                 */
                display_priority?: number;
              }[];
            };
            KE?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=KE" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 10
                 */
                display_priority?: number;
              }[];
            };
            KR?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=KR" */
              link?: string;
              flatrate?: {
                /** @example "/2ioan5BX5L9tz4fIGU93blTeFhv.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 356
                 */
                provider_id?: number;
                /** @example "wavve" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
            };
            LB?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=LB" */
              link?: string;
              flatrate?: {
                /** @example "/xEPXbwbfABzPrUTWbgtDFH1NOa.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 629
                 */
                provider_id?: number;
                /** @example "OSN" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 13
                 */
                display_priority?: number;
              }[];
            };
            LY?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=LY" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 27
                 */
                display_priority?: number;
              }[];
            };
            MD?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=MD" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 26
                 */
                display_priority?: number;
              }[];
            };
            MK?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=MK" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 29
                 */
                display_priority?: number;
              }[];
            };
            MU?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=MU" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 8
                 */
                display_priority?: number;
              }[];
            };
            MX?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=MX" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 11
                 */
                display_priority?: number;
              }[];
            };
            MY?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=MY" */
              link?: string;
              flatrate?: {
                /** @example "/bxdNcDbk1ohVeOMmM3eusAAiTLw.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 425
                 */
                provider_id?: number;
                /** @example "HBO Go" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 14
                 */
                display_priority?: number;
              }[];
            };
            MZ?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=MZ" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 10
                 */
                display_priority?: number;
              }[];
            };
            NE?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=NE" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 25
                 */
                display_priority?: number;
              }[];
            };
            NG?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=NG" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 27
                 */
                display_priority?: number;
              }[];
            };
            NL?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=NL" */
              link?: string;
              buy?: {
                /** @example "/shq88b09gTBYC4hA7K7MUL8Q4zP.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 68
                 */
                provider_id?: number;
                /** @example "Microsoft Store" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 12
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 47
                 */
                display_priority?: number;
              }[];
            };
            NO?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=NO" */
              link?: string;
              buy?: {
                /** @example "/shq88b09gTBYC4hA7K7MUL8Q4zP.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 68
                 */
                provider_id?: number;
                /** @example "Microsoft Store" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 9
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 5
                 */
                display_priority?: number;
              }[];
            };
            NZ?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=NZ" */
              link?: string;
              flatrate?: {
                /** @example "/od4YNSSLgOP3p8EtQTnEYfrPa77.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 273
                 */
                provider_id?: number;
                /** @example "Neon TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                display_priority?: number;
              }[];
            };
            PA?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=PA" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 27
                 */
                display_priority?: number;
              }[];
            };
            PE?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=PE" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 8
                 */
                display_priority?: number;
              }[];
            };
            PH?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=PH" */
              link?: string;
              flatrate?: {
                /** @example "/bxdNcDbk1ohVeOMmM3eusAAiTLw.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 425
                 */
                provider_id?: number;
                /** @example "HBO Go" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 12
                 */
                display_priority?: number;
              }[];
            };
            PL?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=PL" */
              link?: string;
              rent?: {
                /** @example "/bZNXgd8fwVTD68aAGlElkpAtu7b.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 549
                 */
                provider_id?: number;
                /** @example "IPLA" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 17
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/l5Wxbsgral716BOtZsGyPVNn8GC.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 250
                 */
                provider_id?: number;
                /** @example "Horizon" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 7
                 */
                display_priority?: number;
              }[];
            };
            PS?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=PS" */
              link?: string;
              flatrate?: {
                /** @example "/xEPXbwbfABzPrUTWbgtDFH1NOa.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 629
                 */
                provider_id?: number;
                /** @example "OSN" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 12
                 */
                display_priority?: number;
              }[];
            };
            PT?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=PT" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 28
                 */
                display_priority?: number;
              }[];
            };
            PY?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=PY" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 3
                 */
                display_priority?: number;
              }[];
            };
            RO?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=RO" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 17
                 */
                display_priority?: number;
              }[];
            };
            RS?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=RS" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 32
                 */
                display_priority?: number;
              }[];
            };
            RU?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=RU" */
              link?: string;
              flatrate?: {
                /** @example "/w1T8s7FqakcfucR8cgOvbe6UeXN.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 115
                 */
                provider_id?: number;
                /** @example "Okko" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 0
                 */
                display_priority?: number;
              }[];
            };
            SA?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=SA" */
              link?: string;
              flatrate?: {
                /** @example "/xEPXbwbfABzPrUTWbgtDFH1NOa.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 629
                 */
                provider_id?: number;
                /** @example "OSN" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 25
                 */
                display_priority?: number;
              }[];
            };
            SC?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=SC" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 9
                 */
                display_priority?: number;
              }[];
            };
            SE?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=SE" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
              buy?: {
                /** @example "/shq88b09gTBYC4hA7K7MUL8Q4zP.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 68
                 */
                provider_id?: number;
                /** @example "Microsoft Store" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 7
                 */
                display_priority?: number;
              }[];
            };
            SG?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=SG" */
              link?: string;
              flatrate?: {
                /** @example "/bxdNcDbk1ohVeOMmM3eusAAiTLw.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 425
                 */
                provider_id?: number;
                /** @example "HBO Go" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 13
                 */
                display_priority?: number;
              }[];
            };
            SI?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=SI" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 29
                 */
                display_priority?: number;
              }[];
            };
            SK?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=SK" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 37
                 */
                display_priority?: number;
              }[];
            };
            SN?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=SN" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 11
                 */
                display_priority?: number;
              }[];
            };
            SV?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=SV" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 25
                 */
                display_priority?: number;
              }[];
            };
            TH?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=TH" */
              link?: string;
              flatrate?: {
                /** @example "/bxdNcDbk1ohVeOMmM3eusAAiTLw.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 425
                 */
                provider_id?: number;
                /** @example "HBO Go" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 12
                 */
                display_priority?: number;
              }[];
            };
            TR?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=TR" */
              link?: string;
              flatrate?: {
                /** @example "/z3XAGCCbDD3KTZFvc96Ytr3XR56.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 341
                 */
                provider_id?: number;
                /** @example "blutv" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                display_priority?: number;
              }[];
            };
            TT?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=TT" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 11
                 */
                display_priority?: number;
              }[];
            };
            TW?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=TW" */
              link?: string;
              flatrate?: {
                /** @example "/bxdNcDbk1ohVeOMmM3eusAAiTLw.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 425
                 */
                provider_id?: number;
                /** @example "HBO Go" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 40
                 */
                display_priority?: number;
              }[];
            };
            TZ?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=TZ" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 9
                 */
                display_priority?: number;
              }[];
            };
            UG?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=UG" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 10
                 */
                display_priority?: number;
              }[];
            };
            US?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=US" */
              link?: string;
              buy?: {
                /** @example "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 2
                 */
                provider_id?: number;
                /** @example "Apple TV" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
              free?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 7
                 */
                display_priority?: number;
              }[];
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 7
                 */
                display_priority?: number;
              }[];
            };
            UY?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=UY" */
              link?: string;
              flatrate?: {
                /** @example "/kV8XFGI5OLJKl72dI8DtnKplfFr.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 467
                 */
                provider_id?: number;
                /** @example "DIRECTV GO" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 9
                 */
                display_priority?: number;
              }[];
            };
            VE?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=VE" */
              link?: string;
              flatrate?: {
                /** @example "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 384
                 */
                provider_id?: number;
                /** @example "HBO Max" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 8
                 */
                display_priority?: number;
              }[];
            };
            ZA?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=ZA" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 4
                 */
                display_priority?: number;
              }[];
            };
            ZM?: {
              /** @example "https://www.themoviedb.org/tv/1399-game-of-thrones/season/1/watch?locale=ZM" */
              link?: string;
              flatrate?: {
                /** @example "/okiQZMXnqwv0aD3QDYmu5DBNLce.jpg" */
                logo_path?: string;
                /**
                 * @default 0
                 * @example 55
                 */
                provider_id?: number;
                /** @example "ShowMax" */
                provider_name?: string;
                /**
                 * @default 0
                 * @example 10
                 */
                display_priority?: number;
              }[];
            };
          };
        },
        any
      >({
        path: `/3/tv/${seriesId}/season/${seasonNumber}/watch/providers`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the list of countries (ISO 3166-1 tags) used throughout TMDB.
     *
     * @name ConfigurationCountries
     * @summary Countries
     * @request GET:/3/configuration/countries
     * @secure
     */
    configurationCountries: (
      query?: {
        /** @default "en-US" */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "AD" */
          iso_3166_1?: string;
          /** @example "Andorra" */
          english_name?: string;
          /** @example "Andorra" */
          native_name?: string;
        }[],
        any
      >({
        path: `/3/configuration/countries`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the list of the jobs and departments we use on TMDB.
     *
     * @name ConfigurationJobs
     * @summary Jobs
     * @request GET:/3/configuration/jobs
     * @secure
     */
    configurationJobs: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example "Production" */
          department?: string;
          jobs?: string[];
        }[],
        any
      >({
        path: `/3/configuration/jobs`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the list of languages (ISO 639-1 tags) used throughout TMDB.
     *
     * @name ConfigurationLanguages
     * @summary Languages
     * @request GET:/3/configuration/languages
     * @secure
     */
    configurationLanguages: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example "bi" */
          iso_639_1?: string;
          /** @example "Bislama" */
          english_name?: string;
          /** @example "" */
          name?: string;
        }[],
        any
      >({
        path: `/3/configuration/languages`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get a list of the officially supported translations on TMDB.
     *
     * @name ConfigurationPrimaryTranslations
     * @summary Primary Translations
     * @request GET:/3/configuration/primary_translations
     * @secure
     */
    configurationPrimaryTranslations: (params: RequestParams = {}) =>
      this.request<string[], any>({
        path: `/3/configuration/primary_translations`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the list of timezones used throughout TMDB.
     *
     * @name ConfigurationTimezones
     * @summary Timezones
     * @request GET:/3/configuration/timezones
     * @secure
     */
    configurationTimezones: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example "AD" */
          iso_3166_1?: string;
          zones?: string[];
        }[],
        any
      >({
        path: `/3/configuration/timezones`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description This method allows an application to validate a request token by entering a username and password.
     *
     * @name AuthenticationCreateSessionFromLogin
     * @summary Create Session (with login)
     * @request POST:/3/authentication/token/validate_with_login
     * @secure
     */
    authenticationCreateSessionFromLogin: (
      data: {
        /** @format json */
        RAW_BODY: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default true
           * @example true
           */
          success?: boolean;
          /** @example "2018-07-24 04:10:26 UTC" */
          expires_at?: string;
          /** @example "1531f1a558c8357ce8990cf887ff196e8f5402ec" */
          request_token?: string;
        },
        any
      >({
        path: `/3/authentication/token/validate_with_login`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the newest created person. This is a live response and will continuously change.
     *
     * @name PersonLatestId
     * @summary Latest
     * @request GET:/3/person/latest
     * @secure
     */
    personLatestId: (params: RequestParams = {}) =>
      this.request<
        {
          /**
           * @default true
           * @example false
           */
          adult?: boolean;
          also_known_as?: any[];
          /** @example "" */
          biography?: string;
          birthday?: any;
          deathday?: any;
          /**
           * @default 0
           * @example 0
           */
          gender?: number;
          homepage?: any;
          /**
           * @default 0
           * @example 4064343
           */
          id?: number;
          imdb_id?: any;
          known_for_department?: any;
          /** @example "Ángel Cruz" */
          name?: string;
          place_of_birth?: any;
          /**
           * @default 0
           * @example 0
           */
          popularity?: number;
          profile_path?: any;
        },
        any
      >({
        path: `/3/person/latest`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the recent changes for a TV episode.
     *
     * @name TvEpisodeChangesById
     * @summary Changes
     * @request GET:/3/tv/episode/{episode_id}/changes
     * @secure
     */
    tvEpisodeChangesById: (episodeId: number, params: RequestParams = {}) =>
      this.request<
        {
          changes?: {
            /** @example "production_code" */
            key?: string;
            items?: {
              /** @example "54bd9ed7c3a3686c6b00da66" */
              id?: string;
              /** @example "added" */
              action?: string;
              /** @example "2015-01-20 00:18:31 UTC" */
              time?: string;
              /** @example "101" */
              value?: string;
            }[];
          }[];
        },
        any
      >({
        path: `/3/tv/episode/${episodeId}/changes`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the details of a TV episode group.
     *
     * @name TvEpisodeGroupDetails
     * @summary Details
     * @request GET:/3/tv/episode_group/{tv_episode_group_id}
     * @secure
     */
    tvEpisodeGroupDetails: (
      tvEpisodeGroupId: string,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "Comedians in Cars organized in Netflix's collections." */
          description?: string;
          /**
           * @default 0
           * @example 83
           */
          episode_count?: number;
          /**
           * @default 0
           * @example 6
           */
          group_count?: number;
          groups?: {
            /** @example "5acf93efc3a368739a0000a9" */
            id?: string;
            /** @example "First Cup" */
            name?: string;
            /**
             * @default 0
             * @example 1
             */
            order?: number;
            episodes?: {
              /** @example "2015-06-17" */
              air_date?: string;
              /**
               * @default 0
               * @example 3
               */
              episode_number?: number;
              /**
               * @default 0
               * @example 1078262
               */
              id?: number;
              /** @example "Jim Carrey: We Love Breathing What You're Burning, Baby" */
              name?: string;
              /** @example "Jerry’s full of testosterone as he steps into a ‘76 Lamborghini Countach with Jim Carrey, who’s between a three-week cleanse and a five-day silent retreat. After coffee, it’s off to Carrey’s studio to study a portrait of a gorilla with a machine gun. Wow." */
              overview?: string;
              /** @example "" */
              production_code?: string;
              runtime?: any;
              /**
               * @default 0
               * @example 6
               */
              season_number?: number;
              /**
               * @default 0
               * @example 59717
               */
              show_id?: number;
              /** @example "/aOyE420zuFq9zWtEWjIccAiTrzU.jpg" */
              still_path?: string;
              /**
               * @default 0
               * @example 7.4
               */
              vote_average?: number;
              /**
               * @default 0
               * @example 5
               */
              vote_count?: number;
              /**
               * @default 0
               * @example 0
               */
              order?: number;
            }[];
            /**
             * @default true
             * @example true
             */
            locked?: boolean;
          }[];
          /** @example "5acf93e60e0a26346d0000ce" */
          id?: string;
          /** @example "Netflix Collections" */
          name?: string;
          network?: {
            /**
             * @default 0
             * @example 213
             */
            id?: number;
            /** @example "/wwemzKWzjKYJFfCeiB57q3r4Bcm.png" */
            logo_path?: string;
            /** @example "Netflix" */
            name?: string;
            /** @example "" */
            origin_country?: string;
          };
          /**
           * @default 0
           * @example 4
           */
          type?: number;
        },
        any
      >({
        path: `/3/tv/episode_group/${tvEpisodeGroupId}`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Search for companies by their original and alternative names.
     *
     * @name SearchCompany
     * @summary Company
     * @request GET:/3/search/company
     * @secure
     */
    searchCompany: (
      query: {
        query: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default 0
             * @example 3268
             */
            id?: number;
            /** @example "/tuomPhY2UtuPTqqFnKMVHvSb724.png" */
            logo_path?: string;
            /** @example "HBO" */
            name?: string;
            /** @example "US" */
            origin_country?: string;
          }[];
          /**
           * @default 0
           * @example 2
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 22
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/search/company`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Search for collections by their original, translated and alternative names.
     *
     * @name SearchCollection
     * @summary Collection
     * @request GET:/3/search/collection
     * @secure
     */
    searchCollection: (
      query: {
        query: string;
        /** @default false */
        include_adult?: boolean;
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
        region?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default true
             * @example false
             */
            adult?: boolean;
            /** @example "/zuW6fOiusv4X9nnW3paHGfXcSll.jpg" */
            backdrop_path?: string;
            /**
             * @default 0
             * @example 86311
             */
            id?: number;
            /** @example "The Avengers Collection" */
            name?: string;
            /** @example "en" */
            original_language?: string;
            /** @example "The Avengers Collection" */
            original_name?: string;
            /** @example "A superhero film series produced by Marvel Studios based on the Marvel Comics superhero team of the same name, and part of the Marvel Cinematic Universe (MCU).  The series features an ensemble cast from the Marvel Cinematic Universe series films, as they join forces for the peacekeeping organization S.H.I.E.L.D. led by Nick Fury." */
            overview?: string;
            /** @example "/yFSIUVTCvgYrpalUktulvk3Gi5Y.jpg" */
            poster_path?: string;
          }[];
          /**
           * @default 0
           * @example 1
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 1
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/search/collection`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Search for keywords by their name.
     *
     * @name SearchKeyword
     * @summary Keyword
     * @request GET:/3/search/keyword
     * @secure
     */
    searchKeyword: (
      query: {
        query: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /**
             * @default 0
             * @example 262419
             */
            id?: number;
            /** @example "lost" */
            name?: string;
          }[];
          /**
           * @default 0
           * @example 5
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 84
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/search/keyword`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get the lists that a TV series has been added to.
     *
     * @name ListsCopy
     * @summary Lists
     * @request GET:/3/tv/{series_id}/lists
     * @secure
     */
    listsCopy: (
      seriesId: number,
      query?: {
        /** @default "en-US" */
        language?: string;
        /**
         * @format int32
         * @default 1
         */
        page?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * @default 0
           * @example 1399
           */
          id?: number;
          /**
           * @default 0
           * @example 1
           */
          page?: number;
          results?: {
            /** @example "" */
            description?: string;
            /**
             * @default 0
             * @example 0
             */
            favorite_count?: number;
            /**
             * @default 0
             * @example 8257231
             */
            id?: number;
            /**
             * @default 0
             * @example 182
             */
            item_count?: number;
            /** @example "en" */
            iso_639_1?: string;
            /** @example "US" */
            iso_3166_1?: string;
            /** @example "Done" */
            name?: string;
            poster_path?: any;
          }[];
          /**
           * @default 0
           * @example 96
           */
          total_pages?: number;
          /**
           * @default 0
           * @example 1906
           */
          total_results?: number;
        },
        any
      >({
        path: `/3/tv/${seriesId}/lists`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),
  };
}
