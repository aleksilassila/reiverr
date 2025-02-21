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

export interface MediaSource {
	id: string;
	pluginId: string;
	name: string;
	userId: string;
	user: string;
	/** @default false */
	enabled?: boolean;
	/** @default false */
	adminControlled?: boolean;
	pluginSettings?: Record<string, any>;
	priority: number;
}

export interface PlayState {
	id: string;
	tmdbId: number;
	mediaType: 'Movie' | 'Series' | 'Episode';
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

export interface PlayStateDto {
	id: string;
	tmdbId: number;
	mediaType: 'Movie' | 'Series' | 'Episode';
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
	mediaType: 'Movie' | 'Series' | 'Episode';
	userId: string;
	user?: string;
	playStates?: PlayStateDto[];
	updatedAt: string;
	createdAt: string;
}

export interface UserDto {
	id: string;
	name: string;
	isAdmin: boolean;
	onboardingDone?: boolean;
	settings: Settings;
	mediaSources?: MediaSource[];
	playStates?: PlayState[];
	libraryItems?: LibraryItem[];
	profilePicture: string;
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

export interface ValidationResponseDto {
	/** @example true */
	isValid: boolean;
	/** @example {"setting1":"error message","setting2":"another error message"} */
	errors: Record<string, string>;
	/** @example {"setting1":"new value","setting2":"another new value"} */
	settings: Record<string, any>;
}

export interface SourceProviderCapabilitiesDto {
	moviePlayback: boolean;
	episodePlayback: boolean;
	movieIndexing: boolean;
	episodeIndexing: boolean;
}

export interface PaginatedResponseDto {
	total: number;
	page: number;
	itemsPerPage: number;
}

export interface IndexItemDto {
	id: string;
}

export interface VideoStreamPropertyDto {
	label: string;
	value: string | number;
	formatted?: string;
}

export interface StreamCandidateDto {
	key: string;
	title: string;
	properties: VideoStreamPropertyDto[];
}

export interface StreamCandidatesDto {
	candidates: StreamCandidateDto[];
}

export interface DirectPlayProfileDto {
	/** Gets or sets the container. */
	Container?: string | null;
	/** Gets or sets the audio codec. */
	AudioCodec?: string | null;
	/** Gets or sets the video codec. */
	VideoCodec?: string | null;
	/** Gets or sets the Dlna profile type. */
	Type?: 'Audio' | 'Video' | 'Photo' | 'Subtitle' | 'Lyric';
}

export interface ProfileConditionDto {
	/** Gets or sets the condition. */
	Condition?: 'Equals' | 'NotEquals' | 'LessThanEqual' | 'GreaterThanEqual' | 'EqualsAny' | null;
	/** Gets or sets the property. */
	Property?:
		| 'AudioChannels'
		| 'AudioBitrate'
		| 'AudioProfile'
		| 'Width'
		| 'Height'
		| 'Has64BitOffsets'
		| 'PacketLength'
		| 'VideoBitDepth'
		| 'VideoBitrate'
		| 'VideoFramerate'
		| 'VideoLevel'
		| 'VideoProfile'
		| 'VideoTimestamp'
		| 'IsAnamorphic'
		| 'RefFrames'
		| 'NumAudioStreams'
		| 'NumVideoStreams'
		| 'IsSecondaryAudio'
		| 'VideoCodecTag'
		| 'IsAvc'
		| 'IsInterlaced'
		| 'AudioSampleRate'
		| 'AudioBitDepth'
		| 'VideoRangeType'
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
	Type?: 'Audio' | 'Video' | 'Photo' | 'Subtitle' | 'Lyric';
	/** Gets or sets the video codec. */
	VideoCodec?: string | null;
	/** Gets or sets the audio codec. */
	AudioCodec?: string | null;
	/** Media streaming protocol. */
	Protocol?: 'http' | 'hls';
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
	TranscodeSeekInfo?: 'Auto' | 'Bytes';
	/**
	 * Indicates if timestamps should be copied.
	 * @default false
	 */
	CopyTimestamps?: boolean;
	/**
	 * Gets or sets the encoding context.
	 * @default "Streaming"
	 */
	Context?: 'Streaming' | 'Static';
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
	Type?: 'Audio' | 'Video' | 'Photo' | 'Subtitle' | 'Lyric' | null;
	/** Gets or sets the profile conditions. */
	Conditions?: ProfileConditionDto[] | null;
	/** Gets or sets the container(s) which this container must meet. */
	Container?: string | null;
	/** Gets or sets the sub container(s) which this container must meet. */
	SubContainer?: string | null;
}

export interface CodecProfileDto {
	/** Gets or sets the MediaBrowser.Model.Dlna.CodecType which this container must meet. */
	Type?: 'Video' | 'VideoAudio' | 'Audio' | null;
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
	Method?: 'Encode' | 'Embed' | 'External' | 'Hls' | 'Drop' | null;
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
	kind: 'subtitles' | 'captions' | 'descriptions';
	label: string;
}

export interface StreamDto {
	key: string;
	title: string;
	properties: VideoStreamPropertyDto[];
	src: string;
	directPlay: boolean;
	/** Duration in seconds */
	duration: number;
	/** Play progress as a number between 0 and 1 */
	progress: number;
	audioStreams: AudioStreamDto[];
	audioStreamIndex: number;
	qualities: QualityDto[];
	qualityIndex: number;
	subtitles: SubtitlesDto[];
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
}

export interface UpdateMediaSourceResponse {
	mediaSource: MediaSourceDto;
	validationResponse?: ValidationResponseDto;
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

export interface NextEpisodeToAir {
	air_date?: string;
}

export interface Season {
	air_date?: string;
	episode_count?: number;
	id?: number;
	name?: string;
	overview?: string;
	poster_path?: string;
	season_number?: number;
	vote_average?: number;
}

export interface LibraryItemDto2 {
	tmdbId: string;
	mediaType: 'Movie' | 'Series' | 'Episode';
	playStates?: PlayStateDto[];
	createdAt: string;
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
	seasons?: Season[];
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
	ResponseType
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

export type RequestParams = Omit<FullRequestParams, 'body' | 'method' | 'query' | 'path'>;

export interface ApiConfig<SecurityDataType = unknown>
	extends Omit<AxiosRequestConfig, 'data' | 'cancelToken'> {
	securityWorker?: (
		securityData: SecurityDataType | null
	) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
	secure?: boolean;
	format?: ResponseType;
}

export enum ContentType {
	Json = 'application/json',
	FormData = 'multipart/form-data',
	UrlEncoded = 'application/x-www-form-urlencoded',
	Text = 'text/plain'
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
		this.instance = axios.create({ ...axiosConfig, baseURL: axiosConfig.baseURL || '' });
		this.secure = secure;
		this.format = format;
		this.securityWorker = securityWorker;
	}

	public setSecurityData = (data: SecurityDataType | null) => {
		this.securityData = data;
	};

	protected mergeRequestParams(
		params1: AxiosRequestConfig,
		params2?: AxiosRequestConfig
	): AxiosRequestConfig {
		const method = params1.method || (params2 && params2.method);

		return {
			...this.instance.defaults,
			...params1,
			...(params2 || {}),
			headers: {
				...((method &&
					this.instance.defaults.headers[method.toLowerCase() as keyof HeadersDefaults]) ||
					{}),
				...(params1.headers || {}),
				...((params2 && params2.headers) || {})
			}
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
			const propertyContent: any[] = property instanceof Array ? property : [property];

			for (const formItem of propertyContent) {
				const isFileType = formItem instanceof Blob || formItem instanceof File;
				formData.append(key, isFileType ? formItem : this.stringifyFormItem(formItem));
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

		if (type === ContentType.FormData && body && body !== null && typeof body === 'object') {
			body = this.createFormData(body as Record<string, unknown>);
		}

		if (type === ContentType.Text && body && body !== null && typeof body !== 'string') {
			body = JSON.stringify(body);
		}

		return this.instance.request({
			...requestParams,
			headers: {
				...(requestParams.headers || {}),
				...(type ? { 'Content-Type': type } : {})
			},
			params: query,
			responseType: responseFormat,
			data: body,
			url: path
		});
	};
}

/**
 * @title No title
 * @version 1.0.0
 * @contact
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
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
				method: 'GET',
				format: 'json',
				...params
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
				method: 'POST',
				body: data,
				type: ContentType.Json,
				format: 'json',
				...params
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
				method: 'GET',
				format: 'json',
				...params
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
				method: 'PUT',
				body: data,
				type: ContentType.Json,
				format: 'json',
				...params
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
				method: 'DELETE',
				...params
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
			params: RequestParams = {}
		) =>
			this.request<UpdateMediaSourceResponse, any>({
				path: `/api/users/${userId}/sources`,
				method: 'PUT',
				body: data,
				type: ContentType.Json,
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags users
		 * @name DeleteSource
		 * @request DELETE:/api/users/{userId}/sources/{sourceId}
		 */
		deleteSource: (sourceId: string, userId: string, params: RequestParams = {}) =>
			this.request<UserDto, any>({
				path: `/api/users/${userId}/sources/${sourceId}`,
				method: 'DELETE',
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags users
		 * @name GetMovieUserData
		 * @request GET:/api/users/{userId}/user-data/movie/tmdb/{tmdbId}
		 */
		getMovieUserData: (userId: string, tmdbId: string, params: RequestParams = {}) =>
			this.request<MovieUserDataDto, any>({
				path: `/api/users/${userId}/user-data/movie/tmdb/${tmdbId}`,
				method: 'GET',
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags users
		 * @name GetSeriesUserData
		 * @request GET:/api/users/{userId}/user-data/series/tmdb/{tmdbId}
		 */
		getSeriesUserData: (userId: string, tmdbId: string, params: RequestParams = {}) =>
			this.request<SeriesUserDataDto, any>({
				path: `/api/users/${userId}/user-data/series/tmdb/${tmdbId}`,
				method: 'GET',
				format: 'json',
				...params
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
			params: RequestParams = {}
		) =>
			this.request<MovieUserDataDto, any>({
				path: `/api/users/${userId}/user-data/series/tmdb/${tmdbId}/season/${season}/episode/${episode}`,
				method: 'GET',
				format: 'json',
				...params
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
			params: RequestParams = {}
		) =>
			this.request<void, any>({
				path: `/api/users/${userId}/play-state/movie/tmdb/${tmdbId}`,
				method: 'PUT',
				body: data,
				type: ContentType.Json,
				...params
			}),

		/**
		 * No description
		 *
		 * @tags users
		 * @name DeleteMoviePlayStateByTmdbId
		 * @request DELETE:/api/users/{userId}/play-state/movie/tmdb/{tmdbId}
		 */
		deleteMoviePlayStateByTmdbId: (userId: string, tmdbId: string, params: RequestParams = {}) =>
			this.request<void, any>({
				path: `/api/users/${userId}/play-state/movie/tmdb/${tmdbId}`,
				method: 'DELETE',
				...params
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
			params: RequestParams = {}
		) =>
			this.request<void, any>({
				path: `/api/users/${userId}/play-state/series/tmdb/${tmdbId}/season/${season}/episode/${episode}`,
				method: 'PUT',
				body: data,
				type: ContentType.Json,
				...params
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
			params: RequestParams = {}
		) =>
			this.request<void, any>({
				path: `/api/users/${userId}/play-state/series/tmdb/${tmdbId}/season/${season}/episode/${episode}`,
				method: 'DELETE',
				...params
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
			params: RequestParams = {}
		) =>
			this.request<void, any>({
				path: `/api/users/${userId}/play-state/series/tmdb/${tmdbId}`,
				method: 'PUT',
				body: data,
				type: ContentType.Json,
				...params
			}),

		/**
		 * No description
		 *
		 * @tags users
		 * @name GetLibraryItems
		 * @request GET:/api/users/{userId}/library
		 */
		getLibraryItems: (userId: string, params: RequestParams = {}) =>
			this.request<
				PaginatedResponseDto & {
					items: LibraryItemDto2[];
				},
				any
			>({
				path: `/api/users/${userId}/library`,
				method: 'GET',
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags users
		 * @name AddLibraryItem
		 * @request PUT:/api/users/{userId}/library/tmdb/{tmdbId}
		 */
		addLibraryItem: (
			userId: string,
			tmdbId: string,
			query: {
				mediaType: 'Movie' | 'Series' | 'Episode';
			},
			params: RequestParams = {}
		) =>
			this.request<SuccessResponseDto, any>({
				path: `/api/users/${userId}/library/tmdb/${tmdbId}`,
				method: 'PUT',
				query: query,
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags users
		 * @name RemoveLibraryItem
		 * @request DELETE:/api/users/{userId}/library/tmdb/{tmdbId}
		 */
		removeLibraryItem: (userId: string, tmdbId: string, params: RequestParams = {}) =>
			this.request<SuccessResponseDto, any>({
				path: `/api/users/${userId}/library/tmdb/${tmdbId}`,
				method: 'DELETE',
				format: 'json',
				...params
			})
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
				method: 'POST',
				body: data,
				type: ContentType.Json,
				format: 'json',
				...params
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
				method: 'GET',
				...params
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
				method: 'POST',
				...params
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
				method: 'PUT',
				...params
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
				method: 'DELETE',
				...params
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
				method: 'PATCH',
				...params
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
				method: 'OPTIONS',
				...params
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
				method: 'HEAD',
				...params
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
				method: 'SEARCH',
				...params
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
				method: 'GET',
				...params
			})
	};
	metadata = {
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
				method: 'POST',
				...params
			})
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
				method: 'GET',
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags providers
		 * @name GetSourceSettingsTemplate
		 * @request GET:/api/providers/{providerId}/settings/template
		 */
		getSourceSettingsTemplate: (providerId: string, params: RequestParams = {}) =>
			this.request<PluginSettingsTemplateDto, any>({
				path: `/api/providers/${providerId}/settings/template`,
				method: 'GET',
				format: 'json',
				...params
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
			params: RequestParams = {}
		) =>
			this.request<ValidationResponseDto, any>({
				path: `/api/providers/${providerId}/settings/validate`,
				method: 'POST',
				body: data,
				type: ContentType.Json,
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags providers
		 * @name GetSourceCapabilities
		 * @request GET:/api/providers/{providerId}/capabilities
		 */
		getSourceCapabilities: (providerId: string, params: RequestParams = {}) =>
			this.request<SourceProviderCapabilitiesDto, any>({
				path: `/api/providers/${providerId}/capabilities`,
				method: 'GET',
				format: 'json',
				...params
			})
	};
	sources = {
		/**
		 * No description
		 *
		 * @tags sources
		 * @name GetMovieCatalogue
		 * @request GET:/api/sources/{sourceId}/catalogue/movies
		 */
		getMovieCatalogue: (sourceId: string, params: RequestParams = {}) =>
			this.request<
				PaginatedResponseDto & {
					items: IndexItemDto[];
				},
				any
			>({
				path: `/api/sources/${sourceId}/catalogue/movies`,
				method: 'GET',
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags sources
		 * @name GetEpisodeCatalogue
		 * @request GET:/api/sources/{sourceId}/catalogue/episodes
		 */
		getEpisodeCatalogue: (sourceId: string, params: RequestParams = {}) =>
			this.request<
				PaginatedResponseDto & {
					items: IndexItemDto[];
				},
				any
			>({
				path: `/api/sources/${sourceId}/catalogue/episodes`,
				method: 'GET',
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags sources
		 * @name GetMovieStreams
		 * @request GET:/api/sources/{sourceId}/movies/tmdb/{tmdbId}/streams
		 */
		getMovieStreams: (sourceId: string, tmdbId: string, params: RequestParams = {}) =>
			this.request<StreamCandidatesDto, any>({
				path: `/api/sources/${sourceId}/movies/tmdb/${tmdbId}/streams`,
				method: 'GET',
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags sources
		 * @name GetEpisodeStreams
		 * @request GET:/api/sources/{sourceId}/shows/tmdb/{tmdbId}/season/{season}/episode/{episode}/streams
		 */
		getEpisodeStreams: (
			sourceId: string,
			tmdbId: string,
			season: number,
			episode: number,
			params: RequestParams = {}
		) =>
			this.request<StreamCandidatesDto, any>({
				path: `/api/sources/${sourceId}/shows/tmdb/${tmdbId}/season/${season}/episode/${episode}/streams`,
				method: 'GET',
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags sources
		 * @name GetMovieStream
		 * @request POST:/api/sources/{sourceId}/movies/tmdb/{tmdbId}/streams/{key}
		 */
		getMovieStream: (
			tmdbId: string,
			sourceId: string,
			key: string,
			data: PlaybackConfigDto,
			params: RequestParams = {}
		) =>
			this.request<StreamDto, any>({
				path: `/api/sources/${sourceId}/movies/tmdb/${tmdbId}/streams/${key}`,
				method: 'POST',
				body: data,
				type: ContentType.Json,
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags sources
		 * @name GetEpisodeStream
		 * @request POST:/api/sources/{sourceId}/shows/tmdb/{tmdbId}/season/{season}/episode/{episode}/streams/{key}
		 */
		getEpisodeStream: (
			sourceId: string,
			tmdbId: string,
			season: number,
			episode: number,
			key: string,
			data: PlaybackConfigDto,
			params: RequestParams = {}
		) =>
			this.request<StreamDto, any>({
				path: `/api/sources/${sourceId}/shows/tmdb/${tmdbId}/season/${season}/episode/${episode}/streams/${key}`,
				method: 'POST',
				body: data,
				type: ContentType.Json,
				format: 'json',
				...params
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
				method: 'GET',
				...params
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
				method: 'POST',
				...params
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
				method: 'PUT',
				...params
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
				method: 'DELETE',
				...params
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
				method: 'PATCH',
				...params
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
				method: 'OPTIONS',
				...params
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
				method: 'HEAD',
				...params
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
				method: 'SEARCH',
				...params
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
				method: 'GET',
				...params
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
				method: 'POST',
				...params
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
				method: 'PUT',
				...params
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
				method: 'DELETE',
				...params
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
				method: 'PATCH',
				...params
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
				method: 'OPTIONS',
				...params
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
				method: 'HEAD',
				...params
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
				method: 'SEARCH',
				...params
			})
	};
}
