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

export interface UserDto {
	id: string;
	name: string;
	isAdmin: boolean;
	onboardingDone?: boolean;
	settings: Settings;
	pluginSettings?: object;
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
	pluginSettings?: object;
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
	sources = {
		/**
		 * No description
		 *
		 * @tags sources
		 * @name GetSourcePlugins
		 * @request GET:/api/sources
		 */
		getSourcePlugins: (params: RequestParams = {}) =>
			this.request<string[], any>({
				path: `/api/sources`,
				method: 'GET',
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags sources
		 * @name GetSourceSettingsTemplate
		 * @request GET:/api/sources/{sourceId}/settings
		 */
		getSourceSettingsTemplate: (sourceId: string, params: RequestParams = {}) =>
			this.request<void, any>({
				path: `/api/sources/${sourceId}/settings`,
				method: 'GET',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags sources
		 * @name GetMovieStream
		 * @request GET:/api/sources/{sourceId}/movies/{tmdbId}/stream
		 */
		getMovieStream: (sourceId: string, tmdbId: string, params: RequestParams = {}) =>
			this.request<void, any>({
				path: `/api/sources/${sourceId}/movies/${tmdbId}/stream`,
				method: 'GET',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags sources
		 * @name GetMovieStreamProxyGet
		 * @request GET:/api/sources/{sourceId}/movies/{tmdbId}/stream/*
		 */
		getMovieStreamProxyGet: (sourceId: string, tmdbId: string, params: RequestParams = {}) =>
			this.request<void, any>({
				path: `/api/sources/${sourceId}/movies/${tmdbId}/stream/*`,
				method: 'GET',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags sources
		 * @name GetMovieStreamProxyPost
		 * @request POST:/api/sources/{sourceId}/movies/{tmdbId}/stream/*
		 */
		getMovieStreamProxyPost: (sourceId: string, tmdbId: string, params: RequestParams = {}) =>
			this.request<void, any>({
				path: `/api/sources/${sourceId}/movies/${tmdbId}/stream/*`,
				method: 'POST',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags sources
		 * @name GetMovieStreamProxyPut
		 * @request PUT:/api/sources/{sourceId}/movies/{tmdbId}/stream/*
		 */
		getMovieStreamProxyPut: (sourceId: string, tmdbId: string, params: RequestParams = {}) =>
			this.request<void, any>({
				path: `/api/sources/${sourceId}/movies/${tmdbId}/stream/*`,
				method: 'PUT',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags sources
		 * @name GetMovieStreamProxyDelete
		 * @request DELETE:/api/sources/{sourceId}/movies/{tmdbId}/stream/*
		 */
		getMovieStreamProxyDelete: (sourceId: string, tmdbId: string, params: RequestParams = {}) =>
			this.request<void, any>({
				path: `/api/sources/${sourceId}/movies/${tmdbId}/stream/*`,
				method: 'DELETE',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags sources
		 * @name GetMovieStreamProxyPatch
		 * @request PATCH:/api/sources/{sourceId}/movies/{tmdbId}/stream/*
		 */
		getMovieStreamProxyPatch: (sourceId: string, tmdbId: string, params: RequestParams = {}) =>
			this.request<void, any>({
				path: `/api/sources/${sourceId}/movies/${tmdbId}/stream/*`,
				method: 'PATCH',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags sources
		 * @name GetMovieStreamProxyOptions
		 * @request OPTIONS:/api/sources/{sourceId}/movies/{tmdbId}/stream/*
		 */
		getMovieStreamProxyOptions: (sourceId: string, tmdbId: string, params: RequestParams = {}) =>
			this.request<void, any>({
				path: `/api/sources/${sourceId}/movies/${tmdbId}/stream/*`,
				method: 'OPTIONS',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags sources
		 * @name GetMovieStreamProxyHead
		 * @request HEAD:/api/sources/{sourceId}/movies/{tmdbId}/stream/*
		 */
		getMovieStreamProxyHead: (sourceId: string, tmdbId: string, params: RequestParams = {}) =>
			this.request<void, any>({
				path: `/api/sources/${sourceId}/movies/${tmdbId}/stream/*`,
				method: 'HEAD',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags sources
		 * @name GetMovieStreamProxySearch
		 * @request SEARCH:/api/sources/{sourceId}/movies/{tmdbId}/stream/*
		 */
		getMovieStreamProxySearch: (sourceId: string, tmdbId: string, params: RequestParams = {}) =>
			this.request<void, any>({
				path: `/api/sources/${sourceId}/movies/${tmdbId}/stream/*`,
				method: 'SEARCH',
				...params
			})
	};
}
