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

/** An entity representing a user's access schedule. */
export interface AccessSchedule {
  /**
   * Gets the id of this instance.
   * @format int32
   */
  Id?: number;
  /**
   * Gets the id of the associated user.
   * @format uuid
   */
  UserId?: string;
  /** Gets or sets the day of week. */
  DayOfWeek?:
    | 'Sunday'
    | 'Monday'
    | 'Tuesday'
    | 'Wednesday'
    | 'Thursday'
    | 'Friday'
    | 'Saturday'
    | 'Everyday'
    | 'Weekday'
    | 'Weekend';
  /**
   * Gets or sets the start hour.
   * @format double
   */
  StartHour?: number;
  /**
   * Gets or sets the end hour.
   * @format double
   */
  EndHour?: number;
}

/** An activity log entry. */
export interface ActivityLogEntry {
  /**
   * Gets or sets the identifier.
   * @format int64
   */
  Id?: number;
  /** Gets or sets the name. */
  Name?: string;
  /** Gets or sets the overview. */
  Overview?: string | null;
  /** Gets or sets the short overview. */
  ShortOverview?: string | null;
  /** Gets or sets the type. */
  Type?: string;
  /** Gets or sets the item identifier. */
  ItemId?: string | null;
  /**
   * Gets or sets the date.
   * @format date-time
   */
  Date?: string;
  /**
   * Gets or sets the user identifier.
   * @format uuid
   */
  UserId?: string;
  /**
   * Gets or sets the user primary image tag.
   * @deprecated
   */
  UserPrimaryImageTag?: string | null;
  /** Gets or sets the log severity. */
  Severity?: 'Trace' | 'Debug' | 'Information' | 'Warning' | 'Error' | 'Critical' | 'None';
}

/** Activity log created message. */
export interface ActivityLogEntryMessage {
  /** Gets or sets the data. */
  Data?: ActivityLogEntry[] | null;
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "ActivityLogEntry"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** Query result container. */
export interface ActivityLogEntryQueryResult {
  /** Gets or sets the items. */
  Items?: ActivityLogEntry[];
  /**
   * Gets or sets the total number of records available.
   * @format int32
   */
  TotalRecordCount?: number;
  /**
   * Gets or sets the index of the first record in Items.
   * @format int32
   */
  StartIndex?: number;
}

/**
 * Activity log entry start message.
 * Data is the timing data encoded as "$initialDelay,$interval" in ms.
 */
export interface ActivityLogEntryStartMessage {
  /** Gets or sets the data. */
  Data?: string | null;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "ActivityLogEntryStart"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** Activity log entry stop message. */
export interface ActivityLogEntryStopMessage {
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "ActivityLogEntryStop"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** Add virtual folder dto. */
export interface AddVirtualFolderDto {
  /** Gets or sets library options. */
  LibraryOptions?: LibraryOptions | null;
}

export interface AlbumInfo {
  /** Gets or sets the name. */
  Name?: string | null;
  /** Gets or sets the original title. */
  OriginalTitle?: string | null;
  /** Gets or sets the path. */
  Path?: string | null;
  /** Gets or sets the metadata language. */
  MetadataLanguage?: string | null;
  /** Gets or sets the metadata country code. */
  MetadataCountryCode?: string | null;
  /** Gets or sets the provider ids. */
  ProviderIds?: Record<string, string | null>;
  /**
   * Gets or sets the year.
   * @format int32
   */
  Year?: number | null;
  /** @format int32 */
  IndexNumber?: number | null;
  /** @format int32 */
  ParentIndexNumber?: number | null;
  /** @format date-time */
  PremiereDate?: string | null;
  IsAutomated?: boolean;
  /** Gets or sets the album artist. */
  AlbumArtists?: string[];
  /** Gets or sets the artist provider ids. */
  ArtistProviderIds?: Record<string, string | null>;
  SongInfos?: SongInfo[];
}

export interface AlbumInfoRemoteSearchQuery {
  SearchInfo?: AlbumInfo | null;
  /** @format uuid */
  ItemId?: string;
  /** Gets or sets the provider name to search within if set. */
  SearchProviderName?: string | null;
  /** Gets or sets a value indicating whether disabled providers should be included. */
  IncludeDisabledProviders?: boolean;
}

export interface AllThemeMediaResult {
  /** Class ThemeMediaResult. */
  ThemeVideosResult?: ThemeMediaResult | null;
  /** Class ThemeMediaResult. */
  ThemeSongsResult?: ThemeMediaResult | null;
  /** Class ThemeMediaResult. */
  SoundtrackSongsResult?: ThemeMediaResult | null;
}

export interface ArtistInfo {
  /** Gets or sets the name. */
  Name?: string | null;
  /** Gets or sets the original title. */
  OriginalTitle?: string | null;
  /** Gets or sets the path. */
  Path?: string | null;
  /** Gets or sets the metadata language. */
  MetadataLanguage?: string | null;
  /** Gets or sets the metadata country code. */
  MetadataCountryCode?: string | null;
  /** Gets or sets the provider ids. */
  ProviderIds?: Record<string, string | null>;
  /**
   * Gets or sets the year.
   * @format int32
   */
  Year?: number | null;
  /** @format int32 */
  IndexNumber?: number | null;
  /** @format int32 */
  ParentIndexNumber?: number | null;
  /** @format date-time */
  PremiereDate?: string | null;
  IsAutomated?: boolean;
  SongInfos?: SongInfo[];
}

export interface ArtistInfoRemoteSearchQuery {
  SearchInfo?: ArtistInfo | null;
  /** @format uuid */
  ItemId?: string;
  /** Gets or sets the provider name to search within if set. */
  SearchProviderName?: string | null;
  /** Gets or sets a value indicating whether disabled providers should be included. */
  IncludeDisabledProviders?: boolean;
}

/** An enum representing formats of spatial audio. */
export enum AudioSpatialFormat {
  None = 'None',
  DolbyAtmos = 'DolbyAtmos',
  DTSX = 'DTSX',
}

/** The authenticate user by name request body. */
export interface AuthenticateUserByName {
  /** Gets or sets the username. */
  Username?: string | null;
  /** Gets or sets the plain text password. */
  Pw?: string | null;
}

export interface AuthenticationInfo {
  /**
   * Gets or sets the identifier.
   * @format int64
   */
  Id?: number;
  /** Gets or sets the access token. */
  AccessToken?: string | null;
  /** Gets or sets the device identifier. */
  DeviceId?: string | null;
  /** Gets or sets the name of the application. */
  AppName?: string | null;
  /** Gets or sets the application version. */
  AppVersion?: string | null;
  /** Gets or sets the name of the device. */
  DeviceName?: string | null;
  /**
   * Gets or sets the user identifier.
   * @format uuid
   */
  UserId?: string;
  /** Gets or sets a value indicating whether this instance is active. */
  IsActive?: boolean;
  /**
   * Gets or sets the date created.
   * @format date-time
   */
  DateCreated?: string;
  /**
   * Gets or sets the date revoked.
   * @format date-time
   */
  DateRevoked?: string | null;
  /** @format date-time */
  DateLastActivity?: string;
  UserName?: string | null;
}

/** Query result container. */
export interface AuthenticationInfoQueryResult {
  /** Gets or sets the items. */
  Items?: AuthenticationInfo[];
  /**
   * Gets or sets the total number of records available.
   * @format int32
   */
  TotalRecordCount?: number;
  /**
   * Gets or sets the index of the first record in Items.
   * @format int32
   */
  StartIndex?: number;
}

/** A class representing an authentication result. */
export interface AuthenticationResult {
  /** Class UserDto. */
  User?: UserDto | null;
  /** Session info DTO. */
  SessionInfo?: SessionInfoDto | null;
  /** Gets or sets the access token. */
  AccessToken?: string | null;
  /** Gets or sets the server id. */
  ServerId?: string | null;
}

/**
 * This is strictly used as a data transfer object from the api layer.
 * This holds information about a BaseItem in a format that is convenient for the client.
 */
export interface BaseItemDto {
  /** Gets or sets the name. */
  Name?: string | null;
  OriginalTitle?: string | null;
  /** Gets or sets the server identifier. */
  ServerId?: string | null;
  /**
   * Gets or sets the id.
   * @format uuid
   */
  Id?: string;
  /** Gets or sets the etag. */
  Etag?: string | null;
  /** Gets or sets the type of the source. */
  SourceType?: string | null;
  /** Gets or sets the playlist item identifier. */
  PlaylistItemId?: string | null;
  /**
   * Gets or sets the date created.
   * @format date-time
   */
  DateCreated?: string | null;
  /** @format date-time */
  DateLastMediaAdded?: string | null;
  ExtraType?:
    | 'Unknown'
    | 'Clip'
    | 'Trailer'
    | 'BehindTheScenes'
    | 'DeletedScene'
    | 'Interview'
    | 'Scene'
    | 'Sample'
    | 'ThemeSong'
    | 'ThemeVideo'
    | 'Featurette'
    | 'Short'
    | null;
  /** @format int32 */
  AirsBeforeSeasonNumber?: number | null;
  /** @format int32 */
  AirsAfterSeasonNumber?: number | null;
  /** @format int32 */
  AirsBeforeEpisodeNumber?: number | null;
  CanDelete?: boolean | null;
  CanDownload?: boolean | null;
  HasLyrics?: boolean | null;
  HasSubtitles?: boolean | null;
  PreferredMetadataLanguage?: string | null;
  PreferredMetadataCountryCode?: string | null;
  Container?: string | null;
  /** Gets or sets the name of the sort. */
  SortName?: string | null;
  ForcedSortName?: string | null;
  /** Gets or sets the video3 D format. */
  Video3DFormat?: 'HalfSideBySide' | 'FullSideBySide' | 'FullTopAndBottom' | 'HalfTopAndBottom' | 'MVC' | null;
  /**
   * Gets or sets the premiere date.
   * @format date-time
   */
  PremiereDate?: string | null;
  /** Gets or sets the external urls. */
  ExternalUrls?: ExternalUrl[] | null;
  /** Gets or sets the media versions. */
  MediaSources?: MediaSourceInfo[] | null;
  /**
   * Gets or sets the critic rating.
   * @format float
   */
  CriticRating?: number | null;
  ProductionLocations?: string[] | null;
  /** Gets or sets the path. */
  Path?: string | null;
  EnableMediaSourceDisplay?: boolean | null;
  /** Gets or sets the official rating. */
  OfficialRating?: string | null;
  /** Gets or sets the custom rating. */
  CustomRating?: string | null;
  /**
   * Gets or sets the channel identifier.
   * @format uuid
   */
  ChannelId?: string | null;
  ChannelName?: string | null;
  /** Gets or sets the overview. */
  Overview?: string | null;
  /** Gets or sets the taglines. */
  Taglines?: string[] | null;
  /** Gets or sets the genres. */
  Genres?: string[] | null;
  /**
   * Gets or sets the community rating.
   * @format float
   */
  CommunityRating?: number | null;
  /**
   * Gets or sets the cumulative run time ticks.
   * @format int64
   */
  CumulativeRunTimeTicks?: number | null;
  /**
   * Gets or sets the run time ticks.
   * @format int64
   */
  RunTimeTicks?: number | null;
  /** Gets or sets the play access. */
  PlayAccess?: 'Full' | 'None' | null;
  /** Gets or sets the aspect ratio. */
  AspectRatio?: string | null;
  /**
   * Gets or sets the production year.
   * @format int32
   */
  ProductionYear?: number | null;
  /** Gets or sets a value indicating whether this instance is place holder. */
  IsPlaceHolder?: boolean | null;
  /** Gets or sets the number. */
  Number?: string | null;
  ChannelNumber?: string | null;
  /**
   * Gets or sets the index number.
   * @format int32
   */
  IndexNumber?: number | null;
  /**
   * Gets or sets the index number end.
   * @format int32
   */
  IndexNumberEnd?: number | null;
  /**
   * Gets or sets the parent index number.
   * @format int32
   */
  ParentIndexNumber?: number | null;
  /** Gets or sets the trailer urls. */
  RemoteTrailers?: MediaUrl[] | null;
  /** Gets or sets the provider ids. */
  ProviderIds?: Record<string, string | null>;
  /** Gets or sets a value indicating whether this instance is HD. */
  IsHD?: boolean | null;
  /** Gets or sets a value indicating whether this instance is folder. */
  IsFolder?: boolean | null;
  /**
   * Gets or sets the parent id.
   * @format uuid
   */
  ParentId?: string | null;
  /** The base item kind. */
  Type?:
    | 'AggregateFolder'
    | 'Audio'
    | 'AudioBook'
    | 'BasePluginFolder'
    | 'Book'
    | 'BoxSet'
    | 'Channel'
    | 'ChannelFolderItem'
    | 'CollectionFolder'
    | 'Episode'
    | 'Folder'
    | 'Genre'
    | 'ManualPlaylistsFolder'
    | 'Movie'
    | 'LiveTvChannel'
    | 'LiveTvProgram'
    | 'MusicAlbum'
    | 'MusicArtist'
    | 'MusicGenre'
    | 'MusicVideo'
    | 'Person'
    | 'Photo'
    | 'PhotoAlbum'
    | 'Playlist'
    | 'PlaylistsFolder'
    | 'Program'
    | 'Recording'
    | 'Season'
    | 'Series'
    | 'Studio'
    | 'Trailer'
    | 'TvChannel'
    | 'TvProgram'
    | 'UserRootFolder'
    | 'UserView'
    | 'Video'
    | 'Year';
  /** Gets or sets the people. */
  People?: BaseItemPerson[] | null;
  /** Gets or sets the studios. */
  Studios?: NameGuidPair[] | null;
  GenreItems?: NameGuidPair[] | null;
  /**
   * Gets or sets whether the item has a logo, this will hold the Id of the Parent that has one.
   * @format uuid
   */
  ParentLogoItemId?: string | null;
  /**
   * Gets or sets whether the item has any backdrops, this will hold the Id of the Parent that has one.
   * @format uuid
   */
  ParentBackdropItemId?: string | null;
  /** Gets or sets the parent backdrop image tags. */
  ParentBackdropImageTags?: string[] | null;
  /**
   * Gets or sets the local trailer count.
   * @format int32
   */
  LocalTrailerCount?: number | null;
  /** Gets or sets the user data for this item based on the user it's being requested for. */
  UserData?: UserItemDataDto | null;
  /**
   * Gets or sets the recursive item count.
   * @format int32
   */
  RecursiveItemCount?: number | null;
  /**
   * Gets or sets the child count.
   * @format int32
   */
  ChildCount?: number | null;
  /** Gets or sets the name of the series. */
  SeriesName?: string | null;
  /**
   * Gets or sets the series id.
   * @format uuid
   */
  SeriesId?: string | null;
  /**
   * Gets or sets the season identifier.
   * @format uuid
   */
  SeasonId?: string | null;
  /**
   * Gets or sets the special feature count.
   * @format int32
   */
  SpecialFeatureCount?: number | null;
  /** Gets or sets the display preferences id. */
  DisplayPreferencesId?: string | null;
  /** Gets or sets the status. */
  Status?: string | null;
  /** Gets or sets the air time. */
  AirTime?: string | null;
  /** Gets or sets the air days. */
  AirDays?: DayOfWeek[] | null;
  /** Gets or sets the tags. */
  Tags?: string[] | null;
  /**
   * Gets or sets the primary image aspect ratio, after image enhancements.
   * @format double
   */
  PrimaryImageAspectRatio?: number | null;
  /** Gets or sets the artists. */
  Artists?: string[] | null;
  /** Gets or sets the artist items. */
  ArtistItems?: NameGuidPair[] | null;
  /** Gets or sets the album. */
  Album?: string | null;
  /** Gets or sets the type of the collection. */
  CollectionType?:
    | 'unknown'
    | 'movies'
    | 'tvshows'
    | 'music'
    | 'musicvideos'
    | 'trailers'
    | 'homevideos'
    | 'boxsets'
    | 'books'
    | 'photos'
    | 'livetv'
    | 'playlists'
    | 'folders'
    | null;
  /** Gets or sets the display order. */
  DisplayOrder?: string | null;
  /**
   * Gets or sets the album id.
   * @format uuid
   */
  AlbumId?: string | null;
  /** Gets or sets the album image tag. */
  AlbumPrimaryImageTag?: string | null;
  /** Gets or sets the series primary image tag. */
  SeriesPrimaryImageTag?: string | null;
  /** Gets or sets the album artist. */
  AlbumArtist?: string | null;
  /** Gets or sets the album artists. */
  AlbumArtists?: NameGuidPair[] | null;
  /** Gets or sets the name of the season. */
  SeasonName?: string | null;
  /** Gets or sets the media streams. */
  MediaStreams?: MediaStream[] | null;
  /** Gets or sets the type of the video. */
  VideoType?: 'VideoFile' | 'Iso' | 'Dvd' | 'BluRay' | null;
  /**
   * Gets or sets the part count.
   * @format int32
   */
  PartCount?: number | null;
  /** @format int32 */
  MediaSourceCount?: number | null;
  /** Gets or sets the image tags. */
  ImageTags?: Record<string, string>;
  /** Gets or sets the backdrop image tags. */
  BackdropImageTags?: string[] | null;
  /** Gets or sets the screenshot image tags. */
  ScreenshotImageTags?: string[] | null;
  /** Gets or sets the parent logo image tag. */
  ParentLogoImageTag?: string | null;
  /**
   * Gets or sets whether the item has fan art, this will hold the Id of the Parent that has one.
   * @format uuid
   */
  ParentArtItemId?: string | null;
  /** Gets or sets the parent art image tag. */
  ParentArtImageTag?: string | null;
  /** Gets or sets the series thumb image tag. */
  SeriesThumbImageTag?: string | null;
  /**
   * Gets or sets the blurhashes for the image tags.
   * Maps image type to dictionary mapping image tag to blurhash value.
   */
  ImageBlurHashes?: {
    Primary?: Record<string, string>;
    Art?: Record<string, string>;
    Backdrop?: Record<string, string>;
    Banner?: Record<string, string>;
    Logo?: Record<string, string>;
    Thumb?: Record<string, string>;
    Disc?: Record<string, string>;
    Box?: Record<string, string>;
    Screenshot?: Record<string, string>;
    Menu?: Record<string, string>;
    Chapter?: Record<string, string>;
    BoxRear?: Record<string, string>;
    Profile?: Record<string, string>;
  } | null;
  /** Gets or sets the series studio. */
  SeriesStudio?: string | null;
  /**
   * Gets or sets the parent thumb item id.
   * @format uuid
   */
  ParentThumbItemId?: string | null;
  /** Gets or sets the parent thumb image tag. */
  ParentThumbImageTag?: string | null;
  /** Gets or sets the parent primary image item identifier. */
  ParentPrimaryImageItemId?: string | null;
  /** Gets or sets the parent primary image tag. */
  ParentPrimaryImageTag?: string | null;
  /** Gets or sets the chapters. */
  Chapters?: ChapterInfo[] | null;
  /** Gets or sets the trickplay manifest. */
  Trickplay?: Record<string, Record<string, TrickplayInfo>>;
  /** Gets or sets the type of the location. */
  LocationType?: 'FileSystem' | 'Remote' | 'Virtual' | 'Offline' | null;
  /** Gets or sets the type of the iso. */
  IsoType?: 'Dvd' | 'BluRay' | null;
  /** Media types. */
  MediaType?: 'Unknown' | 'Video' | 'Audio' | 'Photo' | 'Book';
  /**
   * Gets or sets the end date.
   * @format date-time
   */
  EndDate?: string | null;
  /** Gets or sets the locked fields. */
  LockedFields?: MetadataField[] | null;
  /**
   * Gets or sets the trailer count.
   * @format int32
   */
  TrailerCount?: number | null;
  /**
   * Gets or sets the movie count.
   * @format int32
   */
  MovieCount?: number | null;
  /**
   * Gets or sets the series count.
   * @format int32
   */
  SeriesCount?: number | null;
  /** @format int32 */
  ProgramCount?: number | null;
  /**
   * Gets or sets the episode count.
   * @format int32
   */
  EpisodeCount?: number | null;
  /**
   * Gets or sets the song count.
   * @format int32
   */
  SongCount?: number | null;
  /**
   * Gets or sets the album count.
   * @format int32
   */
  AlbumCount?: number | null;
  /** @format int32 */
  ArtistCount?: number | null;
  /**
   * Gets or sets the music video count.
   * @format int32
   */
  MusicVideoCount?: number | null;
  /** Gets or sets a value indicating whether [enable internet providers]. */
  LockData?: boolean | null;
  /** @format int32 */
  Width?: number | null;
  /** @format int32 */
  Height?: number | null;
  CameraMake?: string | null;
  CameraModel?: string | null;
  Software?: string | null;
  /** @format double */
  ExposureTime?: number | null;
  /** @format double */
  FocalLength?: number | null;
  ImageOrientation?:
    | 'TopLeft'
    | 'TopRight'
    | 'BottomRight'
    | 'BottomLeft'
    | 'LeftTop'
    | 'RightTop'
    | 'RightBottom'
    | 'LeftBottom'
    | null;
  /** @format double */
  Aperture?: number | null;
  /** @format double */
  ShutterSpeed?: number | null;
  /** @format double */
  Latitude?: number | null;
  /** @format double */
  Longitude?: number | null;
  /** @format double */
  Altitude?: number | null;
  /** @format int32 */
  IsoSpeedRating?: number | null;
  /** Gets or sets the series timer identifier. */
  SeriesTimerId?: string | null;
  /** Gets or sets the program identifier. */
  ProgramId?: string | null;
  /** Gets or sets the channel primary image tag. */
  ChannelPrimaryImageTag?: string | null;
  /**
   * Gets or sets the start date of the recording, in UTC.
   * @format date-time
   */
  StartDate?: string | null;
  /**
   * Gets or sets the completion percentage.
   * @format double
   */
  CompletionPercentage?: number | null;
  /** Gets or sets a value indicating whether this instance is repeat. */
  IsRepeat?: boolean | null;
  /** Gets or sets the episode title. */
  EpisodeTitle?: string | null;
  /** Gets or sets the type of the channel. */
  ChannelType?: 'TV' | 'Radio' | null;
  /** Gets or sets the audio. */
  Audio?: 'Mono' | 'Stereo' | 'Dolby' | 'DolbyDigital' | 'Thx' | 'Atmos' | null;
  /** Gets or sets a value indicating whether this instance is movie. */
  IsMovie?: boolean | null;
  /** Gets or sets a value indicating whether this instance is sports. */
  IsSports?: boolean | null;
  /** Gets or sets a value indicating whether this instance is series. */
  IsSeries?: boolean | null;
  /** Gets or sets a value indicating whether this instance is live. */
  IsLive?: boolean | null;
  /** Gets or sets a value indicating whether this instance is news. */
  IsNews?: boolean | null;
  /** Gets or sets a value indicating whether this instance is kids. */
  IsKids?: boolean | null;
  /** Gets or sets a value indicating whether this instance is premiere. */
  IsPremiere?: boolean | null;
  /** Gets or sets the timer identifier. */
  TimerId?: string | null;
  /**
   * Gets or sets the gain required for audio normalization.
   * @format float
   */
  NormalizationGain?: number | null;
  /** Gets or sets the current program. */
  CurrentProgram?: BaseItemDto | null;
}

/** Query result container. */
export interface BaseItemDtoQueryResult {
  /** Gets or sets the items. */
  Items?: BaseItemDto[];
  /**
   * Gets or sets the total number of records available.
   * @format int32
   */
  TotalRecordCount?: number;
  /**
   * Gets or sets the index of the first record in Items.
   * @format int32
   */
  StartIndex?: number;
}

/** The base item kind. */
export enum BaseItemKind {
  AggregateFolder = 'AggregateFolder',
  Audio = 'Audio',
  AudioBook = 'AudioBook',
  BasePluginFolder = 'BasePluginFolder',
  Book = 'Book',
  BoxSet = 'BoxSet',
  Channel = 'Channel',
  ChannelFolderItem = 'ChannelFolderItem',
  CollectionFolder = 'CollectionFolder',
  Episode = 'Episode',
  Folder = 'Folder',
  Genre = 'Genre',
  ManualPlaylistsFolder = 'ManualPlaylistsFolder',
  Movie = 'Movie',
  LiveTvChannel = 'LiveTvChannel',
  LiveTvProgram = 'LiveTvProgram',
  MusicAlbum = 'MusicAlbum',
  MusicArtist = 'MusicArtist',
  MusicGenre = 'MusicGenre',
  MusicVideo = 'MusicVideo',
  Person = 'Person',
  Photo = 'Photo',
  PhotoAlbum = 'PhotoAlbum',
  Playlist = 'Playlist',
  PlaylistsFolder = 'PlaylistsFolder',
  Program = 'Program',
  Recording = 'Recording',
  Season = 'Season',
  Series = 'Series',
  Studio = 'Studio',
  Trailer = 'Trailer',
  TvChannel = 'TvChannel',
  TvProgram = 'TvProgram',
  UserRootFolder = 'UserRootFolder',
  UserView = 'UserView',
  Video = 'Video',
  Year = 'Year',
}

/** This is used by the api to get information about a Person within a BaseItem. */
export interface BaseItemPerson {
  /** Gets or sets the name. */
  Name?: string | null;
  /**
   * Gets or sets the identifier.
   * @format uuid
   */
  Id?: string;
  /** Gets or sets the role. */
  Role?: string | null;
  /** The person kind. */
  Type?:
    | 'Unknown'
    | 'Actor'
    | 'Director'
    | 'Composer'
    | 'Writer'
    | 'GuestStar'
    | 'Producer'
    | 'Conductor'
    | 'Lyricist'
    | 'Arranger'
    | 'Engineer'
    | 'Mixer'
    | 'Remixer'
    | 'Creator'
    | 'Artist'
    | 'AlbumArtist'
    | 'Author'
    | 'Illustrator'
    | 'Penciller'
    | 'Inker'
    | 'Colorist'
    | 'Letterer'
    | 'CoverArtist'
    | 'Editor'
    | 'Translator';
  /** Gets or sets the primary image tag. */
  PrimaryImageTag?: string | null;
  /** Gets or sets the primary image blurhash. */
  ImageBlurHashes?: {
    Primary?: Record<string, string>;
    Art?: Record<string, string>;
    Backdrop?: Record<string, string>;
    Banner?: Record<string, string>;
    Logo?: Record<string, string>;
    Thumb?: Record<string, string>;
    Disc?: Record<string, string>;
    Box?: Record<string, string>;
    Screenshot?: Record<string, string>;
    Menu?: Record<string, string>;
    Chapter?: Record<string, string>;
    BoxRear?: Record<string, string>;
    Profile?: Record<string, string>;
  } | null;
}

/** Class BasePluginConfiguration. */
export type BasePluginConfiguration = object;

export interface BookInfo {
  /** Gets or sets the name. */
  Name?: string | null;
  /** Gets or sets the original title. */
  OriginalTitle?: string | null;
  /** Gets or sets the path. */
  Path?: string | null;
  /** Gets or sets the metadata language. */
  MetadataLanguage?: string | null;
  /** Gets or sets the metadata country code. */
  MetadataCountryCode?: string | null;
  /** Gets or sets the provider ids. */
  ProviderIds?: Record<string, string | null>;
  /**
   * Gets or sets the year.
   * @format int32
   */
  Year?: number | null;
  /** @format int32 */
  IndexNumber?: number | null;
  /** @format int32 */
  ParentIndexNumber?: number | null;
  /** @format date-time */
  PremiereDate?: string | null;
  IsAutomated?: boolean;
  SeriesName?: string | null;
}

export interface BookInfoRemoteSearchQuery {
  SearchInfo?: BookInfo | null;
  /** @format uuid */
  ItemId?: string;
  /** Gets or sets the provider name to search within if set. */
  SearchProviderName?: string | null;
  /** Gets or sets a value indicating whether disabled providers should be included. */
  IncludeDisabledProviders?: boolean;
}

export interface BoxSetInfo {
  /** Gets or sets the name. */
  Name?: string | null;
  /** Gets or sets the original title. */
  OriginalTitle?: string | null;
  /** Gets or sets the path. */
  Path?: string | null;
  /** Gets or sets the metadata language. */
  MetadataLanguage?: string | null;
  /** Gets or sets the metadata country code. */
  MetadataCountryCode?: string | null;
  /** Gets or sets the provider ids. */
  ProviderIds?: Record<string, string | null>;
  /**
   * Gets or sets the year.
   * @format int32
   */
  Year?: number | null;
  /** @format int32 */
  IndexNumber?: number | null;
  /** @format int32 */
  ParentIndexNumber?: number | null;
  /** @format date-time */
  PremiereDate?: string | null;
  IsAutomated?: boolean;
}

export interface BoxSetInfoRemoteSearchQuery {
  SearchInfo?: BoxSetInfo | null;
  /** @format uuid */
  ItemId?: string;
  /** Gets or sets the provider name to search within if set. */
  SearchProviderName?: string | null;
  /** Gets or sets a value indicating whether disabled providers should be included. */
  IncludeDisabledProviders?: boolean;
}

/** The branding options. */
export interface BrandingOptions {
  /** Gets or sets the login disclaimer. */
  LoginDisclaimer?: string | null;
  /** Gets or sets the custom CSS. */
  CustomCss?: string | null;
  /** Gets or sets a value indicating whether to enable the splashscreen. */
  SplashscreenEnabled?: boolean;
}

/** Class BufferRequestDto. */
export interface BufferRequestDto {
  /**
   * Gets or sets when the request has been made by the client.
   * @format date-time
   */
  When?: string;
  /**
   * Gets or sets the position ticks.
   * @format int64
   */
  PositionTicks?: number;
  /** Gets or sets a value indicating whether the client playback is unpaused. */
  IsPlaying?: boolean;
  /**
   * Gets or sets the playlist item identifier of the playing item.
   * @format uuid
   */
  PlaylistItemId?: string;
}

/** The cast receiver application model. */
export interface CastReceiverApplication {
  /** Gets or sets the cast receiver application id. */
  Id?: string;
  /** Gets or sets the cast receiver application name. */
  Name?: string;
}

export interface ChannelFeatures {
  /** Gets or sets the name. */
  Name?: string;
  /**
   * Gets or sets the identifier.
   * @format uuid
   */
  Id?: string;
  /** Gets or sets a value indicating whether this instance can search. */
  CanSearch?: boolean;
  /** Gets or sets the media types. */
  MediaTypes?: ChannelMediaType[];
  /** Gets or sets the content types. */
  ContentTypes?: ChannelMediaContentType[];
  /**
   * Gets or sets the maximum number of records the channel allows retrieving at a time.
   * @format int32
   */
  MaxPageSize?: number | null;
  /**
   * Gets or sets the automatic refresh levels.
   * @format int32
   */
  AutoRefreshLevels?: number | null;
  /** Gets or sets the default sort orders. */
  DefaultSortFields?: ChannelItemSortField[];
  /** Gets or sets a value indicating whether a sort ascending/descending toggle is supported. */
  SupportsSortOrderToggle?: boolean;
  /** Gets or sets a value indicating whether [supports latest media]. */
  SupportsLatestMedia?: boolean;
  /** Gets or sets a value indicating whether this instance can filter. */
  CanFilter?: boolean;
  /** Gets or sets a value indicating whether [supports content downloading]. */
  SupportsContentDownloading?: boolean;
}

export enum ChannelItemSortField {
  Name = 'Name',
  CommunityRating = 'CommunityRating',
  PremiereDate = 'PremiereDate',
  DateCreated = 'DateCreated',
  Runtime = 'Runtime',
  PlayCount = 'PlayCount',
  CommunityPlayCount = 'CommunityPlayCount',
}

/** Channel mapping options dto. */
export interface ChannelMappingOptionsDto {
  /** Gets or sets list of tuner channels. */
  TunerChannels?: TunerChannelMapping[];
  /** Gets or sets list of provider channels. */
  ProviderChannels?: NameIdPair[];
  /** Gets or sets list of mappings. */
  Mappings?: NameValuePair[];
  /** Gets or sets provider name. */
  ProviderName?: string | null;
}

export enum ChannelMediaContentType {
  Clip = 'Clip',
  Podcast = 'Podcast',
  Trailer = 'Trailer',
  Movie = 'Movie',
  Episode = 'Episode',
  Song = 'Song',
  MovieExtra = 'MovieExtra',
  TvExtra = 'TvExtra',
}

export enum ChannelMediaType {
  Audio = 'Audio',
  Video = 'Video',
  Photo = 'Photo',
}

/** Enum ChannelType. */
export enum ChannelType {
  TV = 'TV',
  Radio = 'Radio',
}

/** Class ChapterInfo. */
export interface ChapterInfo {
  /**
   * Gets or sets the start position ticks.
   * @format int64
   */
  StartPositionTicks?: number;
  /** Gets or sets the name. */
  Name?: string | null;
  /** Gets or sets the image path. */
  ImagePath?: string | null;
  /** @format date-time */
  ImageDateModified?: string;
  ImageTag?: string | null;
}

/** Client capabilities dto. */
export interface ClientCapabilitiesDto {
  /** Gets or sets the list of playable media types. */
  PlayableMediaTypes?: MediaType[];
  /** Gets or sets the list of supported commands. */
  SupportedCommands?: GeneralCommandType[];
  /** Gets or sets a value indicating whether session supports media control. */
  SupportsMediaControl?: boolean;
  /** Gets or sets a value indicating whether session supports a persistent identifier. */
  SupportsPersistentIdentifier?: boolean;
  /** Gets or sets the device profile. */
  DeviceProfile?: DeviceProfile | null;
  /** Gets or sets the app store url. */
  AppStoreUrl?: string | null;
  /** Gets or sets the icon url. */
  IconUrl?: string | null;
}

/** Client log document response dto. */
export interface ClientLogDocumentResponseDto {
  /** Gets the resulting filename. */
  FileName?: string;
}

/** Defines the MediaBrowser.Model.Dlna.CodecProfile. */
export interface CodecProfile {
  /** Gets or sets the MediaBrowser.Model.Dlna.CodecType which this container must meet. */
  Type?: 'Video' | 'VideoAudio' | 'Audio';
  /** Gets or sets the list of MediaBrowser.Model.Dlna.ProfileCondition which this profile must meet. */
  Conditions?: ProfileCondition[];
  /** Gets or sets the list of MediaBrowser.Model.Dlna.ProfileCondition to apply if this profile is met. */
  ApplyConditions?: ProfileCondition[];
  /** Gets or sets the codec(s) that this profile applies to. */
  Codec?: string | null;
  /** Gets or sets the container(s) which this profile will be applied to. */
  Container?: string | null;
  /** Gets or sets the sub-container(s) which this profile will be applied to. */
  SubContainer?: string | null;
}

export enum CodecType {
  Video = 'Video',
  VideoAudio = 'VideoAudio',
  Audio = 'Audio',
}

export interface CollectionCreationResult {
  /** @format uuid */
  Id?: string;
}

/** Collection type. */
export enum CollectionType {
  Unknown = 'unknown',
  Movies = 'movies',
  Tvshows = 'tvshows',
  Music = 'music',
  Musicvideos = 'musicvideos',
  Trailers = 'trailers',
  Homevideos = 'homevideos',
  Boxsets = 'boxsets',
  Books = 'books',
  Photos = 'photos',
  Livetv = 'livetv',
  Playlists = 'playlists',
  Folders = 'folders',
}

/** The collection type options. */
export enum CollectionTypeOptions {
  Movies = 'movies',
  Tvshows = 'tvshows',
  Music = 'music',
  Musicvideos = 'musicvideos',
  Homevideos = 'homevideos',
  Boxsets = 'boxsets',
  Books = 'books',
  Mixed = 'mixed',
}

export interface ConfigImageTypes {
  BackdropSizes?: string[] | null;
  BaseUrl?: string | null;
  LogoSizes?: string[] | null;
  PosterSizes?: string[] | null;
  ProfileSizes?: string[] | null;
  SecureBaseUrl?: string | null;
  StillSizes?: string[] | null;
}

/** The configuration page info. */
export interface ConfigurationPageInfo {
  /** Gets or sets the name. */
  Name?: string;
  /** Gets or sets a value indicating whether the configurations page is enabled in the main menu. */
  EnableInMainMenu?: boolean;
  /** Gets or sets the menu section. */
  MenuSection?: string | null;
  /** Gets or sets the menu icon. */
  MenuIcon?: string | null;
  /** Gets or sets the display name. */
  DisplayName?: string | null;
  /**
   * Gets or sets the plugin id.
   * @format uuid
   */
  PluginId?: string | null;
}

/** Defines the MediaBrowser.Model.Dlna.ContainerProfile. */
export interface ContainerProfile {
  /** Gets or sets the MediaBrowser.Model.Dlna.DlnaProfileType which this container must meet. */
  Type?: 'Audio' | 'Video' | 'Photo' | 'Subtitle' | 'Lyric';
  /** Gets or sets the list of MediaBrowser.Model.Dlna.ProfileCondition which this container will be applied to. */
  Conditions?: ProfileCondition[];
  /** Gets or sets the container(s) which this container must meet. */
  Container?: string | null;
  /** Gets or sets the sub container(s) which this container must meet. */
  SubContainer?: string | null;
}

/** Class CountryInfo. */
export interface CountryInfo {
  /** Gets or sets the name. */
  Name?: string | null;
  /** Gets or sets the display name. */
  DisplayName?: string | null;
  /** Gets or sets the name of the two letter ISO region. */
  TwoLetterISORegionName?: string | null;
  /** Gets or sets the name of the three letter ISO region. */
  ThreeLetterISORegionName?: string | null;
}

/** Create new playlist dto. */
export interface CreatePlaylistDto {
  /** Gets or sets the name of the new playlist. */
  Name?: string;
  /** Gets or sets item ids to add to the playlist. */
  Ids?: string[];
  /**
   * Gets or sets the user id.
   * @format uuid
   */
  UserId?: string | null;
  /** Gets or sets the media type. */
  MediaType?: 'Unknown' | 'Video' | 'Audio' | 'Photo' | 'Book' | null;
  /** Gets or sets the playlist users. */
  Users?: PlaylistUserPermissions[];
  /** Gets or sets a value indicating whether the playlist is public. */
  IsPublic?: boolean;
}

/** The create user by name request body. */
export interface CreateUserByName {
  /** Gets or sets the username. */
  Name: string;
  /** Gets or sets the password. */
  Password?: string | null;
}

/** Class CultureDto. */
export interface CultureDto {
  /** Gets the name. */
  Name?: string;
  /** Gets the display name. */
  DisplayName?: string;
  /** Gets the name of the two letter ISO language. */
  TwoLetterISOLanguageName?: string;
  /** Gets the name of the three letter ISO language. */
  ThreeLetterISOLanguageName?: string | null;
  ThreeLetterISOLanguageNames?: string[];
}

export enum DayOfWeek {
  Sunday = 'Sunday',
  Monday = 'Monday',
  Tuesday = 'Tuesday',
  Wednesday = 'Wednesday',
  Thursday = 'Thursday',
  Friday = 'Friday',
  Saturday = 'Saturday',
}

export enum DayPattern {
  Daily = 'Daily',
  Weekdays = 'Weekdays',
  Weekends = 'Weekends',
}

/** Default directory browser info. */
export interface DefaultDirectoryBrowserInfoDto {
  /** Gets or sets the path. */
  Path?: string | null;
}

/** Enum containing deinterlace methods. */
export enum DeinterlaceMethod {
  Yadif = 'yadif',
  Bwdif = 'bwdif',
}

/** A DTO representing device information. */
export interface DeviceInfoDto {
  /** Gets or sets the name. */
  Name?: string | null;
  /** Gets or sets the custom name. */
  CustomName?: string | null;
  /** Gets or sets the access token. */
  AccessToken?: string | null;
  /** Gets or sets the identifier. */
  Id?: string | null;
  /** Gets or sets the last name of the user. */
  LastUserName?: string | null;
  /** Gets or sets the name of the application. */
  AppName?: string | null;
  /** Gets or sets the application version. */
  AppVersion?: string | null;
  /**
   * Gets or sets the last user identifier.
   * @format uuid
   */
  LastUserId?: string | null;
  /**
   * Gets or sets the date last modified.
   * @format date-time
   */
  DateLastActivity?: string | null;
  /** Gets or sets the capabilities. */
  Capabilities?: ClientCapabilitiesDto;
  /** Gets or sets the icon URL. */
  IconUrl?: string | null;
}

/** Query result container. */
export interface DeviceInfoDtoQueryResult {
  /** Gets or sets the items. */
  Items?: DeviceInfoDto[];
  /**
   * Gets or sets the total number of records available.
   * @format int32
   */
  TotalRecordCount?: number;
  /**
   * Gets or sets the index of the first record in Items.
   * @format int32
   */
  StartIndex?: number;
}

/** A dto representing custom options for a device. */
export interface DeviceOptionsDto {
  /**
   * Gets or sets the id.
   * @format int32
   */
  Id?: number;
  /** Gets or sets the device id. */
  DeviceId?: string | null;
  /** Gets or sets the custom name. */
  CustomName?: string | null;
}

/**
 * A MediaBrowser.Model.Dlna.DeviceProfile represents a set of metadata which determines which content a certain device is able to play.
 * <br />
 * Specifically, it defines the supported <see cref="P:MediaBrowser.Model.Dlna.DeviceProfile.ContainerProfiles">containers</see> and
 * <see cref="P:MediaBrowser.Model.Dlna.DeviceProfile.CodecProfiles">codecs</see> (video and/or audio, including codec profiles and levels)
 * the device is able to direct play (without transcoding or remuxing),
 * as well as which <see cref="P:MediaBrowser.Model.Dlna.DeviceProfile.TranscodingProfiles">containers/codecs to transcode to</see> in case it isn't.
 */
export interface DeviceProfile {
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
  DirectPlayProfiles?: DirectPlayProfile[];
  /** Gets or sets the transcoding profiles. */
  TranscodingProfiles?: TranscodingProfile[];
  /** Gets or sets the container profiles. Failing to meet these optional conditions causes transcoding to occur. */
  ContainerProfiles?: ContainerProfile[];
  /** Gets or sets the codec profiles. */
  CodecProfiles?: CodecProfile[];
  /** Gets or sets the subtitle profiles. */
  SubtitleProfiles?: SubtitleProfile[];
}

/** Defines the MediaBrowser.Model.Dlna.DirectPlayProfile. */
export interface DirectPlayProfile {
  /** Gets or sets the container. */
  Container?: string;
  /** Gets or sets the audio codec. */
  AudioCodec?: string | null;
  /** Gets or sets the video codec. */
  VideoCodec?: string | null;
  /** Gets or sets the Dlna profile type. */
  Type?: 'Audio' | 'Video' | 'Photo' | 'Subtitle' | 'Lyric';
}

/** Defines the display preferences for any item that supports them (usually Folders). */
export interface DisplayPreferencesDto {
  /** Gets or sets the user id. */
  Id?: string | null;
  /** Gets or sets the type of the view. */
  ViewType?: string | null;
  /** Gets or sets the sort by. */
  SortBy?: string | null;
  /** Gets or sets the index by. */
  IndexBy?: string | null;
  /** Gets or sets a value indicating whether [remember indexing]. */
  RememberIndexing?: boolean;
  /**
   * Gets or sets the height of the primary image.
   * @format int32
   */
  PrimaryImageHeight?: number;
  /**
   * Gets or sets the width of the primary image.
   * @format int32
   */
  PrimaryImageWidth?: number;
  /** Gets or sets the custom prefs. */
  CustomPrefs?: Record<string, string | null>;
  /** An enum representing the axis that should be scrolled. */
  ScrollDirection?: 'Horizontal' | 'Vertical';
  /** Gets or sets a value indicating whether to show backdrops on this item. */
  ShowBackdrop?: boolean;
  /** Gets or sets a value indicating whether [remember sorting]. */
  RememberSorting?: boolean;
  /** An enum representing the sorting order. */
  SortOrder?: 'Ascending' | 'Descending';
  /** Gets or sets a value indicating whether [show sidebar]. */
  ShowSidebar?: boolean;
  /** Gets or sets the client. */
  Client?: string | null;
}

export enum DlnaProfileType {
  Audio = 'Audio',
  Video = 'Video',
  Photo = 'Photo',
  Subtitle = 'Subtitle',
  Lyric = 'Lyric',
}

/** An enum representing an algorithm to downmix surround sound to stereo. */
export enum DownMixStereoAlgorithms {
  None = 'None',
  Dave750 = 'Dave750',
  NightmodeDialogue = 'NightmodeDialogue',
  Rfc7845 = 'Rfc7845',
  Ac4 = 'Ac4',
}

/** An enum that represents a day of the week, weekdays, weekends, or all days. */
export enum DynamicDayOfWeek {
  Sunday = 'Sunday',
  Monday = 'Monday',
  Tuesday = 'Tuesday',
  Wednesday = 'Wednesday',
  Thursday = 'Thursday',
  Friday = 'Friday',
  Saturday = 'Saturday',
  Everyday = 'Everyday',
  Weekday = 'Weekday',
  Weekend = 'Weekend',
}

/** An enum representing the options to disable embedded subs. */
export enum EmbeddedSubtitleOptions {
  AllowAll = 'AllowAll',
  AllowText = 'AllowText',
  AllowImage = 'AllowImage',
  AllowNone = 'AllowNone',
}

/** Enum containing encoder presets. */
export enum EncoderPreset {
  Auto = 'auto',
  Placebo = 'placebo',
  Veryslow = 'veryslow',
  Slower = 'slower',
  Slow = 'slow',
  Medium = 'medium',
  Fast = 'fast',
  Faster = 'faster',
  Veryfast = 'veryfast',
  Superfast = 'superfast',
  Ultrafast = 'ultrafast',
}

export enum EncodingContext {
  Streaming = 'Streaming',
  Static = 'Static',
}

/** Class EncodingOptions. */
export interface EncodingOptions {
  /**
   * Gets or sets the thread count used for encoding.
   * @format int32
   */
  EncodingThreadCount?: number;
  /** Gets or sets the temporary transcoding path. */
  TranscodingTempPath?: string | null;
  /** Gets or sets the path to the fallback font. */
  FallbackFontPath?: string | null;
  /** Gets or sets a value indicating whether to use the fallback font. */
  EnableFallbackFont?: boolean;
  /** Gets or sets a value indicating whether audio VBR is enabled. */
  EnableAudioVbr?: boolean;
  /**
   * Gets or sets the audio boost applied when downmixing audio.
   * @format double
   */
  DownMixAudioBoost?: number;
  /** Gets or sets the algorithm used for downmixing audio to stereo. */
  DownMixStereoAlgorithm?: 'None' | 'Dave750' | 'NightmodeDialogue' | 'Rfc7845' | 'Ac4';
  /**
   * Gets or sets the maximum size of the muxing queue.
   * @format int32
   */
  MaxMuxingQueueSize?: number;
  /** Gets or sets a value indicating whether throttling is enabled. */
  EnableThrottling?: boolean;
  /**
   * Gets or sets the delay after which throttling happens.
   * @format int32
   */
  ThrottleDelaySeconds?: number;
  /** Gets or sets a value indicating whether segment deletion is enabled. */
  EnableSegmentDeletion?: boolean;
  /**
   * Gets or sets seconds for which segments should be kept before being deleted.
   * @format int32
   */
  SegmentKeepSeconds?: number;
  /** Gets or sets the hardware acceleration type. */
  HardwareAccelerationType?: 'none' | 'amf' | 'qsv' | 'nvenc' | 'v4l2m2m' | 'vaapi' | 'videotoolbox' | 'rkmpp';
  /** Gets or sets the FFmpeg path as set by the user via the UI. */
  EncoderAppPath?: string | null;
  /** Gets or sets the current FFmpeg path being used by the system and displayed on the transcode page. */
  EncoderAppPathDisplay?: string | null;
  /** Gets or sets the VA-API device. */
  VaapiDevice?: string | null;
  /** Gets or sets the QSV device. */
  QsvDevice?: string | null;
  /** Gets or sets a value indicating whether tonemapping is enabled. */
  EnableTonemapping?: boolean;
  /** Gets or sets a value indicating whether VPP tonemapping is enabled. */
  EnableVppTonemapping?: boolean;
  /** Gets or sets a value indicating whether videotoolbox tonemapping is enabled. */
  EnableVideoToolboxTonemapping?: boolean;
  /** Gets or sets the tone-mapping algorithm. */
  TonemappingAlgorithm?: 'none' | 'clip' | 'linear' | 'gamma' | 'reinhard' | 'hable' | 'mobius' | 'bt2390';
  /** Gets or sets the tone-mapping mode. */
  TonemappingMode?: 'auto' | 'max' | 'rgb' | 'lum' | 'itp';
  /** Gets or sets the tone-mapping range. */
  TonemappingRange?: 'auto' | 'tv' | 'pc';
  /**
   * Gets or sets the tone-mapping desaturation.
   * @format double
   */
  TonemappingDesat?: number;
  /**
   * Gets or sets the tone-mapping peak.
   * @format double
   */
  TonemappingPeak?: number;
  /**
   * Gets or sets the tone-mapping parameters.
   * @format double
   */
  TonemappingParam?: number;
  /**
   * Gets or sets the VPP tone-mapping brightness.
   * @format double
   */
  VppTonemappingBrightness?: number;
  /**
   * Gets or sets the VPP tone-mapping contrast.
   * @format double
   */
  VppTonemappingContrast?: number;
  /**
   * Gets or sets the H264 CRF.
   * @format int32
   */
  H264Crf?: number;
  /**
   * Gets or sets the H265 CRF.
   * @format int32
   */
  H265Crf?: number;
  /** Gets or sets the encoder preset. */
  EncoderPreset?:
    | 'auto'
    | 'placebo'
    | 'veryslow'
    | 'slower'
    | 'slow'
    | 'medium'
    | 'fast'
    | 'faster'
    | 'veryfast'
    | 'superfast'
    | 'ultrafast'
    | null;
  /** Gets or sets a value indicating whether the framerate is doubled when deinterlacing. */
  DeinterlaceDoubleRate?: boolean;
  /** Gets or sets the deinterlace method. */
  DeinterlaceMethod?: 'yadif' | 'bwdif';
  /** Gets or sets a value indicating whether 10bit HEVC decoding is enabled. */
  EnableDecodingColorDepth10Hevc?: boolean;
  /** Gets or sets a value indicating whether 10bit VP9 decoding is enabled. */
  EnableDecodingColorDepth10Vp9?: boolean;
  /** Gets or sets a value indicating whether 8/10bit HEVC RExt decoding is enabled. */
  EnableDecodingColorDepth10HevcRext?: boolean;
  /** Gets or sets a value indicating whether 12bit HEVC RExt decoding is enabled. */
  EnableDecodingColorDepth12HevcRext?: boolean;
  /** Gets or sets a value indicating whether the enhanced NVDEC is enabled. */
  EnableEnhancedNvdecDecoder?: boolean;
  /** Gets or sets a value indicating whether the system native hardware decoder should be used. */
  PreferSystemNativeHwDecoder?: boolean;
  /** Gets or sets a value indicating whether the Intel H264 low-power hardware encoder should be used. */
  EnableIntelLowPowerH264HwEncoder?: boolean;
  /** Gets or sets a value indicating whether the Intel HEVC low-power hardware encoder should be used. */
  EnableIntelLowPowerHevcHwEncoder?: boolean;
  /** Gets or sets a value indicating whether hardware encoding is enabled. */
  EnableHardwareEncoding?: boolean;
  /** Gets or sets a value indicating whether HEVC encoding is enabled. */
  AllowHevcEncoding?: boolean;
  /** Gets or sets a value indicating whether AV1 encoding is enabled. */
  AllowAv1Encoding?: boolean;
  /** Gets or sets a value indicating whether subtitle extraction is enabled. */
  EnableSubtitleExtraction?: boolean;
  /** Gets or sets the codecs hardware encoding is used for. */
  HardwareDecodingCodecs?: string[] | null;
  /** Gets or sets the file extensions on-demand metadata based keyframe extraction is enabled for. */
  AllowOnDemandMetadataBasedKeyframeExtractionForExtensions?: string[] | null;
}

export interface EndPointInfo {
  IsLocal?: boolean;
  IsInNetwork?: boolean;
}

/** Represents the external id information for serialization to the client. */
export interface ExternalIdInfo {
  /** Gets or sets the display name of the external id provider (IE: IMDB, MusicBrainz, etc). */
  Name?: string;
  /** Gets or sets the unique key for this id. This key should be unique across all providers. */
  Key?: string;
  /**
   * Gets or sets the specific media type for this id. This is used to distinguish between the different
   * external id types for providers with multiple ids.
   * A null value indicates there is no specific media type associated with the external id, or this is the
   * default id for the external provider so there is no need to specify a type.
   */
  Type?:
    | 'Album'
    | 'AlbumArtist'
    | 'Artist'
    | 'BoxSet'
    | 'Episode'
    | 'Movie'
    | 'OtherArtist'
    | 'Person'
    | 'ReleaseGroup'
    | 'Season'
    | 'Series'
    | 'Track'
    | 'Book'
    | null;
  /**
   * Gets or sets the URL format string.
   * @deprecated
   */
  UrlFormatString?: string | null;
}

/** The specific media type of an MediaBrowser.Model.Providers.ExternalIdInfo. */
export enum ExternalIdMediaType {
  Album = 'Album',
  AlbumArtist = 'AlbumArtist',
  Artist = 'Artist',
  BoxSet = 'BoxSet',
  Episode = 'Episode',
  Movie = 'Movie',
  OtherArtist = 'OtherArtist',
  Person = 'Person',
  ReleaseGroup = 'ReleaseGroup',
  Season = 'Season',
  Series = 'Series',
  Track = 'Track',
  Book = 'Book',
}

export interface ExternalUrl {
  /** Gets or sets the name. */
  Name?: string | null;
  /** Gets or sets the type of the item. */
  Url?: string | null;
}

export enum ExtraType {
  Unknown = 'Unknown',
  Clip = 'Clip',
  Trailer = 'Trailer',
  BehindTheScenes = 'BehindTheScenes',
  DeletedScene = 'DeletedScene',
  Interview = 'Interview',
  Scene = 'Scene',
  Sample = 'Sample',
  ThemeSong = 'ThemeSong',
  ThemeVideo = 'ThemeVideo',
  Featurette = 'Featurette',
  Short = 'Short',
}

/** Class FileSystemEntryInfo. */
export interface FileSystemEntryInfo {
  /** Gets the name. */
  Name?: string;
  /** Gets the path. */
  Path?: string;
  /** Gets the type. */
  Type?: 'File' | 'Directory' | 'NetworkComputer' | 'NetworkShare';
}

/** Enum FileSystemEntryType. */
export enum FileSystemEntryType {
  File = 'File',
  Directory = 'Directory',
  NetworkComputer = 'NetworkComputer',
  NetworkShare = 'NetworkShare',
}

/** Class FontFile. */
export interface FontFile {
  /** Gets or sets the name. */
  Name?: string | null;
  /**
   * Gets or sets the size.
   * @format int64
   */
  Size?: number;
  /**
   * Gets or sets the date created.
   * @format date-time
   */
  DateCreated?: string;
  /**
   * Gets or sets the date modified.
   * @format date-time
   */
  DateModified?: string;
}

/** Force keep alive websocket messages. */
export interface ForceKeepAliveMessage {
  /**
   * Gets or sets the data.
   * @format int32
   */
  Data?: number;
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "ForceKeepAlive"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

export enum ForgotPasswordAction {
  ContactAdmin = 'ContactAdmin',
  PinCode = 'PinCode',
  InNetworkRequired = 'InNetworkRequired',
}

/** Forgot Password request body DTO. */
export interface ForgotPasswordDto {
  /** Gets or sets the entered username to have its password reset. */
  EnteredUsername: string;
}

/** Forgot Password Pin enter request body DTO. */
export interface ForgotPasswordPinDto {
  /** Gets or sets the entered pin to have the password reset. */
  Pin: string;
}

export interface ForgotPasswordResult {
  /** Gets or sets the action. */
  Action?: 'ContactAdmin' | 'PinCode' | 'InNetworkRequired';
  /** Gets or sets the pin file. */
  PinFile?: string | null;
  /**
   * Gets or sets the pin expiration date.
   * @format date-time
   */
  PinExpirationDate?: string | null;
}

export interface GeneralCommand {
  /** This exists simply to identify a set of known commands. */
  Name?:
    | 'MoveUp'
    | 'MoveDown'
    | 'MoveLeft'
    | 'MoveRight'
    | 'PageUp'
    | 'PageDown'
    | 'PreviousLetter'
    | 'NextLetter'
    | 'ToggleOsd'
    | 'ToggleContextMenu'
    | 'Select'
    | 'Back'
    | 'TakeScreenshot'
    | 'SendKey'
    | 'SendString'
    | 'GoHome'
    | 'GoToSettings'
    | 'VolumeUp'
    | 'VolumeDown'
    | 'Mute'
    | 'Unmute'
    | 'ToggleMute'
    | 'SetVolume'
    | 'SetAudioStreamIndex'
    | 'SetSubtitleStreamIndex'
    | 'ToggleFullscreen'
    | 'DisplayContent'
    | 'GoToSearch'
    | 'DisplayMessage'
    | 'SetRepeatMode'
    | 'ChannelUp'
    | 'ChannelDown'
    | 'Guide'
    | 'ToggleStats'
    | 'PlayMediaSource'
    | 'PlayTrailers'
    | 'SetShuffleQueue'
    | 'PlayState'
    | 'PlayNext'
    | 'ToggleOsdMenu'
    | 'Play'
    | 'SetMaxStreamingBitrate'
    | 'SetPlaybackOrder';
  /** @format uuid */
  ControllingUserId?: string;
  Arguments?: Record<string, string | null>;
}

/** General command websocket message. */
export interface GeneralCommandMessage {
  /** Gets or sets the data. */
  Data?: GeneralCommand | null;
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "GeneralCommand"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** This exists simply to identify a set of known commands. */
export enum GeneralCommandType {
  MoveUp = 'MoveUp',
  MoveDown = 'MoveDown',
  MoveLeft = 'MoveLeft',
  MoveRight = 'MoveRight',
  PageUp = 'PageUp',
  PageDown = 'PageDown',
  PreviousLetter = 'PreviousLetter',
  NextLetter = 'NextLetter',
  ToggleOsd = 'ToggleOsd',
  ToggleContextMenu = 'ToggleContextMenu',
  Select = 'Select',
  Back = 'Back',
  TakeScreenshot = 'TakeScreenshot',
  SendKey = 'SendKey',
  SendString = 'SendString',
  GoHome = 'GoHome',
  GoToSettings = 'GoToSettings',
  VolumeUp = 'VolumeUp',
  VolumeDown = 'VolumeDown',
  Mute = 'Mute',
  Unmute = 'Unmute',
  ToggleMute = 'ToggleMute',
  SetVolume = 'SetVolume',
  SetAudioStreamIndex = 'SetAudioStreamIndex',
  SetSubtitleStreamIndex = 'SetSubtitleStreamIndex',
  ToggleFullscreen = 'ToggleFullscreen',
  DisplayContent = 'DisplayContent',
  GoToSearch = 'GoToSearch',
  DisplayMessage = 'DisplayMessage',
  SetRepeatMode = 'SetRepeatMode',
  ChannelUp = 'ChannelUp',
  ChannelDown = 'ChannelDown',
  Guide = 'Guide',
  ToggleStats = 'ToggleStats',
  PlayMediaSource = 'PlayMediaSource',
  PlayTrailers = 'PlayTrailers',
  SetShuffleQueue = 'SetShuffleQueue',
  PlayState = 'PlayState',
  PlayNext = 'PlayNext',
  ToggleOsdMenu = 'ToggleOsdMenu',
  Play = 'Play',
  SetMaxStreamingBitrate = 'SetMaxStreamingBitrate',
  SetPlaybackOrder = 'SetPlaybackOrder',
}

/** Get programs dto. */
export interface GetProgramsDto {
  /** Gets or sets the channels to return guide information for. */
  ChannelIds?: string[] | null;
  /**
   * Gets or sets optional. Filter by user id.
   * @format uuid
   */
  UserId?: string | null;
  /**
   * Gets or sets the minimum premiere start date.
   * @format date-time
   */
  MinStartDate?: string | null;
  /** Gets or sets filter by programs that have completed airing, or not. */
  HasAired?: boolean | null;
  /** Gets or sets filter by programs that are currently airing, or not. */
  IsAiring?: boolean | null;
  /**
   * Gets or sets the maximum premiere start date.
   * @format date-time
   */
  MaxStartDate?: string | null;
  /**
   * Gets or sets the minimum premiere end date.
   * @format date-time
   */
  MinEndDate?: string | null;
  /**
   * Gets or sets the maximum premiere end date.
   * @format date-time
   */
  MaxEndDate?: string | null;
  /** Gets or sets filter for movies. */
  IsMovie?: boolean | null;
  /** Gets or sets filter for series. */
  IsSeries?: boolean | null;
  /** Gets or sets filter for news. */
  IsNews?: boolean | null;
  /** Gets or sets filter for kids. */
  IsKids?: boolean | null;
  /** Gets or sets filter for sports. */
  IsSports?: boolean | null;
  /**
   * Gets or sets the record index to start at. All items with a lower index will be dropped from the results.
   * @format int32
   */
  StartIndex?: number | null;
  /**
   * Gets or sets the maximum number of records to return.
   * @format int32
   */
  Limit?: number | null;
  /** Gets or sets specify one or more sort orders, comma delimited. Options: Name, StartDate. */
  SortBy?: ItemSortBy[] | null;
  /** Gets or sets sort order. */
  SortOrder?: SortOrder[] | null;
  /** Gets or sets the genres to return guide information for. */
  Genres?: string[] | null;
  /** Gets or sets the genre ids to return guide information for. */
  GenreIds?: string[] | null;
  /** Gets or sets include image information in output. */
  EnableImages?: boolean | null;
  /**
   * Gets or sets a value indicating whether retrieve total record count.
   * @default true
   */
  EnableTotalRecordCount?: boolean;
  /**
   * Gets or sets the max number of images to return, per image type.
   * @format int32
   */
  ImageTypeLimit?: number | null;
  /** Gets or sets the image types to include in the output. */
  EnableImageTypes?: ImageType[] | null;
  /** Gets or sets include user data. */
  EnableUserData?: boolean | null;
  /** Gets or sets filter by series timer id. */
  SeriesTimerId?: string | null;
  /**
   * Gets or sets filter by library series id.
   * @format uuid
   */
  LibrarySeriesId?: string | null;
  /** Gets or sets specify additional fields of information to return in the output. */
  Fields?: ItemFields[] | null;
}

/** Class GroupInfoDto. */
export interface GroupInfoDto {
  /**
   * Gets the group identifier.
   * @format uuid
   */
  GroupId?: string;
  /** Gets the group name. */
  GroupName?: string;
  /** Gets the group state. */
  State?: 'Idle' | 'Waiting' | 'Paused' | 'Playing';
  /** Gets the participants. */
  Participants?: string[];
  /**
   * Gets the date when this DTO has been created.
   * @format date-time
   */
  LastUpdatedAt?: string;
}

/** Class GroupUpdate. */
export interface GroupInfoDtoGroupUpdate {
  /**
   * Gets the group identifier.
   * @format uuid
   */
  GroupId?: string;
  /** Gets the update type. */
  Type?:
    | 'UserJoined'
    | 'UserLeft'
    | 'GroupJoined'
    | 'GroupLeft'
    | 'StateUpdate'
    | 'PlayQueue'
    | 'NotInGroup'
    | 'GroupDoesNotExist'
    | 'CreateGroupDenied'
    | 'JoinGroupDenied'
    | 'LibraryAccessDenied';
  /** Gets the update data. */
  Data?: GroupInfoDto;
}

/** Enum GroupQueueMode. */
export enum GroupQueueMode {
  Queue = 'Queue',
  QueueNext = 'QueueNext',
}

/** Enum GroupRepeatMode. */
export enum GroupRepeatMode {
  RepeatOne = 'RepeatOne',
  RepeatAll = 'RepeatAll',
  RepeatNone = 'RepeatNone',
}

/** Enum GroupShuffleMode. */
export enum GroupShuffleMode {
  Sorted = 'Sorted',
  Shuffle = 'Shuffle',
}

/** Enum GroupState. */
export enum GroupStateType {
  Idle = 'Idle',
  Waiting = 'Waiting',
  Paused = 'Paused',
  Playing = 'Playing',
}

/** Class GroupStateUpdate. */
export interface GroupStateUpdate {
  /** Gets the state of the group. */
  State?: 'Idle' | 'Waiting' | 'Paused' | 'Playing';
  /** Gets the reason of the state change. */
  Reason?:
    | 'Play'
    | 'SetPlaylistItem'
    | 'RemoveFromPlaylist'
    | 'MovePlaylistItem'
    | 'Queue'
    | 'Unpause'
    | 'Pause'
    | 'Stop'
    | 'Seek'
    | 'Buffer'
    | 'Ready'
    | 'NextItem'
    | 'PreviousItem'
    | 'SetRepeatMode'
    | 'SetShuffleMode'
    | 'Ping'
    | 'IgnoreWait';
}

/** Class GroupUpdate. */
export interface GroupStateUpdateGroupUpdate {
  /**
   * Gets the group identifier.
   * @format uuid
   */
  GroupId?: string;
  /** Gets the update type. */
  Type?:
    | 'UserJoined'
    | 'UserLeft'
    | 'GroupJoined'
    | 'GroupLeft'
    | 'StateUpdate'
    | 'PlayQueue'
    | 'NotInGroup'
    | 'GroupDoesNotExist'
    | 'CreateGroupDenied'
    | 'JoinGroupDenied'
    | 'LibraryAccessDenied';
  /** Gets the update data. */
  Data?: GroupStateUpdate;
}

/** Group update without data. */
export type GroupUpdate = BaseGroupUpdate &
  (
    | BaseGroupUpdateTypeMapping<'UserJoined', StringGroupUpdate>
    | BaseGroupUpdateTypeMapping<'UserLeft', StringGroupUpdate>
    | BaseGroupUpdateTypeMapping<'GroupJoined', GroupInfoDtoGroupUpdate>
    | BaseGroupUpdateTypeMapping<'GroupLeft', StringGroupUpdate>
    | BaseGroupUpdateTypeMapping<'StateUpdate', GroupStateUpdateGroupUpdate>
    | BaseGroupUpdateTypeMapping<'PlayQueue', PlayQueueUpdateGroupUpdate>
    | BaseGroupUpdateTypeMapping<'NotInGroup', StringGroupUpdate>
    | BaseGroupUpdateTypeMapping<'GroupDoesNotExist', StringGroupUpdate>
    | BaseGroupUpdateTypeMapping<'LibraryAccessDenied', StringGroupUpdate>
  );

/** Enum GroupUpdateType. */
export enum GroupUpdateType {
  UserJoined = 'UserJoined',
  UserLeft = 'UserLeft',
  GroupJoined = 'GroupJoined',
  GroupLeft = 'GroupLeft',
  StateUpdate = 'StateUpdate',
  PlayQueue = 'PlayQueue',
  NotInGroup = 'NotInGroup',
  GroupDoesNotExist = 'GroupDoesNotExist',
  CreateGroupDenied = 'CreateGroupDenied',
  JoinGroupDenied = 'JoinGroupDenied',
  LibraryAccessDenied = 'LibraryAccessDenied',
}

export interface GuideInfo {
  /**
   * Gets or sets the start date.
   * @format date-time
   */
  StartDate?: string;
  /**
   * Gets or sets the end date.
   * @format date-time
   */
  EndDate?: string;
}

/** Enum containing hardware acceleration types. */
export enum HardwareAccelerationType {
  None = 'none',
  Amf = 'amf',
  Qsv = 'qsv',
  Nvenc = 'nvenc',
  V4L2M2M = 'v4l2m2m',
  Vaapi = 'vaapi',
  Videotoolbox = 'videotoolbox',
  Rkmpp = 'rkmpp',
}

/** Class IgnoreWaitRequestDto. */
export interface IgnoreWaitRequestDto {
  /** Gets or sets a value indicating whether the client should be ignored. */
  IgnoreWait?: boolean;
}

/** Enum ImageOutputFormat. */
export enum ImageFormat {
  Bmp = 'Bmp',
  Gif = 'Gif',
  Jpg = 'Jpg',
  Png = 'Png',
  Webp = 'Webp',
  Svg = 'Svg',
}

/** Class ImageInfo. */
export interface ImageInfo {
  /** Gets or sets the type of the image. */
  ImageType?:
    | 'Primary'
    | 'Art'
    | 'Backdrop'
    | 'Banner'
    | 'Logo'
    | 'Thumb'
    | 'Disc'
    | 'Box'
    | 'Screenshot'
    | 'Menu'
    | 'Chapter'
    | 'BoxRear'
    | 'Profile';
  /**
   * Gets or sets the index of the image.
   * @format int32
   */
  ImageIndex?: number | null;
  /** Gets or sets the image tag. */
  ImageTag?: string | null;
  /** Gets or sets the path. */
  Path?: string | null;
  /** Gets or sets the blurhash. */
  BlurHash?: string | null;
  /**
   * Gets or sets the height.
   * @format int32
   */
  Height?: number | null;
  /**
   * Gets or sets the width.
   * @format int32
   */
  Width?: number | null;
  /**
   * Gets or sets the size.
   * @format int64
   */
  Size?: number;
}

export interface ImageOption {
  /** Gets or sets the type. */
  Type?:
    | 'Primary'
    | 'Art'
    | 'Backdrop'
    | 'Banner'
    | 'Logo'
    | 'Thumb'
    | 'Disc'
    | 'Box'
    | 'Screenshot'
    | 'Menu'
    | 'Chapter'
    | 'BoxRear'
    | 'Profile';
  /**
   * Gets or sets the limit.
   * @format int32
   */
  Limit?: number;
  /**
   * Gets or sets the minimum width.
   * @format int32
   */
  MinWidth?: number;
}

export enum ImageOrientation {
  TopLeft = 'TopLeft',
  TopRight = 'TopRight',
  BottomRight = 'BottomRight',
  BottomLeft = 'BottomLeft',
  LeftTop = 'LeftTop',
  RightTop = 'RightTop',
  RightBottom = 'RightBottom',
  LeftBottom = 'LeftBottom',
}

/** Class ImageProviderInfo. */
export interface ImageProviderInfo {
  /** Gets the name. */
  Name?: string;
  /** Gets the supported image types. */
  SupportedImages?: ImageType[];
}

/** Enum ImageResolution. */
export enum ImageResolution {
  MatchSource = 'MatchSource',
  P144 = 'P144',
  P240 = 'P240',
  P360 = 'P360',
  P480 = 'P480',
  P720 = 'P720',
  P1080 = 'P1080',
  P1440 = 'P1440',
  P2160 = 'P2160',
}

export enum ImageSavingConvention {
  Legacy = 'Legacy',
  Compatible = 'Compatible',
}

/** Enum ImageType. */
export enum ImageType {
  Primary = 'Primary',
  Art = 'Art',
  Backdrop = 'Backdrop',
  Banner = 'Banner',
  Logo = 'Logo',
  Thumb = 'Thumb',
  Disc = 'Disc',
  Box = 'Box',
  Screenshot = 'Screenshot',
  Menu = 'Menu',
  Chapter = 'Chapter',
  BoxRear = 'BoxRear',
  Profile = 'Profile',
}

/** Keep alive websocket messages. */
export interface InboundKeepAliveMessage {
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "KeepAlive"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** Represents the list of possible inbound websocket types */
export type InboundWebSocketMessage = BaseInboundWebSocketMessage &
  (
    | BaseInboundWebSocketMessageMessageTypeMapping<'ActivityLogEntryStart', ActivityLogEntryStartMessage>
    | BaseInboundWebSocketMessageMessageTypeMapping<'ActivityLogEntryStop', ActivityLogEntryStopMessage>
    | BaseInboundWebSocketMessageMessageTypeMapping<'KeepAlive', InboundKeepAliveMessage>
    | BaseInboundWebSocketMessageMessageTypeMapping<'ScheduledTasksInfoStart', ScheduledTasksInfoStartMessage>
    | BaseInboundWebSocketMessageMessageTypeMapping<'ScheduledTasksInfoStop', ScheduledTasksInfoStopMessage>
    | BaseInboundWebSocketMessageMessageTypeMapping<'SessionsStart', SessionsStartMessage>
    | BaseInboundWebSocketMessageMessageTypeMapping<'SessionsStop', SessionsStopMessage>
  );

/** Class InstallationInfo. */
export interface InstallationInfo {
  /**
   * Gets or sets the Id.
   * @format uuid
   */
  Guid?: string;
  /** Gets or sets the name. */
  Name?: string | null;
  /** Gets or sets the version. */
  Version?: string | null;
  /** Gets or sets the changelog for this version. */
  Changelog?: string | null;
  /** Gets or sets the source URL. */
  SourceUrl?: string | null;
  /** Gets or sets a checksum for the binary. */
  Checksum?: string | null;
  /** Gets or sets package information for the installation. */
  PackageInfo?: PackageInfo | null;
}

/** Defines the MediaBrowser.Common.Plugins.IPlugin. */
export interface IPlugin {
  /** Gets the name of the plugin. */
  Name?: string | null;
  /** Gets the Description. */
  Description?: string | null;
  /**
   * Gets the unique id.
   * @format uuid
   */
  Id?: string;
  /** Gets the plugin version. */
  Version?: string | null;
  /** Gets the path to the assembly file. */
  AssemblyFilePath?: string | null;
  /** Gets a value indicating whether the plugin can be uninstalled. */
  CanUninstall?: boolean;
  /** Gets the full path to the data folder, where the plugin can store any miscellaneous files needed. */
  DataFolderPath?: string | null;
}

/** Enum IsoType. */
export enum IsoType {
  Dvd = 'Dvd',
  BluRay = 'BluRay',
}

/** Class LibrarySummary. */
export interface ItemCounts {
  /**
   * Gets or sets the movie count.
   * @format int32
   */
  MovieCount?: number;
  /**
   * Gets or sets the series count.
   * @format int32
   */
  SeriesCount?: number;
  /**
   * Gets or sets the episode count.
   * @format int32
   */
  EpisodeCount?: number;
  /**
   * Gets or sets the artist count.
   * @format int32
   */
  ArtistCount?: number;
  /**
   * Gets or sets the program count.
   * @format int32
   */
  ProgramCount?: number;
  /**
   * Gets or sets the trailer count.
   * @format int32
   */
  TrailerCount?: number;
  /**
   * Gets or sets the song count.
   * @format int32
   */
  SongCount?: number;
  /**
   * Gets or sets the album count.
   * @format int32
   */
  AlbumCount?: number;
  /**
   * Gets or sets the music video count.
   * @format int32
   */
  MusicVideoCount?: number;
  /**
   * Gets or sets the box set count.
   * @format int32
   */
  BoxSetCount?: number;
  /**
   * Gets or sets the book count.
   * @format int32
   */
  BookCount?: number;
  /**
   * Gets or sets the item count.
   * @format int32
   */
  ItemCount?: number;
}

/** Used to control the data that gets attached to DtoBaseItems. */
export enum ItemFields {
  AirTime = 'AirTime',
  CanDelete = 'CanDelete',
  CanDownload = 'CanDownload',
  ChannelInfo = 'ChannelInfo',
  Chapters = 'Chapters',
  Trickplay = 'Trickplay',
  ChildCount = 'ChildCount',
  CumulativeRunTimeTicks = 'CumulativeRunTimeTicks',
  CustomRating = 'CustomRating',
  DateCreated = 'DateCreated',
  DateLastMediaAdded = 'DateLastMediaAdded',
  DisplayPreferencesId = 'DisplayPreferencesId',
  Etag = 'Etag',
  ExternalUrls = 'ExternalUrls',
  Genres = 'Genres',
  HomePageUrl = 'HomePageUrl',
  ItemCounts = 'ItemCounts',
  MediaSourceCount = 'MediaSourceCount',
  MediaSources = 'MediaSources',
  OriginalTitle = 'OriginalTitle',
  Overview = 'Overview',
  ParentId = 'ParentId',
  Path = 'Path',
  People = 'People',
  PlayAccess = 'PlayAccess',
  ProductionLocations = 'ProductionLocations',
  ProviderIds = 'ProviderIds',
  PrimaryImageAspectRatio = 'PrimaryImageAspectRatio',
  RecursiveItemCount = 'RecursiveItemCount',
  Settings = 'Settings',
  ScreenshotImageTags = 'ScreenshotImageTags',
  SeriesPrimaryImage = 'SeriesPrimaryImage',
  SeriesStudio = 'SeriesStudio',
  SortName = 'SortName',
  SpecialEpisodeNumbers = 'SpecialEpisodeNumbers',
  Studios = 'Studios',
  Taglines = 'Taglines',
  Tags = 'Tags',
  RemoteTrailers = 'RemoteTrailers',
  MediaStreams = 'MediaStreams',
  SeasonUserData = 'SeasonUserData',
  ServiceName = 'ServiceName',
  ThemeSongIds = 'ThemeSongIds',
  ThemeVideoIds = 'ThemeVideoIds',
  ExternalEtag = 'ExternalEtag',
  PresentationUniqueKey = 'PresentationUniqueKey',
  InheritedParentalRatingValue = 'InheritedParentalRatingValue',
  ExternalSeriesId = 'ExternalSeriesId',
  SeriesPresentationUniqueKey = 'SeriesPresentationUniqueKey',
  DateLastRefreshed = 'DateLastRefreshed',
  DateLastSaved = 'DateLastSaved',
  RefreshState = 'RefreshState',
  ChannelImage = 'ChannelImage',
  EnableMediaSourceDisplay = 'EnableMediaSourceDisplay',
  Width = 'Width',
  Height = 'Height',
  ExtraIds = 'ExtraIds',
  LocalTrailerCount = 'LocalTrailerCount',
  IsHD = 'IsHD',
  SpecialFeatureCount = 'SpecialFeatureCount',
}

/** Enum ItemFilter. */
export enum ItemFilter {
  IsFolder = 'IsFolder',
  IsNotFolder = 'IsNotFolder',
  IsUnplayed = 'IsUnplayed',
  IsPlayed = 'IsPlayed',
  IsFavorite = 'IsFavorite',
  IsResumable = 'IsResumable',
  Likes = 'Likes',
  Dislikes = 'Dislikes',
  IsFavoriteOrLikes = 'IsFavoriteOrLikes',
}

/** These represent sort orders. */
export enum ItemSortBy {
  Default = 'Default',
  AiredEpisodeOrder = 'AiredEpisodeOrder',
  Album = 'Album',
  AlbumArtist = 'AlbumArtist',
  Artist = 'Artist',
  DateCreated = 'DateCreated',
  OfficialRating = 'OfficialRating',
  DatePlayed = 'DatePlayed',
  PremiereDate = 'PremiereDate',
  StartDate = 'StartDate',
  SortName = 'SortName',
  Name = 'Name',
  Random = 'Random',
  Runtime = 'Runtime',
  CommunityRating = 'CommunityRating',
  ProductionYear = 'ProductionYear',
  PlayCount = 'PlayCount',
  CriticRating = 'CriticRating',
  IsFolder = 'IsFolder',
  IsUnplayed = 'IsUnplayed',
  IsPlayed = 'IsPlayed',
  SeriesSortName = 'SeriesSortName',
  VideoBitRate = 'VideoBitRate',
  AirTime = 'AirTime',
  Studio = 'Studio',
  IsFavoriteOrLiked = 'IsFavoriteOrLiked',
  DateLastContentAdded = 'DateLastContentAdded',
  SeriesDatePlayed = 'SeriesDatePlayed',
  ParentIndexNumber = 'ParentIndexNumber',
  IndexNumber = 'IndexNumber',
  SimilarityScore = 'SimilarityScore',
  SearchScore = 'SearchScore',
}

/** Class JoinGroupRequestDto. */
export interface JoinGroupRequestDto {
  /**
   * Gets or sets the group identifier.
   * @format uuid
   */
  GroupId?: string;
}

export enum KeepUntil {
  UntilDeleted = 'UntilDeleted',
  UntilSpaceNeeded = 'UntilSpaceNeeded',
  UntilWatched = 'UntilWatched',
  UntilDate = 'UntilDate',
}

/** Library changed message. */
export interface LibraryChangedMessage {
  /** Class LibraryUpdateInfo. */
  Data?: LibraryUpdateInfo | null;
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "LibraryChanged"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** Library option info dto. */
export interface LibraryOptionInfoDto {
  /** Gets or sets name. */
  Name?: string | null;
  /** Gets or sets a value indicating whether default enabled. */
  DefaultEnabled?: boolean;
}

export interface LibraryOptions {
  Enabled?: boolean;
  EnablePhotos?: boolean;
  EnableRealtimeMonitor?: boolean;
  EnableLUFSScan?: boolean;
  EnableChapterImageExtraction?: boolean;
  ExtractChapterImagesDuringLibraryScan?: boolean;
  EnableTrickplayImageExtraction?: boolean;
  ExtractTrickplayImagesDuringLibraryScan?: boolean;
  PathInfos?: MediaPathInfo[];
  SaveLocalMetadata?: boolean;
  /** @deprecated */
  EnableInternetProviders?: boolean;
  EnableAutomaticSeriesGrouping?: boolean;
  EnableEmbeddedTitles?: boolean;
  EnableEmbeddedExtrasTitles?: boolean;
  EnableEmbeddedEpisodeInfos?: boolean;
  /** @format int32 */
  AutomaticRefreshIntervalDays?: number;
  /** Gets or sets the preferred metadata language. */
  PreferredMetadataLanguage?: string | null;
  /** Gets or sets the metadata country code. */
  MetadataCountryCode?: string | null;
  SeasonZeroDisplayName?: string;
  MetadataSavers?: string[] | null;
  DisabledLocalMetadataReaders?: string[];
  LocalMetadataReaderOrder?: string[] | null;
  DisabledSubtitleFetchers?: string[];
  SubtitleFetcherOrder?: string[];
  DisabledMediaSegmentProviders?: string[];
  MediaSegmentProvideOrder?: string[];
  SkipSubtitlesIfEmbeddedSubtitlesPresent?: boolean;
  SkipSubtitlesIfAudioTrackMatches?: boolean;
  SubtitleDownloadLanguages?: string[] | null;
  RequirePerfectSubtitleMatch?: boolean;
  SaveSubtitlesWithMedia?: boolean;
  /** @default false */
  SaveLyricsWithMedia?: boolean;
  /** @default false */
  SaveTrickplayWithMedia?: boolean;
  DisabledLyricFetchers?: string[];
  LyricFetcherOrder?: string[];
  /** @default false */
  PreferNonstandardArtistsTag?: boolean;
  /** @default false */
  UseCustomTagDelimiters?: boolean;
  CustomTagDelimiters?: string[];
  DelimiterWhitelist?: string[];
  AutomaticallyAddToCollection?: boolean;
  /** An enum representing the options to disable embedded subs. */
  AllowEmbeddedSubtitles?: 'AllowAll' | 'AllowText' | 'AllowImage' | 'AllowNone';
  TypeOptions?: TypeOptions[];
}

/** Library options result dto. */
export interface LibraryOptionsResultDto {
  /** Gets or sets the metadata savers. */
  MetadataSavers?: LibraryOptionInfoDto[];
  /** Gets or sets the metadata readers. */
  MetadataReaders?: LibraryOptionInfoDto[];
  /** Gets or sets the subtitle fetchers. */
  SubtitleFetchers?: LibraryOptionInfoDto[];
  /** Gets or sets the list of lyric fetchers. */
  LyricFetchers?: LibraryOptionInfoDto[];
  /** Gets or sets the type options. */
  TypeOptions?: LibraryTypeOptionsDto[];
}

/** Library type options dto. */
export interface LibraryTypeOptionsDto {
  /** Gets or sets the type. */
  Type?: string | null;
  /** Gets or sets the metadata fetchers. */
  MetadataFetchers?: LibraryOptionInfoDto[];
  /** Gets or sets the image fetchers. */
  ImageFetchers?: LibraryOptionInfoDto[];
  /** Gets or sets the supported image types. */
  SupportedImageTypes?: ImageType[];
  /** Gets or sets the default image options. */
  DefaultImageOptions?: ImageOption[];
}

/** Class LibraryUpdateInfo. */
export interface LibraryUpdateInfo {
  /** Gets or sets the folders added to. */
  FoldersAddedTo?: string[];
  /** Gets or sets the folders removed from. */
  FoldersRemovedFrom?: string[];
  /** Gets or sets the items added. */
  ItemsAdded?: string[];
  /** Gets or sets the items removed. */
  ItemsRemoved?: string[];
  /** Gets or sets the items updated. */
  ItemsUpdated?: string[];
  CollectionFolders?: string[];
  IsEmpty?: boolean;
}

export interface ListingsProviderInfo {
  Id?: string | null;
  Type?: string | null;
  Username?: string | null;
  Password?: string | null;
  ListingsId?: string | null;
  ZipCode?: string | null;
  Country?: string | null;
  Path?: string | null;
  EnabledTuners?: string[] | null;
  EnableAllTuners?: boolean;
  NewsCategories?: string[] | null;
  SportsCategories?: string[] | null;
  KidsCategories?: string[] | null;
  MovieCategories?: string[] | null;
  ChannelMappings?: NameValuePair[] | null;
  MoviePrefix?: string | null;
  PreferredLanguage?: string | null;
  UserAgent?: string | null;
}

export interface LiveStreamResponse {
  MediaSource?: MediaSourceInfo;
}

export interface LiveTvInfo {
  /** Gets or sets the services. */
  Services?: LiveTvServiceInfo[];
  /** Gets or sets a value indicating whether this instance is enabled. */
  IsEnabled?: boolean;
  /** Gets or sets the enabled users. */
  EnabledUsers?: string[];
}

export interface LiveTvOptions {
  /** @format int32 */
  GuideDays?: number | null;
  RecordingPath?: string | null;
  MovieRecordingPath?: string | null;
  SeriesRecordingPath?: string | null;
  EnableRecordingSubfolders?: boolean;
  EnableOriginalAudioWithEncodedRecordings?: boolean;
  TunerHosts?: TunerHostInfo[] | null;
  ListingProviders?: ListingsProviderInfo[] | null;
  /** @format int32 */
  PrePaddingSeconds?: number;
  /** @format int32 */
  PostPaddingSeconds?: number;
  MediaLocationsCreated?: string[] | null;
  RecordingPostProcessor?: string | null;
  RecordingPostProcessorArguments?: string | null;
  SaveRecordingNFO?: boolean;
  SaveRecordingImages?: boolean;
}

/** Class ServiceInfo. */
export interface LiveTvServiceInfo {
  /** Gets or sets the name. */
  Name?: string | null;
  /** Gets or sets the home page URL. */
  HomePageUrl?: string | null;
  /** Gets or sets the status. */
  Status?: 'Ok' | 'Unavailable';
  /** Gets or sets the status message. */
  StatusMessage?: string | null;
  /** Gets or sets the version. */
  Version?: string | null;
  /** Gets or sets a value indicating whether this instance has update available. */
  HasUpdateAvailable?: boolean;
  /** Gets or sets a value indicating whether this instance is visible. */
  IsVisible?: boolean;
  Tuners?: string[] | null;
}

export enum LiveTvServiceStatus {
  Ok = 'Ok',
  Unavailable = 'Unavailable',
}

export interface LocalizationOption {
  Name?: string | null;
  Value?: string | null;
}

/** Enum LocationType. */
export enum LocationType {
  FileSystem = 'FileSystem',
  Remote = 'Remote',
  Virtual = 'Virtual',
  Offline = 'Offline',
}

export interface LogFile {
  /**
   * Gets or sets the date created.
   * @format date-time
   */
  DateCreated?: string;
  /**
   * Gets or sets the date modified.
   * @format date-time
   */
  DateModified?: string;
  /**
   * Gets or sets the size.
   * @format int64
   */
  Size?: number;
  /** Gets or sets the name. */
  Name?: string;
}

export enum LogLevel {
  Trace = 'Trace',
  Debug = 'Debug',
  Information = 'Information',
  Warning = 'Warning',
  Error = 'Error',
  Critical = 'Critical',
  None = 'None',
}

/** LyricResponse model. */
export interface LyricDto {
  /** Gets or sets Metadata for the lyrics. */
  Metadata?: LyricMetadata;
  /** Gets or sets a collection of individual lyric lines. */
  Lyrics?: LyricLine[];
}

/** Lyric model. */
export interface LyricLine {
  /** Gets the text of this lyric line. */
  Text?: string;
  /**
   * Gets the start time in ticks.
   * @format int64
   */
  Start?: number | null;
}

/** LyricMetadata model. */
export interface LyricMetadata {
  /** Gets or sets the song artist. */
  Artist?: string | null;
  /** Gets or sets the album this song is on. */
  Album?: string | null;
  /** Gets or sets the title of the song. */
  Title?: string | null;
  /** Gets or sets the author of the lyric data. */
  Author?: string | null;
  /**
   * Gets or sets the length of the song in ticks.
   * @format int64
   */
  Length?: number | null;
  /** Gets or sets who the LRC file was created by. */
  By?: string | null;
  /**
   * Gets or sets the lyric offset compared to audio in ticks.
   * @format int64
   */
  Offset?: number | null;
  /** Gets or sets the software used to create the LRC file. */
  Creator?: string | null;
  /** Gets or sets the version of the creator used. */
  Version?: string | null;
  /** Gets or sets a value indicating whether this lyric is synced. */
  IsSynced?: boolean | null;
}

/** Class MediaAttachment. */
export interface MediaAttachment {
  /** Gets or sets the codec. */
  Codec?: string | null;
  /** Gets or sets the codec tag. */
  CodecTag?: string | null;
  /** Gets or sets the comment. */
  Comment?: string | null;
  /**
   * Gets or sets the index.
   * @format int32
   */
  Index?: number;
  /** Gets or sets the filename. */
  FileName?: string | null;
  /** Gets or sets the MIME type. */
  MimeType?: string | null;
  /** Gets or sets the delivery URL. */
  DeliveryUrl?: string | null;
}

/** Media Path dto. */
export interface MediaPathDto {
  /** Gets or sets the name of the library. */
  Name: string;
  /** Gets or sets the path to add. */
  Path?: string | null;
  /** Gets or sets the path info. */
  PathInfo?: MediaPathInfo | null;
}

export interface MediaPathInfo {
  Path?: string;
}

export enum MediaProtocol {
  File = 'File',
  Http = 'Http',
  Rtmp = 'Rtmp',
  Rtsp = 'Rtsp',
  Udp = 'Udp',
  Rtp = 'Rtp',
  Ftp = 'Ftp',
}

/** Api model for MediaSegment's. */
export interface MediaSegmentDto {
  /**
   * Gets or sets the id of the media segment.
   * @format uuid
   */
  Id?: string;
  /**
   * Gets or sets the id of the associated item.
   * @format uuid
   */
  ItemId?: string;
  /** Defines the types of content an individual Jellyfin.Data.Entities.MediaSegment represents. */
  Type?: 'Unknown' | 'Commercial' | 'Preview' | 'Recap' | 'Outro' | 'Intro';
  /**
   * Gets or sets the start of the segment.
   * @format int64
   */
  StartTicks?: number;
  /**
   * Gets or sets the end of the segment.
   * @format int64
   */
  EndTicks?: number;
}

/** Query result container. */
export interface MediaSegmentDtoQueryResult {
  /** Gets or sets the items. */
  Items?: MediaSegmentDto[];
  /**
   * Gets or sets the total number of records available.
   * @format int32
   */
  TotalRecordCount?: number;
  /**
   * Gets or sets the index of the first record in Items.
   * @format int32
   */
  StartIndex?: number;
}

/** Defines the types of content an individual Jellyfin.Data.Entities.MediaSegment represents. */
export enum MediaSegmentType {
  Unknown = 'Unknown',
  Commercial = 'Commercial',
  Preview = 'Preview',
  Recap = 'Recap',
  Outro = 'Outro',
  Intro = 'Intro',
}

export interface MediaSourceInfo {
  Protocol?: 'File' | 'Http' | 'Rtmp' | 'Rtsp' | 'Udp' | 'Rtp' | 'Ftp';
  Id?: string | null;
  Path?: string | null;
  EncoderPath?: string | null;
  EncoderProtocol?: 'File' | 'Http' | 'Rtmp' | 'Rtsp' | 'Udp' | 'Rtp' | 'Ftp' | null;
  Type?: 'Default' | 'Grouping' | 'Placeholder';
  Container?: string | null;
  /** @format int64 */
  Size?: number | null;
  Name?: string | null;
  /**
   * Gets or sets a value indicating whether the media is remote.
   * Differentiate internet url vs local network.
   */
  IsRemote?: boolean;
  ETag?: string | null;
  /** @format int64 */
  RunTimeTicks?: number | null;
  ReadAtNativeFramerate?: boolean;
  IgnoreDts?: boolean;
  IgnoreIndex?: boolean;
  GenPtsInput?: boolean;
  SupportsTranscoding?: boolean;
  SupportsDirectStream?: boolean;
  SupportsDirectPlay?: boolean;
  IsInfiniteStream?: boolean;
  /** @default false */
  UseMostCompatibleTranscodingProfile?: boolean;
  RequiresOpening?: boolean;
  OpenToken?: string | null;
  RequiresClosing?: boolean;
  LiveStreamId?: string | null;
  /** @format int32 */
  BufferMs?: number | null;
  RequiresLooping?: boolean;
  SupportsProbing?: boolean;
  VideoType?: 'VideoFile' | 'Iso' | 'Dvd' | 'BluRay' | null;
  IsoType?: 'Dvd' | 'BluRay' | null;
  Video3DFormat?: 'HalfSideBySide' | 'FullSideBySide' | 'FullTopAndBottom' | 'HalfTopAndBottom' | 'MVC' | null;
  MediaStreams?: MediaStream[] | null;
  MediaAttachments?: MediaAttachment[] | null;
  Formats?: string[] | null;
  /** @format int32 */
  Bitrate?: number | null;
  /** @format int32 */
  FallbackMaxStreamingBitrate?: number | null;
  Timestamp?: 'None' | 'Zero' | 'Valid' | null;
  RequiredHttpHeaders?: Record<string, string | null>;
  TranscodingUrl?: string | null;
  /**
   * Media streaming protocol.
   * Lowercase for backwards compatibility.
   */
  TranscodingSubProtocol?: 'http' | 'hls';
  TranscodingContainer?: string | null;
  /** @format int32 */
  AnalyzeDurationMs?: number | null;
  /** @format int32 */
  DefaultAudioStreamIndex?: number | null;
  /** @format int32 */
  DefaultSubtitleStreamIndex?: number | null;
  HasSegments?: boolean;
}

export enum MediaSourceType {
  Default = 'Default',
  Grouping = 'Grouping',
  Placeholder = 'Placeholder',
}

/** Class MediaStream. */
export interface MediaStream {
  /** Gets or sets the codec. */
  Codec?: string | null;
  /** Gets or sets the codec tag. */
  CodecTag?: string | null;
  /** Gets or sets the language. */
  Language?: string | null;
  /** Gets or sets the color range. */
  ColorRange?: string | null;
  /** Gets or sets the color space. */
  ColorSpace?: string | null;
  /** Gets or sets the color transfer. */
  ColorTransfer?: string | null;
  /** Gets or sets the color primaries. */
  ColorPrimaries?: string | null;
  /**
   * Gets or sets the Dolby Vision version major.
   * @format int32
   */
  DvVersionMajor?: number | null;
  /**
   * Gets or sets the Dolby Vision version minor.
   * @format int32
   */
  DvVersionMinor?: number | null;
  /**
   * Gets or sets the Dolby Vision profile.
   * @format int32
   */
  DvProfile?: number | null;
  /**
   * Gets or sets the Dolby Vision level.
   * @format int32
   */
  DvLevel?: number | null;
  /**
   * Gets or sets the Dolby Vision rpu present flag.
   * @format int32
   */
  RpuPresentFlag?: number | null;
  /**
   * Gets or sets the Dolby Vision el present flag.
   * @format int32
   */
  ElPresentFlag?: number | null;
  /**
   * Gets or sets the Dolby Vision bl present flag.
   * @format int32
   */
  BlPresentFlag?: number | null;
  /**
   * Gets or sets the Dolby Vision bl signal compatibility id.
   * @format int32
   */
  DvBlSignalCompatibilityId?: number | null;
  /**
   * Gets or sets the Rotation in degrees.
   * @format int32
   */
  Rotation?: number | null;
  /** Gets or sets the comment. */
  Comment?: string | null;
  /** Gets or sets the time base. */
  TimeBase?: string | null;
  /** Gets or sets the codec time base. */
  CodecTimeBase?: string | null;
  /** Gets or sets the title. */
  Title?: string | null;
  /** An enum representing video ranges. */
  VideoRange?: 'Unknown' | 'SDR' | 'HDR';
  /** An enum representing types of video ranges. */
  VideoRangeType?:
    | 'Unknown'
    | 'SDR'
    | 'HDR10'
    | 'HLG'
    | 'DOVI'
    | 'DOVIWithHDR10'
    | 'DOVIWithHLG'
    | 'DOVIWithSDR'
    | 'HDR10Plus';
  /** Gets the video dovi title. */
  VideoDoViTitle?: string | null;
  /**
   * An enum representing formats of spatial audio.
   * @default "None"
   */
  AudioSpatialFormat?: 'None' | 'DolbyAtmos' | 'DTSX';
  LocalizedUndefined?: string | null;
  LocalizedDefault?: string | null;
  LocalizedForced?: string | null;
  LocalizedExternal?: string | null;
  LocalizedHearingImpaired?: string | null;
  DisplayTitle?: string | null;
  NalLengthSize?: string | null;
  /** Gets or sets a value indicating whether this instance is interlaced. */
  IsInterlaced?: boolean;
  IsAVC?: boolean | null;
  /** Gets or sets the channel layout. */
  ChannelLayout?: string | null;
  /**
   * Gets or sets the bit rate.
   * @format int32
   */
  BitRate?: number | null;
  /**
   * Gets or sets the bit depth.
   * @format int32
   */
  BitDepth?: number | null;
  /**
   * Gets or sets the reference frames.
   * @format int32
   */
  RefFrames?: number | null;
  /**
   * Gets or sets the length of the packet.
   * @format int32
   */
  PacketLength?: number | null;
  /**
   * Gets or sets the channels.
   * @format int32
   */
  Channels?: number | null;
  /**
   * Gets or sets the sample rate.
   * @format int32
   */
  SampleRate?: number | null;
  /** Gets or sets a value indicating whether this instance is default. */
  IsDefault?: boolean;
  /** Gets or sets a value indicating whether this instance is forced. */
  IsForced?: boolean;
  /** Gets or sets a value indicating whether this instance is for the hearing impaired. */
  IsHearingImpaired?: boolean;
  /**
   * Gets or sets the height.
   * @format int32
   */
  Height?: number | null;
  /**
   * Gets or sets the width.
   * @format int32
   */
  Width?: number | null;
  /**
   * Gets or sets the average frame rate.
   * @format float
   */
  AverageFrameRate?: number | null;
  /**
   * Gets or sets the real frame rate.
   * @format float
   */
  RealFrameRate?: number | null;
  /**
   * Gets the framerate used as reference.
   * Prefer AverageFrameRate, if that is null or an unrealistic value
   * then fallback to RealFrameRate.
   * @format float
   */
  ReferenceFrameRate?: number | null;
  /** Gets or sets the profile. */
  Profile?: string | null;
  /** Gets or sets the type. */
  Type?: 'Audio' | 'Video' | 'Subtitle' | 'EmbeddedImage' | 'Data' | 'Lyric';
  /** Gets or sets the aspect ratio. */
  AspectRatio?: string | null;
  /**
   * Gets or sets the index.
   * @format int32
   */
  Index?: number;
  /**
   * Gets or sets the score.
   * @format int32
   */
  Score?: number | null;
  /** Gets or sets a value indicating whether this instance is external. */
  IsExternal?: boolean;
  /** Gets or sets the method. */
  DeliveryMethod?: 'Encode' | 'Embed' | 'External' | 'Hls' | 'Drop' | null;
  /** Gets or sets the delivery URL. */
  DeliveryUrl?: string | null;
  /** Gets or sets a value indicating whether this instance is external URL. */
  IsExternalUrl?: boolean | null;
  IsTextSubtitleStream?: boolean;
  /** Gets or sets a value indicating whether [supports external stream]. */
  SupportsExternalStream?: boolean;
  /** Gets or sets the filename. */
  Path?: string | null;
  /** Gets or sets the pixel format. */
  PixelFormat?: string | null;
  /**
   * Gets or sets the level.
   * @format double
   */
  Level?: number | null;
  /** Gets or sets whether this instance is anamorphic. */
  IsAnamorphic?: boolean | null;
}

/**
 * Media streaming protocol.
 * Lowercase for backwards compatibility.
 */
export enum MediaStreamProtocol {
  Http = 'http',
  Hls = 'hls',
}

/** Enum MediaStreamType. */
export enum MediaStreamType {
  Audio = 'Audio',
  Video = 'Video',
  Subtitle = 'Subtitle',
  EmbeddedImage = 'EmbeddedImage',
  Data = 'Data',
  Lyric = 'Lyric',
}

/** Media types. */
export enum MediaType {
  Unknown = 'Unknown',
  Video = 'Video',
  Audio = 'Audio',
  Photo = 'Photo',
  Book = 'Book',
}

/** Media Update Info Dto. */
export interface MediaUpdateInfoDto {
  /** Gets or sets the list of updates. */
  Updates?: MediaUpdateInfoPathDto[];
}

/** The media update info path. */
export interface MediaUpdateInfoPathDto {
  /** Gets or sets media path. */
  Path?: string | null;
  /**
   * Gets or sets media update type.
   * Created, Modified, Deleted.
   */
  UpdateType?: string | null;
}

export interface MediaUrl {
  Url?: string | null;
  Name?: string | null;
}

export interface MessageCommand {
  Header?: string | null;
  Text: string;
  /** @format int64 */
  TimeoutMs?: number | null;
}

export interface MetadataConfiguration {
  UseFileCreationTimeForDateAdded?: boolean;
}

export interface MetadataEditorInfo {
  ParentalRatingOptions?: ParentalRating[];
  Countries?: CountryInfo[];
  Cultures?: CultureDto[];
  ExternalIdInfos?: ExternalIdInfo[];
  ContentType?:
    | 'unknown'
    | 'movies'
    | 'tvshows'
    | 'music'
    | 'musicvideos'
    | 'trailers'
    | 'homevideos'
    | 'boxsets'
    | 'books'
    | 'photos'
    | 'livetv'
    | 'playlists'
    | 'folders'
    | null;
  ContentTypeOptions?: NameValuePair[];
}

/** Enum MetadataFields. */
export enum MetadataField {
  Cast = 'Cast',
  Genres = 'Genres',
  ProductionLocations = 'ProductionLocations',
  Studios = 'Studios',
  Tags = 'Tags',
  Name = 'Name',
  Overview = 'Overview',
  Runtime = 'Runtime',
  OfficialRating = 'OfficialRating',
}

/** Class MetadataOptions. */
export interface MetadataOptions {
  ItemType?: string | null;
  DisabledMetadataSavers?: string[] | null;
  LocalMetadataReaderOrder?: string[] | null;
  DisabledMetadataFetchers?: string[] | null;
  MetadataFetcherOrder?: string[] | null;
  DisabledImageFetchers?: string[] | null;
  ImageFetcherOrder?: string[] | null;
}

export enum MetadataRefreshMode {
  None = 'None',
  ValidationOnly = 'ValidationOnly',
  Default = 'Default',
  FullRefresh = 'FullRefresh',
}

/** Class MovePlaylistItemRequestDto. */
export interface MovePlaylistItemRequestDto {
  /**
   * Gets or sets the playlist identifier of the item.
   * @format uuid
   */
  PlaylistItemId?: string;
  /**
   * Gets or sets the new position.
   * @format int32
   */
  NewIndex?: number;
}

export interface MovieInfo {
  /** Gets or sets the name. */
  Name?: string | null;
  /** Gets or sets the original title. */
  OriginalTitle?: string | null;
  /** Gets or sets the path. */
  Path?: string | null;
  /** Gets or sets the metadata language. */
  MetadataLanguage?: string | null;
  /** Gets or sets the metadata country code. */
  MetadataCountryCode?: string | null;
  /** Gets or sets the provider ids. */
  ProviderIds?: Record<string, string | null>;
  /**
   * Gets or sets the year.
   * @format int32
   */
  Year?: number | null;
  /** @format int32 */
  IndexNumber?: number | null;
  /** @format int32 */
  ParentIndexNumber?: number | null;
  /** @format date-time */
  PremiereDate?: string | null;
  IsAutomated?: boolean;
}

export interface MovieInfoRemoteSearchQuery {
  SearchInfo?: MovieInfo | null;
  /** @format uuid */
  ItemId?: string;
  /** Gets or sets the provider name to search within if set. */
  SearchProviderName?: string | null;
  /** Gets or sets a value indicating whether disabled providers should be included. */
  IncludeDisabledProviders?: boolean;
}

export interface MusicVideoInfo {
  /** Gets or sets the name. */
  Name?: string | null;
  /** Gets or sets the original title. */
  OriginalTitle?: string | null;
  /** Gets or sets the path. */
  Path?: string | null;
  /** Gets or sets the metadata language. */
  MetadataLanguage?: string | null;
  /** Gets or sets the metadata country code. */
  MetadataCountryCode?: string | null;
  /** Gets or sets the provider ids. */
  ProviderIds?: Record<string, string | null>;
  /**
   * Gets or sets the year.
   * @format int32
   */
  Year?: number | null;
  /** @format int32 */
  IndexNumber?: number | null;
  /** @format int32 */
  ParentIndexNumber?: number | null;
  /** @format date-time */
  PremiereDate?: string | null;
  IsAutomated?: boolean;
  Artists?: string[] | null;
}

export interface MusicVideoInfoRemoteSearchQuery {
  SearchInfo?: MusicVideoInfo | null;
  /** @format uuid */
  ItemId?: string;
  /** Gets or sets the provider name to search within if set. */
  SearchProviderName?: string | null;
  /** Gets or sets a value indicating whether disabled providers should be included. */
  IncludeDisabledProviders?: boolean;
}

export interface NameGuidPair {
  Name?: string | null;
  /** @format uuid */
  Id?: string;
}

export interface NameIdPair {
  /** Gets or sets the name. */
  Name?: string | null;
  /** Gets or sets the identifier. */
  Id?: string | null;
}

export interface NameValuePair {
  /** Gets or sets the name. */
  Name?: string | null;
  /** Gets or sets the value. */
  Value?: string | null;
}

/** Defines the MediaBrowser.Common.Net.NetworkConfiguration. */
export interface NetworkConfiguration {
  /** Gets or sets a value used to specify the URL prefix that your Jellyfin instance can be accessed at. */
  BaseUrl?: string;
  /** Gets or sets a value indicating whether to use HTTPS. */
  EnableHttps?: boolean;
  /** Gets or sets a value indicating whether the server should force connections over HTTPS. */
  RequireHttps?: boolean;
  /** Gets or sets the filesystem path of an X.509 certificate to use for SSL. */
  CertificatePath?: string;
  /** Gets or sets the password required to access the X.509 certificate data in the file specified by MediaBrowser.Common.Net.NetworkConfiguration.CertificatePath. */
  CertificatePassword?: string;
  /**
   * Gets or sets the internal HTTP server port.
   * @format int32
   */
  InternalHttpPort?: number;
  /**
   * Gets or sets the internal HTTPS server port.
   * @format int32
   */
  InternalHttpsPort?: number;
  /**
   * Gets or sets the public HTTP port.
   * @format int32
   */
  PublicHttpPort?: number;
  /**
   * Gets or sets the public HTTPS port.
   * @format int32
   */
  PublicHttpsPort?: number;
  /** Gets or sets a value indicating whether Autodiscovery is enabled. */
  AutoDiscovery?: boolean;
  /** Gets or sets a value indicating whether to enable automatic port forwarding. */
  EnableUPnP?: boolean;
  /** Gets or sets a value indicating whether IPv6 is enabled. */
  EnableIPv4?: boolean;
  /** Gets or sets a value indicating whether IPv6 is enabled. */
  EnableIPv6?: boolean;
  /** Gets or sets a value indicating whether access from outside of the LAN is permitted. */
  EnableRemoteAccess?: boolean;
  /** Gets or sets the subnets that are deemed to make up the LAN. */
  LocalNetworkSubnets?: string[];
  /** Gets or sets the interface addresses which Jellyfin will bind to. If empty, all interfaces will be used. */
  LocalNetworkAddresses?: string[];
  /** Gets or sets the known proxies. */
  KnownProxies?: string[];
  /** Gets or sets a value indicating whether address names that match MediaBrowser.Common.Net.NetworkConfiguration.VirtualInterfaceNames should be ignored for the purposes of binding. */
  IgnoreVirtualInterfaces?: boolean;
  /** Gets or sets a value indicating the interface name prefixes that should be ignored. The list can be comma separated and values are case-insensitive. <seealso cref="P:MediaBrowser.Common.Net.NetworkConfiguration.IgnoreVirtualInterfaces" />. */
  VirtualInterfaceNames?: string[];
  /** Gets or sets a value indicating whether the published server uri is based on information in HTTP requests. */
  EnablePublishedServerUriByRequest?: boolean;
  /**
   * Gets or sets the PublishedServerUriBySubnet
   * Gets or sets PublishedServerUri to advertise for specific subnets.
   */
  PublishedServerUriBySubnet?: string[];
  /** Gets or sets the filter for remote IP connectivity. Used in conjunction with <seealso cref="P:MediaBrowser.Common.Net.NetworkConfiguration.IsRemoteIPFilterBlacklist" />. */
  RemoteIPFilter?: string[];
  /** Gets or sets a value indicating whether <seealso cref="P:MediaBrowser.Common.Net.NetworkConfiguration.RemoteIPFilter" /> contains a blacklist or a whitelist. Default is a whitelist. */
  IsRemoteIPFilterBlacklist?: boolean;
}

/** Class NewGroupRequestDto. */
export interface NewGroupRequestDto {
  /** Gets or sets the group name. */
  GroupName?: string;
}

/** Class NextItemRequestDto. */
export interface NextItemRequestDto {
  /**
   * Gets or sets the playing item identifier.
   * @format uuid
   */
  PlaylistItemId?: string;
}

/** Open live stream dto. */
export interface OpenLiveStreamDto {
  /** Gets or sets the open token. */
  OpenToken?: string | null;
  /**
   * Gets or sets the user id.
   * @format uuid
   */
  UserId?: string | null;
  /** Gets or sets the play session id. */
  PlaySessionId?: string | null;
  /**
   * Gets or sets the max streaming bitrate.
   * @format int32
   */
  MaxStreamingBitrate?: number | null;
  /**
   * Gets or sets the start time in ticks.
   * @format int64
   */
  StartTimeTicks?: number | null;
  /**
   * Gets or sets the audio stream index.
   * @format int32
   */
  AudioStreamIndex?: number | null;
  /**
   * Gets or sets the subtitle stream index.
   * @format int32
   */
  SubtitleStreamIndex?: number | null;
  /**
   * Gets or sets the max audio channels.
   * @format int32
   */
  MaxAudioChannels?: number | null;
  /**
   * Gets or sets the item id.
   * @format uuid
   */
  ItemId?: string | null;
  /** Gets or sets a value indicating whether to enable direct play. */
  EnableDirectPlay?: boolean | null;
  /** Gets or sets a value indicating whether to enale direct stream. */
  EnableDirectStream?: boolean | null;
  /** Gets or sets a value indicating whether always burn in subtitles when transcoding. */
  AlwaysBurnInSubtitleWhenTranscoding?: boolean | null;
  /** Gets or sets the device profile. */
  DeviceProfile?: DeviceProfile | null;
  /** Gets or sets the device play protocols. */
  DirectPlayProtocols?: MediaProtocol[];
}

/** Keep alive websocket messages. */
export interface OutboundKeepAliveMessage {
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "KeepAlive"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** Represents the list of possible outbound websocket types */
export type OutboundWebSocketMessage = BaseOutboundWebSocketMessage &
  (
    | BaseOutboundWebSocketMessageMessageTypeMapping<'ActivityLogEntry', ActivityLogEntryMessage>
    | BaseOutboundWebSocketMessageMessageTypeMapping<'ForceKeepAlive', ForceKeepAliveMessage>
    | BaseOutboundWebSocketMessageMessageTypeMapping<'GeneralCommand', GeneralCommandMessage>
    | BaseOutboundWebSocketMessageMessageTypeMapping<'LibraryChanged', LibraryChangedMessage>
    | BaseOutboundWebSocketMessageMessageTypeMapping<'KeepAlive', OutboundKeepAliveMessage>
    | BaseOutboundWebSocketMessageMessageTypeMapping<'Play', PlayMessage>
    | BaseOutboundWebSocketMessageMessageTypeMapping<'Playstate', PlaystateMessage>
    | BaseOutboundWebSocketMessageMessageTypeMapping<'PackageInstallationCancelled', PluginInstallationCancelledMessage>
    | BaseOutboundWebSocketMessageMessageTypeMapping<'PackageInstallationCompleted', PluginInstallationCompletedMessage>
    | BaseOutboundWebSocketMessageMessageTypeMapping<'PackageInstallationFailed', PluginInstallationFailedMessage>
    | BaseOutboundWebSocketMessageMessageTypeMapping<'PackageInstalling', PluginInstallingMessage>
    | BaseOutboundWebSocketMessageMessageTypeMapping<'PackageUninstalled', PluginUninstalledMessage>
    | BaseOutboundWebSocketMessageMessageTypeMapping<'RefreshProgress', RefreshProgressMessage>
    | BaseOutboundWebSocketMessageMessageTypeMapping<'RestartRequired', RestartRequiredMessage>
    | BaseOutboundWebSocketMessageMessageTypeMapping<'ScheduledTaskEnded', ScheduledTaskEndedMessage>
    | BaseOutboundWebSocketMessageMessageTypeMapping<'ScheduledTasksInfo', ScheduledTasksInfoMessage>
    | BaseOutboundWebSocketMessageMessageTypeMapping<'SeriesTimerCancelled', SeriesTimerCancelledMessage>
    | BaseOutboundWebSocketMessageMessageTypeMapping<'SeriesTimerCreated', SeriesTimerCreatedMessage>
    | BaseOutboundWebSocketMessageMessageTypeMapping<'ServerRestarting', ServerRestartingMessage>
    | BaseOutboundWebSocketMessageMessageTypeMapping<'ServerShuttingDown', ServerShuttingDownMessage>
    | BaseOutboundWebSocketMessageMessageTypeMapping<'Sessions', SessionsMessage>
    | BaseOutboundWebSocketMessageMessageTypeMapping<'SyncPlayCommand', SyncPlayCommandMessage>
    | BaseOutboundWebSocketMessageMessageTypeMapping<'SyncPlayGroupUpdate', SyncPlayGroupUpdateCommandMessage>
    | BaseOutboundWebSocketMessageMessageTypeMapping<'TimerCancelled', TimerCancelledMessage>
    | BaseOutboundWebSocketMessageMessageTypeMapping<'TimerCreated', TimerCreatedMessage>
    | BaseOutboundWebSocketMessageMessageTypeMapping<'UserDataChanged', UserDataChangedMessage>
    | BaseOutboundWebSocketMessageMessageTypeMapping<'UserDeleted', UserDeletedMessage>
    | BaseOutboundWebSocketMessageMessageTypeMapping<'UserUpdated', UserUpdatedMessage>
  );

/** Class PackageInfo. */
export interface PackageInfo {
  /** Gets or sets the name. */
  name?: string;
  /** Gets or sets a long description of the plugin containing features or helpful explanations. */
  description?: string;
  /** Gets or sets a short overview of what the plugin does. */
  overview?: string;
  /** Gets or sets the owner. */
  owner?: string;
  /** Gets or sets the category. */
  category?: string;
  /**
   * Gets or sets the guid of the assembly associated with this plugin.
   * This is used to identify the proper item for automatic updates.
   * @format uuid
   */
  guid?: string;
  /** Gets or sets the versions. */
  versions?: VersionInfo[];
  /** Gets or sets the image url for the package. */
  imageUrl?: string | null;
}

/** Class ParentalRating. */
export interface ParentalRating {
  /** Gets or sets the name. */
  Name?: string | null;
  /**
   * Gets or sets the value.
   * @format int32
   */
  Value?: number | null;
}

/** Defines the MediaBrowser.Model.Configuration.PathSubstitution. */
export interface PathSubstitution {
  /** Gets or sets the value to substitute. */
  From?: string;
  /** Gets or sets the value to substitution with. */
  To?: string;
}

/** The person kind. */
export enum PersonKind {
  Unknown = 'Unknown',
  Actor = 'Actor',
  Director = 'Director',
  Composer = 'Composer',
  Writer = 'Writer',
  GuestStar = 'GuestStar',
  Producer = 'Producer',
  Conductor = 'Conductor',
  Lyricist = 'Lyricist',
  Arranger = 'Arranger',
  Engineer = 'Engineer',
  Mixer = 'Mixer',
  Remixer = 'Remixer',
  Creator = 'Creator',
  Artist = 'Artist',
  AlbumArtist = 'AlbumArtist',
  Author = 'Author',
  Illustrator = 'Illustrator',
  Penciller = 'Penciller',
  Inker = 'Inker',
  Colorist = 'Colorist',
  Letterer = 'Letterer',
  CoverArtist = 'CoverArtist',
  Editor = 'Editor',
  Translator = 'Translator',
}

export interface PersonLookupInfo {
  /** Gets or sets the name. */
  Name?: string | null;
  /** Gets or sets the original title. */
  OriginalTitle?: string | null;
  /** Gets or sets the path. */
  Path?: string | null;
  /** Gets or sets the metadata language. */
  MetadataLanguage?: string | null;
  /** Gets or sets the metadata country code. */
  MetadataCountryCode?: string | null;
  /** Gets or sets the provider ids. */
  ProviderIds?: Record<string, string | null>;
  /**
   * Gets or sets the year.
   * @format int32
   */
  Year?: number | null;
  /** @format int32 */
  IndexNumber?: number | null;
  /** @format int32 */
  ParentIndexNumber?: number | null;
  /** @format date-time */
  PremiereDate?: string | null;
  IsAutomated?: boolean;
}

export interface PersonLookupInfoRemoteSearchQuery {
  SearchInfo?: PersonLookupInfo | null;
  /** @format uuid */
  ItemId?: string;
  /** Gets or sets the provider name to search within if set. */
  SearchProviderName?: string | null;
  /** Gets or sets a value indicating whether disabled providers should be included. */
  IncludeDisabledProviders?: boolean;
}

/** Class PingRequestDto. */
export interface PingRequestDto {
  /**
   * Gets or sets the ping time.
   * @format int64
   */
  Ping?: number;
}

export interface PinRedeemResult {
  /** Gets or sets a value indicating whether this MediaBrowser.Model.Users.PinRedeemResult is success. */
  Success?: boolean;
  /** Gets or sets the users reset. */
  UsersReset?: string[];
}

export enum PlayAccess {
  Full = 'Full',
  None = 'None',
}

export enum PlaybackErrorCode {
  NotAllowed = 'NotAllowed',
  NoCompatibleStream = 'NoCompatibleStream',
  RateLimitExceeded = 'RateLimitExceeded',
}

/** Plabyback info dto. */
export interface PlaybackInfoDto {
  /**
   * Gets or sets the playback userId.
   * @format uuid
   */
  UserId?: string | null;
  /**
   * Gets or sets the max streaming bitrate.
   * @format int32
   */
  MaxStreamingBitrate?: number | null;
  /**
   * Gets or sets the start time in ticks.
   * @format int64
   */
  StartTimeTicks?: number | null;
  /**
   * Gets or sets the audio stream index.
   * @format int32
   */
  AudioStreamIndex?: number | null;
  /**
   * Gets or sets the subtitle stream index.
   * @format int32
   */
  SubtitleStreamIndex?: number | null;
  /**
   * Gets or sets the max audio channels.
   * @format int32
   */
  MaxAudioChannels?: number | null;
  /** Gets or sets the media source id. */
  MediaSourceId?: string | null;
  /** Gets or sets the live stream id. */
  LiveStreamId?: string | null;
  /** Gets or sets the device profile. */
  DeviceProfile?: DeviceProfile | null;
  /** Gets or sets a value indicating whether to enable direct play. */
  EnableDirectPlay?: boolean | null;
  /** Gets or sets a value indicating whether to enable direct stream. */
  EnableDirectStream?: boolean | null;
  /** Gets or sets a value indicating whether to enable transcoding. */
  EnableTranscoding?: boolean | null;
  /** Gets or sets a value indicating whether to enable video stream copy. */
  AllowVideoStreamCopy?: boolean | null;
  /** Gets or sets a value indicating whether to allow audio stream copy. */
  AllowAudioStreamCopy?: boolean | null;
  /** Gets or sets a value indicating whether to auto open the live stream. */
  AutoOpenLiveStream?: boolean | null;
  /** Gets or sets a value indicating whether always burn in subtitles when transcoding. */
  AlwaysBurnInSubtitleWhenTranscoding?: boolean | null;
}

/** Class PlaybackInfoResponse. */
export interface PlaybackInfoResponse {
  /** Gets or sets the media sources. */
  MediaSources?: MediaSourceInfo[];
  /** Gets or sets the play session identifier. */
  PlaySessionId?: string | null;
  /** Gets or sets the error code. */
  ErrorCode?: 'NotAllowed' | 'NoCompatibleStream' | 'RateLimitExceeded' | null;
}

/** Enum PlaybackOrder. */
export enum PlaybackOrder {
  Default = 'Default',
  Shuffle = 'Shuffle',
}

/** Class PlaybackProgressInfo. */
export interface PlaybackProgressInfo {
  /** Gets or sets a value indicating whether this instance can seek. */
  CanSeek?: boolean;
  /** Gets or sets the item. */
  Item?: BaseItemDto | null;
  /**
   * Gets or sets the item identifier.
   * @format uuid
   */
  ItemId?: string;
  /** Gets or sets the session id. */
  SessionId?: string | null;
  /** Gets or sets the media version identifier. */
  MediaSourceId?: string | null;
  /**
   * Gets or sets the index of the audio stream.
   * @format int32
   */
  AudioStreamIndex?: number | null;
  /**
   * Gets or sets the index of the subtitle stream.
   * @format int32
   */
  SubtitleStreamIndex?: number | null;
  /** Gets or sets a value indicating whether this instance is paused. */
  IsPaused?: boolean;
  /** Gets or sets a value indicating whether this instance is muted. */
  IsMuted?: boolean;
  /**
   * Gets or sets the position ticks.
   * @format int64
   */
  PositionTicks?: number | null;
  /** @format int64 */
  PlaybackStartTimeTicks?: number | null;
  /**
   * Gets or sets the volume level.
   * @format int32
   */
  VolumeLevel?: number | null;
  /** @format int32 */
  Brightness?: number | null;
  AspectRatio?: string | null;
  /** Gets or sets the play method. */
  PlayMethod?: 'Transcode' | 'DirectStream' | 'DirectPlay';
  /** Gets or sets the live stream identifier. */
  LiveStreamId?: string | null;
  /** Gets or sets the play session identifier. */
  PlaySessionId?: string | null;
  /** Gets or sets the repeat mode. */
  RepeatMode?: 'RepeatNone' | 'RepeatAll' | 'RepeatOne';
  /** Gets or sets the playback order. */
  PlaybackOrder?: 'Default' | 'Shuffle';
  NowPlayingQueue?: QueueItem[] | null;
  PlaylistItemId?: string | null;
}

/** Enum PlaybackRequestType. */
export enum PlaybackRequestType {
  Play = 'Play',
  SetPlaylistItem = 'SetPlaylistItem',
  RemoveFromPlaylist = 'RemoveFromPlaylist',
  MovePlaylistItem = 'MovePlaylistItem',
  Queue = 'Queue',
  Unpause = 'Unpause',
  Pause = 'Pause',
  Stop = 'Stop',
  Seek = 'Seek',
  Buffer = 'Buffer',
  Ready = 'Ready',
  NextItem = 'NextItem',
  PreviousItem = 'PreviousItem',
  SetRepeatMode = 'SetRepeatMode',
  SetShuffleMode = 'SetShuffleMode',
  Ping = 'Ping',
  IgnoreWait = 'IgnoreWait',
}

/** Class PlaybackStartInfo. */
export interface PlaybackStartInfo {
  /** Gets or sets a value indicating whether this instance can seek. */
  CanSeek?: boolean;
  /** Gets or sets the item. */
  Item?: BaseItemDto | null;
  /**
   * Gets or sets the item identifier.
   * @format uuid
   */
  ItemId?: string;
  /** Gets or sets the session id. */
  SessionId?: string | null;
  /** Gets or sets the media version identifier. */
  MediaSourceId?: string | null;
  /**
   * Gets or sets the index of the audio stream.
   * @format int32
   */
  AudioStreamIndex?: number | null;
  /**
   * Gets or sets the index of the subtitle stream.
   * @format int32
   */
  SubtitleStreamIndex?: number | null;
  /** Gets or sets a value indicating whether this instance is paused. */
  IsPaused?: boolean;
  /** Gets or sets a value indicating whether this instance is muted. */
  IsMuted?: boolean;
  /**
   * Gets or sets the position ticks.
   * @format int64
   */
  PositionTicks?: number | null;
  /** @format int64 */
  PlaybackStartTimeTicks?: number | null;
  /**
   * Gets or sets the volume level.
   * @format int32
   */
  VolumeLevel?: number | null;
  /** @format int32 */
  Brightness?: number | null;
  AspectRatio?: string | null;
  /** Gets or sets the play method. */
  PlayMethod?: 'Transcode' | 'DirectStream' | 'DirectPlay';
  /** Gets or sets the live stream identifier. */
  LiveStreamId?: string | null;
  /** Gets or sets the play session identifier. */
  PlaySessionId?: string | null;
  /** Gets or sets the repeat mode. */
  RepeatMode?: 'RepeatNone' | 'RepeatAll' | 'RepeatOne';
  /** Gets or sets the playback order. */
  PlaybackOrder?: 'Default' | 'Shuffle';
  NowPlayingQueue?: QueueItem[] | null;
  PlaylistItemId?: string | null;
}

/** Class PlaybackStopInfo. */
export interface PlaybackStopInfo {
  /** Gets or sets the item. */
  Item?: BaseItemDto | null;
  /**
   * Gets or sets the item identifier.
   * @format uuid
   */
  ItemId?: string;
  /** Gets or sets the session id. */
  SessionId?: string | null;
  /** Gets or sets the media version identifier. */
  MediaSourceId?: string | null;
  /**
   * Gets or sets the position ticks.
   * @format int64
   */
  PositionTicks?: number | null;
  /** Gets or sets the live stream identifier. */
  LiveStreamId?: string | null;
  /** Gets or sets the play session identifier. */
  PlaySessionId?: string | null;
  /** Gets or sets a value indicating whether this MediaBrowser.Model.Session.PlaybackStopInfo is failed. */
  Failed?: boolean;
  NextMediaType?: string | null;
  PlaylistItemId?: string | null;
  NowPlayingQueue?: QueueItem[] | null;
}

/** Enum PlayCommand. */
export enum PlayCommand {
  PlayNow = 'PlayNow',
  PlayNext = 'PlayNext',
  PlayLast = 'PlayLast',
  PlayInstantMix = 'PlayInstantMix',
  PlayShuffle = 'PlayShuffle',
}

export interface PlayerStateInfo {
  /**
   * Gets or sets the now playing position ticks.
   * @format int64
   */
  PositionTicks?: number | null;
  /** Gets or sets a value indicating whether this instance can seek. */
  CanSeek?: boolean;
  /** Gets or sets a value indicating whether this instance is paused. */
  IsPaused?: boolean;
  /** Gets or sets a value indicating whether this instance is muted. */
  IsMuted?: boolean;
  /**
   * Gets or sets the volume level.
   * @format int32
   */
  VolumeLevel?: number | null;
  /**
   * Gets or sets the index of the now playing audio stream.
   * @format int32
   */
  AudioStreamIndex?: number | null;
  /**
   * Gets or sets the index of the now playing subtitle stream.
   * @format int32
   */
  SubtitleStreamIndex?: number | null;
  /** Gets or sets the now playing media version identifier. */
  MediaSourceId?: string | null;
  /** Gets or sets the play method. */
  PlayMethod?: 'Transcode' | 'DirectStream' | 'DirectPlay' | null;
  /** Gets or sets the repeat mode. */
  RepeatMode?: 'RepeatNone' | 'RepeatAll' | 'RepeatOne';
  /** Gets or sets the playback order. */
  PlaybackOrder?: 'Default' | 'Shuffle';
  /** Gets or sets the now playing live stream identifier. */
  LiveStreamId?: string | null;
}

export interface PlaylistCreationResult {
  Id?: string;
}

/** DTO for playlists. */
export interface PlaylistDto {
  /** Gets or sets a value indicating whether the playlist is publicly readable. */
  OpenAccess?: boolean;
  /** Gets or sets the share permissions. */
  Shares?: PlaylistUserPermissions[];
  /** Gets or sets the item ids. */
  ItemIds?: string[];
}

/** Class to hold data on user permissions for playlists. */
export interface PlaylistUserPermissions {
  /**
   * Gets or sets the user id.
   * @format uuid
   */
  UserId?: string;
  /** Gets or sets a value indicating whether the user has edit permissions. */
  CanEdit?: boolean;
}

/** Play command websocket message. */
export interface PlayMessage {
  /** Class PlayRequest. */
  Data?: PlayRequest | null;
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "Play"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

export enum PlayMethod {
  Transcode = 'Transcode',
  DirectStream = 'DirectStream',
  DirectPlay = 'DirectPlay',
}

/** Class PlayQueueUpdate. */
export interface PlayQueueUpdate {
  /** Gets the request type that originated this update. */
  Reason?:
    | 'NewPlaylist'
    | 'SetCurrentItem'
    | 'RemoveItems'
    | 'MoveItem'
    | 'Queue'
    | 'QueueNext'
    | 'NextItem'
    | 'PreviousItem'
    | 'RepeatMode'
    | 'ShuffleMode';
  /**
   * Gets the UTC time of the last change to the playing queue.
   * @format date-time
   */
  LastUpdate?: string;
  /** Gets the playlist. */
  Playlist?: SyncPlayQueueItem[];
  /**
   * Gets the playing item index in the playlist.
   * @format int32
   */
  PlayingItemIndex?: number;
  /**
   * Gets the start position ticks.
   * @format int64
   */
  StartPositionTicks?: number;
  /** Gets a value indicating whether the current item is playing. */
  IsPlaying?: boolean;
  /** Gets the shuffle mode. */
  ShuffleMode?: 'Sorted' | 'Shuffle';
  /** Gets the repeat mode. */
  RepeatMode?: 'RepeatOne' | 'RepeatAll' | 'RepeatNone';
}

/** Class GroupUpdate. */
export interface PlayQueueUpdateGroupUpdate {
  /**
   * Gets the group identifier.
   * @format uuid
   */
  GroupId?: string;
  /** Gets the update type. */
  Type?:
    | 'UserJoined'
    | 'UserLeft'
    | 'GroupJoined'
    | 'GroupLeft'
    | 'StateUpdate'
    | 'PlayQueue'
    | 'NotInGroup'
    | 'GroupDoesNotExist'
    | 'CreateGroupDenied'
    | 'JoinGroupDenied'
    | 'LibraryAccessDenied';
  /** Gets the update data. */
  Data?: PlayQueueUpdate;
}

/** Enum PlayQueueUpdateReason. */
export enum PlayQueueUpdateReason {
  NewPlaylist = 'NewPlaylist',
  SetCurrentItem = 'SetCurrentItem',
  RemoveItems = 'RemoveItems',
  MoveItem = 'MoveItem',
  Queue = 'Queue',
  QueueNext = 'QueueNext',
  NextItem = 'NextItem',
  PreviousItem = 'PreviousItem',
  RepeatMode = 'RepeatMode',
  ShuffleMode = 'ShuffleMode',
}

/** Class PlayRequest. */
export interface PlayRequest {
  /** Gets or sets the item ids. */
  ItemIds?: string[] | null;
  /**
   * Gets or sets the start position ticks that the first item should be played at.
   * @format int64
   */
  StartPositionTicks?: number | null;
  /** Gets or sets the play command. */
  PlayCommand?: 'PlayNow' | 'PlayNext' | 'PlayLast' | 'PlayInstantMix' | 'PlayShuffle';
  /**
   * Gets or sets the controlling user identifier.
   * @format uuid
   */
  ControllingUserId?: string;
  /** @format int32 */
  SubtitleStreamIndex?: number | null;
  /** @format int32 */
  AudioStreamIndex?: number | null;
  MediaSourceId?: string | null;
  /** @format int32 */
  StartIndex?: number | null;
}

/** Class PlayRequestDto. */
export interface PlayRequestDto {
  /** Gets or sets the playing queue. */
  PlayingQueue?: string[];
  /**
   * Gets or sets the position of the playing item in the queue.
   * @format int32
   */
  PlayingItemPosition?: number;
  /**
   * Gets or sets the start position ticks.
   * @format int64
   */
  StartPositionTicks?: number;
}

/** Enum PlaystateCommand. */
export enum PlaystateCommand {
  Stop = 'Stop',
  Pause = 'Pause',
  Unpause = 'Unpause',
  NextTrack = 'NextTrack',
  PreviousTrack = 'PreviousTrack',
  Seek = 'Seek',
  Rewind = 'Rewind',
  FastForward = 'FastForward',
  PlayPause = 'PlayPause',
}

/** Playstate message. */
export interface PlaystateMessage {
  /** Gets or sets the data. */
  Data?: PlaystateRequest | null;
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "Playstate"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

export interface PlaystateRequest {
  /** Enum PlaystateCommand. */
  Command?:
    | 'Stop'
    | 'Pause'
    | 'Unpause'
    | 'NextTrack'
    | 'PreviousTrack'
    | 'Seek'
    | 'Rewind'
    | 'FastForward'
    | 'PlayPause';
  /** @format int64 */
  SeekPositionTicks?: number | null;
  /** Gets or sets the controlling user identifier. */
  ControllingUserId?: string | null;
}

/** This is a serializable stub class that is used by the api to provide information about installed plugins. */
export interface PluginInfo {
  /** Gets or sets the name. */
  Name?: string;
  /** Gets or sets the version. */
  Version?: string;
  /** Gets or sets the name of the configuration file. */
  ConfigurationFileName?: string | null;
  /** Gets or sets the description. */
  Description?: string;
  /**
   * Gets or sets the unique id.
   * @format uuid
   */
  Id?: string;
  /** Gets or sets a value indicating whether the plugin can be uninstalled. */
  CanUninstall?: boolean;
  /** Gets or sets a value indicating whether this plugin has a valid image. */
  HasImage?: boolean;
  /** Gets or sets a value indicating the status of the plugin. */
  Status?: 'Active' | 'Restart' | 'Deleted' | 'Superceded' | 'Malfunctioned' | 'NotSupported' | 'Disabled';
}

/** Plugin installation cancelled message. */
export interface PluginInstallationCancelledMessage {
  /** Class InstallationInfo. */
  Data?: InstallationInfo | null;
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "PackageInstallationCancelled"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** Plugin installation completed message. */
export interface PluginInstallationCompletedMessage {
  /** Class InstallationInfo. */
  Data?: InstallationInfo | null;
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "PackageInstallationCompleted"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** Plugin installation failed message. */
export interface PluginInstallationFailedMessage {
  /** Class InstallationInfo. */
  Data?: InstallationInfo | null;
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "PackageInstallationFailed"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** Package installing message. */
export interface PluginInstallingMessage {
  /** Class InstallationInfo. */
  Data?: InstallationInfo | null;
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "PackageInstalling"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** Plugin load status. */
export enum PluginStatus {
  Active = 'Active',
  Restart = 'Restart',
  Deleted = 'Deleted',
  Superceded = 'Superceded',
  Malfunctioned = 'Malfunctioned',
  NotSupported = 'NotSupported',
  Disabled = 'Disabled',
}

/** Plugin uninstalled message. */
export interface PluginUninstalledMessage {
  /** This is a serializable stub class that is used by the api to provide information about installed plugins. */
  Data?: PluginInfo | null;
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "PackageUninstalled"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** Class PreviousItemRequestDto. */
export interface PreviousItemRequestDto {
  /**
   * Gets or sets the playing item identifier.
   * @format uuid
   */
  PlaylistItemId?: string;
}

export interface ProblemDetails {
  type?: string | null;
  title?: string | null;
  /** @format int32 */
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  [key: string]: any;
}

export enum ProcessPriorityClass {
  Normal = 'Normal',
  Idle = 'Idle',
  High = 'High',
  RealTime = 'RealTime',
  BelowNormal = 'BelowNormal',
  AboveNormal = 'AboveNormal',
}

export interface ProfileCondition {
  Condition?: 'Equals' | 'NotEquals' | 'LessThanEqual' | 'GreaterThanEqual' | 'EqualsAny';
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
    | 'VideoRangeType';
  Value?: string | null;
  IsRequired?: boolean;
}

export enum ProfileConditionType {
  Equals = 'Equals',
  NotEquals = 'NotEquals',
  LessThanEqual = 'LessThanEqual',
  GreaterThanEqual = 'GreaterThanEqual',
  EqualsAny = 'EqualsAny',
}

export enum ProfileConditionValue {
  AudioChannels = 'AudioChannels',
  AudioBitrate = 'AudioBitrate',
  AudioProfile = 'AudioProfile',
  Width = 'Width',
  Height = 'Height',
  Has64BitOffsets = 'Has64BitOffsets',
  PacketLength = 'PacketLength',
  VideoBitDepth = 'VideoBitDepth',
  VideoBitrate = 'VideoBitrate',
  VideoFramerate = 'VideoFramerate',
  VideoLevel = 'VideoLevel',
  VideoProfile = 'VideoProfile',
  VideoTimestamp = 'VideoTimestamp',
  IsAnamorphic = 'IsAnamorphic',
  RefFrames = 'RefFrames',
  NumAudioStreams = 'NumAudioStreams',
  NumVideoStreams = 'NumVideoStreams',
  IsSecondaryAudio = 'IsSecondaryAudio',
  VideoCodecTag = 'VideoCodecTag',
  IsAvc = 'IsAvc',
  IsInterlaced = 'IsInterlaced',
  AudioSampleRate = 'AudioSampleRate',
  AudioBitDepth = 'AudioBitDepth',
  VideoRangeType = 'VideoRangeType',
}

export enum ProgramAudio {
  Mono = 'Mono',
  Stereo = 'Stereo',
  Dolby = 'Dolby',
  DolbyDigital = 'DolbyDigital',
  Thx = 'Thx',
  Atmos = 'Atmos',
}

export interface PublicSystemInfo {
  /** Gets or sets the local address. */
  LocalAddress?: string | null;
  /** Gets or sets the name of the server. */
  ServerName?: string | null;
  /** Gets or sets the server version. */
  Version?: string | null;
  /** Gets or sets the product name. This is the AssemblyProduct name. */
  ProductName?: string | null;
  /**
   * Gets or sets the operating system.
   * @deprecated
   */
  OperatingSystem?: string | null;
  /** Gets or sets the id. */
  Id?: string | null;
  /** Gets or sets a value indicating whether the startup wizard is completed. */
  StartupWizardCompleted?: boolean | null;
}

export interface QueryFilters {
  Genres?: NameGuidPair[] | null;
  Tags?: string[] | null;
}

export interface QueryFiltersLegacy {
  Genres?: string[] | null;
  Tags?: string[] | null;
  OfficialRatings?: string[] | null;
  Years?: number[] | null;
}

export interface QueueItem {
  /** @format uuid */
  Id?: string;
  PlaylistItemId?: string | null;
}

/** Class QueueRequestDto. */
export interface QueueRequestDto {
  /** Gets or sets the items to enqueue. */
  ItemIds?: string[];
  /** Gets or sets the mode in which to add the new items. */
  Mode?: 'Queue' | 'QueueNext';
}

/** The quick connect request body. */
export interface QuickConnectDto {
  /** Gets or sets the quick connect secret. */
  Secret: string;
}

/** Stores the state of an quick connect request. */
export interface QuickConnectResult {
  /** Gets or sets a value indicating whether this request is authorized. */
  Authenticated?: boolean;
  /** Gets the secret value used to uniquely identify this request. Can be used to retrieve authentication information. */
  Secret?: string;
  /** Gets the user facing code used so the user can quickly differentiate this request from others. */
  Code?: string;
  /** Gets the requesting device id. */
  DeviceId?: string;
  /** Gets the requesting device name. */
  DeviceName?: string;
  /** Gets the requesting app name. */
  AppName?: string;
  /** Gets the requesting app version. */
  AppVersion?: string;
  /**
   * Gets or sets the DateTime that this request was created.
   * @format date-time
   */
  DateAdded?: string;
}

export enum RatingType {
  Score = 'Score',
  Likes = 'Likes',
}

/** Class ReadyRequest. */
export interface ReadyRequestDto {
  /**
   * Gets or sets when the request has been made by the client.
   * @format date-time
   */
  When?: string;
  /**
   * Gets or sets the position ticks.
   * @format int64
   */
  PositionTicks?: number;
  /** Gets or sets a value indicating whether the client playback is unpaused. */
  IsPlaying?: boolean;
  /**
   * Gets or sets the playlist item identifier of the playing item.
   * @format uuid
   */
  PlaylistItemId?: string;
}

export interface RecommendationDto {
  Items?: BaseItemDto[] | null;
  RecommendationType?:
    | 'SimilarToRecentlyPlayed'
    | 'SimilarToLikedItem'
    | 'HasDirectorFromRecentlyPlayed'
    | 'HasActorFromRecentlyPlayed'
    | 'HasLikedDirector'
    | 'HasLikedActor';
  BaselineItemName?: string | null;
  /** @format uuid */
  CategoryId?: string;
}

export enum RecommendationType {
  SimilarToRecentlyPlayed = 'SimilarToRecentlyPlayed',
  SimilarToLikedItem = 'SimilarToLikedItem',
  HasDirectorFromRecentlyPlayed = 'HasDirectorFromRecentlyPlayed',
  HasActorFromRecentlyPlayed = 'HasActorFromRecentlyPlayed',
  HasLikedDirector = 'HasLikedDirector',
  HasLikedActor = 'HasLikedActor',
}

export enum RecordingStatus {
  New = 'New',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  ConflictedOk = 'ConflictedOk',
  ConflictedNotOk = 'ConflictedNotOk',
  Error = 'Error',
}

/** Refresh progress message. */
export interface RefreshProgressMessage {
  /** Gets or sets the data. */
  Data?: Record<string, string | null>;
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "RefreshProgress"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** Class RemoteImageInfo. */
export interface RemoteImageInfo {
  /** Gets or sets the name of the provider. */
  ProviderName?: string | null;
  /** Gets or sets the URL. */
  Url?: string | null;
  /** Gets or sets a url used for previewing a smaller version. */
  ThumbnailUrl?: string | null;
  /**
   * Gets or sets the height.
   * @format int32
   */
  Height?: number | null;
  /**
   * Gets or sets the width.
   * @format int32
   */
  Width?: number | null;
  /**
   * Gets or sets the community rating.
   * @format double
   */
  CommunityRating?: number | null;
  /**
   * Gets or sets the vote count.
   * @format int32
   */
  VoteCount?: number | null;
  /** Gets or sets the language. */
  Language?: string | null;
  /** Gets or sets the type. */
  Type?:
    | 'Primary'
    | 'Art'
    | 'Backdrop'
    | 'Banner'
    | 'Logo'
    | 'Thumb'
    | 'Disc'
    | 'Box'
    | 'Screenshot'
    | 'Menu'
    | 'Chapter'
    | 'BoxRear'
    | 'Profile';
  /** Gets or sets the type of the rating. */
  RatingType?: 'Score' | 'Likes';
}

/** Class RemoteImageResult. */
export interface RemoteImageResult {
  /** Gets or sets the images. */
  Images?: RemoteImageInfo[] | null;
  /**
   * Gets or sets the total record count.
   * @format int32
   */
  TotalRecordCount?: number;
  /** Gets or sets the providers. */
  Providers?: string[] | null;
}

/** The remote lyric info dto. */
export interface RemoteLyricInfoDto {
  /** Gets or sets the id for the lyric. */
  Id?: string;
  /** Gets the provider name. */
  ProviderName?: string;
  /** Gets the lyrics. */
  Lyrics?: LyricDto;
}

export interface RemoteSearchResult {
  /** Gets or sets the name. */
  Name?: string | null;
  /** Gets or sets the provider ids. */
  ProviderIds?: Record<string, string | null>;
  /**
   * Gets or sets the year.
   * @format int32
   */
  ProductionYear?: number | null;
  /** @format int32 */
  IndexNumber?: number | null;
  /** @format int32 */
  IndexNumberEnd?: number | null;
  /** @format int32 */
  ParentIndexNumber?: number | null;
  /** @format date-time */
  PremiereDate?: string | null;
  ImageUrl?: string | null;
  SearchProviderName?: string | null;
  Overview?: string | null;
  AlbumArtist?: RemoteSearchResult | null;
  Artists?: RemoteSearchResult[] | null;
}

export interface RemoteSubtitleInfo {
  ThreeLetterISOLanguageName?: string | null;
  Id?: string | null;
  ProviderName?: string | null;
  Name?: string | null;
  Format?: string | null;
  Author?: string | null;
  Comment?: string | null;
  /** @format date-time */
  DateCreated?: string | null;
  /** @format float */
  CommunityRating?: number | null;
  /** @format float */
  FrameRate?: number | null;
  /** @format int32 */
  DownloadCount?: number | null;
  IsHashMatch?: boolean | null;
  AiTranslated?: boolean | null;
  MachineTranslated?: boolean | null;
  Forced?: boolean | null;
  HearingImpaired?: boolean | null;
}

/** Class RemoveFromPlaylistRequestDto. */
export interface RemoveFromPlaylistRequestDto {
  /** Gets or sets the playlist identifiers of the items. Ignored when clearing the playlist. */
  PlaylistItemIds?: string[];
  /** Gets or sets a value indicating whether the entire playlist should be cleared. */
  ClearPlaylist?: boolean;
  /** Gets or sets a value indicating whether the playing item should be removed as well. Used only when clearing the playlist. */
  ClearPlayingItem?: boolean;
}

export enum RepeatMode {
  RepeatNone = 'RepeatNone',
  RepeatAll = 'RepeatAll',
  RepeatOne = 'RepeatOne',
}

/** Class RepositoryInfo. */
export interface RepositoryInfo {
  /** Gets or sets the name. */
  Name?: string | null;
  /** Gets or sets the URL. */
  Url?: string | null;
  /** Gets or sets a value indicating whether the repository is enabled. */
  Enabled?: boolean;
}

/** Restart required. */
export interface RestartRequiredMessage {
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "RestartRequired"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** Scheduled task ended message. */
export interface ScheduledTaskEndedMessage {
  /** Class TaskExecutionInfo. */
  Data?: TaskResult | null;
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "ScheduledTaskEnded"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** Scheduled tasks info message. */
export interface ScheduledTasksInfoMessage {
  /** Gets or sets the data. */
  Data?: TaskInfo[] | null;
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "ScheduledTasksInfo"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/**
 * Scheduled tasks info start message.
 * Data is the timing data encoded as "$initialDelay,$interval" in ms.
 */
export interface ScheduledTasksInfoStartMessage {
  /** Gets or sets the data. */
  Data?: string | null;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "ScheduledTasksInfoStart"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** Scheduled tasks info stop message. */
export interface ScheduledTasksInfoStopMessage {
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "ScheduledTasksInfoStop"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** An enum representing the axis that should be scrolled. */
export enum ScrollDirection {
  Horizontal = 'Horizontal',
  Vertical = 'Vertical',
}

/** Class SearchHintResult. */
export interface SearchHint {
  /**
   * Gets or sets the item id.
   * @deprecated
   * @format uuid
   */
  ItemId?: string;
  /**
   * Gets or sets the item id.
   * @format uuid
   */
  Id?: string;
  /** Gets or sets the name. */
  Name?: string;
  /** Gets or sets the matched term. */
  MatchedTerm?: string | null;
  /**
   * Gets or sets the index number.
   * @format int32
   */
  IndexNumber?: number | null;
  /**
   * Gets or sets the production year.
   * @format int32
   */
  ProductionYear?: number | null;
  /**
   * Gets or sets the parent index number.
   * @format int32
   */
  ParentIndexNumber?: number | null;
  /** Gets or sets the image tag. */
  PrimaryImageTag?: string | null;
  /** Gets or sets the thumb image tag. */
  ThumbImageTag?: string | null;
  /** Gets or sets the thumb image item identifier. */
  ThumbImageItemId?: string | null;
  /** Gets or sets the backdrop image tag. */
  BackdropImageTag?: string | null;
  /** Gets or sets the backdrop image item identifier. */
  BackdropImageItemId?: string | null;
  /** The base item kind. */
  Type?:
    | 'AggregateFolder'
    | 'Audio'
    | 'AudioBook'
    | 'BasePluginFolder'
    | 'Book'
    | 'BoxSet'
    | 'Channel'
    | 'ChannelFolderItem'
    | 'CollectionFolder'
    | 'Episode'
    | 'Folder'
    | 'Genre'
    | 'ManualPlaylistsFolder'
    | 'Movie'
    | 'LiveTvChannel'
    | 'LiveTvProgram'
    | 'MusicAlbum'
    | 'MusicArtist'
    | 'MusicGenre'
    | 'MusicVideo'
    | 'Person'
    | 'Photo'
    | 'PhotoAlbum'
    | 'Playlist'
    | 'PlaylistsFolder'
    | 'Program'
    | 'Recording'
    | 'Season'
    | 'Series'
    | 'Studio'
    | 'Trailer'
    | 'TvChannel'
    | 'TvProgram'
    | 'UserRootFolder'
    | 'UserView'
    | 'Video'
    | 'Year';
  /** Gets or sets a value indicating whether this instance is folder. */
  IsFolder?: boolean | null;
  /**
   * Gets or sets the run time ticks.
   * @format int64
   */
  RunTimeTicks?: number | null;
  /** Media types. */
  MediaType?: 'Unknown' | 'Video' | 'Audio' | 'Photo' | 'Book';
  /**
   * Gets or sets the start date.
   * @format date-time
   */
  StartDate?: string | null;
  /**
   * Gets or sets the end date.
   * @format date-time
   */
  EndDate?: string | null;
  /** Gets or sets the series. */
  Series?: string | null;
  /** Gets or sets the status. */
  Status?: string | null;
  /** Gets or sets the album. */
  Album?: string | null;
  /**
   * Gets or sets the album id.
   * @format uuid
   */
  AlbumId?: string | null;
  /** Gets or sets the album artist. */
  AlbumArtist?: string | null;
  /** Gets or sets the artists. */
  Artists?: string[];
  /**
   * Gets or sets the song count.
   * @format int32
   */
  SongCount?: number | null;
  /**
   * Gets or sets the episode count.
   * @format int32
   */
  EpisodeCount?: number | null;
  /**
   * Gets or sets the channel identifier.
   * @format uuid
   */
  ChannelId?: string | null;
  /** Gets or sets the name of the channel. */
  ChannelName?: string | null;
  /**
   * Gets or sets the primary image aspect ratio.
   * @format double
   */
  PrimaryImageAspectRatio?: number | null;
}

/** Class SearchHintResult. */
export interface SearchHintResult {
  /** Gets the search hints. */
  SearchHints?: SearchHint[];
  /**
   * Gets the total record count.
   * @format int32
   */
  TotalRecordCount?: number;
}

/** Class SeekRequestDto. */
export interface SeekRequestDto {
  /**
   * Gets or sets the position ticks.
   * @format int64
   */
  PositionTicks?: number;
}

/** Class SendCommand. */
export interface SendCommand {
  /**
   * Gets the group identifier.
   * @format uuid
   */
  GroupId?: string;
  /**
   * Gets the playlist identifier of the playing item.
   * @format uuid
   */
  PlaylistItemId?: string;
  /**
   * Gets or sets the UTC time when to execute the command.
   * @format date-time
   */
  When?: string;
  /**
   * Gets the position ticks.
   * @format int64
   */
  PositionTicks?: number | null;
  /** Gets the command. */
  Command?: 'Unpause' | 'Pause' | 'Stop' | 'Seek';
  /**
   * Gets the UTC time when this command has been emitted.
   * @format date-time
   */
  EmittedAt?: string;
}

/** Enum SendCommandType. */
export enum SendCommandType {
  Unpause = 'Unpause',
  Pause = 'Pause',
  Stop = 'Stop',
  Seek = 'Seek',
}

export interface SeriesInfo {
  /** Gets or sets the name. */
  Name?: string | null;
  /** Gets or sets the original title. */
  OriginalTitle?: string | null;
  /** Gets or sets the path. */
  Path?: string | null;
  /** Gets or sets the metadata language. */
  MetadataLanguage?: string | null;
  /** Gets or sets the metadata country code. */
  MetadataCountryCode?: string | null;
  /** Gets or sets the provider ids. */
  ProviderIds?: Record<string, string | null>;
  /**
   * Gets or sets the year.
   * @format int32
   */
  Year?: number | null;
  /** @format int32 */
  IndexNumber?: number | null;
  /** @format int32 */
  ParentIndexNumber?: number | null;
  /** @format date-time */
  PremiereDate?: string | null;
  IsAutomated?: boolean;
}

export interface SeriesInfoRemoteSearchQuery {
  SearchInfo?: SeriesInfo | null;
  /** @format uuid */
  ItemId?: string;
  /** Gets or sets the provider name to search within if set. */
  SearchProviderName?: string | null;
  /** Gets or sets a value indicating whether disabled providers should be included. */
  IncludeDisabledProviders?: boolean;
}

/** The status of a series. */
export enum SeriesStatus {
  Continuing = 'Continuing',
  Ended = 'Ended',
  Unreleased = 'Unreleased',
}

/** Series timer cancelled message. */
export interface SeriesTimerCancelledMessage {
  /** Gets or sets the data. */
  Data?: TimerEventInfo | null;
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "SeriesTimerCancelled"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** Series timer created message. */
export interface SeriesTimerCreatedMessage {
  /** Gets or sets the data. */
  Data?: TimerEventInfo | null;
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "SeriesTimerCreated"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** Class SeriesTimerInfoDto. */
export interface SeriesTimerInfoDto {
  /** Gets or sets the Id of the recording. */
  Id?: string | null;
  Type?: string | null;
  /** Gets or sets the server identifier. */
  ServerId?: string | null;
  /** Gets or sets the external identifier. */
  ExternalId?: string | null;
  /**
   * Gets or sets the channel id of the recording.
   * @format uuid
   */
  ChannelId?: string;
  /** Gets or sets the external channel identifier. */
  ExternalChannelId?: string | null;
  /** Gets or sets the channel name of the recording. */
  ChannelName?: string | null;
  ChannelPrimaryImageTag?: string | null;
  /** Gets or sets the program identifier. */
  ProgramId?: string | null;
  /** Gets or sets the external program identifier. */
  ExternalProgramId?: string | null;
  /** Gets or sets the name of the recording. */
  Name?: string | null;
  /** Gets or sets the description of the recording. */
  Overview?: string | null;
  /**
   * Gets or sets the start date of the recording, in UTC.
   * @format date-time
   */
  StartDate?: string;
  /**
   * Gets or sets the end date of the recording, in UTC.
   * @format date-time
   */
  EndDate?: string;
  /** Gets or sets the name of the service. */
  ServiceName?: string | null;
  /**
   * Gets or sets the priority.
   * @format int32
   */
  Priority?: number;
  /**
   * Gets or sets the pre padding seconds.
   * @format int32
   */
  PrePaddingSeconds?: number;
  /**
   * Gets or sets the post padding seconds.
   * @format int32
   */
  PostPaddingSeconds?: number;
  /** Gets or sets a value indicating whether this instance is pre padding required. */
  IsPrePaddingRequired?: boolean;
  /** Gets or sets the Id of the Parent that has a backdrop if the item does not have one. */
  ParentBackdropItemId?: string | null;
  /** Gets or sets the parent backdrop image tags. */
  ParentBackdropImageTags?: string[] | null;
  /** Gets or sets a value indicating whether this instance is post padding required. */
  IsPostPaddingRequired?: boolean;
  KeepUntil?: 'UntilDeleted' | 'UntilSpaceNeeded' | 'UntilWatched' | 'UntilDate';
  /** Gets or sets a value indicating whether [record any time]. */
  RecordAnyTime?: boolean;
  SkipEpisodesInLibrary?: boolean;
  /** Gets or sets a value indicating whether [record any channel]. */
  RecordAnyChannel?: boolean;
  /** @format int32 */
  KeepUpTo?: number;
  /** Gets or sets a value indicating whether [record new only]. */
  RecordNewOnly?: boolean;
  /** Gets or sets the days. */
  Days?: DayOfWeek[] | null;
  /** Gets or sets the day pattern. */
  DayPattern?: 'Daily' | 'Weekdays' | 'Weekends' | null;
  /** Gets or sets the image tags. */
  ImageTags?: Record<string, string>;
  /** Gets or sets the parent thumb item id. */
  ParentThumbItemId?: string | null;
  /** Gets or sets the parent thumb image tag. */
  ParentThumbImageTag?: string | null;
  /** Gets or sets the parent primary image item identifier. */
  ParentPrimaryImageItemId?: string | null;
  /** Gets or sets the parent primary image tag. */
  ParentPrimaryImageTag?: string | null;
}

/** Query result container. */
export interface SeriesTimerInfoDtoQueryResult {
  /** Gets or sets the items. */
  Items?: SeriesTimerInfoDto[];
  /**
   * Gets or sets the total number of records available.
   * @format int32
   */
  TotalRecordCount?: number;
  /**
   * Gets or sets the index of the first record in Items.
   * @format int32
   */
  StartIndex?: number;
}

/** Represents the server configuration. */
export interface ServerConfiguration {
  /**
   * Gets or sets the number of days we should retain log files.
   * @format int32
   */
  LogFileRetentionDays?: number;
  /** Gets or sets a value indicating whether this instance is first run. */
  IsStartupWizardCompleted?: boolean;
  /** Gets or sets the cache path. */
  CachePath?: string | null;
  /** Gets or sets the last known version that was ran using the configuration. */
  PreviousVersion?: string | null;
  /**
   * Gets or sets the stringified PreviousVersion to be stored/loaded,
   * because System.Version itself isn't xml-serializable.
   */
  PreviousVersionStr?: string | null;
  /** Gets or sets a value indicating whether to enable prometheus metrics exporting. */
  EnableMetrics?: boolean;
  EnableNormalizedItemByNameIds?: boolean;
  /** Gets or sets a value indicating whether this instance is port authorized. */
  IsPortAuthorized?: boolean;
  /** Gets or sets a value indicating whether quick connect is available for use on this server. */
  QuickConnectAvailable?: boolean;
  /** Gets or sets a value indicating whether [enable case sensitive item ids]. */
  EnableCaseSensitiveItemIds?: boolean;
  DisableLiveTvChannelUserDataName?: boolean;
  /** Gets or sets the metadata path. */
  MetadataPath?: string;
  /** Gets or sets the preferred metadata language. */
  PreferredMetadataLanguage?: string;
  /** Gets or sets the metadata country code. */
  MetadataCountryCode?: string;
  /** Gets or sets characters to be replaced with a ' ' in strings to create a sort name. */
  SortReplaceCharacters?: string[];
  /** Gets or sets characters to be removed from strings to create a sort name. */
  SortRemoveCharacters?: string[];
  /** Gets or sets words to be removed from strings to create a sort name. */
  SortRemoveWords?: string[];
  /**
   * Gets or sets the minimum percentage of an item that must be played in order for playstate to be updated.
   * @format int32
   */
  MinResumePct?: number;
  /**
   * Gets or sets the maximum percentage of an item that can be played while still saving playstate. If this percentage is crossed playstate will be reset to the beginning and the item will be marked watched.
   * @format int32
   */
  MaxResumePct?: number;
  /**
   * Gets or sets the minimum duration that an item must have in order to be eligible for playstate updates..
   * @format int32
   */
  MinResumeDurationSeconds?: number;
  /**
   * Gets or sets the minimum minutes of a book that must be played in order for playstate to be updated.
   * @format int32
   */
  MinAudiobookResume?: number;
  /**
   * Gets or sets the remaining minutes of a book that can be played while still saving playstate. If this percentage is crossed playstate will be reset to the beginning and the item will be marked watched.
   * @format int32
   */
  MaxAudiobookResume?: number;
  /**
   * Gets or sets the threshold in minutes after a inactive session gets closed automatically.
   * If set to 0 the check for inactive sessions gets disabled.
   * @format int32
   */
  InactiveSessionThreshold?: number;
  /**
   * Gets or sets the delay in seconds that we will wait after a file system change to try and discover what has been added/removed
   * Some delay is necessary with some items because their creation is not atomic.  It involves the creation of several
   * different directories and files.
   * @format int32
   */
  LibraryMonitorDelay?: number;
  /**
   * Gets or sets the duration in seconds that we will wait after a library updated event before executing the library changed notification.
   * @format int32
   */
  LibraryUpdateDuration?: number;
  /** Gets or sets the image saving convention. */
  ImageSavingConvention?: 'Legacy' | 'Compatible';
  MetadataOptions?: MetadataOptions[];
  SkipDeserializationForBasicTypes?: boolean;
  ServerName?: string;
  UICulture?: string;
  SaveMetadataHidden?: boolean;
  ContentTypes?: NameValuePair[];
  /** @format int32 */
  RemoteClientBitrateLimit?: number;
  EnableFolderView?: boolean;
  EnableGroupingIntoCollections?: boolean;
  DisplaySpecialsWithinSeasons?: boolean;
  CodecsUsed?: string[];
  PluginRepositories?: RepositoryInfo[];
  EnableExternalContentInSuggestions?: boolean;
  /** @format int32 */
  ImageExtractionTimeoutMs?: number;
  PathSubstitutions?: PathSubstitution[];
  /** Gets or sets a value indicating whether slow server responses should be logged as a warning. */
  EnableSlowResponseWarning?: boolean;
  /**
   * Gets or sets the threshold for the slow response time warning in ms.
   * @format int64
   */
  SlowResponseThresholdMs?: number;
  /** Gets or sets the cors hosts. */
  CorsHosts?: string[];
  /**
   * Gets or sets the number of days we should retain activity logs.
   * @format int32
   */
  ActivityLogRetentionDays?: number | null;
  /**
   * Gets or sets the how the library scan fans out.
   * @format int32
   */
  LibraryScanFanoutConcurrency?: number;
  /**
   * Gets or sets the how many metadata refreshes can run concurrently.
   * @format int32
   */
  LibraryMetadataRefreshConcurrency?: number;
  /** Gets or sets a value indicating whether older plugins should automatically be deleted from the plugin folder. */
  RemoveOldPlugins?: boolean;
  /** Gets or sets a value indicating whether clients should be allowed to upload logs. */
  AllowClientLogUpload?: boolean;
  /**
   * Gets or sets the dummy chapter duration in seconds, use 0 (zero) or less to disable generation alltogether.
   * @format int32
   */
  DummyChapterDuration?: number;
  /** Gets or sets the chapter image resolution. */
  ChapterImageResolution?: 'MatchSource' | 'P144' | 'P240' | 'P360' | 'P480' | 'P720' | 'P1080' | 'P1440' | 'P2160';
  /**
   * Gets or sets the limit for parallel image encoding.
   * @format int32
   */
  ParallelImageEncodingLimit?: number;
  /** Gets or sets the list of cast receiver applications. */
  CastReceiverApplications?: CastReceiverApplication[];
  /** Gets or sets the trickplay options. */
  TrickplayOptions?: TrickplayOptions;
}

/** The server discovery info model. */
export interface ServerDiscoveryInfo {
  /** Gets the address. */
  Address?: string;
  /** Gets the server identifier. */
  Id?: string;
  /** Gets the name. */
  Name?: string;
  /** Gets the endpoint address. */
  EndpointAddress?: string | null;
}

/** Server restarting down message. */
export interface ServerRestartingMessage {
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "ServerRestarting"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** Server shutting down message. */
export interface ServerShuttingDownMessage {
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "ServerShuttingDown"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** Session info DTO. */
export interface SessionInfoDto {
  /** Gets or sets the play state. */
  PlayState?: PlayerStateInfo | null;
  /** Gets or sets the additional users. */
  AdditionalUsers?: SessionUserInfo[] | null;
  /** Gets or sets the client capabilities. */
  Capabilities?: ClientCapabilitiesDto | null;
  /** Gets or sets the remote end point. */
  RemoteEndPoint?: string | null;
  /** Gets or sets the playable media types. */
  PlayableMediaTypes?: MediaType[];
  /** Gets or sets the id. */
  Id?: string | null;
  /**
   * Gets or sets the user id.
   * @format uuid
   */
  UserId?: string;
  /** Gets or sets the username. */
  UserName?: string | null;
  /** Gets or sets the type of the client. */
  Client?: string | null;
  /**
   * Gets or sets the last activity date.
   * @format date-time
   */
  LastActivityDate?: string;
  /**
   * Gets or sets the last playback check in.
   * @format date-time
   */
  LastPlaybackCheckIn?: string;
  /**
   * Gets or sets the last paused date.
   * @format date-time
   */
  LastPausedDate?: string | null;
  /** Gets or sets the name of the device. */
  DeviceName?: string | null;
  /** Gets or sets the type of the device. */
  DeviceType?: string | null;
  /** Gets or sets the now playing item. */
  NowPlayingItem?: BaseItemDto | null;
  /** Gets or sets the now viewing item. */
  NowViewingItem?: BaseItemDto | null;
  /** Gets or sets the device id. */
  DeviceId?: string | null;
  /** Gets or sets the application version. */
  ApplicationVersion?: string | null;
  /** Gets or sets the transcoding info. */
  TranscodingInfo?: TranscodingInfo | null;
  /** Gets or sets a value indicating whether this session is active. */
  IsActive?: boolean;
  /** Gets or sets a value indicating whether the session supports media control. */
  SupportsMediaControl?: boolean;
  /** Gets or sets a value indicating whether the session supports remote control. */
  SupportsRemoteControl?: boolean;
  /** Gets or sets the now playing queue. */
  NowPlayingQueue?: QueueItem[] | null;
  /** Gets or sets the now playing queue full items. */
  NowPlayingQueueFullItems?: BaseItemDto[] | null;
  /** Gets or sets a value indicating whether the session has a custom device name. */
  HasCustomDeviceName?: boolean;
  /** Gets or sets the playlist item id. */
  PlaylistItemId?: string | null;
  /** Gets or sets the server id. */
  ServerId?: string | null;
  /** Gets or sets the user primary image tag. */
  UserPrimaryImageTag?: string | null;
  /** Gets or sets the supported commands. */
  SupportedCommands?: GeneralCommandType[];
}

/** The different kinds of messages that are used in the WebSocket api. */
export enum SessionMessageType {
  ForceKeepAlive = 'ForceKeepAlive',
  GeneralCommand = 'GeneralCommand',
  UserDataChanged = 'UserDataChanged',
  Sessions = 'Sessions',
  Play = 'Play',
  SyncPlayCommand = 'SyncPlayCommand',
  SyncPlayGroupUpdate = 'SyncPlayGroupUpdate',
  Playstate = 'Playstate',
  RestartRequired = 'RestartRequired',
  ServerShuttingDown = 'ServerShuttingDown',
  ServerRestarting = 'ServerRestarting',
  LibraryChanged = 'LibraryChanged',
  UserDeleted = 'UserDeleted',
  UserUpdated = 'UserUpdated',
  SeriesTimerCreated = 'SeriesTimerCreated',
  TimerCreated = 'TimerCreated',
  SeriesTimerCancelled = 'SeriesTimerCancelled',
  TimerCancelled = 'TimerCancelled',
  RefreshProgress = 'RefreshProgress',
  ScheduledTaskEnded = 'ScheduledTaskEnded',
  PackageInstallationCancelled = 'PackageInstallationCancelled',
  PackageInstallationFailed = 'PackageInstallationFailed',
  PackageInstallationCompleted = 'PackageInstallationCompleted',
  PackageInstalling = 'PackageInstalling',
  PackageUninstalled = 'PackageUninstalled',
  ActivityLogEntry = 'ActivityLogEntry',
  ScheduledTasksInfo = 'ScheduledTasksInfo',
  ActivityLogEntryStart = 'ActivityLogEntryStart',
  ActivityLogEntryStop = 'ActivityLogEntryStop',
  SessionsStart = 'SessionsStart',
  SessionsStop = 'SessionsStop',
  ScheduledTasksInfoStart = 'ScheduledTasksInfoStart',
  ScheduledTasksInfoStop = 'ScheduledTasksInfoStop',
  KeepAlive = 'KeepAlive',
}

/** Sessions message. */
export interface SessionsMessage {
  /** Gets or sets the data. */
  Data?: SessionInfoDto[] | null;
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "Sessions"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/**
 * Sessions start message.
 * Data is the timing data encoded as "$initialDelay,$interval" in ms.
 */
export interface SessionsStartMessage {
  /** Gets or sets the data. */
  Data?: string | null;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "SessionsStart"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** Sessions stop message. */
export interface SessionsStopMessage {
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "SessionsStop"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** Class SessionUserInfo. */
export interface SessionUserInfo {
  /**
   * Gets or sets the user identifier.
   * @format uuid
   */
  UserId?: string;
  /** Gets or sets the name of the user. */
  UserName?: string | null;
}

/** Set channel mapping dto. */
export interface SetChannelMappingDto {
  /** Gets or sets the provider id. */
  ProviderId: string;
  /** Gets or sets the tuner channel id. */
  TunerChannelId: string;
  /** Gets or sets the provider channel id. */
  ProviderChannelId: string;
}

/** Class SetPlaylistItemRequestDto. */
export interface SetPlaylistItemRequestDto {
  /**
   * Gets or sets the playlist identifier of the playing item.
   * @format uuid
   */
  PlaylistItemId?: string;
}

/** Class SetRepeatModeRequestDto. */
export interface SetRepeatModeRequestDto {
  /** Gets or sets the repeat mode. */
  Mode?: 'RepeatOne' | 'RepeatAll' | 'RepeatNone';
}

/** Class SetShuffleModeRequestDto. */
export interface SetShuffleModeRequestDto {
  /** Gets or sets the shuffle mode. */
  Mode?: 'Sorted' | 'Shuffle';
}

export interface SongInfo {
  /** Gets or sets the name. */
  Name?: string | null;
  /** Gets or sets the original title. */
  OriginalTitle?: string | null;
  /** Gets or sets the path. */
  Path?: string | null;
  /** Gets or sets the metadata language. */
  MetadataLanguage?: string | null;
  /** Gets or sets the metadata country code. */
  MetadataCountryCode?: string | null;
  /** Gets or sets the provider ids. */
  ProviderIds?: Record<string, string | null>;
  /**
   * Gets or sets the year.
   * @format int32
   */
  Year?: number | null;
  /** @format int32 */
  IndexNumber?: number | null;
  /** @format int32 */
  ParentIndexNumber?: number | null;
  /** @format date-time */
  PremiereDate?: string | null;
  IsAutomated?: boolean;
  AlbumArtists?: string[] | null;
  Album?: string | null;
  Artists?: string[] | null;
}

/** An enum representing the sorting order. */
export enum SortOrder {
  Ascending = 'Ascending',
  Descending = 'Descending',
}

/** Special view option dto. */
export interface SpecialViewOptionDto {
  /** Gets or sets view option name. */
  Name?: string | null;
  /** Gets or sets view option id. */
  Id?: string | null;
}

/** The startup configuration DTO. */
export interface StartupConfigurationDto {
  /** Gets or sets UI language culture. */
  UICulture?: string | null;
  /** Gets or sets the metadata country code. */
  MetadataCountryCode?: string | null;
  /** Gets or sets the preferred language for the metadata. */
  PreferredMetadataLanguage?: string | null;
}

/** Startup remote access dto. */
export interface StartupRemoteAccessDto {
  /** Gets or sets a value indicating whether enable remote access. */
  EnableRemoteAccess: boolean;
  /** Gets or sets a value indicating whether enable automatic port mapping. */
  EnableAutomaticPortMapping: boolean;
}

/** The startup user DTO. */
export interface StartupUserDto {
  /** Gets or sets the username. */
  Name?: string | null;
  /** Gets or sets the user's password. */
  Password?: string | null;
}

/** Class GroupUpdate. */
export interface StringGroupUpdate {
  /**
   * Gets the group identifier.
   * @format uuid
   */
  GroupId?: string;
  /** Gets the update type. */
  Type?:
    | 'UserJoined'
    | 'UserLeft'
    | 'GroupJoined'
    | 'GroupLeft'
    | 'StateUpdate'
    | 'PlayQueue'
    | 'NotInGroup'
    | 'GroupDoesNotExist'
    | 'CreateGroupDenied'
    | 'JoinGroupDenied'
    | 'LibraryAccessDenied';
  /** Gets the update data. */
  Data?: string;
}

/** Delivery method to use during playback of a specific subtitle format. */
export enum SubtitleDeliveryMethod {
  Encode = 'Encode',
  Embed = 'Embed',
  External = 'External',
  Hls = 'Hls',
  Drop = 'Drop',
}

export interface SubtitleOptions {
  SkipIfEmbeddedSubtitlesPresent?: boolean;
  SkipIfAudioTrackMatches?: boolean;
  DownloadLanguages?: string[] | null;
  DownloadMovieSubtitles?: boolean;
  DownloadEpisodeSubtitles?: boolean;
  OpenSubtitlesUsername?: string | null;
  OpenSubtitlesPasswordHash?: string | null;
  IsOpenSubtitleVipAccount?: boolean;
  RequirePerfectMatch?: boolean;
}

/** An enum representing a subtitle playback mode. */
export enum SubtitlePlaybackMode {
  Default = 'Default',
  Always = 'Always',
  OnlyForced = 'OnlyForced',
  None = 'None',
  Smart = 'Smart',
}

/** A class for subtitle profile information. */
export interface SubtitleProfile {
  /** Gets or sets the format. */
  Format?: string | null;
  /** Gets or sets the delivery method. */
  Method?: 'Encode' | 'Embed' | 'External' | 'Hls' | 'Drop';
  /** Gets or sets the DIDL mode. */
  DidlMode?: string | null;
  /** Gets or sets the language. */
  Language?: string | null;
  /** Gets or sets the container. */
  Container?: string | null;
}

/** Sync play command. */
export interface SyncPlayCommandMessage {
  /** Class SendCommand. */
  Data?: SendCommand | null;
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "SyncPlayCommand"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** Untyped sync play command. */
export interface SyncPlayGroupUpdateCommandMessage {
  /** Group update without data. */
  Data?: GroupUpdate | null;
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "SyncPlayGroupUpdate"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** Class QueueItem. */
export interface SyncPlayQueueItem {
  /**
   * Gets the item identifier.
   * @format uuid
   */
  ItemId?: string;
  /**
   * Gets the playlist identifier of the item.
   * @format uuid
   */
  PlaylistItemId?: string;
}

/** Enum SyncPlayUserAccessType. */
export enum SyncPlayUserAccessType {
  CreateAndJoinGroups = 'CreateAndJoinGroups',
  JoinGroups = 'JoinGroups',
  None = 'None',
}

/** Class SystemInfo. */
export interface SystemInfo {
  /** Gets or sets the local address. */
  LocalAddress?: string | null;
  /** Gets or sets the name of the server. */
  ServerName?: string | null;
  /** Gets or sets the server version. */
  Version?: string | null;
  /** Gets or sets the product name. This is the AssemblyProduct name. */
  ProductName?: string | null;
  /**
   * Gets or sets the operating system.
   * @deprecated
   */
  OperatingSystem?: string | null;
  /** Gets or sets the id. */
  Id?: string | null;
  /** Gets or sets a value indicating whether the startup wizard is completed. */
  StartupWizardCompleted?: boolean | null;
  /**
   * Gets or sets the display name of the operating system.
   * @deprecated
   */
  OperatingSystemDisplayName?: string | null;
  /** Gets or sets the package name. */
  PackageName?: string | null;
  /** Gets or sets a value indicating whether this instance has pending restart. */
  HasPendingRestart?: boolean;
  IsShuttingDown?: boolean;
  /** Gets or sets a value indicating whether [supports library monitor]. */
  SupportsLibraryMonitor?: boolean;
  /**
   * Gets or sets the web socket port number.
   * @format int32
   */
  WebSocketPortNumber?: number;
  /** Gets or sets the completed installations. */
  CompletedInstallations?: InstallationInfo[] | null;
  /**
   * Gets or sets a value indicating whether this instance can self restart.
   * @deprecated
   * @default true
   */
  CanSelfRestart?: boolean;
  /**
   * @deprecated
   * @default false
   */
  CanLaunchWebBrowser?: boolean;
  /** Gets or sets the program data path. */
  ProgramDataPath?: string | null;
  /** Gets or sets the web UI resources path. */
  WebPath?: string | null;
  /** Gets or sets the items by name path. */
  ItemsByNamePath?: string | null;
  /** Gets or sets the cache path. */
  CachePath?: string | null;
  /** Gets or sets the log path. */
  LogPath?: string | null;
  /** Gets or sets the internal metadata path. */
  InternalMetadataPath?: string | null;
  /** Gets or sets the transcode path. */
  TranscodingTempPath?: string | null;
  /** Gets or sets the list of cast receiver applications. */
  CastReceiverApplications?: CastReceiverApplication[] | null;
  /**
   * Gets or sets a value indicating whether this instance has update available.
   * @deprecated
   * @default false
   */
  HasUpdateAvailable?: boolean;
  /**
   * @deprecated
   * @default "System"
   */
  EncoderLocation?: string | null;
  /**
   * @deprecated
   * @default "X64"
   */
  SystemArchitecture?: string | null;
}

/** Enum TaskCompletionStatus. */
export enum TaskCompletionStatus {
  Completed = 'Completed',
  Failed = 'Failed',
  Cancelled = 'Cancelled',
  Aborted = 'Aborted',
}

/** Class TaskInfo. */
export interface TaskInfo {
  /** Gets or sets the name. */
  Name?: string | null;
  /** Gets or sets the state of the task. */
  State?: 'Idle' | 'Cancelling' | 'Running';
  /**
   * Gets or sets the progress.
   * @format double
   */
  CurrentProgressPercentage?: number | null;
  /** Gets or sets the id. */
  Id?: string | null;
  /** Gets or sets the last execution result. */
  LastExecutionResult?: TaskResult | null;
  /** Gets or sets the triggers. */
  Triggers?: TaskTriggerInfo[] | null;
  /** Gets or sets the description. */
  Description?: string | null;
  /** Gets or sets the category. */
  Category?: string | null;
  /** Gets or sets a value indicating whether this instance is hidden. */
  IsHidden?: boolean;
  /** Gets or sets the key. */
  Key?: string | null;
}

/** Class TaskExecutionInfo. */
export interface TaskResult {
  /**
   * Gets or sets the start time UTC.
   * @format date-time
   */
  StartTimeUtc?: string;
  /**
   * Gets or sets the end time UTC.
   * @format date-time
   */
  EndTimeUtc?: string;
  /** Gets or sets the status. */
  Status?: 'Completed' | 'Failed' | 'Cancelled' | 'Aborted';
  /** Gets or sets the name. */
  Name?: string | null;
  /** Gets or sets the key. */
  Key?: string | null;
  /** Gets or sets the id. */
  Id?: string | null;
  /** Gets or sets the error message. */
  ErrorMessage?: string | null;
  /** Gets or sets the long error message. */
  LongErrorMessage?: string | null;
}

/** Enum TaskState. */
export enum TaskState {
  Idle = 'Idle',
  Cancelling = 'Cancelling',
  Running = 'Running',
}

/** Class TaskTriggerInfo. */
export interface TaskTriggerInfo {
  /** Gets or sets the type. */
  Type?: string | null;
  /**
   * Gets or sets the time of day.
   * @format int64
   */
  TimeOfDayTicks?: number | null;
  /**
   * Gets or sets the interval.
   * @format int64
   */
  IntervalTicks?: number | null;
  /** Gets or sets the day of week. */
  DayOfWeek?: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | null;
  /**
   * Gets or sets the maximum runtime ticks.
   * @format int64
   */
  MaxRuntimeTicks?: number | null;
}

/** Class ThemeMediaResult. */
export interface ThemeMediaResult {
  /** Gets or sets the items. */
  Items?: BaseItemDto[];
  /**
   * Gets or sets the total number of records available.
   * @format int32
   */
  TotalRecordCount?: number;
  /**
   * Gets or sets the index of the first record in Items.
   * @format int32
   */
  StartIndex?: number;
  /**
   * Gets or sets the owner id.
   * @format uuid
   */
  OwnerId?: string;
}

/** Timer cancelled message. */
export interface TimerCancelledMessage {
  /** Gets or sets the data. */
  Data?: TimerEventInfo | null;
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "TimerCancelled"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** Timer created message. */
export interface TimerCreatedMessage {
  /** Gets or sets the data. */
  Data?: TimerEventInfo | null;
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "TimerCreated"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

export interface TimerEventInfo {
  Id?: string;
  /** @format uuid */
  ProgramId?: string | null;
}

export interface TimerInfoDto {
  /** Gets or sets the Id of the recording. */
  Id?: string | null;
  Type?: string | null;
  /** Gets or sets the server identifier. */
  ServerId?: string | null;
  /** Gets or sets the external identifier. */
  ExternalId?: string | null;
  /**
   * Gets or sets the channel id of the recording.
   * @format uuid
   */
  ChannelId?: string;
  /** Gets or sets the external channel identifier. */
  ExternalChannelId?: string | null;
  /** Gets or sets the channel name of the recording. */
  ChannelName?: string | null;
  ChannelPrimaryImageTag?: string | null;
  /** Gets or sets the program identifier. */
  ProgramId?: string | null;
  /** Gets or sets the external program identifier. */
  ExternalProgramId?: string | null;
  /** Gets or sets the name of the recording. */
  Name?: string | null;
  /** Gets or sets the description of the recording. */
  Overview?: string | null;
  /**
   * Gets or sets the start date of the recording, in UTC.
   * @format date-time
   */
  StartDate?: string;
  /**
   * Gets or sets the end date of the recording, in UTC.
   * @format date-time
   */
  EndDate?: string;
  /** Gets or sets the name of the service. */
  ServiceName?: string | null;
  /**
   * Gets or sets the priority.
   * @format int32
   */
  Priority?: number;
  /**
   * Gets or sets the pre padding seconds.
   * @format int32
   */
  PrePaddingSeconds?: number;
  /**
   * Gets or sets the post padding seconds.
   * @format int32
   */
  PostPaddingSeconds?: number;
  /** Gets or sets a value indicating whether this instance is pre padding required. */
  IsPrePaddingRequired?: boolean;
  /** Gets or sets the Id of the Parent that has a backdrop if the item does not have one. */
  ParentBackdropItemId?: string | null;
  /** Gets or sets the parent backdrop image tags. */
  ParentBackdropImageTags?: string[] | null;
  /** Gets or sets a value indicating whether this instance is post padding required. */
  IsPostPaddingRequired?: boolean;
  KeepUntil?: 'UntilDeleted' | 'UntilSpaceNeeded' | 'UntilWatched' | 'UntilDate';
  /** Gets or sets the status. */
  Status?: 'New' | 'InProgress' | 'Completed' | 'Cancelled' | 'ConflictedOk' | 'ConflictedNotOk' | 'Error';
  /** Gets or sets the series timer identifier. */
  SeriesTimerId?: string | null;
  /** Gets or sets the external series timer identifier. */
  ExternalSeriesTimerId?: string | null;
  /**
   * Gets or sets the run time ticks.
   * @format int64
   */
  RunTimeTicks?: number | null;
  /** Gets or sets the program information. */
  ProgramInfo?: BaseItemDto | null;
}

/** Query result container. */
export interface TimerInfoDtoQueryResult {
  /** Gets or sets the items. */
  Items?: TimerInfoDto[];
  /**
   * Gets or sets the total number of records available.
   * @format int32
   */
  TotalRecordCount?: number;
  /**
   * Gets or sets the index of the first record in Items.
   * @format int32
   */
  StartIndex?: number;
}

/** Enum containing tonemapping algorithms. */
export enum TonemappingAlgorithm {
  None = 'none',
  Clip = 'clip',
  Linear = 'linear',
  Gamma = 'gamma',
  Reinhard = 'reinhard',
  Hable = 'hable',
  Mobius = 'mobius',
  Bt2390 = 'bt2390',
}

/** Enum containing tonemapping modes. */
export enum TonemappingMode {
  Auto = 'auto',
  Max = 'max',
  Rgb = 'rgb',
  Lum = 'lum',
  Itp = 'itp',
}

/** Enum containing tonemapping ranges. */
export enum TonemappingRange {
  Auto = 'auto',
  Tv = 'tv',
  Pc = 'pc',
}

export interface TrailerInfo {
  /** Gets or sets the name. */
  Name?: string | null;
  /** Gets or sets the original title. */
  OriginalTitle?: string | null;
  /** Gets or sets the path. */
  Path?: string | null;
  /** Gets or sets the metadata language. */
  MetadataLanguage?: string | null;
  /** Gets or sets the metadata country code. */
  MetadataCountryCode?: string | null;
  /** Gets or sets the provider ids. */
  ProviderIds?: Record<string, string | null>;
  /**
   * Gets or sets the year.
   * @format int32
   */
  Year?: number | null;
  /** @format int32 */
  IndexNumber?: number | null;
  /** @format int32 */
  ParentIndexNumber?: number | null;
  /** @format date-time */
  PremiereDate?: string | null;
  IsAutomated?: boolean;
}

export interface TrailerInfoRemoteSearchQuery {
  SearchInfo?: TrailerInfo | null;
  /** @format uuid */
  ItemId?: string;
  /** Gets or sets the provider name to search within if set. */
  SearchProviderName?: string | null;
  /** Gets or sets a value indicating whether disabled providers should be included. */
  IncludeDisabledProviders?: boolean;
}

export enum TranscodeReason {
  ContainerNotSupported = 'ContainerNotSupported',
  VideoCodecNotSupported = 'VideoCodecNotSupported',
  AudioCodecNotSupported = 'AudioCodecNotSupported',
  SubtitleCodecNotSupported = 'SubtitleCodecNotSupported',
  AudioIsExternal = 'AudioIsExternal',
  SecondaryAudioNotSupported = 'SecondaryAudioNotSupported',
  VideoProfileNotSupported = 'VideoProfileNotSupported',
  VideoLevelNotSupported = 'VideoLevelNotSupported',
  VideoResolutionNotSupported = 'VideoResolutionNotSupported',
  VideoBitDepthNotSupported = 'VideoBitDepthNotSupported',
  VideoFramerateNotSupported = 'VideoFramerateNotSupported',
  RefFramesNotSupported = 'RefFramesNotSupported',
  AnamorphicVideoNotSupported = 'AnamorphicVideoNotSupported',
  InterlacedVideoNotSupported = 'InterlacedVideoNotSupported',
  AudioChannelsNotSupported = 'AudioChannelsNotSupported',
  AudioProfileNotSupported = 'AudioProfileNotSupported',
  AudioSampleRateNotSupported = 'AudioSampleRateNotSupported',
  AudioBitDepthNotSupported = 'AudioBitDepthNotSupported',
  ContainerBitrateExceedsLimit = 'ContainerBitrateExceedsLimit',
  VideoBitrateNotSupported = 'VideoBitrateNotSupported',
  AudioBitrateNotSupported = 'AudioBitrateNotSupported',
  UnknownVideoStreamInfo = 'UnknownVideoStreamInfo',
  UnknownAudioStreamInfo = 'UnknownAudioStreamInfo',
  DirectPlayError = 'DirectPlayError',
  VideoRangeTypeNotSupported = 'VideoRangeTypeNotSupported',
  VideoCodecTagNotSupported = 'VideoCodecTagNotSupported',
}

export enum TranscodeSeekInfo {
  Auto = 'Auto',
  Bytes = 'Bytes',
}

/** Class holding information on a runnning transcode. */
export interface TranscodingInfo {
  /** Gets or sets the thread count used for encoding. */
  AudioCodec?: string | null;
  /** Gets or sets the thread count used for encoding. */
  VideoCodec?: string | null;
  /** Gets or sets the thread count used for encoding. */
  Container?: string | null;
  /** Gets or sets a value indicating whether the video is passed through. */
  IsVideoDirect?: boolean;
  /** Gets or sets a value indicating whether the audio is passed through. */
  IsAudioDirect?: boolean;
  /**
   * Gets or sets the bitrate.
   * @format int32
   */
  Bitrate?: number | null;
  /**
   * Gets or sets the framerate.
   * @format float
   */
  Framerate?: number | null;
  /**
   * Gets or sets the completion percentage.
   * @format double
   */
  CompletionPercentage?: number | null;
  /**
   * Gets or sets the video width.
   * @format int32
   */
  Width?: number | null;
  /**
   * Gets or sets the video height.
   * @format int32
   */
  Height?: number | null;
  /**
   * Gets or sets the audio channels.
   * @format int32
   */
  AudioChannels?: number | null;
  /** Gets or sets the hardware acceleration type. */
  HardwareAccelerationType?: 'none' | 'amf' | 'qsv' | 'nvenc' | 'v4l2m2m' | 'vaapi' | 'videotoolbox' | 'rkmpp' | null;
  /** Gets or sets the transcode reasons. */
  TranscodeReasons?:
    | 'ContainerNotSupported'
    | 'VideoCodecNotSupported'
    | 'AudioCodecNotSupported'
    | 'SubtitleCodecNotSupported'
    | 'AudioIsExternal'
    | 'SecondaryAudioNotSupported'
    | 'VideoProfileNotSupported'
    | 'VideoLevelNotSupported'
    | 'VideoResolutionNotSupported'
    | 'VideoBitDepthNotSupported'
    | 'VideoFramerateNotSupported'
    | 'RefFramesNotSupported'
    | 'AnamorphicVideoNotSupported'
    | 'InterlacedVideoNotSupported'
    | 'AudioChannelsNotSupported'
    | 'AudioProfileNotSupported'
    | 'AudioSampleRateNotSupported'
    | 'AudioBitDepthNotSupported'
    | 'ContainerBitrateExceedsLimit'
    | 'VideoBitrateNotSupported'
    | 'AudioBitrateNotSupported'
    | 'UnknownVideoStreamInfo'
    | 'UnknownAudioStreamInfo'
    | 'DirectPlayError'
    | 'VideoRangeTypeNotSupported'
    | 'VideoCodecTagNotSupported';
}

/** A class for transcoding profile information. */
export interface TranscodingProfile {
  /** Gets or sets the container. */
  Container?: string;
  /** Gets or sets the DLNA profile type. */
  Type?: 'Audio' | 'Video' | 'Photo' | 'Subtitle' | 'Lyric';
  /** Gets or sets the video codec. */
  VideoCodec?: string;
  /** Gets or sets the audio codec. */
  AudioCodec?: string;
  /**
   * Media streaming protocol.
   * Lowercase for backwards compatibility.
   */
  Protocol?: 'http' | 'hls';
  /**
   * Gets or sets a value indicating whether the content length should be estimated.
   * @default false
   */
  EstimateContentLength?: boolean;
  /**
   * Gets or sets a value indicating whether M2TS mode is enabled.
   * @default false
   */
  EnableMpegtsM2TsMode?: boolean;
  /**
   * Gets or sets the transcoding seek info mode.
   * @default "Auto"
   */
  TranscodeSeekInfo?: 'Auto' | 'Bytes';
  /**
   * Gets or sets a value indicating whether timestamps should be copied.
   * @default false
   */
  CopyTimestamps?: boolean;
  /**
   * Gets or sets the encoding context.
   * @default "Streaming"
   */
  Context?: 'Streaming' | 'Static';
  /**
   * Gets or sets a value indicating whether subtitles are allowed in the manifest.
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
   * Gets or sets a value indicating whether breaking the video stream on non-keyframes is supported.
   * @default false
   */
  BreakOnNonKeyFrames?: boolean;
  /** Gets or sets the profile conditions. */
  Conditions?: ProfileCondition[];
  /**
   * Gets or sets a value indicating whether variable bitrate encoding is supported.
   * @default true
   */
  EnableAudioVbrEncoding?: boolean;
}

export enum TransportStreamTimestamp {
  None = 'None',
  Zero = 'Zero',
  Valid = 'Valid',
}

/** An entity representing the metadata for a group of trickplay tiles. */
export interface TrickplayInfo {
  /**
   * Gets or sets width of an individual thumbnail.
   * @format int32
   */
  Width?: number;
  /**
   * Gets or sets height of an individual thumbnail.
   * @format int32
   */
  Height?: number;
  /**
   * Gets or sets amount of thumbnails per row.
   * @format int32
   */
  TileWidth?: number;
  /**
   * Gets or sets amount of thumbnails per column.
   * @format int32
   */
  TileHeight?: number;
  /**
   * Gets or sets total amount of non-black thumbnails.
   * @format int32
   */
  ThumbnailCount?: number;
  /**
   * Gets or sets interval in milliseconds between each trickplay thumbnail.
   * @format int32
   */
  Interval?: number;
  /**
   * Gets or sets peak bandwith usage in bits per second.
   * @format int32
   */
  Bandwidth?: number;
}

/** Class TrickplayOptions. */
export interface TrickplayOptions {
  /** Gets or sets a value indicating whether or not to use HW acceleration. */
  EnableHwAcceleration?: boolean;
  /** Gets or sets a value indicating whether or not to use HW accelerated MJPEG encoding. */
  EnableHwEncoding?: boolean;
  /**
   * Gets or sets a value indicating whether to only extract key frames.
   * Significantly faster, but is not compatible with all decoders and/or video files.
   */
  EnableKeyFrameOnlyExtraction?: boolean;
  /** Gets or sets the behavior used by trickplay provider on library scan/update. */
  ScanBehavior?: 'Blocking' | 'NonBlocking';
  /** Gets or sets the process priority for the ffmpeg process. */
  ProcessPriority?: 'Normal' | 'Idle' | 'High' | 'RealTime' | 'BelowNormal' | 'AboveNormal';
  /**
   * Gets or sets the interval, in ms, between each new trickplay image.
   * @format int32
   */
  Interval?: number;
  /** Gets or sets the target width resolutions, in px, to generates preview images for. */
  WidthResolutions?: number[];
  /**
   * Gets or sets number of tile images to allow in X dimension.
   * @format int32
   */
  TileWidth?: number;
  /**
   * Gets or sets number of tile images to allow in Y dimension.
   * @format int32
   */
  TileHeight?: number;
  /**
   * Gets or sets the ffmpeg output quality level.
   * @format int32
   */
  Qscale?: number;
  /**
   * Gets or sets the jpeg quality to use for image tiles.
   * @format int32
   */
  JpegQuality?: number;
  /**
   * Gets or sets the number of threads to be used by ffmpeg.
   * @format int32
   */
  ProcessThreads?: number;
}

/** Enum TrickplayScanBehavior. */
export enum TrickplayScanBehavior {
  Blocking = 'Blocking',
  NonBlocking = 'NonBlocking',
}

export interface TunerChannelMapping {
  Name?: string | null;
  ProviderChannelName?: string | null;
  ProviderChannelId?: string | null;
  Id?: string | null;
}

export interface TunerHostInfo {
  Id?: string | null;
  Url?: string | null;
  Type?: string | null;
  DeviceId?: string | null;
  FriendlyName?: string | null;
  ImportFavoritesOnly?: boolean;
  AllowHWTranscoding?: boolean;
  AllowFmp4TranscodingContainer?: boolean;
  AllowStreamSharing?: boolean;
  /** @format int32 */
  FallbackMaxStreamingBitrate?: number;
  EnableStreamLooping?: boolean;
  Source?: string | null;
  /** @format int32 */
  TunerCount?: number;
  UserAgent?: string | null;
  IgnoreDts?: boolean;
}

export interface TypeOptions {
  Type?: string | null;
  MetadataFetchers?: string[] | null;
  MetadataFetcherOrder?: string[] | null;
  ImageFetchers?: string[] | null;
  ImageFetcherOrder?: string[] | null;
  ImageOptions?: ImageOption[] | null;
}

/** An enum representing an unrated item. */
export enum UnratedItem {
  Movie = 'Movie',
  Trailer = 'Trailer',
  Series = 'Series',
  Music = 'Music',
  Book = 'Book',
  LiveTvChannel = 'LiveTvChannel',
  LiveTvProgram = 'LiveTvProgram',
  ChannelContent = 'ChannelContent',
  Other = 'Other',
}

/** Update library options dto. */
export interface UpdateLibraryOptionsDto {
  /**
   * Gets or sets the library item id.
   * @format uuid
   */
  Id?: string;
  /** Gets or sets library options. */
  LibraryOptions?: LibraryOptions | null;
}

/** Update library options dto. */
export interface UpdateMediaPathRequestDto {
  /** Gets or sets the library name. */
  Name: string;
  /** Gets or sets library folder path information. */
  PathInfo: MediaPathInfo;
}

/** Update existing playlist dto. Fields set to `null` will not be updated and keep their current values. */
export interface UpdatePlaylistDto {
  /** Gets or sets the name of the new playlist. */
  Name?: string | null;
  /** Gets or sets item ids of the playlist. */
  Ids?: string[] | null;
  /** Gets or sets the playlist users. */
  Users?: PlaylistUserPermissions[] | null;
  /** Gets or sets a value indicating whether the playlist is public. */
  IsPublic?: boolean | null;
}

/** Update existing playlist user dto. Fields set to `null` will not be updated and keep their current values. */
export interface UpdatePlaylistUserDto {
  /** Gets or sets a value indicating whether the user can edit the playlist. */
  CanEdit?: boolean | null;
}

/** This is used by the api to get information about a item user data. */
export interface UpdateUserItemDataDto {
  /**
   * Gets or sets the rating.
   * @format double
   */
  Rating?: number | null;
  /**
   * Gets or sets the played percentage.
   * @format double
   */
  PlayedPercentage?: number | null;
  /**
   * Gets or sets the unplayed item count.
   * @format int32
   */
  UnplayedItemCount?: number | null;
  /**
   * Gets or sets the playback position ticks.
   * @format int64
   */
  PlaybackPositionTicks?: number | null;
  /**
   * Gets or sets the play count.
   * @format int32
   */
  PlayCount?: number | null;
  /** Gets or sets a value indicating whether this instance is favorite. */
  IsFavorite?: boolean | null;
  /** Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UpdateUserItemDataDto is likes. */
  Likes?: boolean | null;
  /**
   * Gets or sets the last played date.
   * @format date-time
   */
  LastPlayedDate?: string | null;
  /** Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. */
  Played?: boolean | null;
  /** Gets or sets the key. */
  Key?: string | null;
  /** Gets or sets the item identifier. */
  ItemId?: string | null;
}

/** The update user password request body. */
export interface UpdateUserPassword {
  /** Gets or sets the current sha1-hashed password. */
  CurrentPassword?: string | null;
  /** Gets or sets the current plain text password. */
  CurrentPw?: string | null;
  /** Gets or sets the new plain text password. */
  NewPw?: string | null;
  /** Gets or sets a value indicating whether to reset the password. */
  ResetPassword?: boolean;
}

/** Upload subtitles dto. */
export interface UploadSubtitleDto {
  /** Gets or sets the subtitle language. */
  Language: string;
  /** Gets or sets the subtitle format. */
  Format: string;
  /** Gets or sets a value indicating whether the subtitle is forced. */
  IsForced: boolean;
  /** Gets or sets a value indicating whether the subtitle is for hearing impaired. */
  IsHearingImpaired: boolean;
  /** Gets or sets the subtitle data. */
  Data: string;
}

/** Class UserConfiguration. */
export interface UserConfiguration {
  /** Gets or sets the audio language preference. */
  AudioLanguagePreference?: string | null;
  /** Gets or sets a value indicating whether [play default audio track]. */
  PlayDefaultAudioTrack?: boolean;
  /** Gets or sets the subtitle language preference. */
  SubtitleLanguagePreference?: string | null;
  DisplayMissingEpisodes?: boolean;
  GroupedFolders?: string[];
  /** An enum representing a subtitle playback mode. */
  SubtitleMode?: 'Default' | 'Always' | 'OnlyForced' | 'None' | 'Smart';
  DisplayCollectionsView?: boolean;
  EnableLocalPassword?: boolean;
  OrderedViews?: string[];
  LatestItemsExcludes?: string[];
  MyMediaExcludes?: string[];
  HidePlayedInLatest?: boolean;
  RememberAudioSelections?: boolean;
  RememberSubtitleSelections?: boolean;
  EnableNextEpisodeAutoPlay?: boolean;
  /** Gets or sets the id of the selected cast receiver. */
  CastReceiverId?: string | null;
}

/** User data changed message. */
export interface UserDataChangedMessage {
  /** Class UserDataChangeInfo. */
  Data?: UserDataChangeInfo | null;
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "UserDataChanged"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** Class UserDataChangeInfo. */
export interface UserDataChangeInfo {
  /**
   * Gets or sets the user id.
   * @format uuid
   */
  UserId?: string;
  /** Gets or sets the user data list. */
  UserDataList?: UserItemDataDto[];
}

/** User deleted message. */
export interface UserDeletedMessage {
  /**
   * Gets or sets the data.
   * @format uuid
   */
  Data?: string;
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "UserDeleted"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** Class UserDto. */
export interface UserDto {
  /** Gets or sets the name. */
  Name?: string | null;
  /** Gets or sets the server identifier. */
  ServerId?: string | null;
  /**
   * Gets or sets the name of the server.
   * This is not used by the server and is for client-side usage only.
   */
  ServerName?: string | null;
  /**
   * Gets or sets the id.
   * @format uuid
   */
  Id?: string;
  /** Gets or sets the primary image tag. */
  PrimaryImageTag?: string | null;
  /** Gets or sets a value indicating whether this instance has password. */
  HasPassword?: boolean;
  /** Gets or sets a value indicating whether this instance has configured password. */
  HasConfiguredPassword?: boolean;
  /**
   * Gets or sets a value indicating whether this instance has configured easy password.
   * @deprecated
   */
  HasConfiguredEasyPassword?: boolean;
  /** Gets or sets whether async login is enabled or not. */
  EnableAutoLogin?: boolean | null;
  /**
   * Gets or sets the last login date.
   * @format date-time
   */
  LastLoginDate?: string | null;
  /**
   * Gets or sets the last activity date.
   * @format date-time
   */
  LastActivityDate?: string | null;
  /** Gets or sets the configuration. */
  Configuration?: UserConfiguration | null;
  /** Gets or sets the policy. */
  Policy?: UserPolicy | null;
  /**
   * Gets or sets the primary image aspect ratio.
   * @format double
   */
  PrimaryImageAspectRatio?: number | null;
}

/** Class UserItemDataDto. */
export interface UserItemDataDto {
  /**
   * Gets or sets the rating.
   * @format double
   */
  Rating?: number | null;
  /**
   * Gets or sets the played percentage.
   * @format double
   */
  PlayedPercentage?: number | null;
  /**
   * Gets or sets the unplayed item count.
   * @format int32
   */
  UnplayedItemCount?: number | null;
  /**
   * Gets or sets the playback position ticks.
   * @format int64
   */
  PlaybackPositionTicks?: number;
  /**
   * Gets or sets the play count.
   * @format int32
   */
  PlayCount?: number;
  /** Gets or sets a value indicating whether this instance is favorite. */
  IsFavorite?: boolean;
  /** Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is likes. */
  Likes?: boolean | null;
  /**
   * Gets or sets the last played date.
   * @format date-time
   */
  LastPlayedDate?: string | null;
  /** Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. */
  Played?: boolean;
  /** Gets or sets the key. */
  Key?: string;
  /**
   * Gets or sets the item identifier.
   * @format uuid
   */
  ItemId?: string;
}

export interface UserPolicy {
  /** Gets or sets a value indicating whether this instance is administrator. */
  IsAdministrator?: boolean;
  /** Gets or sets a value indicating whether this instance is hidden. */
  IsHidden?: boolean;
  /**
   * Gets or sets a value indicating whether this instance can manage collections.
   * @default false
   */
  EnableCollectionManagement?: boolean;
  /**
   * Gets or sets a value indicating whether this instance can manage subtitles.
   * @default false
   */
  EnableSubtitleManagement?: boolean;
  /**
   * Gets or sets a value indicating whether this user can manage lyrics.
   * @default false
   */
  EnableLyricManagement?: boolean;
  /** Gets or sets a value indicating whether this instance is disabled. */
  IsDisabled?: boolean;
  /**
   * Gets or sets the max parental rating.
   * @format int32
   */
  MaxParentalRating?: number | null;
  BlockedTags?: string[] | null;
  AllowedTags?: string[] | null;
  EnableUserPreferenceAccess?: boolean;
  AccessSchedules?: AccessSchedule[] | null;
  BlockUnratedItems?: UnratedItem[] | null;
  EnableRemoteControlOfOtherUsers?: boolean;
  EnableSharedDeviceControl?: boolean;
  EnableRemoteAccess?: boolean;
  EnableLiveTvManagement?: boolean;
  EnableLiveTvAccess?: boolean;
  EnableMediaPlayback?: boolean;
  EnableAudioPlaybackTranscoding?: boolean;
  EnableVideoPlaybackTranscoding?: boolean;
  EnablePlaybackRemuxing?: boolean;
  ForceRemoteSourceTranscoding?: boolean;
  EnableContentDeletion?: boolean;
  EnableContentDeletionFromFolders?: string[] | null;
  EnableContentDownloading?: boolean;
  /** Gets or sets a value indicating whether [enable synchronize]. */
  EnableSyncTranscoding?: boolean;
  EnableMediaConversion?: boolean;
  EnabledDevices?: string[] | null;
  EnableAllDevices?: boolean;
  EnabledChannels?: string[] | null;
  EnableAllChannels?: boolean;
  EnabledFolders?: string[] | null;
  EnableAllFolders?: boolean;
  /** @format int32 */
  InvalidLoginAttemptCount?: number;
  /** @format int32 */
  LoginAttemptsBeforeLockout?: number;
  /** @format int32 */
  MaxActiveSessions?: number;
  EnablePublicSharing?: boolean;
  BlockedMediaFolders?: string[] | null;
  BlockedChannels?: string[] | null;
  /** @format int32 */
  RemoteClientBitrateLimit?: number;
  AuthenticationProviderId: string;
  PasswordResetProviderId: string;
  /** Enum SyncPlayUserAccessType. */
  SyncPlayAccess?: 'CreateAndJoinGroups' | 'JoinGroups' | 'None';
}

/** User updated message. */
export interface UserUpdatedMessage {
  /** Class UserDto. */
  Data?: UserDto | null;
  /**
   * Gets or sets the message id.
   * @format uuid
   */
  MessageId?: string;
  /**
   * The different kinds of messages that are used in the WebSocket api.
   * @default "UserUpdated"
   */
  MessageType?:
    | 'ForceKeepAlive'
    | 'GeneralCommand'
    | 'UserDataChanged'
    | 'Sessions'
    | 'Play'
    | 'SyncPlayCommand'
    | 'SyncPlayGroupUpdate'
    | 'Playstate'
    | 'RestartRequired'
    | 'ServerShuttingDown'
    | 'ServerRestarting'
    | 'LibraryChanged'
    | 'UserDeleted'
    | 'UserUpdated'
    | 'SeriesTimerCreated'
    | 'TimerCreated'
    | 'SeriesTimerCancelled'
    | 'TimerCancelled'
    | 'RefreshProgress'
    | 'ScheduledTaskEnded'
    | 'PackageInstallationCancelled'
    | 'PackageInstallationFailed'
    | 'PackageInstallationCompleted'
    | 'PackageInstalling'
    | 'PackageUninstalled'
    | 'ActivityLogEntry'
    | 'ScheduledTasksInfo'
    | 'ActivityLogEntryStart'
    | 'ActivityLogEntryStop'
    | 'SessionsStart'
    | 'SessionsStop'
    | 'ScheduledTasksInfoStart'
    | 'ScheduledTasksInfoStop'
    | 'KeepAlive';
}

/** Class UtcTimeResponse. */
export interface UtcTimeResponse {
  /**
   * Gets the UTC time when request has been received.
   * @format date-time
   */
  RequestReceptionTime?: string;
  /**
   * Gets the UTC time when response has been sent.
   * @format date-time
   */
  ResponseTransmissionTime?: string;
}

/** Validate path object. */
export interface ValidatePathDto {
  /** Gets or sets a value indicating whether validate if path is writable. */
  ValidateWritable?: boolean;
  /** Gets or sets the path. */
  Path?: string | null;
  /** Gets or sets is path file. */
  IsFile?: boolean | null;
}

/** Defines the MediaBrowser.Model.Updates.VersionInfo class. */
export interface VersionInfo {
  /** Gets or sets the version. */
  version?: string;
  /** Gets the version as a System.Version. */
  VersionNumber?: string;
  /** Gets or sets the changelog for this version. */
  changelog?: string | null;
  /** Gets or sets the ABI that this version was built against. */
  targetAbi?: string | null;
  /** Gets or sets the source URL. */
  sourceUrl?: string | null;
  /** Gets or sets a checksum for the binary. */
  checksum?: string | null;
  /** Gets or sets a timestamp of when the binary was built. */
  timestamp?: string | null;
  /** Gets or sets the repository name. */
  repositoryName?: string;
  /** Gets or sets the repository url. */
  repositoryUrl?: string;
}

export enum Video3DFormat {
  HalfSideBySide = 'HalfSideBySide',
  FullSideBySide = 'FullSideBySide',
  FullTopAndBottom = 'FullTopAndBottom',
  HalfTopAndBottom = 'HalfTopAndBottom',
  MVC = 'MVC',
}

/** An enum representing video ranges. */
export enum VideoRange {
  Unknown = 'Unknown',
  SDR = 'SDR',
  HDR = 'HDR',
}

/** An enum representing types of video ranges. */
export enum VideoRangeType {
  Unknown = 'Unknown',
  SDR = 'SDR',
  HDR10 = 'HDR10',
  HLG = 'HLG',
  DOVI = 'DOVI',
  DOVIWithHDR10 = 'DOVIWithHDR10',
  DOVIWithHLG = 'DOVIWithHLG',
  DOVIWithSDR = 'DOVIWithSDR',
  HDR10Plus = 'HDR10Plus',
}

/** Enum VideoType. */
export enum VideoType {
  VideoFile = 'VideoFile',
  Iso = 'Iso',
  Dvd = 'Dvd',
  BluRay = 'BluRay',
}

/** Used to hold information about a user's list of configured virtual folders. */
export interface VirtualFolderInfo {
  /** Gets or sets the name. */
  Name?: string | null;
  /** Gets or sets the locations. */
  Locations?: string[] | null;
  /** Gets or sets the type of the collection. */
  CollectionType?: 'movies' | 'tvshows' | 'music' | 'musicvideos' | 'homevideos' | 'boxsets' | 'books' | 'mixed' | null;
  LibraryOptions?: LibraryOptions | null;
  /** Gets or sets the item identifier. */
  ItemId?: string | null;
  /** Gets or sets the primary image item identifier. */
  PrimaryImageItemId?: string | null;
  /** @format double */
  RefreshProgress?: number | null;
  RefreshStatus?: string | null;
}

/** Provides the MAC address and port for wake-on-LAN functionality. */
export interface WakeOnLanInfo {
  /** Gets the MAC address of the device. */
  MacAddress?: string | null;
  /**
   * Gets or sets the wake-on-LAN port.
   * @format int32
   */
  Port?: number;
}

/** Represents the possible websocket types */
export type WebSocketMessage = InboundWebSocketMessage | OutboundWebSocketMessage;

export interface XbmcMetadataOptions {
  UserId?: string | null;
  ReleaseDateFormat?: string;
  SaveImagePathsInNfo?: boolean;
  EnablePathSubstitution?: boolean;
  EnableExtraThumbsDuplication?: boolean;
}

/** Group update without data. */
interface BaseGroupUpdate {
  /**
   * Gets the group identifier.
   * @format uuid
   */
  GroupId?: string;
  /** Gets the update type. */
  Type?:
    | 'UserJoined'
    | 'UserLeft'
    | 'GroupJoined'
    | 'GroupLeft'
    | 'StateUpdate'
    | 'PlayQueue'
    | 'NotInGroup'
    | 'GroupDoesNotExist'
    | 'CreateGroupDenied'
    | 'JoinGroupDenied'
    | 'LibraryAccessDenied';
}

type BaseGroupUpdateTypeMapping<Key, Type> = {
  Type: Key;
} & Type;

/** Represents the list of possible inbound websocket types */
type BaseInboundWebSocketMessage = object;

type BaseInboundWebSocketMessageMessageTypeMapping<Key, Type> = {
  MessageType: Key;
} & Type;

/** Represents the list of possible outbound websocket types */
type BaseOutboundWebSocketMessage = object;

type BaseOutboundWebSocketMessageMessageTypeMapping<Key, Type> = {
  MessageType: Key;
} & Type;

import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, HeadersDefaults, ResponseType } from 'axios';
import axios from 'axios';

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams extends Omit<AxiosRequestConfig, 'data' | 'params' | 'url' | 'responseType'> {
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

export interface ApiConfig<SecurityDataType = unknown> extends Omit<AxiosRequestConfig, 'data' | 'cancelToken'> {
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

  constructor({ securityWorker, secure, format, ...axiosConfig }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({ ...axiosConfig, baseURL: axiosConfig.baseURL || 'http://localhost' });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(params1: AxiosRequestConfig, params2?: AxiosRequestConfig): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method && this.instance.defaults.headers[method.toLowerCase() as keyof HeadersDefaults]) || {}),
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
 * @title Jellyfin API
 * @version 10.10.3
 * @baseUrl http://localhost
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  system = {
    /**
     * No description
     *
     * @tags ActivityLog
     * @name GetLogEntries
     * @summary Gets activity log entries.
     * @request GET:/System/ActivityLog/Entries
     * @secure
     */
    getLogEntries: (
      query?: {
        /**
         * Optional. The record index to start at. All items with a lower index will be dropped from the results.
         * @format int32
         */
        startIndex?: number;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /**
         * Optional. The minimum date. Format = ISO.
         * @format date-time
         */
        minDate?: string;
        /** Optional. Filter log entries if it has user id, or not. */
        hasUserId?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<ActivityLogEntryQueryResult, void>({
        path: `/System/ActivityLog/Entries`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Configuration
     * @name GetConfiguration
     * @summary Gets application configuration.
     * @request GET:/System/Configuration
     * @secure
     */
    getConfiguration: (params: RequestParams = {}) =>
      this.request<ServerConfiguration, void>({
        path: `/System/Configuration`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Configuration
     * @name UpdateConfiguration
     * @summary Updates application configuration.
     * @request POST:/System/Configuration
     * @secure
     */
    updateConfiguration: (data: ServerConfiguration, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/System/Configuration`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Configuration
     * @name GetNamedConfiguration
     * @summary Gets a named configuration.
     * @request GET:/System/Configuration/{key}
     * @secure
     */
    getNamedConfiguration: (key: string, params: RequestParams = {}) =>
      this.request<File, void>({
        path: `/System/Configuration/${key}`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Configuration
     * @name UpdateNamedConfiguration
     * @summary Updates named configuration.
     * @request POST:/System/Configuration/{key}
     * @secure
     */
    updateNamedConfiguration: (key: string, data: any, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/System/Configuration/${key}`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Configuration
     * @name GetDefaultMetadataOptions
     * @summary Gets a default MetadataOptions object.
     * @request GET:/System/Configuration/MetadataOptions/Default
     * @secure
     */
    getDefaultMetadataOptions: (params: RequestParams = {}) =>
      this.request<MetadataOptions, void>({
        path: `/System/Configuration/MetadataOptions/Default`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags System
     * @name GetEndpointInfo
     * @summary Gets information about the request endpoint.
     * @request GET:/System/Endpoint
     * @secure
     */
    getEndpointInfo: (params: RequestParams = {}) =>
      this.request<EndPointInfo, void | ProblemDetails>({
        path: `/System/Endpoint`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags System
     * @name GetSystemInfo
     * @summary Gets information about the server.
     * @request GET:/System/Info
     * @secure
     */
    getSystemInfo: (params: RequestParams = {}) =>
      this.request<SystemInfo, void | ProblemDetails>({
        path: `/System/Info`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags System
     * @name GetPublicSystemInfo
     * @summary Gets public information about the server.
     * @request GET:/System/Info/Public
     */
    getPublicSystemInfo: (params: RequestParams = {}) =>
      this.request<PublicSystemInfo, any>({
        path: `/System/Info/Public`,
        method: 'GET',
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags System
     * @name GetServerLogs
     * @summary Gets a list of available server log files.
     * @request GET:/System/Logs
     * @secure
     */
    getServerLogs: (params: RequestParams = {}) =>
      this.request<LogFile[], void | ProblemDetails>({
        path: `/System/Logs`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags System
     * @name GetLogFile
     * @summary Gets a log file.
     * @request GET:/System/Logs/Log
     * @secure
     */
    getLogFile: (
      query: {
        /** The name of the log file to get. */
        name: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, void | ProblemDetails>({
        path: `/System/Logs/Log`,
        method: 'GET',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags System
     * @name GetPingSystem
     * @summary Pings the system.
     * @request GET:/System/Ping
     */
    getPingSystem: (params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/System/Ping`,
        method: 'GET',
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags System
     * @name PostPingSystem
     * @summary Pings the system.
     * @request POST:/System/Ping
     */
    postPingSystem: (params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/System/Ping`,
        method: 'POST',
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags System
     * @name RestartApplication
     * @summary Restarts the application.
     * @request POST:/System/Restart
     * @secure
     */
    restartApplication: (params: RequestParams = {}) =>
      this.request<void, void | ProblemDetails>({
        path: `/System/Restart`,
        method: 'POST',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags System
     * @name ShutdownApplication
     * @summary Shuts down the application.
     * @request POST:/System/Shutdown
     * @secure
     */
    shutdownApplication: (params: RequestParams = {}) =>
      this.request<void, void | ProblemDetails>({
        path: `/System/Shutdown`,
        method: 'POST',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags System
     * @name GetWakeOnLanInfo
     * @summary Gets wake on lan information.
     * @request GET:/System/WakeOnLanInfo
     * @deprecated
     * @secure
     */
    getWakeOnLanInfo: (params: RequestParams = {}) =>
      this.request<WakeOnLanInfo[], void>({
        path: `/System/WakeOnLanInfo`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),
  };
  auth = {
    /**
     * No description
     *
     * @tags ApiKey
     * @name GetKeys
     * @summary Get all keys.
     * @request GET:/Auth/Keys
     * @secure
     */
    getKeys: (params: RequestParams = {}) =>
      this.request<AuthenticationInfoQueryResult, void>({
        path: `/Auth/Keys`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags ApiKey
     * @name CreateKey
     * @summary Create a new api key.
     * @request POST:/Auth/Keys
     * @secure
     */
    createKey: (
      query: {
        /** Name of the app using the authentication key. */
        app: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/Auth/Keys`,
        method: 'POST',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags ApiKey
     * @name RevokeKey
     * @summary Remove an api key.
     * @request DELETE:/Auth/Keys/{key}
     * @secure
     */
    revokeKey: (key: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/Auth/Keys/${key}`,
        method: 'DELETE',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Session
     * @name GetPasswordResetProviders
     * @summary Get all password reset providers.
     * @request GET:/Auth/PasswordResetProviders
     * @secure
     */
    getPasswordResetProviders: (params: RequestParams = {}) =>
      this.request<NameIdPair[], void>({
        path: `/Auth/PasswordResetProviders`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Session
     * @name GetAuthProviders
     * @summary Get all auth providers.
     * @request GET:/Auth/Providers
     * @secure
     */
    getAuthProviders: (params: RequestParams = {}) =>
      this.request<NameIdPair[], void>({
        path: `/Auth/Providers`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),
  };
  artists = {
    /**
     * No description
     *
     * @tags Artists
     * @name GetArtists
     * @summary Gets all artists from a given item, folder, or the entire library.
     * @request GET:/Artists
     * @secure
     */
    getArtists: (
      query?: {
        /**
         * Optional filter by minimum community rating.
         * @format double
         */
        minCommunityRating?: number;
        /**
         * Optional. The record index to start at. All items with a lower index will be dropped from the results.
         * @format int32
         */
        startIndex?: number;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Search term. */
        searchTerm?: string;
        /**
         * Specify this to localize the search to a specific item or folder. Omit to use the root.
         * @format uuid
         */
        parentId?: string;
        /** Optional. Specify additional fields of information to return in the output. */
        fields?: ItemFields[];
        /** Optional. If specified, results will be filtered out based on item type. This allows multiple, comma delimited. */
        excludeItemTypes?: BaseItemKind[];
        /** Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimited. */
        includeItemTypes?: BaseItemKind[];
        /** Optional. Specify additional filters to apply. */
        filters?: ItemFilter[];
        /** Optional filter by items that are marked as favorite, or not. */
        isFavorite?: boolean;
        /** Optional filter by MediaType. Allows multiple, comma delimited. */
        mediaTypes?: MediaType[];
        /** Optional. If specified, results will be filtered based on genre. This allows multiple, pipe delimited. */
        genres?: string[];
        /** Optional. If specified, results will be filtered based on genre id. This allows multiple, pipe delimited. */
        genreIds?: string[];
        /** Optional. If specified, results will be filtered based on OfficialRating. This allows multiple, pipe delimited. */
        officialRatings?: string[];
        /** Optional. If specified, results will be filtered based on tag. This allows multiple, pipe delimited. */
        tags?: string[];
        /** Optional. If specified, results will be filtered based on production year. This allows multiple, comma delimited. */
        years?: number[];
        /** Optional, include user data. */
        enableUserData?: boolean;
        /**
         * Optional, the max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
        /** Optional. If specified, results will be filtered to include only those containing the specified person. */
        person?: string;
        /** Optional. If specified, results will be filtered to include only those containing the specified person ids. */
        personIds?: string[];
        /** Optional. If specified, along with Person, results will be filtered to include only those containing the specified person and PersonType. Allows multiple, comma-delimited. */
        personTypes?: string[];
        /** Optional. If specified, results will be filtered based on studio. This allows multiple, pipe delimited. */
        studios?: string[];
        /** Optional. If specified, results will be filtered based on studio id. This allows multiple, pipe delimited. */
        studioIds?: string[];
        /**
         * User id.
         * @format uuid
         */
        userId?: string;
        /** Optional filter by items whose name is sorted equally or greater than a given input string. */
        nameStartsWithOrGreater?: string;
        /** Optional filter by items whose name is sorted equally than a given input string. */
        nameStartsWith?: string;
        /** Optional filter by items whose name is equally or lesser than a given input string. */
        nameLessThan?: string;
        /** Optional. Specify one or more sort orders, comma delimited. */
        sortBy?: ItemSortBy[];
        /** Sort Order - Ascending,Descending. */
        sortOrder?: SortOrder[];
        /**
         * Optional, include image information in output.
         * @default true
         */
        enableImages?: boolean;
        /**
         * Total record count.
         * @default true
         */
        enableTotalRecordCount?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/Artists`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Artists
     * @name GetArtistByName
     * @summary Gets an artist by name.
     * @request GET:/Artists/{name}
     * @secure
     */
    getArtistByName: (
      name: string,
      query?: {
        /**
         * Optional. Filter by user id, and attach user data.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDto, void>({
        path: `/Artists/${name}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Artists
     * @name GetAlbumArtists
     * @summary Gets all album artists from a given item, folder, or the entire library.
     * @request GET:/Artists/AlbumArtists
     * @secure
     */
    getAlbumArtists: (
      query?: {
        /**
         * Optional filter by minimum community rating.
         * @format double
         */
        minCommunityRating?: number;
        /**
         * Optional. The record index to start at. All items with a lower index will be dropped from the results.
         * @format int32
         */
        startIndex?: number;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Search term. */
        searchTerm?: string;
        /**
         * Specify this to localize the search to a specific item or folder. Omit to use the root.
         * @format uuid
         */
        parentId?: string;
        /** Optional. Specify additional fields of information to return in the output. */
        fields?: ItemFields[];
        /** Optional. If specified, results will be filtered out based on item type. This allows multiple, comma delimited. */
        excludeItemTypes?: BaseItemKind[];
        /** Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimited. */
        includeItemTypes?: BaseItemKind[];
        /** Optional. Specify additional filters to apply. */
        filters?: ItemFilter[];
        /** Optional filter by items that are marked as favorite, or not. */
        isFavorite?: boolean;
        /** Optional filter by MediaType. Allows multiple, comma delimited. */
        mediaTypes?: MediaType[];
        /** Optional. If specified, results will be filtered based on genre. This allows multiple, pipe delimited. */
        genres?: string[];
        /** Optional. If specified, results will be filtered based on genre id. This allows multiple, pipe delimited. */
        genreIds?: string[];
        /** Optional. If specified, results will be filtered based on OfficialRating. This allows multiple, pipe delimited. */
        officialRatings?: string[];
        /** Optional. If specified, results will be filtered based on tag. This allows multiple, pipe delimited. */
        tags?: string[];
        /** Optional. If specified, results will be filtered based on production year. This allows multiple, comma delimited. */
        years?: number[];
        /** Optional, include user data. */
        enableUserData?: boolean;
        /**
         * Optional, the max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
        /** Optional. If specified, results will be filtered to include only those containing the specified person. */
        person?: string;
        /** Optional. If specified, results will be filtered to include only those containing the specified person ids. */
        personIds?: string[];
        /** Optional. If specified, along with Person, results will be filtered to include only those containing the specified person and PersonType. Allows multiple, comma-delimited. */
        personTypes?: string[];
        /** Optional. If specified, results will be filtered based on studio. This allows multiple, pipe delimited. */
        studios?: string[];
        /** Optional. If specified, results will be filtered based on studio id. This allows multiple, pipe delimited. */
        studioIds?: string[];
        /**
         * User id.
         * @format uuid
         */
        userId?: string;
        /** Optional filter by items whose name is sorted equally or greater than a given input string. */
        nameStartsWithOrGreater?: string;
        /** Optional filter by items whose name is sorted equally than a given input string. */
        nameStartsWith?: string;
        /** Optional filter by items whose name is equally or lesser than a given input string. */
        nameLessThan?: string;
        /** Optional. Specify one or more sort orders, comma delimited. */
        sortBy?: ItemSortBy[];
        /** Sort Order - Ascending,Descending. */
        sortOrder?: SortOrder[];
        /**
         * Optional, include image information in output.
         * @default true
         */
        enableImages?: boolean;
        /**
         * Total record count.
         * @default true
         */
        enableTotalRecordCount?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/Artists/AlbumArtists`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name GetArtistImage
     * @summary Get artist image by name.
     * @request GET:/Artists/{name}/Images/{imageType}/{imageIndex}
     */
    getArtistImage: (
      name: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      imageIndex: number,
      query?: {
        /** Optional. Supply the cache tag from the item object to receive strong caching headers. */
        tag?: string;
        /** Determines the output format of the image - original,gif,jpg,png. */
        format?: 'Bmp' | 'Gif' | 'Jpg' | 'Png' | 'Webp' | 'Svg';
        /**
         * The maximum image width to return.
         * @format int32
         */
        maxWidth?: number;
        /**
         * The maximum image height to return.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Percent to render for the percent played overlay.
         * @format double
         */
        percentPlayed?: number;
        /**
         * Optional. Unplayed count overlay to render.
         * @format int32
         */
        unplayedCount?: number;
        /**
         * The fixed image width to return.
         * @format int32
         */
        width?: number;
        /**
         * The fixed image height to return.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases.
         * @format int32
         */
        quality?: number;
        /**
         * Width of box to fill.
         * @format int32
         */
        fillWidth?: number;
        /**
         * Height of box to fill.
         * @format int32
         */
        fillHeight?: number;
        /**
         * Optional. Blur image.
         * @format int32
         */
        blur?: number;
        /** Optional. Apply a background color for transparent images. */
        backgroundColor?: string;
        /** Optional. Apply a foreground layer on top of the image. */
        foregroundLayer?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/Artists/${name}/Images/${imageType}/${imageIndex}`,
        method: 'GET',
        query: query,
        format: 'blob',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name HeadArtistImage
     * @summary Get artist image by name.
     * @request HEAD:/Artists/{name}/Images/{imageType}/{imageIndex}
     */
    headArtistImage: (
      name: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      imageIndex: number,
      query?: {
        /** Optional. Supply the cache tag from the item object to receive strong caching headers. */
        tag?: string;
        /** Determines the output format of the image - original,gif,jpg,png. */
        format?: 'Bmp' | 'Gif' | 'Jpg' | 'Png' | 'Webp' | 'Svg';
        /**
         * The maximum image width to return.
         * @format int32
         */
        maxWidth?: number;
        /**
         * The maximum image height to return.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Percent to render for the percent played overlay.
         * @format double
         */
        percentPlayed?: number;
        /**
         * Optional. Unplayed count overlay to render.
         * @format int32
         */
        unplayedCount?: number;
        /**
         * The fixed image width to return.
         * @format int32
         */
        width?: number;
        /**
         * The fixed image height to return.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases.
         * @format int32
         */
        quality?: number;
        /**
         * Width of box to fill.
         * @format int32
         */
        fillWidth?: number;
        /**
         * Height of box to fill.
         * @format int32
         */
        fillHeight?: number;
        /**
         * Optional. Blur image.
         * @format int32
         */
        blur?: number;
        /** Optional. Apply a background color for transparent images. */
        backgroundColor?: string;
        /** Optional. Apply a foreground layer on top of the image. */
        foregroundLayer?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/Artists/${name}/Images/${imageType}/${imageIndex}`,
        method: 'HEAD',
        query: query,
        format: 'blob',
        ...params,
      }),

    /**
     * No description
     *
     * @tags InstantMix
     * @name GetInstantMixFromArtists
     * @summary Creates an instant playlist based on a given artist.
     * @request GET:/Artists/{itemId}/InstantMix
     * @secure
     */
    getInstantMixFromArtists: (
      itemId: string,
      query?: {
        /**
         * Optional. Filter by user id, and attach user data.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Specify additional fields of information to return in the output. */
        fields?: ItemFields[];
        /** Optional. Include image information in output. */
        enableImages?: boolean;
        /** Optional. Include user data. */
        enableUserData?: boolean;
        /**
         * Optional. The max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void | ProblemDetails>({
        path: `/Artists/${itemId}/InstantMix`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags InstantMix
     * @name GetInstantMixFromArtists2
     * @summary Creates an instant playlist based on a given artist.
     * @request GET:/Artists/InstantMix
     * @deprecated
     * @secure
     */
    getInstantMixFromArtists2: (
      query: {
        /**
         * The item id.
         * @format uuid
         */
        id: string;
        /**
         * Optional. Filter by user id, and attach user data.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Specify additional fields of information to return in the output. */
        fields?: ItemFields[];
        /** Optional. Include image information in output. */
        enableImages?: boolean;
        /** Optional. Include user data. */
        enableUserData?: boolean;
        /**
         * Optional. The max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void | ProblemDetails>({
        path: `/Artists/InstantMix`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library
     * @name GetSimilarArtists
     * @summary Gets similar items.
     * @request GET:/Artists/{itemId}/Similar
     * @secure
     */
    getSimilarArtists: (
      itemId: string,
      query?: {
        /** Exclude artist ids. */
        excludeArtistIds?: string[];
        /**
         * Optional. Filter by user id, and attach user data.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimited. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines, TrailerUrls. */
        fields?: ItemFields[];
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/Artists/${itemId}/Similar`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),
  };
  audio = {
    /**
     * No description
     *
     * @tags Audio
     * @name GetAudioStream
     * @summary Gets an audio stream.
     * @request GET:/Audio/{itemId}/stream
     */
    getAudioStream: (
      itemId: string,
      query?: {
        /**
         * The audio container.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        container?: string;
        /** Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false. */
        static?: boolean;
        /** The streaming parameters. */
        params?: string;
        /** The tag. */
        tag?: string;
        /**
         * Optional. The dlna device profile id to utilize.
         * @deprecated
         */
        deviceProfileId?: string;
        /** The play session id. */
        playSessionId?: string;
        /**
         * The segment container.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        segmentContainer?: string;
        /**
         * The segment length.
         * @format int32
         */
        segmentLength?: number;
        /**
         * The minimum number of segments.
         * @format int32
         */
        minSegments?: number;
        /** The media version id, if playing an alternate version. */
        mediaSourceId?: string;
        /** The device id of the client requesting. Used to stop encoding processes when needed. */
        deviceId?: string;
        /**
         * Optional. Specify an audio codec to encode to, e.g. mp3. If omitted the server will auto-select using the url's extension.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        audioCodec?: string;
        /** Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. */
        enableAutoStreamCopy?: boolean;
        /** Whether or not to allow copying of the video stream url. */
        allowVideoStreamCopy?: boolean;
        /** Whether or not to allow copying of the audio stream url. */
        allowAudioStreamCopy?: boolean;
        /** Optional. Whether to break on non key frames. */
        breakOnNonKeyFrames?: boolean;
        /**
         * Optional. Specify a specific audio sample rate, e.g. 44100.
         * @format int32
         */
        audioSampleRate?: number;
        /**
         * Optional. The maximum audio bit depth.
         * @format int32
         */
        maxAudioBitDepth?: number;
        /**
         * Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        audioBitRate?: number;
        /**
         * Optional. Specify a specific number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        audioChannels?: number;
        /**
         * Optional. Specify a maximum number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        maxAudioChannels?: number;
        /** Optional. Specify a specific an encoder profile (varies by encoder), e.g. main, baseline, high. */
        profile?: string;
        /** Optional. Specify a level for the encoder profile (varies by encoder), e.g. 3, 3.1. */
        level?: string;
        /**
         * Optional. A specific video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        framerate?: number;
        /**
         * Optional. A specific maximum video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        maxFramerate?: number;
        /** Whether or not to copy timestamps when transcoding with an offset. Defaults to false. */
        copyTimestamps?: boolean;
        /**
         * Optional. Specify a starting offset, in ticks. 1 tick = 10000 ms.
         * @format int64
         */
        startTimeTicks?: number;
        /**
         * Optional. The fixed horizontal resolution of the encoded video.
         * @format int32
         */
        width?: number;
        /**
         * Optional. The fixed vertical resolution of the encoded video.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        videoBitRate?: number;
        /**
         * Optional. The index of the subtitle stream to use. If omitted no subtitles will be used.
         * @format int32
         */
        subtitleStreamIndex?: number;
        /** Optional. Specify the subtitle delivery method. */
        subtitleMethod?: 'Encode' | 'Embed' | 'External' | 'Hls' | 'Drop';
        /**
         * Optional.
         * @format int32
         */
        maxRefFrames?: number;
        /**
         * Optional. The maximum video bit depth.
         * @format int32
         */
        maxVideoBitDepth?: number;
        /** Optional. Whether to require avc. */
        requireAvc?: boolean;
        /** Optional. Whether to deinterlace the video. */
        deInterlace?: boolean;
        /** Optional. Whether to require a non anamorphic stream. */
        requireNonAnamorphic?: boolean;
        /**
         * Optional. The maximum number of audio channels to transcode.
         * @format int32
         */
        transcodingMaxAudioChannels?: number;
        /**
         * Optional. The limit of how many cpu cores to use.
         * @format int32
         */
        cpuCoreLimit?: number;
        /** The live stream id. */
        liveStreamId?: string;
        /** Optional. Whether to enable the MpegtsM2Ts mode. */
        enableMpegtsM2TsMode?: boolean;
        /**
         * Optional. Specify a video codec to encode to, e.g. h264. If omitted the server will auto-select using the url's extension.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        videoCodec?: string;
        /**
         * Optional. Specify a subtitle codec to encode to.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        subtitleCodec?: string;
        /** Optional. The transcoding reason. */
        transcodeReasons?: string;
        /**
         * Optional. The index of the audio stream to use. If omitted the first audio stream will be used.
         * @format int32
         */
        audioStreamIndex?: number;
        /**
         * Optional. The index of the video stream to use. If omitted the first video stream will be used.
         * @format int32
         */
        videoStreamIndex?: number;
        /** Optional. The MediaBrowser.Model.Dlna.EncodingContext. */
        context?: 'Streaming' | 'Static';
        /** Optional. The streaming options. */
        streamOptions?: Record<string, string | null>;
        /**
         * Optional. Whether to enable Audio Encoding.
         * @default true
         */
        enableAudioVbrEncoding?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, any>({
        path: `/Audio/${itemId}/stream`,
        method: 'GET',
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Audio
     * @name HeadAudioStream
     * @summary Gets an audio stream.
     * @request HEAD:/Audio/{itemId}/stream
     */
    headAudioStream: (
      itemId: string,
      query?: {
        /**
         * The audio container.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        container?: string;
        /** Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false. */
        static?: boolean;
        /** The streaming parameters. */
        params?: string;
        /** The tag. */
        tag?: string;
        /**
         * Optional. The dlna device profile id to utilize.
         * @deprecated
         */
        deviceProfileId?: string;
        /** The play session id. */
        playSessionId?: string;
        /**
         * The segment container.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        segmentContainer?: string;
        /**
         * The segment length.
         * @format int32
         */
        segmentLength?: number;
        /**
         * The minimum number of segments.
         * @format int32
         */
        minSegments?: number;
        /** The media version id, if playing an alternate version. */
        mediaSourceId?: string;
        /** The device id of the client requesting. Used to stop encoding processes when needed. */
        deviceId?: string;
        /**
         * Optional. Specify an audio codec to encode to, e.g. mp3. If omitted the server will auto-select using the url's extension.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        audioCodec?: string;
        /** Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. */
        enableAutoStreamCopy?: boolean;
        /** Whether or not to allow copying of the video stream url. */
        allowVideoStreamCopy?: boolean;
        /** Whether or not to allow copying of the audio stream url. */
        allowAudioStreamCopy?: boolean;
        /** Optional. Whether to break on non key frames. */
        breakOnNonKeyFrames?: boolean;
        /**
         * Optional. Specify a specific audio sample rate, e.g. 44100.
         * @format int32
         */
        audioSampleRate?: number;
        /**
         * Optional. The maximum audio bit depth.
         * @format int32
         */
        maxAudioBitDepth?: number;
        /**
         * Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        audioBitRate?: number;
        /**
         * Optional. Specify a specific number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        audioChannels?: number;
        /**
         * Optional. Specify a maximum number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        maxAudioChannels?: number;
        /** Optional. Specify a specific an encoder profile (varies by encoder), e.g. main, baseline, high. */
        profile?: string;
        /** Optional. Specify a level for the encoder profile (varies by encoder), e.g. 3, 3.1. */
        level?: string;
        /**
         * Optional. A specific video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        framerate?: number;
        /**
         * Optional. A specific maximum video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        maxFramerate?: number;
        /** Whether or not to copy timestamps when transcoding with an offset. Defaults to false. */
        copyTimestamps?: boolean;
        /**
         * Optional. Specify a starting offset, in ticks. 1 tick = 10000 ms.
         * @format int64
         */
        startTimeTicks?: number;
        /**
         * Optional. The fixed horizontal resolution of the encoded video.
         * @format int32
         */
        width?: number;
        /**
         * Optional. The fixed vertical resolution of the encoded video.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        videoBitRate?: number;
        /**
         * Optional. The index of the subtitle stream to use. If omitted no subtitles will be used.
         * @format int32
         */
        subtitleStreamIndex?: number;
        /** Optional. Specify the subtitle delivery method. */
        subtitleMethod?: 'Encode' | 'Embed' | 'External' | 'Hls' | 'Drop';
        /**
         * Optional.
         * @format int32
         */
        maxRefFrames?: number;
        /**
         * Optional. The maximum video bit depth.
         * @format int32
         */
        maxVideoBitDepth?: number;
        /** Optional. Whether to require avc. */
        requireAvc?: boolean;
        /** Optional. Whether to deinterlace the video. */
        deInterlace?: boolean;
        /** Optional. Whether to require a non anamorphic stream. */
        requireNonAnamorphic?: boolean;
        /**
         * Optional. The maximum number of audio channels to transcode.
         * @format int32
         */
        transcodingMaxAudioChannels?: number;
        /**
         * Optional. The limit of how many cpu cores to use.
         * @format int32
         */
        cpuCoreLimit?: number;
        /** The live stream id. */
        liveStreamId?: string;
        /** Optional. Whether to enable the MpegtsM2Ts mode. */
        enableMpegtsM2TsMode?: boolean;
        /**
         * Optional. Specify a video codec to encode to, e.g. h264. If omitted the server will auto-select using the url's extension.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        videoCodec?: string;
        /**
         * Optional. Specify a subtitle codec to encode to.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        subtitleCodec?: string;
        /** Optional. The transcoding reason. */
        transcodeReasons?: string;
        /**
         * Optional. The index of the audio stream to use. If omitted the first audio stream will be used.
         * @format int32
         */
        audioStreamIndex?: number;
        /**
         * Optional. The index of the video stream to use. If omitted the first video stream will be used.
         * @format int32
         */
        videoStreamIndex?: number;
        /** Optional. The MediaBrowser.Model.Dlna.EncodingContext. */
        context?: 'Streaming' | 'Static';
        /** Optional. The streaming options. */
        streamOptions?: Record<string, string | null>;
        /**
         * Optional. Whether to enable Audio Encoding.
         * @default true
         */
        enableAudioVbrEncoding?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, any>({
        path: `/Audio/${itemId}/stream`,
        method: 'HEAD',
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Audio
     * @name GetAudioStreamByContainer
     * @summary Gets an audio stream.
     * @request GET:/Audio/{itemId}/stream.{container}
     */
    getAudioStreamByContainer: (
      itemId: string,
      container: string,
      query?: {
        /** Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false. */
        static?: boolean;
        /** The streaming parameters. */
        params?: string;
        /** The tag. */
        tag?: string;
        /**
         * Optional. The dlna device profile id to utilize.
         * @deprecated
         */
        deviceProfileId?: string;
        /** The play session id. */
        playSessionId?: string;
        /**
         * The segment container.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        segmentContainer?: string;
        /**
         * The segment length.
         * @format int32
         */
        segmentLength?: number;
        /**
         * The minimum number of segments.
         * @format int32
         */
        minSegments?: number;
        /** The media version id, if playing an alternate version. */
        mediaSourceId?: string;
        /** The device id of the client requesting. Used to stop encoding processes when needed. */
        deviceId?: string;
        /**
         * Optional. Specify an audio codec to encode to, e.g. mp3. If omitted the server will auto-select using the url's extension.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        audioCodec?: string;
        /** Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. */
        enableAutoStreamCopy?: boolean;
        /** Whether or not to allow copying of the video stream url. */
        allowVideoStreamCopy?: boolean;
        /** Whether or not to allow copying of the audio stream url. */
        allowAudioStreamCopy?: boolean;
        /** Optional. Whether to break on non key frames. */
        breakOnNonKeyFrames?: boolean;
        /**
         * Optional. Specify a specific audio sample rate, e.g. 44100.
         * @format int32
         */
        audioSampleRate?: number;
        /**
         * Optional. The maximum audio bit depth.
         * @format int32
         */
        maxAudioBitDepth?: number;
        /**
         * Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        audioBitRate?: number;
        /**
         * Optional. Specify a specific number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        audioChannels?: number;
        /**
         * Optional. Specify a maximum number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        maxAudioChannels?: number;
        /** Optional. Specify a specific an encoder profile (varies by encoder), e.g. main, baseline, high. */
        profile?: string;
        /** Optional. Specify a level for the encoder profile (varies by encoder), e.g. 3, 3.1. */
        level?: string;
        /**
         * Optional. A specific video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        framerate?: number;
        /**
         * Optional. A specific maximum video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        maxFramerate?: number;
        /** Whether or not to copy timestamps when transcoding with an offset. Defaults to false. */
        copyTimestamps?: boolean;
        /**
         * Optional. Specify a starting offset, in ticks. 1 tick = 10000 ms.
         * @format int64
         */
        startTimeTicks?: number;
        /**
         * Optional. The fixed horizontal resolution of the encoded video.
         * @format int32
         */
        width?: number;
        /**
         * Optional. The fixed vertical resolution of the encoded video.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        videoBitRate?: number;
        /**
         * Optional. The index of the subtitle stream to use. If omitted no subtitles will be used.
         * @format int32
         */
        subtitleStreamIndex?: number;
        /** Optional. Specify the subtitle delivery method. */
        subtitleMethod?: 'Encode' | 'Embed' | 'External' | 'Hls' | 'Drop';
        /**
         * Optional.
         * @format int32
         */
        maxRefFrames?: number;
        /**
         * Optional. The maximum video bit depth.
         * @format int32
         */
        maxVideoBitDepth?: number;
        /** Optional. Whether to require avc. */
        requireAvc?: boolean;
        /** Optional. Whether to deinterlace the video. */
        deInterlace?: boolean;
        /** Optional. Whether to require a non anamporphic stream. */
        requireNonAnamorphic?: boolean;
        /**
         * Optional. The maximum number of audio channels to transcode.
         * @format int32
         */
        transcodingMaxAudioChannels?: number;
        /**
         * Optional. The limit of how many cpu cores to use.
         * @format int32
         */
        cpuCoreLimit?: number;
        /** The live stream id. */
        liveStreamId?: string;
        /** Optional. Whether to enable the MpegtsM2Ts mode. */
        enableMpegtsM2TsMode?: boolean;
        /**
         * Optional. Specify a video codec to encode to, e.g. h264. If omitted the server will auto-select using the url's extension.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        videoCodec?: string;
        /**
         * Optional. Specify a subtitle codec to encode to.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        subtitleCodec?: string;
        /** Optional. The transcoding reason. */
        transcodeReasons?: string;
        /**
         * Optional. The index of the audio stream to use. If omitted the first audio stream will be used.
         * @format int32
         */
        audioStreamIndex?: number;
        /**
         * Optional. The index of the video stream to use. If omitted the first video stream will be used.
         * @format int32
         */
        videoStreamIndex?: number;
        /** Optional. The MediaBrowser.Model.Dlna.EncodingContext. */
        context?: 'Streaming' | 'Static';
        /** Optional. The streaming options. */
        streamOptions?: Record<string, string | null>;
        /**
         * Optional. Whether to enable Audio Encoding.
         * @default true
         */
        enableAudioVbrEncoding?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, any>({
        path: `/Audio/${itemId}/stream.${container}`,
        method: 'GET',
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Audio
     * @name HeadAudioStreamByContainer
     * @summary Gets an audio stream.
     * @request HEAD:/Audio/{itemId}/stream.{container}
     */
    headAudioStreamByContainer: (
      itemId: string,
      container: string,
      query?: {
        /** Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false. */
        static?: boolean;
        /** The streaming parameters. */
        params?: string;
        /** The tag. */
        tag?: string;
        /**
         * Optional. The dlna device profile id to utilize.
         * @deprecated
         */
        deviceProfileId?: string;
        /** The play session id. */
        playSessionId?: string;
        /**
         * The segment container.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        segmentContainer?: string;
        /**
         * The segment length.
         * @format int32
         */
        segmentLength?: number;
        /**
         * The minimum number of segments.
         * @format int32
         */
        minSegments?: number;
        /** The media version id, if playing an alternate version. */
        mediaSourceId?: string;
        /** The device id of the client requesting. Used to stop encoding processes when needed. */
        deviceId?: string;
        /**
         * Optional. Specify an audio codec to encode to, e.g. mp3. If omitted the server will auto-select using the url's extension.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        audioCodec?: string;
        /** Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. */
        enableAutoStreamCopy?: boolean;
        /** Whether or not to allow copying of the video stream url. */
        allowVideoStreamCopy?: boolean;
        /** Whether or not to allow copying of the audio stream url. */
        allowAudioStreamCopy?: boolean;
        /** Optional. Whether to break on non key frames. */
        breakOnNonKeyFrames?: boolean;
        /**
         * Optional. Specify a specific audio sample rate, e.g. 44100.
         * @format int32
         */
        audioSampleRate?: number;
        /**
         * Optional. The maximum audio bit depth.
         * @format int32
         */
        maxAudioBitDepth?: number;
        /**
         * Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        audioBitRate?: number;
        /**
         * Optional. Specify a specific number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        audioChannels?: number;
        /**
         * Optional. Specify a maximum number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        maxAudioChannels?: number;
        /** Optional. Specify a specific an encoder profile (varies by encoder), e.g. main, baseline, high. */
        profile?: string;
        /** Optional. Specify a level for the encoder profile (varies by encoder), e.g. 3, 3.1. */
        level?: string;
        /**
         * Optional. A specific video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        framerate?: number;
        /**
         * Optional. A specific maximum video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        maxFramerate?: number;
        /** Whether or not to copy timestamps when transcoding with an offset. Defaults to false. */
        copyTimestamps?: boolean;
        /**
         * Optional. Specify a starting offset, in ticks. 1 tick = 10000 ms.
         * @format int64
         */
        startTimeTicks?: number;
        /**
         * Optional. The fixed horizontal resolution of the encoded video.
         * @format int32
         */
        width?: number;
        /**
         * Optional. The fixed vertical resolution of the encoded video.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        videoBitRate?: number;
        /**
         * Optional. The index of the subtitle stream to use. If omitted no subtitles will be used.
         * @format int32
         */
        subtitleStreamIndex?: number;
        /** Optional. Specify the subtitle delivery method. */
        subtitleMethod?: 'Encode' | 'Embed' | 'External' | 'Hls' | 'Drop';
        /**
         * Optional.
         * @format int32
         */
        maxRefFrames?: number;
        /**
         * Optional. The maximum video bit depth.
         * @format int32
         */
        maxVideoBitDepth?: number;
        /** Optional. Whether to require avc. */
        requireAvc?: boolean;
        /** Optional. Whether to deinterlace the video. */
        deInterlace?: boolean;
        /** Optional. Whether to require a non anamporphic stream. */
        requireNonAnamorphic?: boolean;
        /**
         * Optional. The maximum number of audio channels to transcode.
         * @format int32
         */
        transcodingMaxAudioChannels?: number;
        /**
         * Optional. The limit of how many cpu cores to use.
         * @format int32
         */
        cpuCoreLimit?: number;
        /** The live stream id. */
        liveStreamId?: string;
        /** Optional. Whether to enable the MpegtsM2Ts mode. */
        enableMpegtsM2TsMode?: boolean;
        /**
         * Optional. Specify a video codec to encode to, e.g. h264. If omitted the server will auto-select using the url's extension.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        videoCodec?: string;
        /**
         * Optional. Specify a subtitle codec to encode to.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        subtitleCodec?: string;
        /** Optional. The transcoding reason. */
        transcodeReasons?: string;
        /**
         * Optional. The index of the audio stream to use. If omitted the first audio stream will be used.
         * @format int32
         */
        audioStreamIndex?: number;
        /**
         * Optional. The index of the video stream to use. If omitted the first video stream will be used.
         * @format int32
         */
        videoStreamIndex?: number;
        /** Optional. The MediaBrowser.Model.Dlna.EncodingContext. */
        context?: 'Streaming' | 'Static';
        /** Optional. The streaming options. */
        streamOptions?: Record<string, string | null>;
        /**
         * Optional. Whether to enable Audio Encoding.
         * @default true
         */
        enableAudioVbrEncoding?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, any>({
        path: `/Audio/${itemId}/stream.${container}`,
        method: 'HEAD',
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags DynamicHls
     * @name GetHlsAudioSegment
     * @summary Gets a video stream using HTTP live streaming.
     * @request GET:/Audio/{itemId}/hls1/{playlistId}/{segmentId}.{container}
     * @secure
     */
    getHlsAudioSegment: (
      itemId: string,
      playlistId: string,
      segmentId: number,
      container: string,
      query: {
        /**
         * The position of the requested segment in ticks.
         * @format int64
         */
        runtimeTicks: number;
        /**
         * The length of the requested segment in ticks.
         * @format int64
         */
        actualSegmentLengthTicks: number;
        /** Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false. */
        static?: boolean;
        /** The streaming parameters. */
        params?: string;
        /** The tag. */
        tag?: string;
        /**
         * Optional. The dlna device profile id to utilize.
         * @deprecated
         */
        deviceProfileId?: string;
        /** The play session id. */
        playSessionId?: string;
        /**
         * The segment container.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        segmentContainer?: string;
        /**
         * The segment length.
         * @format int32
         */
        segmentLength?: number;
        /**
         * The minimum number of segments.
         * @format int32
         */
        minSegments?: number;
        /** The media version id, if playing an alternate version. */
        mediaSourceId?: string;
        /** The device id of the client requesting. Used to stop encoding processes when needed. */
        deviceId?: string;
        /**
         * Optional. Specify an audio codec to encode to, e.g. mp3.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        audioCodec?: string;
        /** Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. */
        enableAutoStreamCopy?: boolean;
        /** Whether or not to allow copying of the video stream url. */
        allowVideoStreamCopy?: boolean;
        /** Whether or not to allow copying of the audio stream url. */
        allowAudioStreamCopy?: boolean;
        /** Optional. Whether to break on non key frames. */
        breakOnNonKeyFrames?: boolean;
        /**
         * Optional. Specify a specific audio sample rate, e.g. 44100.
         * @format int32
         */
        audioSampleRate?: number;
        /**
         * Optional. The maximum audio bit depth.
         * @format int32
         */
        maxAudioBitDepth?: number;
        /**
         * Optional. The maximum streaming bitrate.
         * @format int32
         */
        maxStreamingBitrate?: number;
        /**
         * Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        audioBitRate?: number;
        /**
         * Optional. Specify a specific number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        audioChannels?: number;
        /**
         * Optional. Specify a maximum number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        maxAudioChannels?: number;
        /** Optional. Specify a specific an encoder profile (varies by encoder), e.g. main, baseline, high. */
        profile?: string;
        /** Optional. Specify a level for the encoder profile (varies by encoder), e.g. 3, 3.1. */
        level?: string;
        /**
         * Optional. A specific video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        framerate?: number;
        /**
         * Optional. A specific maximum video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        maxFramerate?: number;
        /** Whether or not to copy timestamps when transcoding with an offset. Defaults to false. */
        copyTimestamps?: boolean;
        /**
         * Optional. Specify a starting offset, in ticks. 1 tick = 10000 ms.
         * @format int64
         */
        startTimeTicks?: number;
        /**
         * Optional. The fixed horizontal resolution of the encoded video.
         * @format int32
         */
        width?: number;
        /**
         * Optional. The fixed vertical resolution of the encoded video.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        videoBitRate?: number;
        /**
         * Optional. The index of the subtitle stream to use. If omitted no subtitles will be used.
         * @format int32
         */
        subtitleStreamIndex?: number;
        /** Optional. Specify the subtitle delivery method. */
        subtitleMethod?: 'Encode' | 'Embed' | 'External' | 'Hls' | 'Drop';
        /**
         * Optional.
         * @format int32
         */
        maxRefFrames?: number;
        /**
         * Optional. The maximum video bit depth.
         * @format int32
         */
        maxVideoBitDepth?: number;
        /** Optional. Whether to require avc. */
        requireAvc?: boolean;
        /** Optional. Whether to deinterlace the video. */
        deInterlace?: boolean;
        /** Optional. Whether to require a non anamorphic stream. */
        requireNonAnamorphic?: boolean;
        /**
         * Optional. The maximum number of audio channels to transcode.
         * @format int32
         */
        transcodingMaxAudioChannels?: number;
        /**
         * Optional. The limit of how many cpu cores to use.
         * @format int32
         */
        cpuCoreLimit?: number;
        /** The live stream id. */
        liveStreamId?: string;
        /** Optional. Whether to enable the MpegtsM2Ts mode. */
        enableMpegtsM2TsMode?: boolean;
        /**
         * Optional. Specify a video codec to encode to, e.g. h264.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        videoCodec?: string;
        /**
         * Optional. Specify a subtitle codec to encode to.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        subtitleCodec?: string;
        /** Optional. The transcoding reason. */
        transcodeReasons?: string;
        /**
         * Optional. The index of the audio stream to use. If omitted the first audio stream will be used.
         * @format int32
         */
        audioStreamIndex?: number;
        /**
         * Optional. The index of the video stream to use. If omitted the first video stream will be used.
         * @format int32
         */
        videoStreamIndex?: number;
        /** Optional. The MediaBrowser.Model.Dlna.EncodingContext. */
        context?: 'Streaming' | 'Static';
        /** Optional. The streaming options. */
        streamOptions?: Record<string, string | null>;
        /**
         * Optional. Whether to enable Audio Encoding.
         * @default true
         */
        enableAudioVbrEncoding?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, void>({
        path: `/Audio/${itemId}/hls1/${playlistId}/${segmentId}.${container}`,
        method: 'GET',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags DynamicHls
     * @name GetVariantHlsAudioPlaylist
     * @summary Gets an audio stream using HTTP live streaming.
     * @request GET:/Audio/{itemId}/main.m3u8
     * @secure
     */
    getVariantHlsAudioPlaylist: (
      itemId: string,
      query?: {
        /** Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false. */
        static?: boolean;
        /** The streaming parameters. */
        params?: string;
        /** The tag. */
        tag?: string;
        /**
         * Optional. The dlna device profile id to utilize.
         * @deprecated
         */
        deviceProfileId?: string;
        /** The play session id. */
        playSessionId?: string;
        /**
         * The segment container.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        segmentContainer?: string;
        /**
         * The segment length.
         * @format int32
         */
        segmentLength?: number;
        /**
         * The minimum number of segments.
         * @format int32
         */
        minSegments?: number;
        /** The media version id, if playing an alternate version. */
        mediaSourceId?: string;
        /** The device id of the client requesting. Used to stop encoding processes when needed. */
        deviceId?: string;
        /**
         * Optional. Specify an audio codec to encode to, e.g. mp3.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        audioCodec?: string;
        /** Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. */
        enableAutoStreamCopy?: boolean;
        /** Whether or not to allow copying of the video stream url. */
        allowVideoStreamCopy?: boolean;
        /** Whether or not to allow copying of the audio stream url. */
        allowAudioStreamCopy?: boolean;
        /** Optional. Whether to break on non key frames. */
        breakOnNonKeyFrames?: boolean;
        /**
         * Optional. Specify a specific audio sample rate, e.g. 44100.
         * @format int32
         */
        audioSampleRate?: number;
        /**
         * Optional. The maximum audio bit depth.
         * @format int32
         */
        maxAudioBitDepth?: number;
        /**
         * Optional. The maximum streaming bitrate.
         * @format int32
         */
        maxStreamingBitrate?: number;
        /**
         * Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        audioBitRate?: number;
        /**
         * Optional. Specify a specific number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        audioChannels?: number;
        /**
         * Optional. Specify a maximum number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        maxAudioChannels?: number;
        /** Optional. Specify a specific an encoder profile (varies by encoder), e.g. main, baseline, high. */
        profile?: string;
        /** Optional. Specify a level for the encoder profile (varies by encoder), e.g. 3, 3.1. */
        level?: string;
        /**
         * Optional. A specific video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        framerate?: number;
        /**
         * Optional. A specific maximum video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        maxFramerate?: number;
        /** Whether or not to copy timestamps when transcoding with an offset. Defaults to false. */
        copyTimestamps?: boolean;
        /**
         * Optional. Specify a starting offset, in ticks. 1 tick = 10000 ms.
         * @format int64
         */
        startTimeTicks?: number;
        /**
         * Optional. The fixed horizontal resolution of the encoded video.
         * @format int32
         */
        width?: number;
        /**
         * Optional. The fixed vertical resolution of the encoded video.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        videoBitRate?: number;
        /**
         * Optional. The index of the subtitle stream to use. If omitted no subtitles will be used.
         * @format int32
         */
        subtitleStreamIndex?: number;
        /** Optional. Specify the subtitle delivery method. */
        subtitleMethod?: 'Encode' | 'Embed' | 'External' | 'Hls' | 'Drop';
        /**
         * Optional.
         * @format int32
         */
        maxRefFrames?: number;
        /**
         * Optional. The maximum video bit depth.
         * @format int32
         */
        maxVideoBitDepth?: number;
        /** Optional. Whether to require avc. */
        requireAvc?: boolean;
        /** Optional. Whether to deinterlace the video. */
        deInterlace?: boolean;
        /** Optional. Whether to require a non anamorphic stream. */
        requireNonAnamorphic?: boolean;
        /**
         * Optional. The maximum number of audio channels to transcode.
         * @format int32
         */
        transcodingMaxAudioChannels?: number;
        /**
         * Optional. The limit of how many cpu cores to use.
         * @format int32
         */
        cpuCoreLimit?: number;
        /** The live stream id. */
        liveStreamId?: string;
        /** Optional. Whether to enable the MpegtsM2Ts mode. */
        enableMpegtsM2TsMode?: boolean;
        /**
         * Optional. Specify a video codec to encode to, e.g. h264.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        videoCodec?: string;
        /**
         * Optional. Specify a subtitle codec to encode to.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        subtitleCodec?: string;
        /** Optional. The transcoding reason. */
        transcodeReasons?: string;
        /**
         * Optional. The index of the audio stream to use. If omitted the first audio stream will be used.
         * @format int32
         */
        audioStreamIndex?: number;
        /**
         * Optional. The index of the video stream to use. If omitted the first video stream will be used.
         * @format int32
         */
        videoStreamIndex?: number;
        /** Optional. The MediaBrowser.Model.Dlna.EncodingContext. */
        context?: 'Streaming' | 'Static';
        /** Optional. The streaming options. */
        streamOptions?: Record<string, string | null>;
        /**
         * Optional. Whether to enable Audio Encoding.
         * @default true
         */
        enableAudioVbrEncoding?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, void>({
        path: `/Audio/${itemId}/main.m3u8`,
        method: 'GET',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags DynamicHls
     * @name GetMasterHlsAudioPlaylist
     * @summary Gets an audio hls playlist stream.
     * @request GET:/Audio/{itemId}/master.m3u8
     * @secure
     */
    getMasterHlsAudioPlaylist: (
      itemId: string,
      query: {
        /** Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false. */
        static?: boolean;
        /** The streaming parameters. */
        params?: string;
        /** The tag. */
        tag?: string;
        /**
         * Optional. The dlna device profile id to utilize.
         * @deprecated
         */
        deviceProfileId?: string;
        /** The play session id. */
        playSessionId?: string;
        /**
         * The segment container.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        segmentContainer?: string;
        /**
         * The segment length.
         * @format int32
         */
        segmentLength?: number;
        /**
         * The minimum number of segments.
         * @format int32
         */
        minSegments?: number;
        /** The media version id, if playing an alternate version. */
        mediaSourceId: string;
        /** The device id of the client requesting. Used to stop encoding processes when needed. */
        deviceId?: string;
        /**
         * Optional. Specify an audio codec to encode to, e.g. mp3.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        audioCodec?: string;
        /** Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. */
        enableAutoStreamCopy?: boolean;
        /** Whether or not to allow copying of the video stream url. */
        allowVideoStreamCopy?: boolean;
        /** Whether or not to allow copying of the audio stream url. */
        allowAudioStreamCopy?: boolean;
        /** Optional. Whether to break on non key frames. */
        breakOnNonKeyFrames?: boolean;
        /**
         * Optional. Specify a specific audio sample rate, e.g. 44100.
         * @format int32
         */
        audioSampleRate?: number;
        /**
         * Optional. The maximum audio bit depth.
         * @format int32
         */
        maxAudioBitDepth?: number;
        /**
         * Optional. The maximum streaming bitrate.
         * @format int32
         */
        maxStreamingBitrate?: number;
        /**
         * Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        audioBitRate?: number;
        /**
         * Optional. Specify a specific number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        audioChannels?: number;
        /**
         * Optional. Specify a maximum number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        maxAudioChannels?: number;
        /** Optional. Specify a specific an encoder profile (varies by encoder), e.g. main, baseline, high. */
        profile?: string;
        /** Optional. Specify a level for the encoder profile (varies by encoder), e.g. 3, 3.1. */
        level?: string;
        /**
         * Optional. A specific video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        framerate?: number;
        /**
         * Optional. A specific maximum video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        maxFramerate?: number;
        /** Whether or not to copy timestamps when transcoding with an offset. Defaults to false. */
        copyTimestamps?: boolean;
        /**
         * Optional. Specify a starting offset, in ticks. 1 tick = 10000 ms.
         * @format int64
         */
        startTimeTicks?: number;
        /**
         * Optional. The fixed horizontal resolution of the encoded video.
         * @format int32
         */
        width?: number;
        /**
         * Optional. The fixed vertical resolution of the encoded video.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        videoBitRate?: number;
        /**
         * Optional. The index of the subtitle stream to use. If omitted no subtitles will be used.
         * @format int32
         */
        subtitleStreamIndex?: number;
        /** Optional. Specify the subtitle delivery method. */
        subtitleMethod?: 'Encode' | 'Embed' | 'External' | 'Hls' | 'Drop';
        /**
         * Optional.
         * @format int32
         */
        maxRefFrames?: number;
        /**
         * Optional. The maximum video bit depth.
         * @format int32
         */
        maxVideoBitDepth?: number;
        /** Optional. Whether to require avc. */
        requireAvc?: boolean;
        /** Optional. Whether to deinterlace the video. */
        deInterlace?: boolean;
        /** Optional. Whether to require a non anamorphic stream. */
        requireNonAnamorphic?: boolean;
        /**
         * Optional. The maximum number of audio channels to transcode.
         * @format int32
         */
        transcodingMaxAudioChannels?: number;
        /**
         * Optional. The limit of how many cpu cores to use.
         * @format int32
         */
        cpuCoreLimit?: number;
        /** The live stream id. */
        liveStreamId?: string;
        /** Optional. Whether to enable the MpegtsM2Ts mode. */
        enableMpegtsM2TsMode?: boolean;
        /**
         * Optional. Specify a video codec to encode to, e.g. h264.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        videoCodec?: string;
        /**
         * Optional. Specify a subtitle codec to encode to.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        subtitleCodec?: string;
        /** Optional. The transcoding reason. */
        transcodeReasons?: string;
        /**
         * Optional. The index of the audio stream to use. If omitted the first audio stream will be used.
         * @format int32
         */
        audioStreamIndex?: number;
        /**
         * Optional. The index of the video stream to use. If omitted the first video stream will be used.
         * @format int32
         */
        videoStreamIndex?: number;
        /** Optional. The MediaBrowser.Model.Dlna.EncodingContext. */
        context?: 'Streaming' | 'Static';
        /** Optional. The streaming options. */
        streamOptions?: Record<string, string | null>;
        /**
         * Enable adaptive bitrate streaming.
         * @default true
         */
        enableAdaptiveBitrateStreaming?: boolean;
        /**
         * Optional. Whether to enable Audio Encoding.
         * @default true
         */
        enableAudioVbrEncoding?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, void>({
        path: `/Audio/${itemId}/master.m3u8`,
        method: 'GET',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags DynamicHls
     * @name HeadMasterHlsAudioPlaylist
     * @summary Gets an audio hls playlist stream.
     * @request HEAD:/Audio/{itemId}/master.m3u8
     * @secure
     */
    headMasterHlsAudioPlaylist: (
      itemId: string,
      query: {
        /** Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false. */
        static?: boolean;
        /** The streaming parameters. */
        params?: string;
        /** The tag. */
        tag?: string;
        /**
         * Optional. The dlna device profile id to utilize.
         * @deprecated
         */
        deviceProfileId?: string;
        /** The play session id. */
        playSessionId?: string;
        /**
         * The segment container.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        segmentContainer?: string;
        /**
         * The segment length.
         * @format int32
         */
        segmentLength?: number;
        /**
         * The minimum number of segments.
         * @format int32
         */
        minSegments?: number;
        /** The media version id, if playing an alternate version. */
        mediaSourceId: string;
        /** The device id of the client requesting. Used to stop encoding processes when needed. */
        deviceId?: string;
        /**
         * Optional. Specify an audio codec to encode to, e.g. mp3.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        audioCodec?: string;
        /** Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. */
        enableAutoStreamCopy?: boolean;
        /** Whether or not to allow copying of the video stream url. */
        allowVideoStreamCopy?: boolean;
        /** Whether or not to allow copying of the audio stream url. */
        allowAudioStreamCopy?: boolean;
        /** Optional. Whether to break on non key frames. */
        breakOnNonKeyFrames?: boolean;
        /**
         * Optional. Specify a specific audio sample rate, e.g. 44100.
         * @format int32
         */
        audioSampleRate?: number;
        /**
         * Optional. The maximum audio bit depth.
         * @format int32
         */
        maxAudioBitDepth?: number;
        /**
         * Optional. The maximum streaming bitrate.
         * @format int32
         */
        maxStreamingBitrate?: number;
        /**
         * Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        audioBitRate?: number;
        /**
         * Optional. Specify a specific number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        audioChannels?: number;
        /**
         * Optional. Specify a maximum number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        maxAudioChannels?: number;
        /** Optional. Specify a specific an encoder profile (varies by encoder), e.g. main, baseline, high. */
        profile?: string;
        /** Optional. Specify a level for the encoder profile (varies by encoder), e.g. 3, 3.1. */
        level?: string;
        /**
         * Optional. A specific video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        framerate?: number;
        /**
         * Optional. A specific maximum video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        maxFramerate?: number;
        /** Whether or not to copy timestamps when transcoding with an offset. Defaults to false. */
        copyTimestamps?: boolean;
        /**
         * Optional. Specify a starting offset, in ticks. 1 tick = 10000 ms.
         * @format int64
         */
        startTimeTicks?: number;
        /**
         * Optional. The fixed horizontal resolution of the encoded video.
         * @format int32
         */
        width?: number;
        /**
         * Optional. The fixed vertical resolution of the encoded video.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        videoBitRate?: number;
        /**
         * Optional. The index of the subtitle stream to use. If omitted no subtitles will be used.
         * @format int32
         */
        subtitleStreamIndex?: number;
        /** Optional. Specify the subtitle delivery method. */
        subtitleMethod?: 'Encode' | 'Embed' | 'External' | 'Hls' | 'Drop';
        /**
         * Optional.
         * @format int32
         */
        maxRefFrames?: number;
        /**
         * Optional. The maximum video bit depth.
         * @format int32
         */
        maxVideoBitDepth?: number;
        /** Optional. Whether to require avc. */
        requireAvc?: boolean;
        /** Optional. Whether to deinterlace the video. */
        deInterlace?: boolean;
        /** Optional. Whether to require a non anamorphic stream. */
        requireNonAnamorphic?: boolean;
        /**
         * Optional. The maximum number of audio channels to transcode.
         * @format int32
         */
        transcodingMaxAudioChannels?: number;
        /**
         * Optional. The limit of how many cpu cores to use.
         * @format int32
         */
        cpuCoreLimit?: number;
        /** The live stream id. */
        liveStreamId?: string;
        /** Optional. Whether to enable the MpegtsM2Ts mode. */
        enableMpegtsM2TsMode?: boolean;
        /**
         * Optional. Specify a video codec to encode to, e.g. h264.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        videoCodec?: string;
        /**
         * Optional. Specify a subtitle codec to encode to.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        subtitleCodec?: string;
        /** Optional. The transcoding reason. */
        transcodeReasons?: string;
        /**
         * Optional. The index of the audio stream to use. If omitted the first audio stream will be used.
         * @format int32
         */
        audioStreamIndex?: number;
        /**
         * Optional. The index of the video stream to use. If omitted the first video stream will be used.
         * @format int32
         */
        videoStreamIndex?: number;
        /** Optional. The MediaBrowser.Model.Dlna.EncodingContext. */
        context?: 'Streaming' | 'Static';
        /** Optional. The streaming options. */
        streamOptions?: Record<string, string | null>;
        /**
         * Enable adaptive bitrate streaming.
         * @default true
         */
        enableAdaptiveBitrateStreaming?: boolean;
        /**
         * Optional. Whether to enable Audio Encoding.
         * @default true
         */
        enableAudioVbrEncoding?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, void>({
        path: `/Audio/${itemId}/master.m3u8`,
        method: 'HEAD',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags HlsSegment
     * @name GetHlsAudioSegmentLegacyAac
     * @summary Gets the specified audio segment for an audio item.
     * @request GET:/Audio/{itemId}/hls/{segmentId}/stream.aac
     */
    getHlsAudioSegmentLegacyAac: (itemId: string, segmentId: string, params: RequestParams = {}) =>
      this.request<File, any>({
        path: `/Audio/${itemId}/hls/${segmentId}/stream.aac`,
        method: 'GET',
        ...params,
      }),

    /**
     * No description
     *
     * @tags HlsSegment
     * @name GetHlsAudioSegmentLegacyMp3
     * @summary Gets the specified audio segment for an audio item.
     * @request GET:/Audio/{itemId}/hls/{segmentId}/stream.mp3
     */
    getHlsAudioSegmentLegacyMp3: (itemId: string, segmentId: string, params: RequestParams = {}) =>
      this.request<File, any>({
        path: `/Audio/${itemId}/hls/${segmentId}/stream.mp3`,
        method: 'GET',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Lyrics
     * @name GetLyrics
     * @summary Gets an item's lyrics.
     * @request GET:/Audio/{itemId}/Lyrics
     * @secure
     */
    getLyrics: (itemId: string, params: RequestParams = {}) =>
      this.request<LyricDto, void | ProblemDetails>({
        path: `/Audio/${itemId}/Lyrics`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Lyrics
     * @name UploadLyrics
     * @summary Upload an external lyric file.
     * @request POST:/Audio/{itemId}/Lyrics
     * @secure
     */
    uploadLyrics: (
      itemId: string,
      query: {
        /** Name of the file being uploaded. */
        fileName: string;
      },
      data: File,
      params: RequestParams = {},
    ) =>
      this.request<LyricDto, ProblemDetails | void>({
        path: `/Audio/${itemId}/Lyrics`,
        method: 'POST',
        query: query,
        body: data,
        secure: true,
        type: ContentType.Text,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Lyrics
     * @name DeleteLyrics
     * @summary Deletes an external lyric file.
     * @request DELETE:/Audio/{itemId}/Lyrics
     * @secure
     */
    deleteLyrics: (itemId: string, params: RequestParams = {}) =>
      this.request<void, void | ProblemDetails>({
        path: `/Audio/${itemId}/Lyrics`,
        method: 'DELETE',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Lyrics
     * @name SearchRemoteLyrics
     * @summary Search remote lyrics.
     * @request GET:/Audio/{itemId}/RemoteSearch/Lyrics
     * @secure
     */
    searchRemoteLyrics: (itemId: string, params: RequestParams = {}) =>
      this.request<RemoteLyricInfoDto[], void | ProblemDetails>({
        path: `/Audio/${itemId}/RemoteSearch/Lyrics`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Lyrics
     * @name DownloadRemoteLyrics
     * @summary Downloads a remote lyric.
     * @request POST:/Audio/{itemId}/RemoteSearch/Lyrics/{lyricId}
     * @secure
     */
    downloadRemoteLyrics: (itemId: string, lyricId: string, params: RequestParams = {}) =>
      this.request<LyricDto, void | ProblemDetails>({
        path: `/Audio/${itemId}/RemoteSearch/Lyrics/${lyricId}`,
        method: 'POST',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags UniversalAudio
     * @name GetUniversalAudioStream
     * @summary Gets an audio stream.
     * @request GET:/Audio/{itemId}/universal
     * @secure
     */
    getUniversalAudioStream: (
      itemId: string,
      query?: {
        /** Optional. The audio container. */
        container?: string[];
        /** The media version id, if playing an alternate version. */
        mediaSourceId?: string;
        /** The device id of the client requesting. Used to stop encoding processes when needed. */
        deviceId?: string;
        /**
         * Optional. The user id.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. The audio codec to transcode to.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        audioCodec?: string;
        /**
         * Optional. The maximum number of audio channels.
         * @format int32
         */
        maxAudioChannels?: number;
        /**
         * Optional. The number of how many audio channels to transcode to.
         * @format int32
         */
        transcodingAudioChannels?: number;
        /**
         * Optional. The maximum streaming bitrate.
         * @format int32
         */
        maxStreamingBitrate?: number;
        /**
         * Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        audioBitRate?: number;
        /**
         * Optional. Specify a starting offset, in ticks. 1 tick = 10000 ms.
         * @format int64
         */
        startTimeTicks?: number;
        /**
         * Optional. The container to transcode to.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        transcodingContainer?: string;
        /** Optional. The transcoding protocol. */
        transcodingProtocol?: 'http' | 'hls';
        /**
         * Optional. The maximum audio sample rate.
         * @format int32
         */
        maxAudioSampleRate?: number;
        /**
         * Optional. The maximum audio bit depth.
         * @format int32
         */
        maxAudioBitDepth?: number;
        /** Optional. Whether to enable remote media. */
        enableRemoteMedia?: boolean;
        /**
         * Optional. Whether to enable Audio Encoding.
         * @default true
         */
        enableAudioVbrEncoding?: boolean;
        /**
         * Optional. Whether to break on non key frames.
         * @default false
         */
        breakOnNonKeyFrames?: boolean;
        /**
         * Whether to enable redirection. Defaults to true.
         * @default true
         */
        enableRedirection?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, void | ProblemDetails>({
        path: `/Audio/${itemId}/universal`,
        method: 'GET',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags UniversalAudio
     * @name HeadUniversalAudioStream
     * @summary Gets an audio stream.
     * @request HEAD:/Audio/{itemId}/universal
     * @secure
     */
    headUniversalAudioStream: (
      itemId: string,
      query?: {
        /** Optional. The audio container. */
        container?: string[];
        /** The media version id, if playing an alternate version. */
        mediaSourceId?: string;
        /** The device id of the client requesting. Used to stop encoding processes when needed. */
        deviceId?: string;
        /**
         * Optional. The user id.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. The audio codec to transcode to.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        audioCodec?: string;
        /**
         * Optional. The maximum number of audio channels.
         * @format int32
         */
        maxAudioChannels?: number;
        /**
         * Optional. The number of how many audio channels to transcode to.
         * @format int32
         */
        transcodingAudioChannels?: number;
        /**
         * Optional. The maximum streaming bitrate.
         * @format int32
         */
        maxStreamingBitrate?: number;
        /**
         * Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        audioBitRate?: number;
        /**
         * Optional. Specify a starting offset, in ticks. 1 tick = 10000 ms.
         * @format int64
         */
        startTimeTicks?: number;
        /**
         * Optional. The container to transcode to.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        transcodingContainer?: string;
        /** Optional. The transcoding protocol. */
        transcodingProtocol?: 'http' | 'hls';
        /**
         * Optional. The maximum audio sample rate.
         * @format int32
         */
        maxAudioSampleRate?: number;
        /**
         * Optional. The maximum audio bit depth.
         * @format int32
         */
        maxAudioBitDepth?: number;
        /** Optional. Whether to enable remote media. */
        enableRemoteMedia?: boolean;
        /**
         * Optional. Whether to enable Audio Encoding.
         * @default true
         */
        enableAudioVbrEncoding?: boolean;
        /**
         * Optional. Whether to break on non key frames.
         * @default false
         */
        breakOnNonKeyFrames?: boolean;
        /**
         * Whether to enable redirection. Defaults to true.
         * @default true
         */
        enableRedirection?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, void | ProblemDetails>({
        path: `/Audio/${itemId}/universal`,
        method: 'HEAD',
        query: query,
        secure: true,
        ...params,
      }),
  };
  branding = {
    /**
     * No description
     *
     * @tags Branding
     * @name GetBrandingOptions
     * @summary Gets branding configuration.
     * @request GET:/Branding/Configuration
     */
    getBrandingOptions: (params: RequestParams = {}) =>
      this.request<BrandingOptions, any>({
        path: `/Branding/Configuration`,
        method: 'GET',
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Branding
     * @name GetBrandingCss
     * @summary Gets branding css.
     * @request GET:/Branding/Css
     */
    getBrandingCss: (params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/Branding/Css`,
        method: 'GET',
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Branding
     * @name GetBrandingCss2
     * @summary Gets branding css.
     * @request GET:/Branding/Css.css
     */
    getBrandingCss2: (params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/Branding/Css.css`,
        method: 'GET',
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name GetSplashscreen
     * @summary Generates or gets the splashscreen.
     * @request GET:/Branding/Splashscreen
     */
    getSplashscreen: (
      query?: {
        /** Supply the cache tag from the item object to receive strong caching headers. */
        tag?: string;
        /** Determines the output format of the image - original,gif,jpg,png. */
        format?: 'Bmp' | 'Gif' | 'Jpg' | 'Png' | 'Webp' | 'Svg';
        /**
         * The maximum image width to return.
         * @format int32
         */
        maxWidth?: number;
        /**
         * The maximum image height to return.
         * @format int32
         */
        maxHeight?: number;
        /**
         * The fixed image width to return.
         * @format int32
         */
        width?: number;
        /**
         * The fixed image height to return.
         * @format int32
         */
        height?: number;
        /**
         * Width of box to fill.
         * @format int32
         */
        fillWidth?: number;
        /**
         * Height of box to fill.
         * @format int32
         */
        fillHeight?: number;
        /**
         * Blur image.
         * @format int32
         */
        blur?: number;
        /** Apply a background color for transparent images. */
        backgroundColor?: string;
        /** Apply a foreground layer on top of the image. */
        foregroundLayer?: string;
        /**
         * Quality setting, from 0-100.
         * @format int32
         * @min 0
         * @max 100
         * @default 90
         */
        quality?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, any>({
        path: `/Branding/Splashscreen`,
        method: 'GET',
        query: query,
        format: 'blob',
        ...params,
      }),

    /**
 * No description
 *
 * @tags Image
 * @name UploadCustomSplashscreen
 * @summary Uploads a custom splashscreen.
The body is expected to the image contents base64 encoded.
 * @request POST:/Branding/Splashscreen
 * @secure
 */
    uploadCustomSplashscreen: (data: File, params: RequestParams = {}) =>
      this.request<void, ProblemDetails | void>({
        path: `/Branding/Splashscreen`,
        method: 'POST',
        body: data,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name DeleteCustomSplashscreen
     * @summary Delete a custom splashscreen.
     * @request DELETE:/Branding/Splashscreen
     * @secure
     */
    deleteCustomSplashscreen: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/Branding/Splashscreen`,
        method: 'DELETE',
        secure: true,
        ...params,
      }),
  };
  channels = {
    /**
     * No description
     *
     * @tags Channels
     * @name GetChannels
     * @summary Gets available channels.
     * @request GET:/Channels
     * @secure
     */
    getChannels: (
      query?: {
        /**
         * User Id to filter by. Use System.Guid.Empty to not filter by user.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. The record index to start at. All items with a lower index will be dropped from the results.
         * @format int32
         */
        startIndex?: number;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Filter by channels that support getting latest items. */
        supportsLatestItems?: boolean;
        /** Optional. Filter by channels that support media deletion. */
        supportsMediaDeletion?: boolean;
        /** Optional. Filter by channels that are favorite. */
        isFavorite?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/Channels`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Channels
     * @name GetChannelFeatures
     * @summary Get channel features.
     * @request GET:/Channels/{channelId}/Features
     * @secure
     */
    getChannelFeatures: (channelId: string, params: RequestParams = {}) =>
      this.request<ChannelFeatures, void>({
        path: `/Channels/${channelId}/Features`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Channels
     * @name GetChannelItems
     * @summary Get channel items.
     * @request GET:/Channels/{channelId}/Items
     * @secure
     */
    getChannelItems: (
      channelId: string,
      query?: {
        /**
         * Optional. Folder Id.
         * @format uuid
         */
        folderId?: string;
        /**
         * Optional. User Id.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. The record index to start at. All items with a lower index will be dropped from the results.
         * @format int32
         */
        startIndex?: number;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Sort Order - Ascending,Descending. */
        sortOrder?: SortOrder[];
        /** Optional. Specify additional filters to apply. */
        filters?: ItemFilter[];
        /** Optional. Specify one or more sort orders, comma delimited. Options: Album, AlbumArtist, Artist, Budget, CommunityRating, CriticRating, DateCreated, DatePlayed, PlayCount, PremiereDate, ProductionYear, SortName, Random, Revenue, Runtime. */
        sortBy?: ItemSortBy[];
        /** Optional. Specify additional fields of information to return in the output. */
        fields?: ItemFields[];
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/Channels/${channelId}/Items`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Channels
     * @name GetAllChannelFeatures
     * @summary Get all channel features.
     * @request GET:/Channels/Features
     * @secure
     */
    getAllChannelFeatures: (params: RequestParams = {}) =>
      this.request<ChannelFeatures[], void>({
        path: `/Channels/Features`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Channels
     * @name GetLatestChannelItems
     * @summary Gets latest channel items.
     * @request GET:/Channels/Items/Latest
     * @secure
     */
    getLatestChannelItems: (
      query?: {
        /**
         * Optional. User Id.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. The record index to start at. All items with a lower index will be dropped from the results.
         * @format int32
         */
        startIndex?: number;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Specify additional filters to apply. */
        filters?: ItemFilter[];
        /** Optional. Specify additional fields of information to return in the output. */
        fields?: ItemFields[];
        /** Optional. Specify one or more channel id's, comma delimited. */
        channelIds?: string[];
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/Channels/Items/Latest`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),
  };
  clientLog = {
    /**
     * No description
     *
     * @tags ClientLog
     * @name LogFile
     * @summary Upload a document.
     * @request POST:/ClientLog/Document
     * @secure
     */
    logFile: (data: File, params: RequestParams = {}) =>
      this.request<ClientLogDocumentResponseDto, void | ProblemDetails>({
        path: `/ClientLog/Document`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Text,
        format: 'json',
        ...params,
      }),
  };
  collections = {
    /**
     * No description
     *
     * @tags Collection
     * @name CreateCollection
     * @summary Creates a new collection.
     * @request POST:/Collections
     * @secure
     */
    createCollection: (
      query?: {
        /** The name of the collection. */
        name?: string;
        /** Item Ids to add to the collection. */
        ids?: string[];
        /**
         * Optional. Create the collection within a specific folder.
         * @format uuid
         */
        parentId?: string;
        /**
         * Whether or not to lock the new collection.
         * @default false
         */
        isLocked?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<CollectionCreationResult, void>({
        path: `/Collections`,
        method: 'POST',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Collection
     * @name AddToCollection
     * @summary Adds items to a collection.
     * @request POST:/Collections/{collectionId}/Items
     * @secure
     */
    addToCollection: (
      collectionId: string,
      query: {
        /** Item ids, comma delimited. */
        ids: string[];
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/Collections/${collectionId}/Items`,
        method: 'POST',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Collection
     * @name RemoveFromCollection
     * @summary Removes items from a collection.
     * @request DELETE:/Collections/{collectionId}/Items
     * @secure
     */
    removeFromCollection: (
      collectionId: string,
      query: {
        /** Item ids, comma delimited. */
        ids: string[];
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/Collections/${collectionId}/Items`,
        method: 'DELETE',
        query: query,
        secure: true,
        ...params,
      }),
  };
  web = {
    /**
     * No description
     *
     * @tags Dashboard
     * @name GetDashboardConfigurationPage
     * @summary Gets a dashboard configuration page.
     * @request GET:/web/ConfigurationPage
     */
    getDashboardConfigurationPage: (
      query?: {
        /** The name of the page. */
        name?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/web/ConfigurationPage`,
        method: 'GET',
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Dashboard
     * @name GetConfigurationPages
     * @summary Gets the configuration pages.
     * @request GET:/web/ConfigurationPages
     * @secure
     */
    getConfigurationPages: (
      query?: {
        /** Whether to enable in the main menu. */
        enableInMainMenu?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<ConfigurationPageInfo[], void | ProblemDetails>({
        path: `/web/ConfigurationPages`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),
  };
  devices = {
    /**
     * No description
     *
     * @tags Devices
     * @name GetDevices
     * @summary Get Devices.
     * @request GET:/Devices
     * @secure
     */
    getDevices: (
      query?: {
        /**
         * Gets or sets the user identifier.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<DeviceInfoDtoQueryResult, void>({
        path: `/Devices`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Devices
     * @name DeleteDevice
     * @summary Deletes a device.
     * @request DELETE:/Devices
     * @secure
     */
    deleteDevice: (
      query: {
        /** Device Id. */
        id: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void | ProblemDetails>({
        path: `/Devices`,
        method: 'DELETE',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Devices
     * @name GetDeviceInfo
     * @summary Get info for a device.
     * @request GET:/Devices/Info
     * @secure
     */
    getDeviceInfo: (
      query: {
        /** Device Id. */
        id: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<DeviceInfoDto, void | ProblemDetails>({
        path: `/Devices/Info`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Devices
     * @name GetDeviceOptions
     * @summary Get options for a device.
     * @request GET:/Devices/Options
     * @secure
     */
    getDeviceOptions: (
      query: {
        /** Device Id. */
        id: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<DeviceOptionsDto, void | ProblemDetails>({
        path: `/Devices/Options`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Devices
     * @name UpdateDeviceOptions
     * @summary Update device options.
     * @request POST:/Devices/Options
     * @secure
     */
    updateDeviceOptions: (
      query: {
        /** Device Id. */
        id: string;
      },
      data: DeviceOptionsDto,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/Devices/Options`,
        method: 'POST',
        query: query,
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),
  };
  displayPreferences = {
    /**
     * No description
     *
     * @tags DisplayPreferences
     * @name GetDisplayPreferences
     * @summary Get Display Preferences.
     * @request GET:/DisplayPreferences/{displayPreferencesId}
     * @secure
     */
    getDisplayPreferences: (
      displayPreferencesId: string,
      query: {
        /**
         * User id.
         * @format uuid
         */
        userId?: string;
        /** Client. */
        client: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<DisplayPreferencesDto, void>({
        path: `/DisplayPreferences/${displayPreferencesId}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags DisplayPreferences
     * @name UpdateDisplayPreferences
     * @summary Update Display Preferences.
     * @request POST:/DisplayPreferences/{displayPreferencesId}
     * @secure
     */
    updateDisplayPreferences: (
      displayPreferencesId: string,
      query: {
        /**
         * User Id.
         * @format uuid
         */
        userId?: string;
        /** Client. */
        client: string;
      },
      data: DisplayPreferencesDto,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/DisplayPreferences/${displayPreferencesId}`,
        method: 'POST',
        query: query,
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),
  };
  videos = {
    /**
     * No description
     *
     * @tags DynamicHls
     * @name GetHlsVideoSegment
     * @summary Gets a video stream using HTTP live streaming.
     * @request GET:/Videos/{itemId}/hls1/{playlistId}/{segmentId}.{container}
     * @secure
     */
    getHlsVideoSegment: (
      itemId: string,
      playlistId: string,
      segmentId: number,
      container: string,
      query: {
        /**
         * The position of the requested segment in ticks.
         * @format int64
         */
        runtimeTicks: number;
        /**
         * The length of the requested segment in ticks.
         * @format int64
         */
        actualSegmentLengthTicks: number;
        /** Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false. */
        static?: boolean;
        /** The streaming parameters. */
        params?: string;
        /** The tag. */
        tag?: string;
        /**
         * Optional. The dlna device profile id to utilize.
         * @deprecated
         */
        deviceProfileId?: string;
        /** The play session id. */
        playSessionId?: string;
        /**
         * The segment container.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        segmentContainer?: string;
        /**
         * The desired segment length.
         * @format int32
         */
        segmentLength?: number;
        /**
         * The minimum number of segments.
         * @format int32
         */
        minSegments?: number;
        /** The media version id, if playing an alternate version. */
        mediaSourceId?: string;
        /** The device id of the client requesting. Used to stop encoding processes when needed. */
        deviceId?: string;
        /**
         * Optional. Specify an audio codec to encode to, e.g. mp3.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        audioCodec?: string;
        /** Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. */
        enableAutoStreamCopy?: boolean;
        /** Whether or not to allow copying of the video stream url. */
        allowVideoStreamCopy?: boolean;
        /** Whether or not to allow copying of the audio stream url. */
        allowAudioStreamCopy?: boolean;
        /** Optional. Whether to break on non key frames. */
        breakOnNonKeyFrames?: boolean;
        /**
         * Optional. Specify a specific audio sample rate, e.g. 44100.
         * @format int32
         */
        audioSampleRate?: number;
        /**
         * Optional. The maximum audio bit depth.
         * @format int32
         */
        maxAudioBitDepth?: number;
        /**
         * Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        audioBitRate?: number;
        /**
         * Optional. Specify a specific number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        audioChannels?: number;
        /**
         * Optional. Specify a maximum number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        maxAudioChannels?: number;
        /** Optional. Specify a specific an encoder profile (varies by encoder), e.g. main, baseline, high. */
        profile?: string;
        /** Optional. Specify a level for the encoder profile (varies by encoder), e.g. 3, 3.1. */
        level?: string;
        /**
         * Optional. A specific video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        framerate?: number;
        /**
         * Optional. A specific maximum video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        maxFramerate?: number;
        /** Whether or not to copy timestamps when transcoding with an offset. Defaults to false. */
        copyTimestamps?: boolean;
        /**
         * Optional. Specify a starting offset, in ticks. 1 tick = 10000 ms.
         * @format int64
         */
        startTimeTicks?: number;
        /**
         * Optional. The fixed horizontal resolution of the encoded video.
         * @format int32
         */
        width?: number;
        /**
         * Optional. The fixed vertical resolution of the encoded video.
         * @format int32
         */
        height?: number;
        /**
         * Optional. The maximum horizontal resolution of the encoded video.
         * @format int32
         */
        maxWidth?: number;
        /**
         * Optional. The maximum vertical resolution of the encoded video.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        videoBitRate?: number;
        /**
         * Optional. The index of the subtitle stream to use. If omitted no subtitles will be used.
         * @format int32
         */
        subtitleStreamIndex?: number;
        /** Optional. Specify the subtitle delivery method. */
        subtitleMethod?: 'Encode' | 'Embed' | 'External' | 'Hls' | 'Drop';
        /**
         * Optional.
         * @format int32
         */
        maxRefFrames?: number;
        /**
         * Optional. The maximum video bit depth.
         * @format int32
         */
        maxVideoBitDepth?: number;
        /** Optional. Whether to require avc. */
        requireAvc?: boolean;
        /** Optional. Whether to deinterlace the video. */
        deInterlace?: boolean;
        /** Optional. Whether to require a non anamorphic stream. */
        requireNonAnamorphic?: boolean;
        /**
         * Optional. The maximum number of audio channels to transcode.
         * @format int32
         */
        transcodingMaxAudioChannels?: number;
        /**
         * Optional. The limit of how many cpu cores to use.
         * @format int32
         */
        cpuCoreLimit?: number;
        /** The live stream id. */
        liveStreamId?: string;
        /** Optional. Whether to enable the MpegtsM2Ts mode. */
        enableMpegtsM2TsMode?: boolean;
        /**
         * Optional. Specify a video codec to encode to, e.g. h264.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        videoCodec?: string;
        /**
         * Optional. Specify a subtitle codec to encode to.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        subtitleCodec?: string;
        /** Optional. The transcoding reason. */
        transcodeReasons?: string;
        /**
         * Optional. The index of the audio stream to use. If omitted the first audio stream will be used.
         * @format int32
         */
        audioStreamIndex?: number;
        /**
         * Optional. The index of the video stream to use. If omitted the first video stream will be used.
         * @format int32
         */
        videoStreamIndex?: number;
        /** Optional. The MediaBrowser.Model.Dlna.EncodingContext. */
        context?: 'Streaming' | 'Static';
        /** Optional. The streaming options. */
        streamOptions?: Record<string, string | null>;
        /**
         * Optional. Whether to enable Audio Encoding.
         * @default true
         */
        enableAudioVbrEncoding?: boolean;
        /**
         * Whether to always burn in subtitles when transcoding.
         * @default false
         */
        alwaysBurnInSubtitleWhenTranscoding?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, void>({
        path: `/Videos/${itemId}/hls1/${playlistId}/${segmentId}.${container}`,
        method: 'GET',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags DynamicHls
     * @name GetLiveHlsStream
     * @summary Gets a hls live stream.
     * @request GET:/Videos/{itemId}/live.m3u8
     * @secure
     */
    getLiveHlsStream: (
      itemId: string,
      query?: {
        /**
         * The audio container.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        container?: string;
        /** Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false. */
        static?: boolean;
        /** The streaming parameters. */
        params?: string;
        /** The tag. */
        tag?: string;
        /**
         * Optional. The dlna device profile id to utilize.
         * @deprecated
         */
        deviceProfileId?: string;
        /** The play session id. */
        playSessionId?: string;
        /**
         * The segment container.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        segmentContainer?: string;
        /**
         * The segment length.
         * @format int32
         */
        segmentLength?: number;
        /**
         * The minimum number of segments.
         * @format int32
         */
        minSegments?: number;
        /** The media version id, if playing an alternate version. */
        mediaSourceId?: string;
        /** The device id of the client requesting. Used to stop encoding processes when needed. */
        deviceId?: string;
        /**
         * Optional. Specify an audio codec to encode to, e.g. mp3.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        audioCodec?: string;
        /** Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. */
        enableAutoStreamCopy?: boolean;
        /** Whether or not to allow copying of the video stream url. */
        allowVideoStreamCopy?: boolean;
        /** Whether or not to allow copying of the audio stream url. */
        allowAudioStreamCopy?: boolean;
        /** Optional. Whether to break on non key frames. */
        breakOnNonKeyFrames?: boolean;
        /**
         * Optional. Specify a specific audio sample rate, e.g. 44100.
         * @format int32
         */
        audioSampleRate?: number;
        /**
         * Optional. The maximum audio bit depth.
         * @format int32
         */
        maxAudioBitDepth?: number;
        /**
         * Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        audioBitRate?: number;
        /**
         * Optional. Specify a specific number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        audioChannels?: number;
        /**
         * Optional. Specify a maximum number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        maxAudioChannels?: number;
        /** Optional. Specify a specific an encoder profile (varies by encoder), e.g. main, baseline, high. */
        profile?: string;
        /** Optional. Specify a level for the encoder profile (varies by encoder), e.g. 3, 3.1. */
        level?: string;
        /**
         * Optional. A specific video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        framerate?: number;
        /**
         * Optional. A specific maximum video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        maxFramerate?: number;
        /** Whether or not to copy timestamps when transcoding with an offset. Defaults to false. */
        copyTimestamps?: boolean;
        /**
         * Optional. Specify a starting offset, in ticks. 1 tick = 10000 ms.
         * @format int64
         */
        startTimeTicks?: number;
        /**
         * Optional. The fixed horizontal resolution of the encoded video.
         * @format int32
         */
        width?: number;
        /**
         * Optional. The fixed vertical resolution of the encoded video.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        videoBitRate?: number;
        /**
         * Optional. The index of the subtitle stream to use. If omitted no subtitles will be used.
         * @format int32
         */
        subtitleStreamIndex?: number;
        /** Optional. Specify the subtitle delivery method. */
        subtitleMethod?: 'Encode' | 'Embed' | 'External' | 'Hls' | 'Drop';
        /**
         * Optional.
         * @format int32
         */
        maxRefFrames?: number;
        /**
         * Optional. The maximum video bit depth.
         * @format int32
         */
        maxVideoBitDepth?: number;
        /** Optional. Whether to require avc. */
        requireAvc?: boolean;
        /** Optional. Whether to deinterlace the video. */
        deInterlace?: boolean;
        /** Optional. Whether to require a non anamorphic stream. */
        requireNonAnamorphic?: boolean;
        /**
         * Optional. The maximum number of audio channels to transcode.
         * @format int32
         */
        transcodingMaxAudioChannels?: number;
        /**
         * Optional. The limit of how many cpu cores to use.
         * @format int32
         */
        cpuCoreLimit?: number;
        /** The live stream id. */
        liveStreamId?: string;
        /** Optional. Whether to enable the MpegtsM2Ts mode. */
        enableMpegtsM2TsMode?: boolean;
        /**
         * Optional. Specify a video codec to encode to, e.g. h264.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        videoCodec?: string;
        /**
         * Optional. Specify a subtitle codec to encode to.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        subtitleCodec?: string;
        /** Optional. The transcoding reason. */
        transcodeReasons?: string;
        /**
         * Optional. The index of the audio stream to use. If omitted the first audio stream will be used.
         * @format int32
         */
        audioStreamIndex?: number;
        /**
         * Optional. The index of the video stream to use. If omitted the first video stream will be used.
         * @format int32
         */
        videoStreamIndex?: number;
        /** Optional. The MediaBrowser.Model.Dlna.EncodingContext. */
        context?: 'Streaming' | 'Static';
        /** Optional. The streaming options. */
        streamOptions?: Record<string, string | null>;
        /**
         * Optional. The max width.
         * @format int32
         */
        maxWidth?: number;
        /**
         * Optional. The max height.
         * @format int32
         */
        maxHeight?: number;
        /** Optional. Whether to enable subtitles in the manifest. */
        enableSubtitlesInManifest?: boolean;
        /**
         * Optional. Whether to enable Audio Encoding.
         * @default true
         */
        enableAudioVbrEncoding?: boolean;
        /**
         * Whether to always burn in subtitles when transcoding.
         * @default false
         */
        alwaysBurnInSubtitleWhenTranscoding?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, void>({
        path: `/Videos/${itemId}/live.m3u8`,
        method: 'GET',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags DynamicHls
     * @name GetVariantHlsVideoPlaylist
     * @summary Gets a video stream using HTTP live streaming.
     * @request GET:/Videos/{itemId}/main.m3u8
     * @secure
     */
    getVariantHlsVideoPlaylist: (
      itemId: string,
      query?: {
        /** Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false. */
        static?: boolean;
        /** The streaming parameters. */
        params?: string;
        /** The tag. */
        tag?: string;
        /**
         * Optional. The dlna device profile id to utilize.
         * @deprecated
         */
        deviceProfileId?: string;
        /** The play session id. */
        playSessionId?: string;
        /**
         * The segment container.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        segmentContainer?: string;
        /**
         * The segment length.
         * @format int32
         */
        segmentLength?: number;
        /**
         * The minimum number of segments.
         * @format int32
         */
        minSegments?: number;
        /** The media version id, if playing an alternate version. */
        mediaSourceId?: string;
        /** The device id of the client requesting. Used to stop encoding processes when needed. */
        deviceId?: string;
        /**
         * Optional. Specify an audio codec to encode to, e.g. mp3.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        audioCodec?: string;
        /** Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. */
        enableAutoStreamCopy?: boolean;
        /** Whether or not to allow copying of the video stream url. */
        allowVideoStreamCopy?: boolean;
        /** Whether or not to allow copying of the audio stream url. */
        allowAudioStreamCopy?: boolean;
        /** Optional. Whether to break on non key frames. */
        breakOnNonKeyFrames?: boolean;
        /**
         * Optional. Specify a specific audio sample rate, e.g. 44100.
         * @format int32
         */
        audioSampleRate?: number;
        /**
         * Optional. The maximum audio bit depth.
         * @format int32
         */
        maxAudioBitDepth?: number;
        /**
         * Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        audioBitRate?: number;
        /**
         * Optional. Specify a specific number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        audioChannels?: number;
        /**
         * Optional. Specify a maximum number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        maxAudioChannels?: number;
        /** Optional. Specify a specific an encoder profile (varies by encoder), e.g. main, baseline, high. */
        profile?: string;
        /** Optional. Specify a level for the encoder profile (varies by encoder), e.g. 3, 3.1. */
        level?: string;
        /**
         * Optional. A specific video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        framerate?: number;
        /**
         * Optional. A specific maximum video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        maxFramerate?: number;
        /** Whether or not to copy timestamps when transcoding with an offset. Defaults to false. */
        copyTimestamps?: boolean;
        /**
         * Optional. Specify a starting offset, in ticks. 1 tick = 10000 ms.
         * @format int64
         */
        startTimeTicks?: number;
        /**
         * Optional. The fixed horizontal resolution of the encoded video.
         * @format int32
         */
        width?: number;
        /**
         * Optional. The fixed vertical resolution of the encoded video.
         * @format int32
         */
        height?: number;
        /**
         * Optional. The maximum horizontal resolution of the encoded video.
         * @format int32
         */
        maxWidth?: number;
        /**
         * Optional. The maximum vertical resolution of the encoded video.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        videoBitRate?: number;
        /**
         * Optional. The index of the subtitle stream to use. If omitted no subtitles will be used.
         * @format int32
         */
        subtitleStreamIndex?: number;
        /** Optional. Specify the subtitle delivery method. */
        subtitleMethod?: 'Encode' | 'Embed' | 'External' | 'Hls' | 'Drop';
        /**
         * Optional.
         * @format int32
         */
        maxRefFrames?: number;
        /**
         * Optional. The maximum video bit depth.
         * @format int32
         */
        maxVideoBitDepth?: number;
        /** Optional. Whether to require avc. */
        requireAvc?: boolean;
        /** Optional. Whether to deinterlace the video. */
        deInterlace?: boolean;
        /** Optional. Whether to require a non anamorphic stream. */
        requireNonAnamorphic?: boolean;
        /**
         * Optional. The maximum number of audio channels to transcode.
         * @format int32
         */
        transcodingMaxAudioChannels?: number;
        /**
         * Optional. The limit of how many cpu cores to use.
         * @format int32
         */
        cpuCoreLimit?: number;
        /** The live stream id. */
        liveStreamId?: string;
        /** Optional. Whether to enable the MpegtsM2Ts mode. */
        enableMpegtsM2TsMode?: boolean;
        /**
         * Optional. Specify a video codec to encode to, e.g. h264.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        videoCodec?: string;
        /**
         * Optional. Specify a subtitle codec to encode to.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        subtitleCodec?: string;
        /** Optional. The transcoding reason. */
        transcodeReasons?: string;
        /**
         * Optional. The index of the audio stream to use. If omitted the first audio stream will be used.
         * @format int32
         */
        audioStreamIndex?: number;
        /**
         * Optional. The index of the video stream to use. If omitted the first video stream will be used.
         * @format int32
         */
        videoStreamIndex?: number;
        /** Optional. The MediaBrowser.Model.Dlna.EncodingContext. */
        context?: 'Streaming' | 'Static';
        /** Optional. The streaming options. */
        streamOptions?: Record<string, string | null>;
        /**
         * Optional. Whether to enable Audio Encoding.
         * @default true
         */
        enableAudioVbrEncoding?: boolean;
        /**
         * Whether to always burn in subtitles when transcoding.
         * @default false
         */
        alwaysBurnInSubtitleWhenTranscoding?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, void>({
        path: `/Videos/${itemId}/main.m3u8`,
        method: 'GET',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags DynamicHls
     * @name GetMasterHlsVideoPlaylist
     * @summary Gets a video hls playlist stream.
     * @request GET:/Videos/{itemId}/master.m3u8
     * @secure
     */
    getMasterHlsVideoPlaylist: (
      itemId: string,
      query: {
        /** Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false. */
        static?: boolean;
        /** The streaming parameters. */
        params?: string;
        /** The tag. */
        tag?: string;
        /**
         * Optional. The dlna device profile id to utilize.
         * @deprecated
         */
        deviceProfileId?: string;
        /** The play session id. */
        playSessionId?: string;
        /**
         * The segment container.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        segmentContainer?: string;
        /**
         * The segment length.
         * @format int32
         */
        segmentLength?: number;
        /**
         * The minimum number of segments.
         * @format int32
         */
        minSegments?: number;
        /** The media version id, if playing an alternate version. */
        mediaSourceId: string;
        /** The device id of the client requesting. Used to stop encoding processes when needed. */
        deviceId?: string;
        /**
         * Optional. Specify an audio codec to encode to, e.g. mp3.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        audioCodec?: string;
        /** Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. */
        enableAutoStreamCopy?: boolean;
        /** Whether or not to allow copying of the video stream url. */
        allowVideoStreamCopy?: boolean;
        /** Whether or not to allow copying of the audio stream url. */
        allowAudioStreamCopy?: boolean;
        /** Optional. Whether to break on non key frames. */
        breakOnNonKeyFrames?: boolean;
        /**
         * Optional. Specify a specific audio sample rate, e.g. 44100.
         * @format int32
         */
        audioSampleRate?: number;
        /**
         * Optional. The maximum audio bit depth.
         * @format int32
         */
        maxAudioBitDepth?: number;
        /**
         * Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        audioBitRate?: number;
        /**
         * Optional. Specify a specific number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        audioChannels?: number;
        /**
         * Optional. Specify a maximum number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        maxAudioChannels?: number;
        /** Optional. Specify a specific an encoder profile (varies by encoder), e.g. main, baseline, high. */
        profile?: string;
        /** Optional. Specify a level for the encoder profile (varies by encoder), e.g. 3, 3.1. */
        level?: string;
        /**
         * Optional. A specific video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        framerate?: number;
        /**
         * Optional. A specific maximum video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        maxFramerate?: number;
        /** Whether or not to copy timestamps when transcoding with an offset. Defaults to false. */
        copyTimestamps?: boolean;
        /**
         * Optional. Specify a starting offset, in ticks. 1 tick = 10000 ms.
         * @format int64
         */
        startTimeTicks?: number;
        /**
         * Optional. The fixed horizontal resolution of the encoded video.
         * @format int32
         */
        width?: number;
        /**
         * Optional. The fixed vertical resolution of the encoded video.
         * @format int32
         */
        height?: number;
        /**
         * Optional. The maximum horizontal resolution of the encoded video.
         * @format int32
         */
        maxWidth?: number;
        /**
         * Optional. The maximum vertical resolution of the encoded video.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        videoBitRate?: number;
        /**
         * Optional. The index of the subtitle stream to use. If omitted no subtitles will be used.
         * @format int32
         */
        subtitleStreamIndex?: number;
        /** Optional. Specify the subtitle delivery method. */
        subtitleMethod?: 'Encode' | 'Embed' | 'External' | 'Hls' | 'Drop';
        /**
         * Optional.
         * @format int32
         */
        maxRefFrames?: number;
        /**
         * Optional. The maximum video bit depth.
         * @format int32
         */
        maxVideoBitDepth?: number;
        /** Optional. Whether to require avc. */
        requireAvc?: boolean;
        /** Optional. Whether to deinterlace the video. */
        deInterlace?: boolean;
        /** Optional. Whether to require a non anamorphic stream. */
        requireNonAnamorphic?: boolean;
        /**
         * Optional. The maximum number of audio channels to transcode.
         * @format int32
         */
        transcodingMaxAudioChannels?: number;
        /**
         * Optional. The limit of how many cpu cores to use.
         * @format int32
         */
        cpuCoreLimit?: number;
        /** The live stream id. */
        liveStreamId?: string;
        /** Optional. Whether to enable the MpegtsM2Ts mode. */
        enableMpegtsM2TsMode?: boolean;
        /**
         * Optional. Specify a video codec to encode to, e.g. h264.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        videoCodec?: string;
        /**
         * Optional. Specify a subtitle codec to encode to.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        subtitleCodec?: string;
        /** Optional. The transcoding reason. */
        transcodeReasons?: string;
        /**
         * Optional. The index of the audio stream to use. If omitted the first audio stream will be used.
         * @format int32
         */
        audioStreamIndex?: number;
        /**
         * Optional. The index of the video stream to use. If omitted the first video stream will be used.
         * @format int32
         */
        videoStreamIndex?: number;
        /** Optional. The MediaBrowser.Model.Dlna.EncodingContext. */
        context?: 'Streaming' | 'Static';
        /** Optional. The streaming options. */
        streamOptions?: Record<string, string | null>;
        /**
         * Enable adaptive bitrate streaming.
         * @default true
         */
        enableAdaptiveBitrateStreaming?: boolean;
        /**
         * Enable trickplay image playlists being added to master playlist.
         * @default true
         */
        enableTrickplay?: boolean;
        /**
         * Whether to enable Audio Encoding.
         * @default true
         */
        enableAudioVbrEncoding?: boolean;
        /**
         * Whether to always burn in subtitles when transcoding.
         * @default false
         */
        alwaysBurnInSubtitleWhenTranscoding?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, void>({
        path: `/Videos/${itemId}/master.m3u8`,
        method: 'GET',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags DynamicHls
     * @name HeadMasterHlsVideoPlaylist
     * @summary Gets a video hls playlist stream.
     * @request HEAD:/Videos/{itemId}/master.m3u8
     * @secure
     */
    headMasterHlsVideoPlaylist: (
      itemId: string,
      query: {
        /** Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false. */
        static?: boolean;
        /** The streaming parameters. */
        params?: string;
        /** The tag. */
        tag?: string;
        /**
         * Optional. The dlna device profile id to utilize.
         * @deprecated
         */
        deviceProfileId?: string;
        /** The play session id. */
        playSessionId?: string;
        /**
         * The segment container.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        segmentContainer?: string;
        /**
         * The segment length.
         * @format int32
         */
        segmentLength?: number;
        /**
         * The minimum number of segments.
         * @format int32
         */
        minSegments?: number;
        /** The media version id, if playing an alternate version. */
        mediaSourceId: string;
        /** The device id of the client requesting. Used to stop encoding processes when needed. */
        deviceId?: string;
        /**
         * Optional. Specify an audio codec to encode to, e.g. mp3.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        audioCodec?: string;
        /** Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. */
        enableAutoStreamCopy?: boolean;
        /** Whether or not to allow copying of the video stream url. */
        allowVideoStreamCopy?: boolean;
        /** Whether or not to allow copying of the audio stream url. */
        allowAudioStreamCopy?: boolean;
        /** Optional. Whether to break on non key frames. */
        breakOnNonKeyFrames?: boolean;
        /**
         * Optional. Specify a specific audio sample rate, e.g. 44100.
         * @format int32
         */
        audioSampleRate?: number;
        /**
         * Optional. The maximum audio bit depth.
         * @format int32
         */
        maxAudioBitDepth?: number;
        /**
         * Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        audioBitRate?: number;
        /**
         * Optional. Specify a specific number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        audioChannels?: number;
        /**
         * Optional. Specify a maximum number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        maxAudioChannels?: number;
        /** Optional. Specify a specific an encoder profile (varies by encoder), e.g. main, baseline, high. */
        profile?: string;
        /** Optional. Specify a level for the encoder profile (varies by encoder), e.g. 3, 3.1. */
        level?: string;
        /**
         * Optional. A specific video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        framerate?: number;
        /**
         * Optional. A specific maximum video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        maxFramerate?: number;
        /** Whether or not to copy timestamps when transcoding with an offset. Defaults to false. */
        copyTimestamps?: boolean;
        /**
         * Optional. Specify a starting offset, in ticks. 1 tick = 10000 ms.
         * @format int64
         */
        startTimeTicks?: number;
        /**
         * Optional. The fixed horizontal resolution of the encoded video.
         * @format int32
         */
        width?: number;
        /**
         * Optional. The fixed vertical resolution of the encoded video.
         * @format int32
         */
        height?: number;
        /**
         * Optional. The maximum horizontal resolution of the encoded video.
         * @format int32
         */
        maxWidth?: number;
        /**
         * Optional. The maximum vertical resolution of the encoded video.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        videoBitRate?: number;
        /**
         * Optional. The index of the subtitle stream to use. If omitted no subtitles will be used.
         * @format int32
         */
        subtitleStreamIndex?: number;
        /** Optional. Specify the subtitle delivery method. */
        subtitleMethod?: 'Encode' | 'Embed' | 'External' | 'Hls' | 'Drop';
        /**
         * Optional.
         * @format int32
         */
        maxRefFrames?: number;
        /**
         * Optional. The maximum video bit depth.
         * @format int32
         */
        maxVideoBitDepth?: number;
        /** Optional. Whether to require avc. */
        requireAvc?: boolean;
        /** Optional. Whether to deinterlace the video. */
        deInterlace?: boolean;
        /** Optional. Whether to require a non anamorphic stream. */
        requireNonAnamorphic?: boolean;
        /**
         * Optional. The maximum number of audio channels to transcode.
         * @format int32
         */
        transcodingMaxAudioChannels?: number;
        /**
         * Optional. The limit of how many cpu cores to use.
         * @format int32
         */
        cpuCoreLimit?: number;
        /** The live stream id. */
        liveStreamId?: string;
        /** Optional. Whether to enable the MpegtsM2Ts mode. */
        enableMpegtsM2TsMode?: boolean;
        /**
         * Optional. Specify a video codec to encode to, e.g. h264.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        videoCodec?: string;
        /**
         * Optional. Specify a subtitle codec to encode to.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        subtitleCodec?: string;
        /** Optional. The transcoding reason. */
        transcodeReasons?: string;
        /**
         * Optional. The index of the audio stream to use. If omitted the first audio stream will be used.
         * @format int32
         */
        audioStreamIndex?: number;
        /**
         * Optional. The index of the video stream to use. If omitted the first video stream will be used.
         * @format int32
         */
        videoStreamIndex?: number;
        /** Optional. The MediaBrowser.Model.Dlna.EncodingContext. */
        context?: 'Streaming' | 'Static';
        /** Optional. The streaming options. */
        streamOptions?: Record<string, string | null>;
        /**
         * Enable adaptive bitrate streaming.
         * @default true
         */
        enableAdaptiveBitrateStreaming?: boolean;
        /**
         * Enable trickplay image playlists being added to master playlist.
         * @default true
         */
        enableTrickplay?: boolean;
        /**
         * Whether to enable Audio Encoding.
         * @default true
         */
        enableAudioVbrEncoding?: boolean;
        /**
         * Whether to always burn in subtitles when transcoding.
         * @default false
         */
        alwaysBurnInSubtitleWhenTranscoding?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, void>({
        path: `/Videos/${itemId}/master.m3u8`,
        method: 'HEAD',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags HlsSegment
     * @name GetHlsVideoSegmentLegacy
     * @summary Gets a hls video segment.
     * @request GET:/Videos/{itemId}/hls/{playlistId}/{segmentId}.{segmentContainer}
     */
    getHlsVideoSegmentLegacy: (
      itemId: string,
      playlistId: string,
      segmentId: string,
      segmentContainer: string,
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/Videos/${itemId}/hls/${playlistId}/${segmentId}.${segmentContainer}`,
        method: 'GET',
        ...params,
      }),

    /**
     * No description
     *
     * @tags HlsSegment
     * @name GetHlsPlaylistLegacy
     * @summary Gets a hls video playlist.
     * @request GET:/Videos/{itemId}/hls/{playlistId}/stream.m3u8
     * @secure
     */
    getHlsPlaylistLegacy: (itemId: string, playlistId: string, params: RequestParams = {}) =>
      this.request<File, void>({
        path: `/Videos/${itemId}/hls/${playlistId}/stream.m3u8`,
        method: 'GET',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags HlsSegment
     * @name StopEncodingProcess
     * @summary Stops an active encoding.
     * @request DELETE:/Videos/ActiveEncodings
     * @secure
     */
    stopEncodingProcess: (
      query: {
        /** The device id of the client requesting. Used to stop encoding processes when needed. */
        deviceId: string;
        /** The play session id. */
        playSessionId: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/Videos/ActiveEncodings`,
        method: 'DELETE',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Subtitle
     * @name GetSubtitlePlaylist
     * @summary Gets an HLS subtitle playlist.
     * @request GET:/Videos/{itemId}/{mediaSourceId}/Subtitles/{index}/subtitles.m3u8
     * @secure
     */
    getSubtitlePlaylist: (
      itemId: string,
      index: number,
      mediaSourceId: string,
      query: {
        /**
         * The subtitle segment length.
         * @format int32
         */
        segmentLength: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, void | ProblemDetails>({
        path: `/Videos/${itemId}/${mediaSourceId}/Subtitles/${index}/subtitles.m3u8`,
        method: 'GET',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Subtitle
     * @name UploadSubtitle
     * @summary Upload an external subtitle file.
     * @request POST:/Videos/{itemId}/Subtitles
     * @secure
     */
    uploadSubtitle: (itemId: string, data: UploadSubtitleDto, params: RequestParams = {}) =>
      this.request<void, void | ProblemDetails>({
        path: `/Videos/${itemId}/Subtitles`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Subtitle
     * @name DeleteSubtitle
     * @summary Deletes an external subtitle file.
     * @request DELETE:/Videos/{itemId}/Subtitles/{index}
     * @secure
     */
    deleteSubtitle: (itemId: string, index: number, params: RequestParams = {}) =>
      this.request<void, void | ProblemDetails>({
        path: `/Videos/${itemId}/Subtitles/${index}`,
        method: 'DELETE',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Subtitle
     * @name GetSubtitleWithTicks
     * @summary Gets subtitles in a specified format.
     * @request GET:/Videos/{routeItemId}/{routeMediaSourceId}/Subtitles/{routeIndex}/{routeStartPositionTicks}/Stream.{routeFormat}
     */
    getSubtitleWithTicks: (
      routeItemId: string,
      routeMediaSourceId: string,
      routeIndex: number,
      routeStartPositionTicks: number,
      routeFormat: string,
      query?: {
        /**
         * The item id.
         * @deprecated
         * @format uuid
         */
        itemId?: string;
        /**
         * The media source id.
         * @deprecated
         */
        mediaSourceId?: string;
        /**
         * The subtitle stream index.
         * @deprecated
         * @format int32
         */
        index?: number;
        /**
         * The start position of the subtitle in ticks.
         * @deprecated
         * @format int64
         */
        startPositionTicks?: number;
        /**
         * The format of the returned subtitle.
         * @deprecated
         */
        format?: string;
        /**
         * Optional. The end position of the subtitle in ticks.
         * @format int64
         */
        endPositionTicks?: number;
        /**
         * Optional. Whether to copy the timestamps.
         * @default false
         */
        copyTimestamps?: boolean;
        /**
         * Optional. Whether to add a VTT time map.
         * @default false
         */
        addVttTimeMap?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, any>({
        path: `/Videos/${routeItemId}/${routeMediaSourceId}/Subtitles/${routeIndex}/${routeStartPositionTicks}/Stream.${routeFormat}`,
        method: 'GET',
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Subtitle
     * @name GetSubtitle
     * @summary Gets subtitles in a specified format.
     * @request GET:/Videos/{routeItemId}/{routeMediaSourceId}/Subtitles/{routeIndex}/Stream.{routeFormat}
     */
    getSubtitle: (
      routeItemId: string,
      routeMediaSourceId: string,
      routeIndex: number,
      routeFormat: string,
      query?: {
        /**
         * The item id.
         * @deprecated
         * @format uuid
         */
        itemId?: string;
        /**
         * The media source id.
         * @deprecated
         */
        mediaSourceId?: string;
        /**
         * The subtitle stream index.
         * @deprecated
         * @format int32
         */
        index?: number;
        /**
         * The format of the returned subtitle.
         * @deprecated
         */
        format?: string;
        /**
         * Optional. The end position of the subtitle in ticks.
         * @format int64
         */
        endPositionTicks?: number;
        /**
         * Optional. Whether to copy the timestamps.
         * @default false
         */
        copyTimestamps?: boolean;
        /**
         * Optional. Whether to add a VTT time map.
         * @default false
         */
        addVttTimeMap?: boolean;
        /**
         * The start position of the subtitle in ticks.
         * @format int64
         * @default 0
         */
        startPositionTicks?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, any>({
        path: `/Videos/${routeItemId}/${routeMediaSourceId}/Subtitles/${routeIndex}/Stream.${routeFormat}`,
        method: 'GET',
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Trickplay
     * @name GetTrickplayTileImage
     * @summary Gets a trickplay tile image.
     * @request GET:/Videos/{itemId}/Trickplay/{width}/{index}.jpg
     * @secure
     */
    getTrickplayTileImage: (
      itemId: string,
      width: number,
      index: number,
      query?: {
        /**
         * The media version id, if using an alternate version.
         * @format uuid
         */
        mediaSourceId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, void | ProblemDetails>({
        path: `/Videos/${itemId}/Trickplay/${width}/${index}.jpg`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'blob',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Trickplay
     * @name GetTrickplayHlsPlaylist
     * @summary Gets an image tiles playlist for trickplay.
     * @request GET:/Videos/{itemId}/Trickplay/{width}/tiles.m3u8
     * @secure
     */
    getTrickplayHlsPlaylist: (
      itemId: string,
      width: number,
      query?: {
        /**
         * The media version id, if using an alternate version.
         * @format uuid
         */
        mediaSourceId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, void | ProblemDetails>({
        path: `/Videos/${itemId}/Trickplay/${width}/tiles.m3u8`,
        method: 'GET',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags VideoAttachments
     * @name GetAttachment
     * @summary Get video attachment.
     * @request GET:/Videos/{videoId}/{mediaSourceId}/Attachments/{index}
     */
    getAttachment: (videoId: string, mediaSourceId: string, index: number, params: RequestParams = {}) =>
      this.request<File, ProblemDetails>({
        path: `/Videos/${videoId}/${mediaSourceId}/Attachments/${index}`,
        method: 'GET',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Videos
     * @name GetAdditionalPart
     * @summary Gets additional parts for a video.
     * @request GET:/Videos/{itemId}/AdditionalParts
     * @secure
     */
    getAdditionalPart: (
      itemId: string,
      query?: {
        /**
         * Optional. Filter by user id, and attach user data.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/Videos/${itemId}/AdditionalParts`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Videos
     * @name DeleteAlternateSources
     * @summary Removes alternate video sources.
     * @request DELETE:/Videos/{itemId}/AlternateSources
     * @secure
     */
    deleteAlternateSources: (itemId: string, params: RequestParams = {}) =>
      this.request<void, void | ProblemDetails>({
        path: `/Videos/${itemId}/AlternateSources`,
        method: 'DELETE',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Videos
     * @name GetVideoStream
     * @summary Gets a video stream.
     * @request GET:/Videos/{itemId}/stream
     */
    getVideoStream: (
      itemId: string,
      query?: {
        /**
         * The video container. Possible values are: ts, webm, asf, wmv, ogv, mp4, m4v, mkv, mpeg, mpg, avi, 3gp, wmv, wtv, m2ts, mov, iso, flv.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        container?: string;
        /** Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false. */
        static?: boolean;
        /** The streaming parameters. */
        params?: string;
        /** The tag. */
        tag?: string;
        /**
         * Optional. The dlna device profile id to utilize.
         * @deprecated
         */
        deviceProfileId?: string;
        /** The play session id. */
        playSessionId?: string;
        /**
         * The segment container.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        segmentContainer?: string;
        /**
         * The segment length.
         * @format int32
         */
        segmentLength?: number;
        /**
         * The minimum number of segments.
         * @format int32
         */
        minSegments?: number;
        /** The media version id, if playing an alternate version. */
        mediaSourceId?: string;
        /** The device id of the client requesting. Used to stop encoding processes when needed. */
        deviceId?: string;
        /**
         * Optional. Specify an audio codec to encode to, e.g. mp3. If omitted the server will auto-select using the url's extension.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        audioCodec?: string;
        /** Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. */
        enableAutoStreamCopy?: boolean;
        /** Whether or not to allow copying of the video stream url. */
        allowVideoStreamCopy?: boolean;
        /** Whether or not to allow copying of the audio stream url. */
        allowAudioStreamCopy?: boolean;
        /** Optional. Whether to break on non key frames. */
        breakOnNonKeyFrames?: boolean;
        /**
         * Optional. Specify a specific audio sample rate, e.g. 44100.
         * @format int32
         */
        audioSampleRate?: number;
        /**
         * Optional. The maximum audio bit depth.
         * @format int32
         */
        maxAudioBitDepth?: number;
        /**
         * Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        audioBitRate?: number;
        /**
         * Optional. Specify a specific number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        audioChannels?: number;
        /**
         * Optional. Specify a maximum number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        maxAudioChannels?: number;
        /** Optional. Specify a specific an encoder profile (varies by encoder), e.g. main, baseline, high. */
        profile?: string;
        /** Optional. Specify a level for the encoder profile (varies by encoder), e.g. 3, 3.1. */
        level?: string;
        /**
         * Optional. A specific video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        framerate?: number;
        /**
         * Optional. A specific maximum video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        maxFramerate?: number;
        /** Whether or not to copy timestamps when transcoding with an offset. Defaults to false. */
        copyTimestamps?: boolean;
        /**
         * Optional. Specify a starting offset, in ticks. 1 tick = 10000 ms.
         * @format int64
         */
        startTimeTicks?: number;
        /**
         * Optional. The fixed horizontal resolution of the encoded video.
         * @format int32
         */
        width?: number;
        /**
         * Optional. The fixed vertical resolution of the encoded video.
         * @format int32
         */
        height?: number;
        /**
         * Optional. The maximum horizontal resolution of the encoded video.
         * @format int32
         */
        maxWidth?: number;
        /**
         * Optional. The maximum vertical resolution of the encoded video.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        videoBitRate?: number;
        /**
         * Optional. The index of the subtitle stream to use. If omitted no subtitles will be used.
         * @format int32
         */
        subtitleStreamIndex?: number;
        /** Optional. Specify the subtitle delivery method. */
        subtitleMethod?: 'Encode' | 'Embed' | 'External' | 'Hls' | 'Drop';
        /**
         * Optional.
         * @format int32
         */
        maxRefFrames?: number;
        /**
         * Optional. The maximum video bit depth.
         * @format int32
         */
        maxVideoBitDepth?: number;
        /** Optional. Whether to require avc. */
        requireAvc?: boolean;
        /** Optional. Whether to deinterlace the video. */
        deInterlace?: boolean;
        /** Optional. Whether to require a non anamorphic stream. */
        requireNonAnamorphic?: boolean;
        /**
         * Optional. The maximum number of audio channels to transcode.
         * @format int32
         */
        transcodingMaxAudioChannels?: number;
        /**
         * Optional. The limit of how many cpu cores to use.
         * @format int32
         */
        cpuCoreLimit?: number;
        /** The live stream id. */
        liveStreamId?: string;
        /** Optional. Whether to enable the MpegtsM2Ts mode. */
        enableMpegtsM2TsMode?: boolean;
        /**
         * Optional. Specify a video codec to encode to, e.g. h264. If omitted the server will auto-select using the url's extension.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        videoCodec?: string;
        /**
         * Optional. Specify a subtitle codec to encode to.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        subtitleCodec?: string;
        /** Optional. The transcoding reason. */
        transcodeReasons?: string;
        /**
         * Optional. The index of the audio stream to use. If omitted the first audio stream will be used.
         * @format int32
         */
        audioStreamIndex?: number;
        /**
         * Optional. The index of the video stream to use. If omitted the first video stream will be used.
         * @format int32
         */
        videoStreamIndex?: number;
        /** Optional. The MediaBrowser.Model.Dlna.EncodingContext. */
        context?: 'Streaming' | 'Static';
        /** Optional. The streaming options. */
        streamOptions?: Record<string, string | null>;
        /**
         * Optional. Whether to enable Audio Encoding.
         * @default true
         */
        enableAudioVbrEncoding?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, any>({
        path: `/Videos/${itemId}/stream`,
        method: 'GET',
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Videos
     * @name HeadVideoStream
     * @summary Gets a video stream.
     * @request HEAD:/Videos/{itemId}/stream
     */
    headVideoStream: (
      itemId: string,
      query?: {
        /**
         * The video container. Possible values are: ts, webm, asf, wmv, ogv, mp4, m4v, mkv, mpeg, mpg, avi, 3gp, wmv, wtv, m2ts, mov, iso, flv.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        container?: string;
        /** Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false. */
        static?: boolean;
        /** The streaming parameters. */
        params?: string;
        /** The tag. */
        tag?: string;
        /**
         * Optional. The dlna device profile id to utilize.
         * @deprecated
         */
        deviceProfileId?: string;
        /** The play session id. */
        playSessionId?: string;
        /**
         * The segment container.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        segmentContainer?: string;
        /**
         * The segment length.
         * @format int32
         */
        segmentLength?: number;
        /**
         * The minimum number of segments.
         * @format int32
         */
        minSegments?: number;
        /** The media version id, if playing an alternate version. */
        mediaSourceId?: string;
        /** The device id of the client requesting. Used to stop encoding processes when needed. */
        deviceId?: string;
        /**
         * Optional. Specify an audio codec to encode to, e.g. mp3. If omitted the server will auto-select using the url's extension.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        audioCodec?: string;
        /** Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. */
        enableAutoStreamCopy?: boolean;
        /** Whether or not to allow copying of the video stream url. */
        allowVideoStreamCopy?: boolean;
        /** Whether or not to allow copying of the audio stream url. */
        allowAudioStreamCopy?: boolean;
        /** Optional. Whether to break on non key frames. */
        breakOnNonKeyFrames?: boolean;
        /**
         * Optional. Specify a specific audio sample rate, e.g. 44100.
         * @format int32
         */
        audioSampleRate?: number;
        /**
         * Optional. The maximum audio bit depth.
         * @format int32
         */
        maxAudioBitDepth?: number;
        /**
         * Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        audioBitRate?: number;
        /**
         * Optional. Specify a specific number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        audioChannels?: number;
        /**
         * Optional. Specify a maximum number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        maxAudioChannels?: number;
        /** Optional. Specify a specific an encoder profile (varies by encoder), e.g. main, baseline, high. */
        profile?: string;
        /** Optional. Specify a level for the encoder profile (varies by encoder), e.g. 3, 3.1. */
        level?: string;
        /**
         * Optional. A specific video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        framerate?: number;
        /**
         * Optional. A specific maximum video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        maxFramerate?: number;
        /** Whether or not to copy timestamps when transcoding with an offset. Defaults to false. */
        copyTimestamps?: boolean;
        /**
         * Optional. Specify a starting offset, in ticks. 1 tick = 10000 ms.
         * @format int64
         */
        startTimeTicks?: number;
        /**
         * Optional. The fixed horizontal resolution of the encoded video.
         * @format int32
         */
        width?: number;
        /**
         * Optional. The fixed vertical resolution of the encoded video.
         * @format int32
         */
        height?: number;
        /**
         * Optional. The maximum horizontal resolution of the encoded video.
         * @format int32
         */
        maxWidth?: number;
        /**
         * Optional. The maximum vertical resolution of the encoded video.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        videoBitRate?: number;
        /**
         * Optional. The index of the subtitle stream to use. If omitted no subtitles will be used.
         * @format int32
         */
        subtitleStreamIndex?: number;
        /** Optional. Specify the subtitle delivery method. */
        subtitleMethod?: 'Encode' | 'Embed' | 'External' | 'Hls' | 'Drop';
        /**
         * Optional.
         * @format int32
         */
        maxRefFrames?: number;
        /**
         * Optional. The maximum video bit depth.
         * @format int32
         */
        maxVideoBitDepth?: number;
        /** Optional. Whether to require avc. */
        requireAvc?: boolean;
        /** Optional. Whether to deinterlace the video. */
        deInterlace?: boolean;
        /** Optional. Whether to require a non anamorphic stream. */
        requireNonAnamorphic?: boolean;
        /**
         * Optional. The maximum number of audio channels to transcode.
         * @format int32
         */
        transcodingMaxAudioChannels?: number;
        /**
         * Optional. The limit of how many cpu cores to use.
         * @format int32
         */
        cpuCoreLimit?: number;
        /** The live stream id. */
        liveStreamId?: string;
        /** Optional. Whether to enable the MpegtsM2Ts mode. */
        enableMpegtsM2TsMode?: boolean;
        /**
         * Optional. Specify a video codec to encode to, e.g. h264. If omitted the server will auto-select using the url's extension.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        videoCodec?: string;
        /**
         * Optional. Specify a subtitle codec to encode to.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        subtitleCodec?: string;
        /** Optional. The transcoding reason. */
        transcodeReasons?: string;
        /**
         * Optional. The index of the audio stream to use. If omitted the first audio stream will be used.
         * @format int32
         */
        audioStreamIndex?: number;
        /**
         * Optional. The index of the video stream to use. If omitted the first video stream will be used.
         * @format int32
         */
        videoStreamIndex?: number;
        /** Optional. The MediaBrowser.Model.Dlna.EncodingContext. */
        context?: 'Streaming' | 'Static';
        /** Optional. The streaming options. */
        streamOptions?: Record<string, string | null>;
        /**
         * Optional. Whether to enable Audio Encoding.
         * @default true
         */
        enableAudioVbrEncoding?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, any>({
        path: `/Videos/${itemId}/stream`,
        method: 'HEAD',
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Videos
     * @name GetVideoStreamByContainer
     * @summary Gets a video stream.
     * @request GET:/Videos/{itemId}/stream.{container}
     */
    getVideoStreamByContainer: (
      itemId: string,
      container: string,
      query?: {
        /** Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false. */
        static?: boolean;
        /** The streaming parameters. */
        params?: string;
        /** The tag. */
        tag?: string;
        /** Optional. The dlna device profile id to utilize. */
        deviceProfileId?: string;
        /** The play session id. */
        playSessionId?: string;
        /**
         * The segment container.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        segmentContainer?: string;
        /**
         * The segment length.
         * @format int32
         */
        segmentLength?: number;
        /**
         * The minimum number of segments.
         * @format int32
         */
        minSegments?: number;
        /** The media version id, if playing an alternate version. */
        mediaSourceId?: string;
        /** The device id of the client requesting. Used to stop encoding processes when needed. */
        deviceId?: string;
        /**
         * Optional. Specify an audio codec to encode to, e.g. mp3. If omitted the server will auto-select using the url's extension.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        audioCodec?: string;
        /** Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. */
        enableAutoStreamCopy?: boolean;
        /** Whether or not to allow copying of the video stream url. */
        allowVideoStreamCopy?: boolean;
        /** Whether or not to allow copying of the audio stream url. */
        allowAudioStreamCopy?: boolean;
        /** Optional. Whether to break on non key frames. */
        breakOnNonKeyFrames?: boolean;
        /**
         * Optional. Specify a specific audio sample rate, e.g. 44100.
         * @format int32
         */
        audioSampleRate?: number;
        /**
         * Optional. The maximum audio bit depth.
         * @format int32
         */
        maxAudioBitDepth?: number;
        /**
         * Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        audioBitRate?: number;
        /**
         * Optional. Specify a specific number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        audioChannels?: number;
        /**
         * Optional. Specify a maximum number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        maxAudioChannels?: number;
        /** Optional. Specify a specific an encoder profile (varies by encoder), e.g. main, baseline, high. */
        profile?: string;
        /** Optional. Specify a level for the encoder profile (varies by encoder), e.g. 3, 3.1. */
        level?: string;
        /**
         * Optional. A specific video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        framerate?: number;
        /**
         * Optional. A specific maximum video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        maxFramerate?: number;
        /** Whether or not to copy timestamps when transcoding with an offset. Defaults to false. */
        copyTimestamps?: boolean;
        /**
         * Optional. Specify a starting offset, in ticks. 1 tick = 10000 ms.
         * @format int64
         */
        startTimeTicks?: number;
        /**
         * Optional. The fixed horizontal resolution of the encoded video.
         * @format int32
         */
        width?: number;
        /**
         * Optional. The fixed vertical resolution of the encoded video.
         * @format int32
         */
        height?: number;
        /**
         * Optional. The maximum horizontal resolution of the encoded video.
         * @format int32
         */
        maxWidth?: number;
        /**
         * Optional. The maximum vertical resolution of the encoded video.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        videoBitRate?: number;
        /**
         * Optional. The index of the subtitle stream to use. If omitted no subtitles will be used.
         * @format int32
         */
        subtitleStreamIndex?: number;
        /** Optional. Specify the subtitle delivery method. */
        subtitleMethod?: 'Encode' | 'Embed' | 'External' | 'Hls' | 'Drop';
        /**
         * Optional.
         * @format int32
         */
        maxRefFrames?: number;
        /**
         * Optional. The maximum video bit depth.
         * @format int32
         */
        maxVideoBitDepth?: number;
        /** Optional. Whether to require avc. */
        requireAvc?: boolean;
        /** Optional. Whether to deinterlace the video. */
        deInterlace?: boolean;
        /** Optional. Whether to require a non anamorphic stream. */
        requireNonAnamorphic?: boolean;
        /**
         * Optional. The maximum number of audio channels to transcode.
         * @format int32
         */
        transcodingMaxAudioChannels?: number;
        /**
         * Optional. The limit of how many cpu cores to use.
         * @format int32
         */
        cpuCoreLimit?: number;
        /** The live stream id. */
        liveStreamId?: string;
        /** Optional. Whether to enable the MpegtsM2Ts mode. */
        enableMpegtsM2TsMode?: boolean;
        /**
         * Optional. Specify a video codec to encode to, e.g. h264. If omitted the server will auto-select using the url's extension.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        videoCodec?: string;
        /**
         * Optional. Specify a subtitle codec to encode to.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        subtitleCodec?: string;
        /** Optional. The transcoding reason. */
        transcodeReasons?: string;
        /**
         * Optional. The index of the audio stream to use. If omitted the first audio stream will be used.
         * @format int32
         */
        audioStreamIndex?: number;
        /**
         * Optional. The index of the video stream to use. If omitted the first video stream will be used.
         * @format int32
         */
        videoStreamIndex?: number;
        /** Optional. The MediaBrowser.Model.Dlna.EncodingContext. */
        context?: 'Streaming' | 'Static';
        /** Optional. The streaming options. */
        streamOptions?: Record<string, string | null>;
        /**
         * Optional. Whether to enable Audio Encoding.
         * @default true
         */
        enableAudioVbrEncoding?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, any>({
        path: `/Videos/${itemId}/stream.${container}`,
        method: 'GET',
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Videos
     * @name HeadVideoStreamByContainer
     * @summary Gets a video stream.
     * @request HEAD:/Videos/{itemId}/stream.{container}
     */
    headVideoStreamByContainer: (
      itemId: string,
      container: string,
      query?: {
        /** Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false. */
        static?: boolean;
        /** The streaming parameters. */
        params?: string;
        /** The tag. */
        tag?: string;
        /** Optional. The dlna device profile id to utilize. */
        deviceProfileId?: string;
        /** The play session id. */
        playSessionId?: string;
        /**
         * The segment container.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        segmentContainer?: string;
        /**
         * The segment length.
         * @format int32
         */
        segmentLength?: number;
        /**
         * The minimum number of segments.
         * @format int32
         */
        minSegments?: number;
        /** The media version id, if playing an alternate version. */
        mediaSourceId?: string;
        /** The device id of the client requesting. Used to stop encoding processes when needed. */
        deviceId?: string;
        /**
         * Optional. Specify an audio codec to encode to, e.g. mp3. If omitted the server will auto-select using the url's extension.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        audioCodec?: string;
        /** Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. */
        enableAutoStreamCopy?: boolean;
        /** Whether or not to allow copying of the video stream url. */
        allowVideoStreamCopy?: boolean;
        /** Whether or not to allow copying of the audio stream url. */
        allowAudioStreamCopy?: boolean;
        /** Optional. Whether to break on non key frames. */
        breakOnNonKeyFrames?: boolean;
        /**
         * Optional. Specify a specific audio sample rate, e.g. 44100.
         * @format int32
         */
        audioSampleRate?: number;
        /**
         * Optional. The maximum audio bit depth.
         * @format int32
         */
        maxAudioBitDepth?: number;
        /**
         * Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        audioBitRate?: number;
        /**
         * Optional. Specify a specific number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        audioChannels?: number;
        /**
         * Optional. Specify a maximum number of audio channels to encode to, e.g. 2.
         * @format int32
         */
        maxAudioChannels?: number;
        /** Optional. Specify a specific an encoder profile (varies by encoder), e.g. main, baseline, high. */
        profile?: string;
        /** Optional. Specify a level for the encoder profile (varies by encoder), e.g. 3, 3.1. */
        level?: string;
        /**
         * Optional. A specific video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        framerate?: number;
        /**
         * Optional. A specific maximum video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements.
         * @format float
         */
        maxFramerate?: number;
        /** Whether or not to copy timestamps when transcoding with an offset. Defaults to false. */
        copyTimestamps?: boolean;
        /**
         * Optional. Specify a starting offset, in ticks. 1 tick = 10000 ms.
         * @format int64
         */
        startTimeTicks?: number;
        /**
         * Optional. The fixed horizontal resolution of the encoded video.
         * @format int32
         */
        width?: number;
        /**
         * Optional. The fixed vertical resolution of the encoded video.
         * @format int32
         */
        height?: number;
        /**
         * Optional. The maximum horizontal resolution of the encoded video.
         * @format int32
         */
        maxWidth?: number;
        /**
         * Optional. The maximum vertical resolution of the encoded video.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults.
         * @format int32
         */
        videoBitRate?: number;
        /**
         * Optional. The index of the subtitle stream to use. If omitted no subtitles will be used.
         * @format int32
         */
        subtitleStreamIndex?: number;
        /** Optional. Specify the subtitle delivery method. */
        subtitleMethod?: 'Encode' | 'Embed' | 'External' | 'Hls' | 'Drop';
        /**
         * Optional.
         * @format int32
         */
        maxRefFrames?: number;
        /**
         * Optional. The maximum video bit depth.
         * @format int32
         */
        maxVideoBitDepth?: number;
        /** Optional. Whether to require avc. */
        requireAvc?: boolean;
        /** Optional. Whether to deinterlace the video. */
        deInterlace?: boolean;
        /** Optional. Whether to require a non anamorphic stream. */
        requireNonAnamorphic?: boolean;
        /**
         * Optional. The maximum number of audio channels to transcode.
         * @format int32
         */
        transcodingMaxAudioChannels?: number;
        /**
         * Optional. The limit of how many cpu cores to use.
         * @format int32
         */
        cpuCoreLimit?: number;
        /** The live stream id. */
        liveStreamId?: string;
        /** Optional. Whether to enable the MpegtsM2Ts mode. */
        enableMpegtsM2TsMode?: boolean;
        /**
         * Optional. Specify a video codec to encode to, e.g. h264. If omitted the server will auto-select using the url's extension.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        videoCodec?: string;
        /**
         * Optional. Specify a subtitle codec to encode to.
         * @pattern ^[a-zA-Z0-9\-\._,|]{0,40}$
         */
        subtitleCodec?: string;
        /** Optional. The transcoding reason. */
        transcodeReasons?: string;
        /**
         * Optional. The index of the audio stream to use. If omitted the first audio stream will be used.
         * @format int32
         */
        audioStreamIndex?: number;
        /**
         * Optional. The index of the video stream to use. If omitted the first video stream will be used.
         * @format int32
         */
        videoStreamIndex?: number;
        /** Optional. The MediaBrowser.Model.Dlna.EncodingContext. */
        context?: 'Streaming' | 'Static';
        /** Optional. The streaming options. */
        streamOptions?: Record<string, string | null>;
        /**
         * Optional. Whether to enable Audio Encoding.
         * @default true
         */
        enableAudioVbrEncoding?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, any>({
        path: `/Videos/${itemId}/stream.${container}`,
        method: 'HEAD',
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Videos
     * @name MergeVersions
     * @summary Merges videos into a single record.
     * @request POST:/Videos/MergeVersions
     * @secure
     */
    mergeVersions: (
      query: {
        /** Item id list. This allows multiple, comma delimited. */
        ids: string[];
      },
      params: RequestParams = {},
    ) =>
      this.request<void, ProblemDetails | void>({
        path: `/Videos/MergeVersions`,
        method: 'POST',
        query: query,
        secure: true,
        ...params,
      }),
  };
  environment = {
    /**
     * No description
     *
     * @tags Environment
     * @name GetDefaultDirectoryBrowser
     * @summary Get Default directory browser.
     * @request GET:/Environment/DefaultDirectoryBrowser
     * @secure
     */
    getDefaultDirectoryBrowser: (params: RequestParams = {}) =>
      this.request<DefaultDirectoryBrowserInfoDto, void>({
        path: `/Environment/DefaultDirectoryBrowser`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Environment
     * @name GetDirectoryContents
     * @summary Gets the contents of a given directory in the file system.
     * @request GET:/Environment/DirectoryContents
     * @secure
     */
    getDirectoryContents: (
      query: {
        /** The path. */
        path: string;
        /**
         * An optional filter to include or exclude files from the results. true/false.
         * @default false
         */
        includeFiles?: boolean;
        /**
         * An optional filter to include or exclude folders from the results. true/false.
         * @default false
         */
        includeDirectories?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<FileSystemEntryInfo[], void>({
        path: `/Environment/DirectoryContents`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Environment
     * @name GetDrives
     * @summary Gets available drives from the server's file system.
     * @request GET:/Environment/Drives
     * @secure
     */
    getDrives: (params: RequestParams = {}) =>
      this.request<FileSystemEntryInfo[], void>({
        path: `/Environment/Drives`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Environment
     * @name GetNetworkShares
     * @summary Gets network paths.
     * @request GET:/Environment/NetworkShares
     * @deprecated
     * @secure
     */
    getNetworkShares: (params: RequestParams = {}) =>
      this.request<FileSystemEntryInfo[], void>({
        path: `/Environment/NetworkShares`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Environment
     * @name GetParentPath
     * @summary Gets the parent path of a given path.
     * @request GET:/Environment/ParentPath
     * @secure
     */
    getParentPath: (
      query: {
        /** The path. */
        path: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<string, void>({
        path: `/Environment/ParentPath`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Environment
     * @name ValidatePath
     * @summary Validates path.
     * @request POST:/Environment/ValidatePath
     * @secure
     */
    validatePath: (data: ValidatePathDto, params: RequestParams = {}) =>
      this.request<void, void | ProblemDetails>({
        path: `/Environment/ValidatePath`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),
  };
  items = {
    /**
     * No description
     *
     * @tags Filter
     * @name GetQueryFiltersLegacy
     * @summary Gets legacy query filters.
     * @request GET:/Items/Filters
     * @secure
     */
    getQueryFiltersLegacy: (
      query?: {
        /**
         * Optional. User id.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. Parent id.
         * @format uuid
         */
        parentId?: string;
        /** Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimited. */
        includeItemTypes?: BaseItemKind[];
        /** Optional. Filter by MediaType. Allows multiple, comma delimited. */
        mediaTypes?: MediaType[];
      },
      params: RequestParams = {},
    ) =>
      this.request<QueryFiltersLegacy, void>({
        path: `/Items/Filters`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Filter
     * @name GetQueryFilters
     * @summary Gets query filters.
     * @request GET:/Items/Filters2
     * @secure
     */
    getQueryFilters: (
      query?: {
        /**
         * Optional. User id.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. Specify this to localize the search to a specific item or folder. Omit to use the root.
         * @format uuid
         */
        parentId?: string;
        /** Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimited. */
        includeItemTypes?: BaseItemKind[];
        /** Optional. Is item airing. */
        isAiring?: boolean;
        /** Optional. Is item movie. */
        isMovie?: boolean;
        /** Optional. Is item sports. */
        isSports?: boolean;
        /** Optional. Is item kids. */
        isKids?: boolean;
        /** Optional. Is item news. */
        isNews?: boolean;
        /** Optional. Is item series. */
        isSeries?: boolean;
        /** Optional. Search recursive. */
        recursive?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<QueryFilters, void>({
        path: `/Items/Filters2`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name GetItemImageInfos
     * @summary Get item image infos.
     * @request GET:/Items/{itemId}/Images
     * @secure
     */
    getItemImageInfos: (itemId: string, params: RequestParams = {}) =>
      this.request<ImageInfo[], void | ProblemDetails>({
        path: `/Items/${itemId}/Images`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name DeleteItemImage
     * @summary Delete an item's image.
     * @request DELETE:/Items/{itemId}/Images/{imageType}
     * @secure
     */
    deleteItemImage: (
      itemId: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      query?: {
        /**
         * The image index.
         * @format int32
         */
        imageIndex?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void | ProblemDetails>({
        path: `/Items/${itemId}/Images/${imageType}`,
        method: 'DELETE',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name SetItemImage
     * @summary Set item image.
     * @request POST:/Items/{itemId}/Images/{imageType}
     * @secure
     */
    setItemImage: (
      itemId: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      data: File,
      params: RequestParams = {},
    ) =>
      this.request<void, ProblemDetails | void>({
        path: `/Items/${itemId}/Images/${imageType}`,
        method: 'POST',
        body: data,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name GetItemImage
     * @summary Gets the item's image.
     * @request GET:/Items/{itemId}/Images/{imageType}
     */
    getItemImage: (
      itemId: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      query?: {
        /**
         * The maximum image width to return.
         * @format int32
         */
        maxWidth?: number;
        /**
         * The maximum image height to return.
         * @format int32
         */
        maxHeight?: number;
        /**
         * The fixed image width to return.
         * @format int32
         */
        width?: number;
        /**
         * The fixed image height to return.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases.
         * @format int32
         */
        quality?: number;
        /**
         * Width of box to fill.
         * @format int32
         */
        fillWidth?: number;
        /**
         * Height of box to fill.
         * @format int32
         */
        fillHeight?: number;
        /** Optional. Supply the cache tag from the item object to receive strong caching headers. */
        tag?: string;
        /** Optional. The MediaBrowser.Model.Drawing.ImageFormat of the returned image. */
        format?: 'Bmp' | 'Gif' | 'Jpg' | 'Png' | 'Webp' | 'Svg';
        /**
         * Optional. Percent to render for the percent played overlay.
         * @format double
         */
        percentPlayed?: number;
        /**
         * Optional. Unplayed count overlay to render.
         * @format int32
         */
        unplayedCount?: number;
        /**
         * Optional. Blur image.
         * @format int32
         */
        blur?: number;
        /** Optional. Apply a background color for transparent images. */
        backgroundColor?: string;
        /** Optional. Apply a foreground layer on top of the image. */
        foregroundLayer?: string;
        /**
         * Image index.
         * @format int32
         */
        imageIndex?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/Items/${itemId}/Images/${imageType}`,
        method: 'GET',
        query: query,
        format: 'blob',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name HeadItemImage
     * @summary Gets the item's image.
     * @request HEAD:/Items/{itemId}/Images/{imageType}
     */
    headItemImage: (
      itemId: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      query?: {
        /**
         * The maximum image width to return.
         * @format int32
         */
        maxWidth?: number;
        /**
         * The maximum image height to return.
         * @format int32
         */
        maxHeight?: number;
        /**
         * The fixed image width to return.
         * @format int32
         */
        width?: number;
        /**
         * The fixed image height to return.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases.
         * @format int32
         */
        quality?: number;
        /**
         * Width of box to fill.
         * @format int32
         */
        fillWidth?: number;
        /**
         * Height of box to fill.
         * @format int32
         */
        fillHeight?: number;
        /** Optional. Supply the cache tag from the item object to receive strong caching headers. */
        tag?: string;
        /** Optional. The MediaBrowser.Model.Drawing.ImageFormat of the returned image. */
        format?: 'Bmp' | 'Gif' | 'Jpg' | 'Png' | 'Webp' | 'Svg';
        /**
         * Optional. Percent to render for the percent played overlay.
         * @format double
         */
        percentPlayed?: number;
        /**
         * Optional. Unplayed count overlay to render.
         * @format int32
         */
        unplayedCount?: number;
        /**
         * Optional. Blur image.
         * @format int32
         */
        blur?: number;
        /** Optional. Apply a background color for transparent images. */
        backgroundColor?: string;
        /** Optional. Apply a foreground layer on top of the image. */
        foregroundLayer?: string;
        /**
         * Image index.
         * @format int32
         */
        imageIndex?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/Items/${itemId}/Images/${imageType}`,
        method: 'HEAD',
        query: query,
        format: 'blob',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name DeleteItemImageByIndex
     * @summary Delete an item's image.
     * @request DELETE:/Items/{itemId}/Images/{imageType}/{imageIndex}
     * @secure
     */
    deleteItemImageByIndex: (
      itemId: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      imageIndex: number,
      params: RequestParams = {},
    ) =>
      this.request<void, void | ProblemDetails>({
        path: `/Items/${itemId}/Images/${imageType}/${imageIndex}`,
        method: 'DELETE',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name SetItemImageByIndex
     * @summary Set item image.
     * @request POST:/Items/{itemId}/Images/{imageType}/{imageIndex}
     * @secure
     */
    setItemImageByIndex: (
      itemId: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      imageIndex: number,
      data: File,
      params: RequestParams = {},
    ) =>
      this.request<void, ProblemDetails | void>({
        path: `/Items/${itemId}/Images/${imageType}/${imageIndex}`,
        method: 'POST',
        body: data,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name GetItemImageByIndex
     * @summary Gets the item's image.
     * @request GET:/Items/{itemId}/Images/{imageType}/{imageIndex}
     */
    getItemImageByIndex: (
      itemId: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      imageIndex: number,
      query?: {
        /**
         * The maximum image width to return.
         * @format int32
         */
        maxWidth?: number;
        /**
         * The maximum image height to return.
         * @format int32
         */
        maxHeight?: number;
        /**
         * The fixed image width to return.
         * @format int32
         */
        width?: number;
        /**
         * The fixed image height to return.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases.
         * @format int32
         */
        quality?: number;
        /**
         * Width of box to fill.
         * @format int32
         */
        fillWidth?: number;
        /**
         * Height of box to fill.
         * @format int32
         */
        fillHeight?: number;
        /** Optional. Supply the cache tag from the item object to receive strong caching headers. */
        tag?: string;
        /** Optional. The MediaBrowser.Model.Drawing.ImageFormat of the returned image. */
        format?: 'Bmp' | 'Gif' | 'Jpg' | 'Png' | 'Webp' | 'Svg';
        /**
         * Optional. Percent to render for the percent played overlay.
         * @format double
         */
        percentPlayed?: number;
        /**
         * Optional. Unplayed count overlay to render.
         * @format int32
         */
        unplayedCount?: number;
        /**
         * Optional. Blur image.
         * @format int32
         */
        blur?: number;
        /** Optional. Apply a background color for transparent images. */
        backgroundColor?: string;
        /** Optional. Apply a foreground layer on top of the image. */
        foregroundLayer?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/Items/${itemId}/Images/${imageType}/${imageIndex}`,
        method: 'GET',
        query: query,
        format: 'blob',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name HeadItemImageByIndex
     * @summary Gets the item's image.
     * @request HEAD:/Items/{itemId}/Images/{imageType}/{imageIndex}
     */
    headItemImageByIndex: (
      itemId: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      imageIndex: number,
      query?: {
        /**
         * The maximum image width to return.
         * @format int32
         */
        maxWidth?: number;
        /**
         * The maximum image height to return.
         * @format int32
         */
        maxHeight?: number;
        /**
         * The fixed image width to return.
         * @format int32
         */
        width?: number;
        /**
         * The fixed image height to return.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases.
         * @format int32
         */
        quality?: number;
        /**
         * Width of box to fill.
         * @format int32
         */
        fillWidth?: number;
        /**
         * Height of box to fill.
         * @format int32
         */
        fillHeight?: number;
        /** Optional. Supply the cache tag from the item object to receive strong caching headers. */
        tag?: string;
        /** Optional. The MediaBrowser.Model.Drawing.ImageFormat of the returned image. */
        format?: 'Bmp' | 'Gif' | 'Jpg' | 'Png' | 'Webp' | 'Svg';
        /**
         * Optional. Percent to render for the percent played overlay.
         * @format double
         */
        percentPlayed?: number;
        /**
         * Optional. Unplayed count overlay to render.
         * @format int32
         */
        unplayedCount?: number;
        /**
         * Optional. Blur image.
         * @format int32
         */
        blur?: number;
        /** Optional. Apply a background color for transparent images. */
        backgroundColor?: string;
        /** Optional. Apply a foreground layer on top of the image. */
        foregroundLayer?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/Items/${itemId}/Images/${imageType}/${imageIndex}`,
        method: 'HEAD',
        query: query,
        format: 'blob',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name GetItemImage2
     * @summary Gets the item's image.
     * @request GET:/Items/{itemId}/Images/{imageType}/{imageIndex}/{tag}/{format}/{maxWidth}/{maxHeight}/{percentPlayed}/{unplayedCount}
     */
    getItemImage2: (
      itemId: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      maxWidth: number,
      maxHeight: number,
      tag: string,
      format: 'Bmp' | 'Gif' | 'Jpg' | 'Png' | 'Webp' | 'Svg',
      percentPlayed: number,
      unplayedCount: number,
      imageIndex: number,
      query?: {
        /**
         * The fixed image width to return.
         * @format int32
         */
        width?: number;
        /**
         * The fixed image height to return.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases.
         * @format int32
         */
        quality?: number;
        /**
         * Width of box to fill.
         * @format int32
         */
        fillWidth?: number;
        /**
         * Height of box to fill.
         * @format int32
         */
        fillHeight?: number;
        /**
         * Optional. Blur image.
         * @format int32
         */
        blur?: number;
        /** Optional. Apply a background color for transparent images. */
        backgroundColor?: string;
        /** Optional. Apply a foreground layer on top of the image. */
        foregroundLayer?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/Items/${itemId}/Images/${imageType}/${imageIndex}/${tag}/${format}/${maxWidth}/${maxHeight}/${percentPlayed}/${unplayedCount}`,
        method: 'GET',
        query: query,
        format: 'blob',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name HeadItemImage2
     * @summary Gets the item's image.
     * @request HEAD:/Items/{itemId}/Images/{imageType}/{imageIndex}/{tag}/{format}/{maxWidth}/{maxHeight}/{percentPlayed}/{unplayedCount}
     */
    headItemImage2: (
      itemId: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      maxWidth: number,
      maxHeight: number,
      tag: string,
      format: 'Bmp' | 'Gif' | 'Jpg' | 'Png' | 'Webp' | 'Svg',
      percentPlayed: number,
      unplayedCount: number,
      imageIndex: number,
      query?: {
        /**
         * The fixed image width to return.
         * @format int32
         */
        width?: number;
        /**
         * The fixed image height to return.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases.
         * @format int32
         */
        quality?: number;
        /**
         * Width of box to fill.
         * @format int32
         */
        fillWidth?: number;
        /**
         * Height of box to fill.
         * @format int32
         */
        fillHeight?: number;
        /**
         * Optional. Blur image.
         * @format int32
         */
        blur?: number;
        /** Optional. Apply a background color for transparent images. */
        backgroundColor?: string;
        /** Optional. Apply a foreground layer on top of the image. */
        foregroundLayer?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/Items/${itemId}/Images/${imageType}/${imageIndex}/${tag}/${format}/${maxWidth}/${maxHeight}/${percentPlayed}/${unplayedCount}`,
        method: 'HEAD',
        query: query,
        format: 'blob',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name UpdateItemImageIndex
     * @summary Updates the index for an item image.
     * @request POST:/Items/{itemId}/Images/{imageType}/{imageIndex}/Index
     * @secure
     */
    updateItemImageIndex: (
      itemId: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      imageIndex: number,
      query: {
        /**
         * New image index.
         * @format int32
         */
        newIndex: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void | ProblemDetails>({
        path: `/Items/${itemId}/Images/${imageType}/${imageIndex}/Index`,
        method: 'POST',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags InstantMix
     * @name GetInstantMixFromItem
     * @summary Creates an instant playlist based on a given item.
     * @request GET:/Items/{itemId}/InstantMix
     * @secure
     */
    getInstantMixFromItem: (
      itemId: string,
      query?: {
        /**
         * Optional. Filter by user id, and attach user data.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Specify additional fields of information to return in the output. */
        fields?: ItemFields[];
        /** Optional. Include image information in output. */
        enableImages?: boolean;
        /** Optional. Include user data. */
        enableUserData?: boolean;
        /**
         * Optional. The max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void | ProblemDetails>({
        path: `/Items/${itemId}/InstantMix`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags ItemLookup
     * @name GetExternalIdInfos
     * @summary Get the item's external id info.
     * @request GET:/Items/{itemId}/ExternalIdInfos
     * @secure
     */
    getExternalIdInfos: (itemId: string, params: RequestParams = {}) =>
      this.request<ExternalIdInfo[], void | ProblemDetails>({
        path: `/Items/${itemId}/ExternalIdInfos`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags ItemLookup
     * @name ApplySearchCriteria
     * @summary Applies search criteria to an item and refreshes metadata.
     * @request POST:/Items/RemoteSearch/Apply/{itemId}
     * @secure
     */
    applySearchCriteria: (
      itemId: string,
      data: RemoteSearchResult,
      query?: {
        /**
         * Optional. Whether or not to replace all images. Default: True.
         * @default true
         */
        replaceAllImages?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void | ProblemDetails>({
        path: `/Items/RemoteSearch/Apply/${itemId}`,
        method: 'POST',
        query: query,
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags ItemLookup
     * @name GetBookRemoteSearchResults
     * @summary Get book remote search.
     * @request POST:/Items/RemoteSearch/Book
     * @secure
     */
    getBookRemoteSearchResults: (data: BookInfoRemoteSearchQuery, params: RequestParams = {}) =>
      this.request<RemoteSearchResult[], void>({
        path: `/Items/RemoteSearch/Book`,
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
     * @tags ItemLookup
     * @name GetBoxSetRemoteSearchResults
     * @summary Get box set remote search.
     * @request POST:/Items/RemoteSearch/BoxSet
     * @secure
     */
    getBoxSetRemoteSearchResults: (data: BoxSetInfoRemoteSearchQuery, params: RequestParams = {}) =>
      this.request<RemoteSearchResult[], void>({
        path: `/Items/RemoteSearch/BoxSet`,
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
     * @tags ItemLookup
     * @name GetMovieRemoteSearchResults
     * @summary Get movie remote search.
     * @request POST:/Items/RemoteSearch/Movie
     * @secure
     */
    getMovieRemoteSearchResults: (data: MovieInfoRemoteSearchQuery, params: RequestParams = {}) =>
      this.request<RemoteSearchResult[], void>({
        path: `/Items/RemoteSearch/Movie`,
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
     * @tags ItemLookup
     * @name GetMusicAlbumRemoteSearchResults
     * @summary Get music album remote search.
     * @request POST:/Items/RemoteSearch/MusicAlbum
     * @secure
     */
    getMusicAlbumRemoteSearchResults: (data: AlbumInfoRemoteSearchQuery, params: RequestParams = {}) =>
      this.request<RemoteSearchResult[], void>({
        path: `/Items/RemoteSearch/MusicAlbum`,
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
     * @tags ItemLookup
     * @name GetMusicArtistRemoteSearchResults
     * @summary Get music artist remote search.
     * @request POST:/Items/RemoteSearch/MusicArtist
     * @secure
     */
    getMusicArtistRemoteSearchResults: (data: ArtistInfoRemoteSearchQuery, params: RequestParams = {}) =>
      this.request<RemoteSearchResult[], void>({
        path: `/Items/RemoteSearch/MusicArtist`,
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
     * @tags ItemLookup
     * @name GetMusicVideoRemoteSearchResults
     * @summary Get music video remote search.
     * @request POST:/Items/RemoteSearch/MusicVideo
     * @secure
     */
    getMusicVideoRemoteSearchResults: (data: MusicVideoInfoRemoteSearchQuery, params: RequestParams = {}) =>
      this.request<RemoteSearchResult[], void>({
        path: `/Items/RemoteSearch/MusicVideo`,
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
     * @tags ItemLookup
     * @name GetPersonRemoteSearchResults
     * @summary Get person remote search.
     * @request POST:/Items/RemoteSearch/Person
     * @secure
     */
    getPersonRemoteSearchResults: (data: PersonLookupInfoRemoteSearchQuery, params: RequestParams = {}) =>
      this.request<RemoteSearchResult[], void>({
        path: `/Items/RemoteSearch/Person`,
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
     * @tags ItemLookup
     * @name GetSeriesRemoteSearchResults
     * @summary Get series remote search.
     * @request POST:/Items/RemoteSearch/Series
     * @secure
     */
    getSeriesRemoteSearchResults: (data: SeriesInfoRemoteSearchQuery, params: RequestParams = {}) =>
      this.request<RemoteSearchResult[], void>({
        path: `/Items/RemoteSearch/Series`,
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
     * @tags ItemLookup
     * @name GetTrailerRemoteSearchResults
     * @summary Get trailer remote search.
     * @request POST:/Items/RemoteSearch/Trailer
     * @secure
     */
    getTrailerRemoteSearchResults: (data: TrailerInfoRemoteSearchQuery, params: RequestParams = {}) =>
      this.request<RemoteSearchResult[], void>({
        path: `/Items/RemoteSearch/Trailer`,
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
     * @tags ItemRefresh
     * @name RefreshItem
     * @summary Refreshes metadata for an item.
     * @request POST:/Items/{itemId}/Refresh
     * @secure
     */
    refreshItem: (
      itemId: string,
      query?: {
        /**
         * (Optional) Specifies the metadata refresh mode.
         * @default "None"
         */
        metadataRefreshMode?: 'None' | 'ValidationOnly' | 'Default' | 'FullRefresh';
        /**
         * (Optional) Specifies the image refresh mode.
         * @default "None"
         */
        imageRefreshMode?: 'None' | 'ValidationOnly' | 'Default' | 'FullRefresh';
        /**
         * (Optional) Determines if metadata should be replaced. Only applicable if mode is FullRefresh.
         * @default false
         */
        replaceAllMetadata?: boolean;
        /**
         * (Optional) Determines if images should be replaced. Only applicable if mode is FullRefresh.
         * @default false
         */
        replaceAllImages?: boolean;
        /**
         * (Optional) Determines if trickplay images should be replaced. Only applicable if mode is FullRefresh.
         * @default false
         */
        regenerateTrickplay?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void | ProblemDetails>({
        path: `/Items/${itemId}/Refresh`,
        method: 'POST',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Items
     * @name GetItems
     * @summary Gets items based on a query.
     * @request GET:/Items
     * @secure
     */
    getItems: (
      query?: {
        /**
         * The user id supplied as query parameter; this is required when not using an API key.
         * @format uuid
         */
        userId?: string;
        /** Optional filter by maximum official rating (PG, PG-13, TV-MA, etc). */
        maxOfficialRating?: string;
        /** Optional filter by items with theme songs. */
        hasThemeSong?: boolean;
        /** Optional filter by items with theme videos. */
        hasThemeVideo?: boolean;
        /** Optional filter by items with subtitles. */
        hasSubtitles?: boolean;
        /** Optional filter by items with special features. */
        hasSpecialFeature?: boolean;
        /** Optional filter by items with trailers. */
        hasTrailer?: boolean;
        /**
         * Optional. Return items that are siblings of a supplied item.
         * @format uuid
         */
        adjacentTo?: string;
        /**
         * Optional filter by index number.
         * @format int32
         */
        indexNumber?: number;
        /**
         * Optional filter by parent index number.
         * @format int32
         */
        parentIndexNumber?: number;
        /** Optional filter by items that have or do not have a parental rating. */
        hasParentalRating?: boolean;
        /** Optional filter by items that are HD or not. */
        isHd?: boolean;
        /** Optional filter by items that are 4K or not. */
        is4K?: boolean;
        /** Optional. If specified, results will be filtered based on LocationType. This allows multiple, comma delimited. */
        locationTypes?: LocationType[];
        /** Optional. If specified, results will be filtered based on the LocationType. This allows multiple, comma delimited. */
        excludeLocationTypes?: LocationType[];
        /** Optional filter by items that are missing episodes or not. */
        isMissing?: boolean;
        /** Optional filter by items that are unaired episodes or not. */
        isUnaired?: boolean;
        /**
         * Optional filter by minimum community rating.
         * @format double
         */
        minCommunityRating?: number;
        /**
         * Optional filter by minimum critic rating.
         * @format double
         */
        minCriticRating?: number;
        /**
         * Optional. The minimum premiere date. Format = ISO.
         * @format date-time
         */
        minPremiereDate?: string;
        /**
         * Optional. The minimum last saved date. Format = ISO.
         * @format date-time
         */
        minDateLastSaved?: string;
        /**
         * Optional. The minimum last saved date for the current user. Format = ISO.
         * @format date-time
         */
        minDateLastSavedForUser?: string;
        /**
         * Optional. The maximum premiere date. Format = ISO.
         * @format date-time
         */
        maxPremiereDate?: string;
        /** Optional filter by items that have an overview or not. */
        hasOverview?: boolean;
        /** Optional filter by items that have an IMDb id or not. */
        hasImdbId?: boolean;
        /** Optional filter by items that have a TMDb id or not. */
        hasTmdbId?: boolean;
        /** Optional filter by items that have a TVDb id or not. */
        hasTvdbId?: boolean;
        /** Optional filter for live tv movies. */
        isMovie?: boolean;
        /** Optional filter for live tv series. */
        isSeries?: boolean;
        /** Optional filter for live tv news. */
        isNews?: boolean;
        /** Optional filter for live tv kids. */
        isKids?: boolean;
        /** Optional filter for live tv sports. */
        isSports?: boolean;
        /** Optional. If specified, results will be filtered by excluding item ids. This allows multiple, comma delimited. */
        excludeItemIds?: string[];
        /**
         * Optional. The record index to start at. All items with a lower index will be dropped from the results.
         * @format int32
         */
        startIndex?: number;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** When searching within folders, this determines whether or not the search will be recursive. true/false. */
        recursive?: boolean;
        /** Optional. Filter based on a search term. */
        searchTerm?: string;
        /** Sort Order - Ascending, Descending. */
        sortOrder?: SortOrder[];
        /**
         * Specify this to localize the search to a specific item or folder. Omit to use the root.
         * @format uuid
         */
        parentId?: string;
        /** Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimited. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines. */
        fields?: ItemFields[];
        /** Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimited. */
        excludeItemTypes?: BaseItemKind[];
        /** Optional. If specified, results will be filtered based on the item type. This allows multiple, comma delimited. */
        includeItemTypes?: BaseItemKind[];
        /** Optional. Specify additional filters to apply. This allows multiple, comma delimited. Options: IsFolder, IsNotFolder, IsUnplayed, IsPlayed, IsFavorite, IsResumable, Likes, Dislikes. */
        filters?: ItemFilter[];
        /** Optional filter by items that are marked as favorite, or not. */
        isFavorite?: boolean;
        /** Optional filter by MediaType. Allows multiple, comma delimited. */
        mediaTypes?: MediaType[];
        /** Optional. If specified, results will be filtered based on those containing image types. This allows multiple, comma delimited. */
        imageTypes?: ImageType[];
        /** Optional. Specify one or more sort orders, comma delimited. Options: Album, AlbumArtist, Artist, Budget, CommunityRating, CriticRating, DateCreated, DatePlayed, PlayCount, PremiereDate, ProductionYear, SortName, Random, Revenue, Runtime. */
        sortBy?: ItemSortBy[];
        /** Optional filter by items that are played, or not. */
        isPlayed?: boolean;
        /** Optional. If specified, results will be filtered based on genre. This allows multiple, pipe delimited. */
        genres?: string[];
        /** Optional. If specified, results will be filtered based on OfficialRating. This allows multiple, pipe delimited. */
        officialRatings?: string[];
        /** Optional. If specified, results will be filtered based on tag. This allows multiple, pipe delimited. */
        tags?: string[];
        /** Optional. If specified, results will be filtered based on production year. This allows multiple, comma delimited. */
        years?: number[];
        /** Optional, include user data. */
        enableUserData?: boolean;
        /**
         * Optional, the max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
        /** Optional. If specified, results will be filtered to include only those containing the specified person. */
        person?: string;
        /** Optional. If specified, results will be filtered to include only those containing the specified person id. */
        personIds?: string[];
        /** Optional. If specified, along with Person, results will be filtered to include only those containing the specified person and PersonType. Allows multiple, comma-delimited. */
        personTypes?: string[];
        /** Optional. If specified, results will be filtered based on studio. This allows multiple, pipe delimited. */
        studios?: string[];
        /** Optional. If specified, results will be filtered based on artists. This allows multiple, pipe delimited. */
        artists?: string[];
        /** Optional. If specified, results will be filtered based on artist id. This allows multiple, pipe delimited. */
        excludeArtistIds?: string[];
        /** Optional. If specified, results will be filtered to include only those containing the specified artist id. */
        artistIds?: string[];
        /** Optional. If specified, results will be filtered to include only those containing the specified album artist id. */
        albumArtistIds?: string[];
        /** Optional. If specified, results will be filtered to include only those containing the specified contributing artist id. */
        contributingArtistIds?: string[];
        /** Optional. If specified, results will be filtered based on album. This allows multiple, pipe delimited. */
        albums?: string[];
        /** Optional. If specified, results will be filtered based on album id. This allows multiple, pipe delimited. */
        albumIds?: string[];
        /** Optional. If specific items are needed, specify a list of item id's to retrieve. This allows multiple, comma delimited. */
        ids?: string[];
        /** Optional filter by VideoType (videofile, dvd, bluray, iso). Allows multiple, comma delimited. */
        videoTypes?: VideoType[];
        /** Optional filter by minimum official rating (PG, PG-13, TV-MA, etc). */
        minOfficialRating?: string;
        /** Optional filter by items that are locked. */
        isLocked?: boolean;
        /** Optional filter by items that are placeholders. */
        isPlaceHolder?: boolean;
        /** Optional filter by items that have official ratings. */
        hasOfficialRating?: boolean;
        /** Whether or not to hide items behind their boxsets. */
        collapseBoxSetItems?: boolean;
        /**
         * Optional. Filter by the minimum width of the item.
         * @format int32
         */
        minWidth?: number;
        /**
         * Optional. Filter by the minimum height of the item.
         * @format int32
         */
        minHeight?: number;
        /**
         * Optional. Filter by the maximum width of the item.
         * @format int32
         */
        maxWidth?: number;
        /**
         * Optional. Filter by the maximum height of the item.
         * @format int32
         */
        maxHeight?: number;
        /** Optional filter by items that are 3D, or not. */
        is3D?: boolean;
        /** Optional filter by Series Status. Allows multiple, comma delimited. */
        seriesStatus?: SeriesStatus[];
        /** Optional filter by items whose name is sorted equally or greater than a given input string. */
        nameStartsWithOrGreater?: string;
        /** Optional filter by items whose name is sorted equally than a given input string. */
        nameStartsWith?: string;
        /** Optional filter by items whose name is equally or lesser than a given input string. */
        nameLessThan?: string;
        /** Optional. If specified, results will be filtered based on studio id. This allows multiple, pipe delimited. */
        studioIds?: string[];
        /** Optional. If specified, results will be filtered based on genre id. This allows multiple, pipe delimited. */
        genreIds?: string[];
        /**
         * Optional. Enable the total record count.
         * @default true
         */
        enableTotalRecordCount?: boolean;
        /**
         * Optional, include image information in output.
         * @default true
         */
        enableImages?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/Items`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library
     * @name DeleteItems
     * @summary Deletes items from the library and filesystem.
     * @request DELETE:/Items
     * @secure
     */
    deleteItems: (
      query?: {
        /** The item ids. */
        ids?: string[];
      },
      params: RequestParams = {},
    ) =>
      this.request<void, ProblemDetails | void>({
        path: `/Items`,
        method: 'DELETE',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags ItemUpdate
     * @name UpdateItem
     * @summary Updates an item.
     * @request POST:/Items/{itemId}
     * @secure
     */
    updateItem: (itemId: string, data: BaseItemDto, params: RequestParams = {}) =>
      this.request<void, void | ProblemDetails>({
        path: `/Items/${itemId}`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library
     * @name DeleteItem
     * @summary Deletes an item from the library and filesystem.
     * @request DELETE:/Items/{itemId}
     * @secure
     */
    deleteItem: (itemId: string, params: RequestParams = {}) =>
      this.request<void, ProblemDetails | void>({
        path: `/Items/${itemId}`,
        method: 'DELETE',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags UserLibrary
     * @name GetItem
     * @summary Gets an item from a user's library.
     * @request GET:/Items/{itemId}
     * @secure
     */
    getItem: (
      itemId: string,
      query?: {
        /**
         * User id.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDto, void>({
        path: `/Items/${itemId}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags ItemUpdate
     * @name UpdateItemContentType
     * @summary Updates an item's content type.
     * @request POST:/Items/{itemId}/ContentType
     * @secure
     */
    updateItemContentType: (
      itemId: string,
      query?: {
        /** The content type of the item. */
        contentType?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void | ProblemDetails>({
        path: `/Items/${itemId}/ContentType`,
        method: 'POST',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags ItemUpdate
     * @name GetMetadataEditorInfo
     * @summary Gets metadata editor info for an item.
     * @request GET:/Items/{itemId}/MetadataEditor
     * @secure
     */
    getMetadataEditorInfo: (itemId: string, params: RequestParams = {}) =>
      this.request<MetadataEditorInfo, void | ProblemDetails>({
        path: `/Items/${itemId}/MetadataEditor`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library
     * @name GetAncestors
     * @summary Gets all parents of an item.
     * @request GET:/Items/{itemId}/Ancestors
     * @secure
     */
    getAncestors: (
      itemId: string,
      query?: {
        /**
         * Optional. Filter by user id, and attach user data.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDto[], void | ProblemDetails>({
        path: `/Items/${itemId}/Ancestors`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library
     * @name GetCriticReviews
     * @summary Gets critic review for an item.
     * @request GET:/Items/{itemId}/CriticReviews
     * @deprecated
     * @secure
     */
    getCriticReviews: (itemId: string, params: RequestParams = {}) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/Items/${itemId}/CriticReviews`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library
     * @name GetDownload
     * @summary Downloads item media.
     * @request GET:/Items/{itemId}/Download
     * @secure
     */
    getDownload: (itemId: string, params: RequestParams = {}) =>
      this.request<File, void | ProblemDetails>({
        path: `/Items/${itemId}/Download`,
        method: 'GET',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library
     * @name GetFile
     * @summary Get the original file of an item.
     * @request GET:/Items/{itemId}/File
     * @secure
     */
    getFile: (itemId: string, params: RequestParams = {}) =>
      this.request<File, void | ProblemDetails>({
        path: `/Items/${itemId}/File`,
        method: 'GET',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library
     * @name GetSimilarItems
     * @summary Gets similar items.
     * @request GET:/Items/{itemId}/Similar
     * @secure
     */
    getSimilarItems: (
      itemId: string,
      query?: {
        /** Exclude artist ids. */
        excludeArtistIds?: string[];
        /**
         * Optional. Filter by user id, and attach user data.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimited. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines, TrailerUrls. */
        fields?: ItemFields[];
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/Items/${itemId}/Similar`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library
     * @name GetThemeMedia
     * @summary Get theme songs and videos for an item.
     * @request GET:/Items/{itemId}/ThemeMedia
     * @secure
     */
    getThemeMedia: (
      itemId: string,
      query?: {
        /**
         * Optional. Filter by user id, and attach user data.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. Determines whether or not parent items should be searched for theme media.
         * @default false
         */
        inheritFromParent?: boolean;
        /** Optional. Specify one or more sort orders, comma delimited. Options: Album, AlbumArtist, Artist, Budget, CommunityRating, CriticRating, DateCreated, DatePlayed, PlayCount, PremiereDate, ProductionYear, SortName, Random, Revenue, Runtime. */
        sortBy?: ItemSortBy[];
        /** Optional. Sort Order - Ascending, Descending. */
        sortOrder?: SortOrder[];
      },
      params: RequestParams = {},
    ) =>
      this.request<AllThemeMediaResult, void>({
        path: `/Items/${itemId}/ThemeMedia`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library
     * @name GetThemeSongs
     * @summary Get theme songs for an item.
     * @request GET:/Items/{itemId}/ThemeSongs
     * @secure
     */
    getThemeSongs: (
      itemId: string,
      query?: {
        /**
         * Optional. Filter by user id, and attach user data.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. Determines whether or not parent items should be searched for theme media.
         * @default false
         */
        inheritFromParent?: boolean;
        /** Optional. Specify one or more sort orders, comma delimited. Options: Album, AlbumArtist, Artist, Budget, CommunityRating, CriticRating, DateCreated, DatePlayed, PlayCount, PremiereDate, ProductionYear, SortName, Random, Revenue, Runtime. */
        sortBy?: ItemSortBy[];
        /** Optional. Sort Order - Ascending, Descending. */
        sortOrder?: SortOrder[];
      },
      params: RequestParams = {},
    ) =>
      this.request<ThemeMediaResult, void | ProblemDetails>({
        path: `/Items/${itemId}/ThemeSongs`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library
     * @name GetThemeVideos
     * @summary Get theme videos for an item.
     * @request GET:/Items/{itemId}/ThemeVideos
     * @secure
     */
    getThemeVideos: (
      itemId: string,
      query?: {
        /**
         * Optional. Filter by user id, and attach user data.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. Determines whether or not parent items should be searched for theme media.
         * @default false
         */
        inheritFromParent?: boolean;
        /** Optional. Specify one or more sort orders, comma delimited. Options: Album, AlbumArtist, Artist, Budget, CommunityRating, CriticRating, DateCreated, DatePlayed, PlayCount, PremiereDate, ProductionYear, SortName, Random, Revenue, Runtime. */
        sortBy?: ItemSortBy[];
        /** Optional. Sort Order - Ascending, Descending. */
        sortOrder?: SortOrder[];
      },
      params: RequestParams = {},
    ) =>
      this.request<ThemeMediaResult, void | ProblemDetails>({
        path: `/Items/${itemId}/ThemeVideos`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library
     * @name GetItemCounts
     * @summary Get item counts.
     * @request GET:/Items/Counts
     * @secure
     */
    getItemCounts: (
      query?: {
        /**
         * Optional. Get counts from a specific user's library.
         * @format uuid
         */
        userId?: string;
        /** Optional. Get counts of favorite items. */
        isFavorite?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<ItemCounts, void>({
        path: `/Items/Counts`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags MediaInfo
     * @name GetPlaybackInfo
     * @summary Gets live playback media info for an item.
     * @request GET:/Items/{itemId}/PlaybackInfo
     * @secure
     */
    getPlaybackInfo: (
      itemId: string,
      query?: {
        /**
         * The user id.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<PlaybackInfoResponse, void | ProblemDetails>({
        path: `/Items/${itemId}/PlaybackInfo`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description For backwards compatibility parameters can be sent via Query or Body, with Query having higher precedence. Query parameters are obsolete.
     *
     * @tags MediaInfo
     * @name GetPostedPlaybackInfo
     * @summary Gets live playback media info for an item.
     * @request POST:/Items/{itemId}/PlaybackInfo
     * @secure
     */
    getPostedPlaybackInfo: (
      itemId: string,
      data: PlaybackInfoDto,
      query?: {
        /**
         * The user id.
         * @deprecated
         * @format uuid
         */
        userId?: string;
        /**
         * The maximum streaming bitrate.
         * @deprecated
         * @format int32
         */
        maxStreamingBitrate?: number;
        /**
         * The start time in ticks.
         * @deprecated
         * @format int64
         */
        startTimeTicks?: number;
        /**
         * The audio stream index.
         * @deprecated
         * @format int32
         */
        audioStreamIndex?: number;
        /**
         * The subtitle stream index.
         * @deprecated
         * @format int32
         */
        subtitleStreamIndex?: number;
        /**
         * The maximum number of audio channels.
         * @deprecated
         * @format int32
         */
        maxAudioChannels?: number;
        /**
         * The media source id.
         * @deprecated
         */
        mediaSourceId?: string;
        /**
         * The livestream id.
         * @deprecated
         */
        liveStreamId?: string;
        /**
         * Whether to auto open the livestream.
         * @deprecated
         */
        autoOpenLiveStream?: boolean;
        /**
         * Whether to enable direct play. Default: true.
         * @deprecated
         */
        enableDirectPlay?: boolean;
        /**
         * Whether to enable direct stream. Default: true.
         * @deprecated
         */
        enableDirectStream?: boolean;
        /**
         * Whether to enable transcoding. Default: true.
         * @deprecated
         */
        enableTranscoding?: boolean;
        /**
         * Whether to allow to copy the video stream. Default: true.
         * @deprecated
         */
        allowVideoStreamCopy?: boolean;
        /**
         * Whether to allow to copy the audio stream. Default: true.
         * @deprecated
         */
        allowAudioStreamCopy?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<PlaybackInfoResponse, void | ProblemDetails>({
        path: `/Items/${itemId}/PlaybackInfo`,
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
     * @tags RemoteImage
     * @name GetRemoteImages
     * @summary Gets available remote images for an item.
     * @request GET:/Items/{itemId}/RemoteImages
     * @secure
     */
    getRemoteImages: (
      itemId: string,
      query?: {
        /** The image type. */
        type?:
          | 'Primary'
          | 'Art'
          | 'Backdrop'
          | 'Banner'
          | 'Logo'
          | 'Thumb'
          | 'Disc'
          | 'Box'
          | 'Screenshot'
          | 'Menu'
          | 'Chapter'
          | 'BoxRear'
          | 'Profile';
        /**
         * Optional. The record index to start at. All items with a lower index will be dropped from the results.
         * @format int32
         */
        startIndex?: number;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. The image provider to use. */
        providerName?: string;
        /**
         * Optional. Include all languages.
         * @default false
         */
        includeAllLanguages?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<RemoteImageResult, void | ProblemDetails>({
        path: `/Items/${itemId}/RemoteImages`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags RemoteImage
     * @name DownloadRemoteImage
     * @summary Downloads a remote image for an item.
     * @request POST:/Items/{itemId}/RemoteImages/Download
     * @secure
     */
    downloadRemoteImage: (
      itemId: string,
      query: {
        /** Enum ImageType. */
        type:
          | 'Primary'
          | 'Art'
          | 'Backdrop'
          | 'Banner'
          | 'Logo'
          | 'Thumb'
          | 'Disc'
          | 'Box'
          | 'Screenshot'
          | 'Menu'
          | 'Chapter'
          | 'BoxRear'
          | 'Profile';
        /** The image url. */
        imageUrl?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void | ProblemDetails>({
        path: `/Items/${itemId}/RemoteImages/Download`,
        method: 'POST',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags RemoteImage
     * @name GetRemoteImageProviders
     * @summary Gets available remote image providers for an item.
     * @request GET:/Items/{itemId}/RemoteImages/Providers
     * @secure
     */
    getRemoteImageProviders: (itemId: string, params: RequestParams = {}) =>
      this.request<ImageProviderInfo[], void | ProblemDetails>({
        path: `/Items/${itemId}/RemoteImages/Providers`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Subtitle
     * @name SearchRemoteSubtitles
     * @summary Search remote subtitles.
     * @request GET:/Items/{itemId}/RemoteSearch/Subtitles/{language}
     * @secure
     */
    searchRemoteSubtitles: (
      itemId: string,
      language: string,
      query?: {
        /** Optional. Only show subtitles which are a perfect match. */
        isPerfectMatch?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<RemoteSubtitleInfo[], void | ProblemDetails>({
        path: `/Items/${itemId}/RemoteSearch/Subtitles/${language}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Subtitle
     * @name DownloadRemoteSubtitles
     * @summary Downloads a remote subtitle.
     * @request POST:/Items/{itemId}/RemoteSearch/Subtitles/{subtitleId}
     * @secure
     */
    downloadRemoteSubtitles: (itemId: string, subtitleId: string, params: RequestParams = {}) =>
      this.request<void, void | ProblemDetails>({
        path: `/Items/${itemId}/RemoteSearch/Subtitles/${subtitleId}`,
        method: 'POST',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Suggestions
     * @name GetSuggestions
     * @summary Gets suggestions.
     * @request GET:/Items/Suggestions
     * @secure
     */
    getSuggestions: (
      query?: {
        /**
         * The user id.
         * @format uuid
         */
        userId?: string;
        /** The media types. */
        mediaType?: MediaType[];
        /** The type. */
        type?: BaseItemKind[];
        /**
         * Optional. The start index.
         * @format int32
         */
        startIndex?: number;
        /**
         * Optional. The limit.
         * @format int32
         */
        limit?: number;
        /**
         * Whether to enable the total record count.
         * @default false
         */
        enableTotalRecordCount?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/Items/Suggestions`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags UserLibrary
     * @name GetIntros
     * @summary Gets intros to play before the main media item plays.
     * @request GET:/Items/{itemId}/Intros
     * @secure
     */
    getIntros: (
      itemId: string,
      query?: {
        /**
         * User id.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/Items/${itemId}/Intros`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags UserLibrary
     * @name GetLocalTrailers
     * @summary Gets local trailers for an item.
     * @request GET:/Items/{itemId}/LocalTrailers
     * @secure
     */
    getLocalTrailers: (
      itemId: string,
      query?: {
        /**
         * User id.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDto[], void>({
        path: `/Items/${itemId}/LocalTrailers`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags UserLibrary
     * @name GetSpecialFeatures
     * @summary Gets special features for an item.
     * @request GET:/Items/{itemId}/SpecialFeatures
     * @secure
     */
    getSpecialFeatures: (
      itemId: string,
      query?: {
        /**
         * User id.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDto[], void>({
        path: `/Items/${itemId}/SpecialFeatures`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags UserLibrary
     * @name GetLatestMedia
     * @summary Gets latest media.
     * @request GET:/Items/Latest
     * @secure
     */
    getLatestMedia: (
      query?: {
        /**
         * User id.
         * @format uuid
         */
        userId?: string;
        /**
         * Specify this to localize the search to a specific item or folder. Omit to use the root.
         * @format uuid
         */
        parentId?: string;
        /** Optional. Specify additional fields of information to return in the output. */
        fields?: ItemFields[];
        /** Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimited. */
        includeItemTypes?: BaseItemKind[];
        /** Filter by items that are played, or not. */
        isPlayed?: boolean;
        /** Optional. include image information in output. */
        enableImages?: boolean;
        /**
         * Optional. the max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
        /** Optional. include user data. */
        enableUserData?: boolean;
        /**
         * Return item limit.
         * @format int32
         * @default 20
         */
        limit?: number;
        /**
         * Whether or not to group items into a parent container.
         * @default true
         */
        groupItems?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDto[], void>({
        path: `/Items/Latest`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags UserLibrary
     * @name GetRootFolder
     * @summary Gets the root folder from a user's library.
     * @request GET:/Items/Root
     * @secure
     */
    getRootFolder: (
      query?: {
        /**
         * User id.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDto, void>({
        path: `/Items/Root`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),
  };
  genres = {
    /**
     * No description
     *
     * @tags Genres
     * @name GetGenres
     * @summary Gets all genres from a given item, folder, or the entire library.
     * @request GET:/Genres
     * @secure
     */
    getGenres: (
      query?: {
        /**
         * Optional. The record index to start at. All items with a lower index will be dropped from the results.
         * @format int32
         */
        startIndex?: number;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** The search term. */
        searchTerm?: string;
        /**
         * Specify this to localize the search to a specific item or folder. Omit to use the root.
         * @format uuid
         */
        parentId?: string;
        /** Optional. Specify additional fields of information to return in the output. */
        fields?: ItemFields[];
        /** Optional. If specified, results will be filtered out based on item type. This allows multiple, comma delimited. */
        excludeItemTypes?: BaseItemKind[];
        /** Optional. If specified, results will be filtered in based on item type. This allows multiple, comma delimited. */
        includeItemTypes?: BaseItemKind[];
        /** Optional filter by items that are marked as favorite, or not. */
        isFavorite?: boolean;
        /**
         * Optional, the max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
        /**
         * User id.
         * @format uuid
         */
        userId?: string;
        /** Optional filter by items whose name is sorted equally or greater than a given input string. */
        nameStartsWithOrGreater?: string;
        /** Optional filter by items whose name is sorted equally than a given input string. */
        nameStartsWith?: string;
        /** Optional filter by items whose name is equally or lesser than a given input string. */
        nameLessThan?: string;
        /** Optional. Specify one or more sort orders, comma delimited. */
        sortBy?: ItemSortBy[];
        /** Sort Order - Ascending,Descending. */
        sortOrder?: SortOrder[];
        /**
         * Optional, include image information in output.
         * @default true
         */
        enableImages?: boolean;
        /**
         * Optional. Include total record count.
         * @default true
         */
        enableTotalRecordCount?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/Genres`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Genres
     * @name GetGenre
     * @summary Gets a genre, by name.
     * @request GET:/Genres/{genreName}
     * @secure
     */
    getGenre: (
      genreName: string,
      query?: {
        /**
         * The user id.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDto, void>({
        path: `/Genres/${genreName}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name GetGenreImage
     * @summary Get genre image by name.
     * @request GET:/Genres/{name}/Images/{imageType}
     */
    getGenreImage: (
      name: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      query?: {
        /** Optional. Supply the cache tag from the item object to receive strong caching headers. */
        tag?: string;
        /** Determines the output format of the image - original,gif,jpg,png. */
        format?: 'Bmp' | 'Gif' | 'Jpg' | 'Png' | 'Webp' | 'Svg';
        /**
         * The maximum image width to return.
         * @format int32
         */
        maxWidth?: number;
        /**
         * The maximum image height to return.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Percent to render for the percent played overlay.
         * @format double
         */
        percentPlayed?: number;
        /**
         * Optional. Unplayed count overlay to render.
         * @format int32
         */
        unplayedCount?: number;
        /**
         * The fixed image width to return.
         * @format int32
         */
        width?: number;
        /**
         * The fixed image height to return.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases.
         * @format int32
         */
        quality?: number;
        /**
         * Width of box to fill.
         * @format int32
         */
        fillWidth?: number;
        /**
         * Height of box to fill.
         * @format int32
         */
        fillHeight?: number;
        /**
         * Optional. Blur image.
         * @format int32
         */
        blur?: number;
        /** Optional. Apply a background color for transparent images. */
        backgroundColor?: string;
        /** Optional. Apply a foreground layer on top of the image. */
        foregroundLayer?: string;
        /**
         * Image index.
         * @format int32
         */
        imageIndex?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/Genres/${name}/Images/${imageType}`,
        method: 'GET',
        query: query,
        format: 'blob',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name HeadGenreImage
     * @summary Get genre image by name.
     * @request HEAD:/Genres/{name}/Images/{imageType}
     */
    headGenreImage: (
      name: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      query?: {
        /** Optional. Supply the cache tag from the item object to receive strong caching headers. */
        tag?: string;
        /** Determines the output format of the image - original,gif,jpg,png. */
        format?: 'Bmp' | 'Gif' | 'Jpg' | 'Png' | 'Webp' | 'Svg';
        /**
         * The maximum image width to return.
         * @format int32
         */
        maxWidth?: number;
        /**
         * The maximum image height to return.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Percent to render for the percent played overlay.
         * @format double
         */
        percentPlayed?: number;
        /**
         * Optional. Unplayed count overlay to render.
         * @format int32
         */
        unplayedCount?: number;
        /**
         * The fixed image width to return.
         * @format int32
         */
        width?: number;
        /**
         * The fixed image height to return.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases.
         * @format int32
         */
        quality?: number;
        /**
         * Width of box to fill.
         * @format int32
         */
        fillWidth?: number;
        /**
         * Height of box to fill.
         * @format int32
         */
        fillHeight?: number;
        /**
         * Optional. Blur image.
         * @format int32
         */
        blur?: number;
        /** Optional. Apply a background color for transparent images. */
        backgroundColor?: string;
        /** Optional. Apply a foreground layer on top of the image. */
        foregroundLayer?: string;
        /**
         * Image index.
         * @format int32
         */
        imageIndex?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/Genres/${name}/Images/${imageType}`,
        method: 'HEAD',
        query: query,
        format: 'blob',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name GetGenreImageByIndex
     * @summary Get genre image by name.
     * @request GET:/Genres/{name}/Images/{imageType}/{imageIndex}
     */
    getGenreImageByIndex: (
      name: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      imageIndex: number,
      query?: {
        /** Optional. Supply the cache tag from the item object to receive strong caching headers. */
        tag?: string;
        /** Determines the output format of the image - original,gif,jpg,png. */
        format?: 'Bmp' | 'Gif' | 'Jpg' | 'Png' | 'Webp' | 'Svg';
        /**
         * The maximum image width to return.
         * @format int32
         */
        maxWidth?: number;
        /**
         * The maximum image height to return.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Percent to render for the percent played overlay.
         * @format double
         */
        percentPlayed?: number;
        /**
         * Optional. Unplayed count overlay to render.
         * @format int32
         */
        unplayedCount?: number;
        /**
         * The fixed image width to return.
         * @format int32
         */
        width?: number;
        /**
         * The fixed image height to return.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases.
         * @format int32
         */
        quality?: number;
        /**
         * Width of box to fill.
         * @format int32
         */
        fillWidth?: number;
        /**
         * Height of box to fill.
         * @format int32
         */
        fillHeight?: number;
        /**
         * Optional. Blur image.
         * @format int32
         */
        blur?: number;
        /** Optional. Apply a background color for transparent images. */
        backgroundColor?: string;
        /** Optional. Apply a foreground layer on top of the image. */
        foregroundLayer?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/Genres/${name}/Images/${imageType}/${imageIndex}`,
        method: 'GET',
        query: query,
        format: 'blob',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name HeadGenreImageByIndex
     * @summary Get genre image by name.
     * @request HEAD:/Genres/{name}/Images/{imageType}/{imageIndex}
     */
    headGenreImageByIndex: (
      name: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      imageIndex: number,
      query?: {
        /** Optional. Supply the cache tag from the item object to receive strong caching headers. */
        tag?: string;
        /** Determines the output format of the image - original,gif,jpg,png. */
        format?: 'Bmp' | 'Gif' | 'Jpg' | 'Png' | 'Webp' | 'Svg';
        /**
         * The maximum image width to return.
         * @format int32
         */
        maxWidth?: number;
        /**
         * The maximum image height to return.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Percent to render for the percent played overlay.
         * @format double
         */
        percentPlayed?: number;
        /**
         * Optional. Unplayed count overlay to render.
         * @format int32
         */
        unplayedCount?: number;
        /**
         * The fixed image width to return.
         * @format int32
         */
        width?: number;
        /**
         * The fixed image height to return.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases.
         * @format int32
         */
        quality?: number;
        /**
         * Width of box to fill.
         * @format int32
         */
        fillWidth?: number;
        /**
         * Height of box to fill.
         * @format int32
         */
        fillHeight?: number;
        /**
         * Optional. Blur image.
         * @format int32
         */
        blur?: number;
        /** Optional. Apply a background color for transparent images. */
        backgroundColor?: string;
        /** Optional. Apply a foreground layer on top of the image. */
        foregroundLayer?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/Genres/${name}/Images/${imageType}/${imageIndex}`,
        method: 'HEAD',
        query: query,
        format: 'blob',
        ...params,
      }),
  };
  musicGenres = {
    /**
     * No description
     *
     * @tags Image
     * @name GetMusicGenreImage
     * @summary Get music genre image by name.
     * @request GET:/MusicGenres/{name}/Images/{imageType}
     */
    getMusicGenreImage: (
      name: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      query?: {
        /** Optional. Supply the cache tag from the item object to receive strong caching headers. */
        tag?: string;
        /** Determines the output format of the image - original,gif,jpg,png. */
        format?: 'Bmp' | 'Gif' | 'Jpg' | 'Png' | 'Webp' | 'Svg';
        /**
         * The maximum image width to return.
         * @format int32
         */
        maxWidth?: number;
        /**
         * The maximum image height to return.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Percent to render for the percent played overlay.
         * @format double
         */
        percentPlayed?: number;
        /**
         * Optional. Unplayed count overlay to render.
         * @format int32
         */
        unplayedCount?: number;
        /**
         * The fixed image width to return.
         * @format int32
         */
        width?: number;
        /**
         * The fixed image height to return.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases.
         * @format int32
         */
        quality?: number;
        /**
         * Width of box to fill.
         * @format int32
         */
        fillWidth?: number;
        /**
         * Height of box to fill.
         * @format int32
         */
        fillHeight?: number;
        /**
         * Optional. Blur image.
         * @format int32
         */
        blur?: number;
        /** Optional. Apply a background color for transparent images. */
        backgroundColor?: string;
        /** Optional. Apply a foreground layer on top of the image. */
        foregroundLayer?: string;
        /**
         * Image index.
         * @format int32
         */
        imageIndex?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/MusicGenres/${name}/Images/${imageType}`,
        method: 'GET',
        query: query,
        format: 'blob',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name HeadMusicGenreImage
     * @summary Get music genre image by name.
     * @request HEAD:/MusicGenres/{name}/Images/{imageType}
     */
    headMusicGenreImage: (
      name: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      query?: {
        /** Optional. Supply the cache tag from the item object to receive strong caching headers. */
        tag?: string;
        /** Determines the output format of the image - original,gif,jpg,png. */
        format?: 'Bmp' | 'Gif' | 'Jpg' | 'Png' | 'Webp' | 'Svg';
        /**
         * The maximum image width to return.
         * @format int32
         */
        maxWidth?: number;
        /**
         * The maximum image height to return.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Percent to render for the percent played overlay.
         * @format double
         */
        percentPlayed?: number;
        /**
         * Optional. Unplayed count overlay to render.
         * @format int32
         */
        unplayedCount?: number;
        /**
         * The fixed image width to return.
         * @format int32
         */
        width?: number;
        /**
         * The fixed image height to return.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases.
         * @format int32
         */
        quality?: number;
        /**
         * Width of box to fill.
         * @format int32
         */
        fillWidth?: number;
        /**
         * Height of box to fill.
         * @format int32
         */
        fillHeight?: number;
        /**
         * Optional. Blur image.
         * @format int32
         */
        blur?: number;
        /** Optional. Apply a background color for transparent images. */
        backgroundColor?: string;
        /** Optional. Apply a foreground layer on top of the image. */
        foregroundLayer?: string;
        /**
         * Image index.
         * @format int32
         */
        imageIndex?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/MusicGenres/${name}/Images/${imageType}`,
        method: 'HEAD',
        query: query,
        format: 'blob',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name GetMusicGenreImageByIndex
     * @summary Get music genre image by name.
     * @request GET:/MusicGenres/{name}/Images/{imageType}/{imageIndex}
     */
    getMusicGenreImageByIndex: (
      name: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      imageIndex: number,
      query?: {
        /** Optional. Supply the cache tag from the item object to receive strong caching headers. */
        tag?: string;
        /** Determines the output format of the image - original,gif,jpg,png. */
        format?: 'Bmp' | 'Gif' | 'Jpg' | 'Png' | 'Webp' | 'Svg';
        /**
         * The maximum image width to return.
         * @format int32
         */
        maxWidth?: number;
        /**
         * The maximum image height to return.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Percent to render for the percent played overlay.
         * @format double
         */
        percentPlayed?: number;
        /**
         * Optional. Unplayed count overlay to render.
         * @format int32
         */
        unplayedCount?: number;
        /**
         * The fixed image width to return.
         * @format int32
         */
        width?: number;
        /**
         * The fixed image height to return.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases.
         * @format int32
         */
        quality?: number;
        /**
         * Width of box to fill.
         * @format int32
         */
        fillWidth?: number;
        /**
         * Height of box to fill.
         * @format int32
         */
        fillHeight?: number;
        /**
         * Optional. Blur image.
         * @format int32
         */
        blur?: number;
        /** Optional. Apply a background color for transparent images. */
        backgroundColor?: string;
        /** Optional. Apply a foreground layer on top of the image. */
        foregroundLayer?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/MusicGenres/${name}/Images/${imageType}/${imageIndex}`,
        method: 'GET',
        query: query,
        format: 'blob',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name HeadMusicGenreImageByIndex
     * @summary Get music genre image by name.
     * @request HEAD:/MusicGenres/{name}/Images/{imageType}/{imageIndex}
     */
    headMusicGenreImageByIndex: (
      name: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      imageIndex: number,
      query?: {
        /** Optional. Supply the cache tag from the item object to receive strong caching headers. */
        tag?: string;
        /** Determines the output format of the image - original,gif,jpg,png. */
        format?: 'Bmp' | 'Gif' | 'Jpg' | 'Png' | 'Webp' | 'Svg';
        /**
         * The maximum image width to return.
         * @format int32
         */
        maxWidth?: number;
        /**
         * The maximum image height to return.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Percent to render for the percent played overlay.
         * @format double
         */
        percentPlayed?: number;
        /**
         * Optional. Unplayed count overlay to render.
         * @format int32
         */
        unplayedCount?: number;
        /**
         * The fixed image width to return.
         * @format int32
         */
        width?: number;
        /**
         * The fixed image height to return.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases.
         * @format int32
         */
        quality?: number;
        /**
         * Width of box to fill.
         * @format int32
         */
        fillWidth?: number;
        /**
         * Height of box to fill.
         * @format int32
         */
        fillHeight?: number;
        /**
         * Optional. Blur image.
         * @format int32
         */
        blur?: number;
        /** Optional. Apply a background color for transparent images. */
        backgroundColor?: string;
        /** Optional. Apply a foreground layer on top of the image. */
        foregroundLayer?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/MusicGenres/${name}/Images/${imageType}/${imageIndex}`,
        method: 'HEAD',
        query: query,
        format: 'blob',
        ...params,
      }),

    /**
     * No description
     *
     * @tags InstantMix
     * @name GetInstantMixFromMusicGenreByName
     * @summary Creates an instant playlist based on a given genre.
     * @request GET:/MusicGenres/{name}/InstantMix
     * @secure
     */
    getInstantMixFromMusicGenreByName: (
      name: string,
      query?: {
        /**
         * Optional. Filter by user id, and attach user data.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Specify additional fields of information to return in the output. */
        fields?: ItemFields[];
        /** Optional. Include image information in output. */
        enableImages?: boolean;
        /** Optional. Include user data. */
        enableUserData?: boolean;
        /**
         * Optional. The max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/MusicGenres/${name}/InstantMix`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags InstantMix
     * @name GetInstantMixFromMusicGenreById
     * @summary Creates an instant playlist based on a given genre.
     * @request GET:/MusicGenres/InstantMix
     * @secure
     */
    getInstantMixFromMusicGenreById: (
      query: {
        /**
         * The item id.
         * @format uuid
         */
        id: string;
        /**
         * Optional. Filter by user id, and attach user data.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Specify additional fields of information to return in the output. */
        fields?: ItemFields[];
        /** Optional. Include image information in output. */
        enableImages?: boolean;
        /** Optional. Include user data. */
        enableUserData?: boolean;
        /**
         * Optional. The max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void | ProblemDetails>({
        path: `/MusicGenres/InstantMix`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags MusicGenres
     * @name GetMusicGenres
     * @summary Gets all music genres from a given item, folder, or the entire library.
     * @request GET:/MusicGenres
     * @deprecated
     * @secure
     */
    getMusicGenres: (
      query?: {
        /**
         * Optional. The record index to start at. All items with a lower index will be dropped from the results.
         * @format int32
         */
        startIndex?: number;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** The search term. */
        searchTerm?: string;
        /**
         * Specify this to localize the search to a specific item or folder. Omit to use the root.
         * @format uuid
         */
        parentId?: string;
        /** Optional. Specify additional fields of information to return in the output. */
        fields?: ItemFields[];
        /** Optional. If specified, results will be filtered out based on item type. This allows multiple, comma delimited. */
        excludeItemTypes?: BaseItemKind[];
        /** Optional. If specified, results will be filtered in based on item type. This allows multiple, comma delimited. */
        includeItemTypes?: BaseItemKind[];
        /** Optional filter by items that are marked as favorite, or not. */
        isFavorite?: boolean;
        /**
         * Optional, the max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
        /**
         * User id.
         * @format uuid
         */
        userId?: string;
        /** Optional filter by items whose name is sorted equally or greater than a given input string. */
        nameStartsWithOrGreater?: string;
        /** Optional filter by items whose name is sorted equally than a given input string. */
        nameStartsWith?: string;
        /** Optional filter by items whose name is equally or lesser than a given input string. */
        nameLessThan?: string;
        /** Optional. Specify one or more sort orders, comma delimited. */
        sortBy?: ItemSortBy[];
        /** Sort Order - Ascending,Descending. */
        sortOrder?: SortOrder[];
        /**
         * Optional, include image information in output.
         * @default true
         */
        enableImages?: boolean;
        /**
         * Optional. Include total record count.
         * @default true
         */
        enableTotalRecordCount?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/MusicGenres`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags MusicGenres
     * @name GetMusicGenre
     * @summary Gets a music genre, by name.
     * @request GET:/MusicGenres/{genreName}
     * @secure
     */
    getMusicGenre: (
      genreName: string,
      query?: {
        /**
         * Optional. Filter by user id, and attach user data.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDto, void>({
        path: `/MusicGenres/${genreName}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),
  };
  persons = {
    /**
     * No description
     *
     * @tags Image
     * @name GetPersonImage
     * @summary Get person image by name.
     * @request GET:/Persons/{name}/Images/{imageType}
     */
    getPersonImage: (
      name: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      query?: {
        /** Optional. Supply the cache tag from the item object to receive strong caching headers. */
        tag?: string;
        /** Determines the output format of the image - original,gif,jpg,png. */
        format?: 'Bmp' | 'Gif' | 'Jpg' | 'Png' | 'Webp' | 'Svg';
        /**
         * The maximum image width to return.
         * @format int32
         */
        maxWidth?: number;
        /**
         * The maximum image height to return.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Percent to render for the percent played overlay.
         * @format double
         */
        percentPlayed?: number;
        /**
         * Optional. Unplayed count overlay to render.
         * @format int32
         */
        unplayedCount?: number;
        /**
         * The fixed image width to return.
         * @format int32
         */
        width?: number;
        /**
         * The fixed image height to return.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases.
         * @format int32
         */
        quality?: number;
        /**
         * Width of box to fill.
         * @format int32
         */
        fillWidth?: number;
        /**
         * Height of box to fill.
         * @format int32
         */
        fillHeight?: number;
        /**
         * Optional. Blur image.
         * @format int32
         */
        blur?: number;
        /** Optional. Apply a background color for transparent images. */
        backgroundColor?: string;
        /** Optional. Apply a foreground layer on top of the image. */
        foregroundLayer?: string;
        /**
         * Image index.
         * @format int32
         */
        imageIndex?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/Persons/${name}/Images/${imageType}`,
        method: 'GET',
        query: query,
        format: 'blob',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name HeadPersonImage
     * @summary Get person image by name.
     * @request HEAD:/Persons/{name}/Images/{imageType}
     */
    headPersonImage: (
      name: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      query?: {
        /** Optional. Supply the cache tag from the item object to receive strong caching headers. */
        tag?: string;
        /** Determines the output format of the image - original,gif,jpg,png. */
        format?: 'Bmp' | 'Gif' | 'Jpg' | 'Png' | 'Webp' | 'Svg';
        /**
         * The maximum image width to return.
         * @format int32
         */
        maxWidth?: number;
        /**
         * The maximum image height to return.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Percent to render for the percent played overlay.
         * @format double
         */
        percentPlayed?: number;
        /**
         * Optional. Unplayed count overlay to render.
         * @format int32
         */
        unplayedCount?: number;
        /**
         * The fixed image width to return.
         * @format int32
         */
        width?: number;
        /**
         * The fixed image height to return.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases.
         * @format int32
         */
        quality?: number;
        /**
         * Width of box to fill.
         * @format int32
         */
        fillWidth?: number;
        /**
         * Height of box to fill.
         * @format int32
         */
        fillHeight?: number;
        /**
         * Optional. Blur image.
         * @format int32
         */
        blur?: number;
        /** Optional. Apply a background color for transparent images. */
        backgroundColor?: string;
        /** Optional. Apply a foreground layer on top of the image. */
        foregroundLayer?: string;
        /**
         * Image index.
         * @format int32
         */
        imageIndex?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/Persons/${name}/Images/${imageType}`,
        method: 'HEAD',
        query: query,
        format: 'blob',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name GetPersonImageByIndex
     * @summary Get person image by name.
     * @request GET:/Persons/{name}/Images/{imageType}/{imageIndex}
     */
    getPersonImageByIndex: (
      name: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      imageIndex: number,
      query?: {
        /** Optional. Supply the cache tag from the item object to receive strong caching headers. */
        tag?: string;
        /** Determines the output format of the image - original,gif,jpg,png. */
        format?: 'Bmp' | 'Gif' | 'Jpg' | 'Png' | 'Webp' | 'Svg';
        /**
         * The maximum image width to return.
         * @format int32
         */
        maxWidth?: number;
        /**
         * The maximum image height to return.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Percent to render for the percent played overlay.
         * @format double
         */
        percentPlayed?: number;
        /**
         * Optional. Unplayed count overlay to render.
         * @format int32
         */
        unplayedCount?: number;
        /**
         * The fixed image width to return.
         * @format int32
         */
        width?: number;
        /**
         * The fixed image height to return.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases.
         * @format int32
         */
        quality?: number;
        /**
         * Width of box to fill.
         * @format int32
         */
        fillWidth?: number;
        /**
         * Height of box to fill.
         * @format int32
         */
        fillHeight?: number;
        /**
         * Optional. Blur image.
         * @format int32
         */
        blur?: number;
        /** Optional. Apply a background color for transparent images. */
        backgroundColor?: string;
        /** Optional. Apply a foreground layer on top of the image. */
        foregroundLayer?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/Persons/${name}/Images/${imageType}/${imageIndex}`,
        method: 'GET',
        query: query,
        format: 'blob',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name HeadPersonImageByIndex
     * @summary Get person image by name.
     * @request HEAD:/Persons/{name}/Images/{imageType}/{imageIndex}
     */
    headPersonImageByIndex: (
      name: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      imageIndex: number,
      query?: {
        /** Optional. Supply the cache tag from the item object to receive strong caching headers. */
        tag?: string;
        /** Determines the output format of the image - original,gif,jpg,png. */
        format?: 'Bmp' | 'Gif' | 'Jpg' | 'Png' | 'Webp' | 'Svg';
        /**
         * The maximum image width to return.
         * @format int32
         */
        maxWidth?: number;
        /**
         * The maximum image height to return.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Percent to render for the percent played overlay.
         * @format double
         */
        percentPlayed?: number;
        /**
         * Optional. Unplayed count overlay to render.
         * @format int32
         */
        unplayedCount?: number;
        /**
         * The fixed image width to return.
         * @format int32
         */
        width?: number;
        /**
         * The fixed image height to return.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases.
         * @format int32
         */
        quality?: number;
        /**
         * Width of box to fill.
         * @format int32
         */
        fillWidth?: number;
        /**
         * Height of box to fill.
         * @format int32
         */
        fillHeight?: number;
        /**
         * Optional. Blur image.
         * @format int32
         */
        blur?: number;
        /** Optional. Apply a background color for transparent images. */
        backgroundColor?: string;
        /** Optional. Apply a foreground layer on top of the image. */
        foregroundLayer?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/Persons/${name}/Images/${imageType}/${imageIndex}`,
        method: 'HEAD',
        query: query,
        format: 'blob',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Persons
     * @name GetPersons
     * @summary Gets all persons.
     * @request GET:/Persons
     * @secure
     */
    getPersons: (
      query?: {
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** The search term. */
        searchTerm?: string;
        /** Optional. Specify additional fields of information to return in the output. */
        fields?: ItemFields[];
        /** Optional. Specify additional filters to apply. */
        filters?: ItemFilter[];
        /** Optional filter by items that are marked as favorite, or not. userId is required. */
        isFavorite?: boolean;
        /** Optional, include user data. */
        enableUserData?: boolean;
        /**
         * Optional, the max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
        /** Optional. If specified results will be filtered to exclude those containing the specified PersonType. Allows multiple, comma-delimited. */
        excludePersonTypes?: string[];
        /** Optional. If specified results will be filtered to include only those containing the specified PersonType. Allows multiple, comma-delimited. */
        personTypes?: string[];
        /**
         * Optional. If specified, person results will be filtered on items related to said persons.
         * @format uuid
         */
        appearsInItemId?: string;
        /**
         * User id.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional, include image information in output.
         * @default true
         */
        enableImages?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/Persons`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Persons
     * @name GetPerson
     * @summary Get person by name.
     * @request GET:/Persons/{name}
     * @secure
     */
    getPerson: (
      name: string,
      query?: {
        /**
         * Optional. Filter by user id, and attach user data.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDto, void | ProblemDetails>({
        path: `/Persons/${name}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),
  };
  studios = {
    /**
     * No description
     *
     * @tags Image
     * @name GetStudioImage
     * @summary Get studio image by name.
     * @request GET:/Studios/{name}/Images/{imageType}
     */
    getStudioImage: (
      name: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      query?: {
        /** Optional. Supply the cache tag from the item object to receive strong caching headers. */
        tag?: string;
        /** Determines the output format of the image - original,gif,jpg,png. */
        format?: 'Bmp' | 'Gif' | 'Jpg' | 'Png' | 'Webp' | 'Svg';
        /**
         * The maximum image width to return.
         * @format int32
         */
        maxWidth?: number;
        /**
         * The maximum image height to return.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Percent to render for the percent played overlay.
         * @format double
         */
        percentPlayed?: number;
        /**
         * Optional. Unplayed count overlay to render.
         * @format int32
         */
        unplayedCount?: number;
        /**
         * The fixed image width to return.
         * @format int32
         */
        width?: number;
        /**
         * The fixed image height to return.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases.
         * @format int32
         */
        quality?: number;
        /**
         * Width of box to fill.
         * @format int32
         */
        fillWidth?: number;
        /**
         * Height of box to fill.
         * @format int32
         */
        fillHeight?: number;
        /**
         * Optional. Blur image.
         * @format int32
         */
        blur?: number;
        /** Optional. Apply a background color for transparent images. */
        backgroundColor?: string;
        /** Optional. Apply a foreground layer on top of the image. */
        foregroundLayer?: string;
        /**
         * Image index.
         * @format int32
         */
        imageIndex?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/Studios/${name}/Images/${imageType}`,
        method: 'GET',
        query: query,
        format: 'blob',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name HeadStudioImage
     * @summary Get studio image by name.
     * @request HEAD:/Studios/{name}/Images/{imageType}
     */
    headStudioImage: (
      name: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      query?: {
        /** Optional. Supply the cache tag from the item object to receive strong caching headers. */
        tag?: string;
        /** Determines the output format of the image - original,gif,jpg,png. */
        format?: 'Bmp' | 'Gif' | 'Jpg' | 'Png' | 'Webp' | 'Svg';
        /**
         * The maximum image width to return.
         * @format int32
         */
        maxWidth?: number;
        /**
         * The maximum image height to return.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Percent to render for the percent played overlay.
         * @format double
         */
        percentPlayed?: number;
        /**
         * Optional. Unplayed count overlay to render.
         * @format int32
         */
        unplayedCount?: number;
        /**
         * The fixed image width to return.
         * @format int32
         */
        width?: number;
        /**
         * The fixed image height to return.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases.
         * @format int32
         */
        quality?: number;
        /**
         * Width of box to fill.
         * @format int32
         */
        fillWidth?: number;
        /**
         * Height of box to fill.
         * @format int32
         */
        fillHeight?: number;
        /**
         * Optional. Blur image.
         * @format int32
         */
        blur?: number;
        /** Optional. Apply a background color for transparent images. */
        backgroundColor?: string;
        /** Optional. Apply a foreground layer on top of the image. */
        foregroundLayer?: string;
        /**
         * Image index.
         * @format int32
         */
        imageIndex?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/Studios/${name}/Images/${imageType}`,
        method: 'HEAD',
        query: query,
        format: 'blob',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name GetStudioImageByIndex
     * @summary Get studio image by name.
     * @request GET:/Studios/{name}/Images/{imageType}/{imageIndex}
     */
    getStudioImageByIndex: (
      name: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      imageIndex: number,
      query?: {
        /** Optional. Supply the cache tag from the item object to receive strong caching headers. */
        tag?: string;
        /** Determines the output format of the image - original,gif,jpg,png. */
        format?: 'Bmp' | 'Gif' | 'Jpg' | 'Png' | 'Webp' | 'Svg';
        /**
         * The maximum image width to return.
         * @format int32
         */
        maxWidth?: number;
        /**
         * The maximum image height to return.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Percent to render for the percent played overlay.
         * @format double
         */
        percentPlayed?: number;
        /**
         * Optional. Unplayed count overlay to render.
         * @format int32
         */
        unplayedCount?: number;
        /**
         * The fixed image width to return.
         * @format int32
         */
        width?: number;
        /**
         * The fixed image height to return.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases.
         * @format int32
         */
        quality?: number;
        /**
         * Width of box to fill.
         * @format int32
         */
        fillWidth?: number;
        /**
         * Height of box to fill.
         * @format int32
         */
        fillHeight?: number;
        /**
         * Optional. Blur image.
         * @format int32
         */
        blur?: number;
        /** Optional. Apply a background color for transparent images. */
        backgroundColor?: string;
        /** Optional. Apply a foreground layer on top of the image. */
        foregroundLayer?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/Studios/${name}/Images/${imageType}/${imageIndex}`,
        method: 'GET',
        query: query,
        format: 'blob',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name HeadStudioImageByIndex
     * @summary Get studio image by name.
     * @request HEAD:/Studios/{name}/Images/{imageType}/{imageIndex}
     */
    headStudioImageByIndex: (
      name: string,
      imageType:
        | 'Primary'
        | 'Art'
        | 'Backdrop'
        | 'Banner'
        | 'Logo'
        | 'Thumb'
        | 'Disc'
        | 'Box'
        | 'Screenshot'
        | 'Menu'
        | 'Chapter'
        | 'BoxRear'
        | 'Profile',
      imageIndex: number,
      query?: {
        /** Optional. Supply the cache tag from the item object to receive strong caching headers. */
        tag?: string;
        /** Determines the output format of the image - original,gif,jpg,png. */
        format?: 'Bmp' | 'Gif' | 'Jpg' | 'Png' | 'Webp' | 'Svg';
        /**
         * The maximum image width to return.
         * @format int32
         */
        maxWidth?: number;
        /**
         * The maximum image height to return.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Percent to render for the percent played overlay.
         * @format double
         */
        percentPlayed?: number;
        /**
         * Optional. Unplayed count overlay to render.
         * @format int32
         */
        unplayedCount?: number;
        /**
         * The fixed image width to return.
         * @format int32
         */
        width?: number;
        /**
         * The fixed image height to return.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases.
         * @format int32
         */
        quality?: number;
        /**
         * Width of box to fill.
         * @format int32
         */
        fillWidth?: number;
        /**
         * Height of box to fill.
         * @format int32
         */
        fillHeight?: number;
        /**
         * Optional. Blur image.
         * @format int32
         */
        blur?: number;
        /** Optional. Apply a background color for transparent images. */
        backgroundColor?: string;
        /** Optional. Apply a foreground layer on top of the image. */
        foregroundLayer?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/Studios/${name}/Images/${imageType}/${imageIndex}`,
        method: 'HEAD',
        query: query,
        format: 'blob',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Studios
     * @name GetStudios
     * @summary Gets all studios from a given item, folder, or the entire library.
     * @request GET:/Studios
     * @secure
     */
    getStudios: (
      query?: {
        /**
         * Optional. The record index to start at. All items with a lower index will be dropped from the results.
         * @format int32
         */
        startIndex?: number;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Search term. */
        searchTerm?: string;
        /**
         * Specify this to localize the search to a specific item or folder. Omit to use the root.
         * @format uuid
         */
        parentId?: string;
        /** Optional. Specify additional fields of information to return in the output. */
        fields?: ItemFields[];
        /** Optional. If specified, results will be filtered out based on item type. This allows multiple, comma delimited. */
        excludeItemTypes?: BaseItemKind[];
        /** Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimited. */
        includeItemTypes?: BaseItemKind[];
        /** Optional filter by items that are marked as favorite, or not. */
        isFavorite?: boolean;
        /** Optional, include user data. */
        enableUserData?: boolean;
        /**
         * Optional, the max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
        /**
         * User id.
         * @format uuid
         */
        userId?: string;
        /** Optional filter by items whose name is sorted equally or greater than a given input string. */
        nameStartsWithOrGreater?: string;
        /** Optional filter by items whose name is sorted equally than a given input string. */
        nameStartsWith?: string;
        /** Optional filter by items whose name is equally or lesser than a given input string. */
        nameLessThan?: string;
        /**
         * Optional, include image information in output.
         * @default true
         */
        enableImages?: boolean;
        /**
         * Total record count.
         * @default true
         */
        enableTotalRecordCount?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/Studios`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Studios
     * @name GetStudio
     * @summary Gets a studio by name.
     * @request GET:/Studios/{name}
     * @secure
     */
    getStudio: (
      name: string,
      query?: {
        /**
         * Optional. Filter by user id, and attach user data.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDto, void>({
        path: `/Studios/${name}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),
  };
  userImage = {
    /**
     * No description
     *
     * @tags Image
     * @name PostUserImage
     * @summary Sets the user image.
     * @request POST:/UserImage
     * @secure
     */
    postUserImage: (
      data: File,
      query?: {
        /**
         * User Id.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, ProblemDetails | void>({
        path: `/UserImage`,
        method: 'POST',
        query: query,
        body: data,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name DeleteUserImage
     * @summary Delete the user's image.
     * @request DELETE:/UserImage
     * @secure
     */
    deleteUserImage: (
      query?: {
        /**
         * User Id.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void | ProblemDetails>({
        path: `/UserImage`,
        method: 'DELETE',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name GetUserImage
     * @summary Get user profile image.
     * @request GET:/UserImage
     */
    getUserImage: (
      query?: {
        /**
         * User id.
         * @format uuid
         */
        userId?: string;
        /** Optional. Supply the cache tag from the item object to receive strong caching headers. */
        tag?: string;
        /** Determines the output format of the image - original,gif,jpg,png. */
        format?: 'Bmp' | 'Gif' | 'Jpg' | 'Png' | 'Webp' | 'Svg';
        /**
         * The maximum image width to return.
         * @format int32
         */
        maxWidth?: number;
        /**
         * The maximum image height to return.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Percent to render for the percent played overlay.
         * @format double
         */
        percentPlayed?: number;
        /**
         * Optional. Unplayed count overlay to render.
         * @format int32
         */
        unplayedCount?: number;
        /**
         * The fixed image width to return.
         * @format int32
         */
        width?: number;
        /**
         * The fixed image height to return.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases.
         * @format int32
         */
        quality?: number;
        /**
         * Width of box to fill.
         * @format int32
         */
        fillWidth?: number;
        /**
         * Height of box to fill.
         * @format int32
         */
        fillHeight?: number;
        /**
         * Optional. Blur image.
         * @format int32
         */
        blur?: number;
        /** Optional. Apply a background color for transparent images. */
        backgroundColor?: string;
        /** Optional. Apply a foreground layer on top of the image. */
        foregroundLayer?: string;
        /**
         * Image index.
         * @format int32
         */
        imageIndex?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/UserImage`,
        method: 'GET',
        query: query,
        format: 'blob',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Image
     * @name HeadUserImage
     * @summary Get user profile image.
     * @request HEAD:/UserImage
     */
    headUserImage: (
      query?: {
        /**
         * User id.
         * @format uuid
         */
        userId?: string;
        /** Optional. Supply the cache tag from the item object to receive strong caching headers. */
        tag?: string;
        /** Determines the output format of the image - original,gif,jpg,png. */
        format?: 'Bmp' | 'Gif' | 'Jpg' | 'Png' | 'Webp' | 'Svg';
        /**
         * The maximum image width to return.
         * @format int32
         */
        maxWidth?: number;
        /**
         * The maximum image height to return.
         * @format int32
         */
        maxHeight?: number;
        /**
         * Optional. Percent to render for the percent played overlay.
         * @format double
         */
        percentPlayed?: number;
        /**
         * Optional. Unplayed count overlay to render.
         * @format int32
         */
        unplayedCount?: number;
        /**
         * The fixed image width to return.
         * @format int32
         */
        width?: number;
        /**
         * The fixed image height to return.
         * @format int32
         */
        height?: number;
        /**
         * Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases.
         * @format int32
         */
        quality?: number;
        /**
         * Width of box to fill.
         * @format int32
         */
        fillWidth?: number;
        /**
         * Height of box to fill.
         * @format int32
         */
        fillHeight?: number;
        /**
         * Optional. Blur image.
         * @format int32
         */
        blur?: number;
        /** Optional. Apply a background color for transparent images. */
        backgroundColor?: string;
        /** Optional. Apply a foreground layer on top of the image. */
        foregroundLayer?: string;
        /**
         * Image index.
         * @format int32
         */
        imageIndex?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails>({
        path: `/UserImage`,
        method: 'HEAD',
        query: query,
        format: 'blob',
        ...params,
      }),
  };
  albums = {
    /**
     * No description
     *
     * @tags InstantMix
     * @name GetInstantMixFromAlbum
     * @summary Creates an instant playlist based on a given album.
     * @request GET:/Albums/{itemId}/InstantMix
     * @secure
     */
    getInstantMixFromAlbum: (
      itemId: string,
      query?: {
        /**
         * Optional. Filter by user id, and attach user data.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Specify additional fields of information to return in the output. */
        fields?: ItemFields[];
        /** Optional. Include image information in output. */
        enableImages?: boolean;
        /** Optional. Include user data. */
        enableUserData?: boolean;
        /**
         * Optional. The max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void | ProblemDetails>({
        path: `/Albums/${itemId}/InstantMix`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library
     * @name GetSimilarAlbums
     * @summary Gets similar items.
     * @request GET:/Albums/{itemId}/Similar
     * @secure
     */
    getSimilarAlbums: (
      itemId: string,
      query?: {
        /** Exclude artist ids. */
        excludeArtistIds?: string[];
        /**
         * Optional. Filter by user id, and attach user data.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimited. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines, TrailerUrls. */
        fields?: ItemFields[];
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/Albums/${itemId}/Similar`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),
  };
  playlists = {
    /**
     * No description
     *
     * @tags InstantMix
     * @name GetInstantMixFromPlaylist
     * @summary Creates an instant playlist based on a given playlist.
     * @request GET:/Playlists/{itemId}/InstantMix
     * @secure
     */
    getInstantMixFromPlaylist: (
      itemId: string,
      query?: {
        /**
         * Optional. Filter by user id, and attach user data.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Specify additional fields of information to return in the output. */
        fields?: ItemFields[];
        /** Optional. Include image information in output. */
        enableImages?: boolean;
        /** Optional. Include user data. */
        enableUserData?: boolean;
        /**
         * Optional. The max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void | ProblemDetails>({
        path: `/Playlists/${itemId}/InstantMix`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description For backwards compatibility parameters can be sent via Query or Body, with Query having higher precedence. Query parameters are obsolete.
     *
     * @tags Playlists
     * @name CreatePlaylist
     * @summary Creates a new playlist.
     * @request POST:/Playlists
     * @secure
     */
    createPlaylist: (
      data: CreatePlaylistDto,
      query?: {
        /**
         * The playlist name.
         * @deprecated
         */
        name?: string;
        /**
         * The item ids.
         * @deprecated
         */
        ids?: string[];
        /**
         * The user id.
         * @deprecated
         * @format uuid
         */
        userId?: string;
        /**
         * The media type.
         * @deprecated
         */
        mediaType?: 'Unknown' | 'Video' | 'Audio' | 'Photo' | 'Book';
      },
      params: RequestParams = {},
    ) =>
      this.request<PlaylistCreationResult, void>({
        path: `/Playlists`,
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
     * @tags Playlists
     * @name UpdatePlaylist
     * @summary Updates a playlist.
     * @request POST:/Playlists/{playlistId}
     * @secure
     */
    updatePlaylist: (playlistId: string, data: UpdatePlaylistDto, params: RequestParams = {}) =>
      this.request<void, void | ProblemDetails>({
        path: `/Playlists/${playlistId}`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Playlists
     * @name GetPlaylist
     * @summary Get a playlist.
     * @request GET:/Playlists/{playlistId}
     * @secure
     */
    getPlaylist: (playlistId: string, params: RequestParams = {}) =>
      this.request<PlaylistDto, void | ProblemDetails>({
        path: `/Playlists/${playlistId}`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Playlists
     * @name AddItemToPlaylist
     * @summary Adds items to a playlist.
     * @request POST:/Playlists/{playlistId}/Items
     * @secure
     */
    addItemToPlaylist: (
      playlistId: string,
      query?: {
        /** Item id, comma delimited. */
        ids?: string[];
        /**
         * The userId.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void | ProblemDetails>({
        path: `/Playlists/${playlistId}/Items`,
        method: 'POST',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Playlists
     * @name RemoveItemFromPlaylist
     * @summary Removes items from a playlist.
     * @request DELETE:/Playlists/{playlistId}/Items
     * @secure
     */
    removeItemFromPlaylist: (
      playlistId: string,
      query?: {
        /** The item ids, comma delimited. */
        entryIds?: string[];
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void | ProblemDetails>({
        path: `/Playlists/${playlistId}/Items`,
        method: 'DELETE',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Playlists
     * @name GetPlaylistItems
     * @summary Gets the original items of a playlist.
     * @request GET:/Playlists/{playlistId}/Items
     * @secure
     */
    getPlaylistItems: (
      playlistId: string,
      query?: {
        /**
         * User id.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. The record index to start at. All items with a lower index will be dropped from the results.
         * @format int32
         */
        startIndex?: number;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Specify additional fields of information to return in the output. */
        fields?: ItemFields[];
        /** Optional. Include image information in output. */
        enableImages?: boolean;
        /** Optional. Include user data. */
        enableUserData?: boolean;
        /**
         * Optional. The max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void | ProblemDetails>({
        path: `/Playlists/${playlistId}/Items`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Playlists
     * @name MoveItem
     * @summary Moves a playlist item.
     * @request POST:/Playlists/{playlistId}/Items/{itemId}/Move/{newIndex}
     * @secure
     */
    moveItem: (playlistId: string, itemId: string, newIndex: number, params: RequestParams = {}) =>
      this.request<void, void | ProblemDetails>({
        path: `/Playlists/${playlistId}/Items/${itemId}/Move/${newIndex}`,
        method: 'POST',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Playlists
     * @name GetPlaylistUsers
     * @summary Get a playlist's users.
     * @request GET:/Playlists/{playlistId}/Users
     * @secure
     */
    getPlaylistUsers: (playlistId: string, params: RequestParams = {}) =>
      this.request<PlaylistUserPermissions[], void | ProblemDetails>({
        path: `/Playlists/${playlistId}/Users`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Playlists
     * @name GetPlaylistUser
     * @summary Get a playlist user.
     * @request GET:/Playlists/{playlistId}/Users/{userId}
     * @secure
     */
    getPlaylistUser: (playlistId: string, userId: string, params: RequestParams = {}) =>
      this.request<PlaylistUserPermissions, void | ProblemDetails>({
        path: `/Playlists/${playlistId}/Users/${userId}`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Playlists
     * @name UpdatePlaylistUser
     * @summary Modify a user of a playlist's users.
     * @request POST:/Playlists/{playlistId}/Users/{userId}
     * @secure
     */
    updatePlaylistUser: (playlistId: string, userId: string, data: UpdatePlaylistUserDto, params: RequestParams = {}) =>
      this.request<void, void | ProblemDetails>({
        path: `/Playlists/${playlistId}/Users/${userId}`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Playlists
     * @name RemoveUserFromPlaylist
     * @summary Remove a user from a playlist's users.
     * @request DELETE:/Playlists/{playlistId}/Users/{userId}
     * @secure
     */
    removeUserFromPlaylist: (playlistId: string, userId: string, params: RequestParams = {}) =>
      this.request<void, void | ProblemDetails>({
        path: `/Playlists/${playlistId}/Users/${userId}`,
        method: 'DELETE',
        secure: true,
        ...params,
      }),
  };
  songs = {
    /**
     * No description
     *
     * @tags InstantMix
     * @name GetInstantMixFromSong
     * @summary Creates an instant playlist based on a given song.
     * @request GET:/Songs/{itemId}/InstantMix
     * @secure
     */
    getInstantMixFromSong: (
      itemId: string,
      query?: {
        /**
         * Optional. Filter by user id, and attach user data.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Specify additional fields of information to return in the output. */
        fields?: ItemFields[];
        /** Optional. Include image information in output. */
        enableImages?: boolean;
        /** Optional. Include user data. */
        enableUserData?: boolean;
        /**
         * Optional. The max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void | ProblemDetails>({
        path: `/Songs/${itemId}/InstantMix`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),
  };
  userItems = {
    /**
     * No description
     *
     * @tags Items
     * @name GetItemUserData
     * @summary Get Item User Data.
     * @request GET:/UserItems/{itemId}/UserData
     * @secure
     */
    getItemUserData: (
      itemId: string,
      query?: {
        /**
         * The user id.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<UserItemDataDto, void | ProblemDetails>({
        path: `/UserItems/${itemId}/UserData`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Items
     * @name UpdateItemUserData
     * @summary Update Item User Data.
     * @request POST:/UserItems/{itemId}/UserData
     * @secure
     */
    updateItemUserData: (
      itemId: string,
      data: UpdateUserItemDataDto,
      query?: {
        /**
         * The user id.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<UserItemDataDto, void | ProblemDetails>({
        path: `/UserItems/${itemId}/UserData`,
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
     * @tags Items
     * @name GetResumeItems
     * @summary Gets items based on a query.
     * @request GET:/UserItems/Resume
     * @secure
     */
    getResumeItems: (
      query?: {
        /**
         * The user id.
         * @format uuid
         */
        userId?: string;
        /**
         * The start index.
         * @format int32
         */
        startIndex?: number;
        /**
         * The item limit.
         * @format int32
         */
        limit?: number;
        /** The search term. */
        searchTerm?: string;
        /**
         * Specify this to localize the search to a specific item or folder. Omit to use the root.
         * @format uuid
         */
        parentId?: string;
        /** Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimited. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines. */
        fields?: ItemFields[];
        /** Optional. Filter by MediaType. Allows multiple, comma delimited. */
        mediaTypes?: MediaType[];
        /** Optional. Include user data. */
        enableUserData?: boolean;
        /**
         * Optional. The max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
        /** Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimited. */
        excludeItemTypes?: BaseItemKind[];
        /** Optional. If specified, results will be filtered based on the item type. This allows multiple, comma delimited. */
        includeItemTypes?: BaseItemKind[];
        /**
         * Optional. Enable the total record count.
         * @default true
         */
        enableTotalRecordCount?: boolean;
        /**
         * Optional. Include image information in output.
         * @default true
         */
        enableImages?: boolean;
        /**
         * Optional. Whether to exclude the currently active sessions.
         * @default false
         */
        excludeActiveSessions?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/UserItems/Resume`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags UserLibrary
     * @name DeleteUserItemRating
     * @summary Deletes a user's saved personal rating for an item.
     * @request DELETE:/UserItems/{itemId}/Rating
     * @secure
     */
    deleteUserItemRating: (
      itemId: string,
      query?: {
        /**
         * User id.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<UserItemDataDto, void>({
        path: `/UserItems/${itemId}/Rating`,
        method: 'DELETE',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags UserLibrary
     * @name UpdateUserItemRating
     * @summary Updates a user's rating for an item.
     * @request POST:/UserItems/{itemId}/Rating
     * @secure
     */
    updateUserItemRating: (
      itemId: string,
      query?: {
        /**
         * User id.
         * @format uuid
         */
        userId?: string;
        /** Whether this M:Jellyfin.Api.Controllers.UserLibraryController.UpdateUserItemRating(System.Nullable{System.Guid},System.Guid,System.Nullable{System.Boolean}) is likes. */
        likes?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<UserItemDataDto, void>({
        path: `/UserItems/${itemId}/Rating`,
        method: 'POST',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),
  };
  libraries = {
    /**
     * No description
     *
     * @tags Library
     * @name GetLibraryOptionsInfo
     * @summary Gets the library options info.
     * @request GET:/Libraries/AvailableOptions
     * @secure
     */
    getLibraryOptionsInfo: (
      query?: {
        /** Library content type. */
        libraryContentType?:
          | 'unknown'
          | 'movies'
          | 'tvshows'
          | 'music'
          | 'musicvideos'
          | 'trailers'
          | 'homevideos'
          | 'boxsets'
          | 'books'
          | 'photos'
          | 'livetv'
          | 'playlists'
          | 'folders';
        /**
         * Whether this is a new library.
         * @default false
         */
        isNewLibrary?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<LibraryOptionsResultDto, void>({
        path: `/Libraries/AvailableOptions`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),
  };
  library = {
    /**
     * No description
     *
     * @tags Library
     * @name PostUpdatedMedia
     * @summary Reports that new movies have been added by an external source.
     * @request POST:/Library/Media/Updated
     * @secure
     */
    postUpdatedMedia: (data: MediaUpdateInfoDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/Library/Media/Updated`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library
     * @name GetMediaFolders
     * @summary Gets all user media folders.
     * @request GET:/Library/MediaFolders
     * @secure
     */
    getMediaFolders: (
      query?: {
        /** Optional. Filter by folders that are marked hidden, or not. */
        isHidden?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/Library/MediaFolders`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library
     * @name PostAddedMovies
     * @summary Reports that new movies have been added by an external source.
     * @request POST:/Library/Movies/Added
     * @secure
     */
    postAddedMovies: (
      query?: {
        /** The tmdbId. */
        tmdbId?: string;
        /** The imdbId. */
        imdbId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/Library/Movies/Added`,
        method: 'POST',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library
     * @name PostUpdatedMovies
     * @summary Reports that new movies have been added by an external source.
     * @request POST:/Library/Movies/Updated
     * @secure
     */
    postUpdatedMovies: (
      query?: {
        /** The tmdbId. */
        tmdbId?: string;
        /** The imdbId. */
        imdbId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/Library/Movies/Updated`,
        method: 'POST',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library
     * @name GetPhysicalPaths
     * @summary Gets a list of physical paths from virtual folders.
     * @request GET:/Library/PhysicalPaths
     * @secure
     */
    getPhysicalPaths: (params: RequestParams = {}) =>
      this.request<string[], void>({
        path: `/Library/PhysicalPaths`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library
     * @name RefreshLibrary
     * @summary Starts a library scan.
     * @request POST:/Library/Refresh
     * @secure
     */
    refreshLibrary: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/Library/Refresh`,
        method: 'POST',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library
     * @name PostAddedSeries
     * @summary Reports that new episodes of a series have been added by an external source.
     * @request POST:/Library/Series/Added
     * @secure
     */
    postAddedSeries: (
      query?: {
        /** The tvdbId. */
        tvdbId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/Library/Series/Added`,
        method: 'POST',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library
     * @name PostUpdatedSeries
     * @summary Reports that new episodes of a series have been added by an external source.
     * @request POST:/Library/Series/Updated
     * @secure
     */
    postUpdatedSeries: (
      query?: {
        /** The tvdbId. */
        tvdbId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/Library/Series/Updated`,
        method: 'POST',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LibraryStructure
     * @name GetVirtualFolders
     * @summary Gets all virtual folders.
     * @request GET:/Library/VirtualFolders
     * @secure
     */
    getVirtualFolders: (params: RequestParams = {}) =>
      this.request<VirtualFolderInfo[], void>({
        path: `/Library/VirtualFolders`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags LibraryStructure
     * @name AddVirtualFolder
     * @summary Adds a virtual folder.
     * @request POST:/Library/VirtualFolders
     * @secure
     */
    addVirtualFolder: (
      data: AddVirtualFolderDto,
      query?: {
        /** The name of the virtual folder. */
        name?: string;
        /** The type of the collection. */
        collectionType?: 'movies' | 'tvshows' | 'music' | 'musicvideos' | 'homevideos' | 'boxsets' | 'books' | 'mixed';
        /** The paths of the virtual folder. */
        paths?: string[];
        /**
         * Whether to refresh the library.
         * @default false
         */
        refreshLibrary?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/Library/VirtualFolders`,
        method: 'POST',
        query: query,
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LibraryStructure
     * @name RemoveVirtualFolder
     * @summary Removes a virtual folder.
     * @request DELETE:/Library/VirtualFolders
     * @secure
     */
    removeVirtualFolder: (
      query?: {
        /** The name of the folder. */
        name?: string;
        /**
         * Whether to refresh the library.
         * @default false
         */
        refreshLibrary?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/Library/VirtualFolders`,
        method: 'DELETE',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LibraryStructure
     * @name UpdateLibraryOptions
     * @summary Update library options.
     * @request POST:/Library/VirtualFolders/LibraryOptions
     * @secure
     */
    updateLibraryOptions: (data: UpdateLibraryOptionsDto, params: RequestParams = {}) =>
      this.request<void, void | ProblemDetails>({
        path: `/Library/VirtualFolders/LibraryOptions`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LibraryStructure
     * @name RenameVirtualFolder
     * @summary Renames a virtual folder.
     * @request POST:/Library/VirtualFolders/Name
     * @secure
     */
    renameVirtualFolder: (
      query?: {
        /** The name of the virtual folder. */
        name?: string;
        /** The new name. */
        newName?: string;
        /**
         * Whether to refresh the library.
         * @default false
         */
        refreshLibrary?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void | ProblemDetails>({
        path: `/Library/VirtualFolders/Name`,
        method: 'POST',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LibraryStructure
     * @name AddMediaPath
     * @summary Add a media path to a library.
     * @request POST:/Library/VirtualFolders/Paths
     * @secure
     */
    addMediaPath: (
      data: MediaPathDto,
      query?: {
        /**
         * Whether to refresh the library.
         * @default false
         */
        refreshLibrary?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/Library/VirtualFolders/Paths`,
        method: 'POST',
        query: query,
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LibraryStructure
     * @name RemoveMediaPath
     * @summary Remove a media path.
     * @request DELETE:/Library/VirtualFolders/Paths
     * @secure
     */
    removeMediaPath: (
      query?: {
        /** The name of the library. */
        name?: string;
        /** The path to remove. */
        path?: string;
        /**
         * Whether to refresh the library.
         * @default false
         */
        refreshLibrary?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/Library/VirtualFolders/Paths`,
        method: 'DELETE',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LibraryStructure
     * @name UpdateMediaPath
     * @summary Updates a media path.
     * @request POST:/Library/VirtualFolders/Paths/Update
     * @secure
     */
    updateMediaPath: (data: UpdateMediaPathRequestDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/Library/VirtualFolders/Paths/Update`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),
  };
  movies = {
    /**
     * No description
     *
     * @tags Library
     * @name GetSimilarMovies
     * @summary Gets similar items.
     * @request GET:/Movies/{itemId}/Similar
     * @secure
     */
    getSimilarMovies: (
      itemId: string,
      query?: {
        /** Exclude artist ids. */
        excludeArtistIds?: string[];
        /**
         * Optional. Filter by user id, and attach user data.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimited. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines, TrailerUrls. */
        fields?: ItemFields[];
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/Movies/${itemId}/Similar`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Movies
     * @name GetMovieRecommendations
     * @summary Gets movie recommendations.
     * @request GET:/Movies/Recommendations
     * @secure
     */
    getMovieRecommendations: (
      query?: {
        /**
         * Optional. Filter by user id, and attach user data.
         * @format uuid
         */
        userId?: string;
        /**
         * Specify this to localize the search to a specific item or folder. Omit to use the root.
         * @format uuid
         */
        parentId?: string;
        /** Optional. The fields to return. */
        fields?: ItemFields[];
        /**
         * The max number of categories to return.
         * @format int32
         * @default 5
         */
        categoryLimit?: number;
        /**
         * The max number of items to return per category.
         * @format int32
         * @default 8
         */
        itemLimit?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<RecommendationDto[], void>({
        path: `/Movies/Recommendations`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),
  };
  shows = {
    /**
     * No description
     *
     * @tags Library
     * @name GetSimilarShows
     * @summary Gets similar items.
     * @request GET:/Shows/{itemId}/Similar
     * @secure
     */
    getSimilarShows: (
      itemId: string,
      query?: {
        /** Exclude artist ids. */
        excludeArtistIds?: string[];
        /**
         * Optional. Filter by user id, and attach user data.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimited. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines, TrailerUrls. */
        fields?: ItemFields[];
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/Shows/${itemId}/Similar`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags TvShows
     * @name GetEpisodes
     * @summary Gets episodes for a tv season.
     * @request GET:/Shows/{seriesId}/Episodes
     * @secure
     */
    getEpisodes: (
      seriesId: string,
      query?: {
        /**
         * The user id.
         * @format uuid
         */
        userId?: string;
        /** Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimited. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines, TrailerUrls. */
        fields?: ItemFields[];
        /**
         * Optional filter by season number.
         * @format int32
         */
        season?: number;
        /**
         * Optional. Filter by season id.
         * @format uuid
         */
        seasonId?: string;
        /** Optional. Filter by items that are missing episodes or not. */
        isMissing?: boolean;
        /**
         * Optional. Return items that are siblings of a supplied item.
         * @format uuid
         */
        adjacentTo?: string;
        /**
         * Optional. Skip through the list until a given item is found.
         * @format uuid
         */
        startItemId?: string;
        /**
         * Optional. The record index to start at. All items with a lower index will be dropped from the results.
         * @format int32
         */
        startIndex?: number;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional, include image information in output. */
        enableImages?: boolean;
        /**
         * Optional, the max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
        /** Optional. Include user data. */
        enableUserData?: boolean;
        /** Optional. Specify one or more sort orders, comma delimited. Options: Album, AlbumArtist, Artist, Budget, CommunityRating, CriticRating, DateCreated, DatePlayed, PlayCount, PremiereDate, ProductionYear, SortName, Random, Revenue, Runtime. */
        sortBy?:
          | 'Default'
          | 'AiredEpisodeOrder'
          | 'Album'
          | 'AlbumArtist'
          | 'Artist'
          | 'DateCreated'
          | 'OfficialRating'
          | 'DatePlayed'
          | 'PremiereDate'
          | 'StartDate'
          | 'SortName'
          | 'Name'
          | 'Random'
          | 'Runtime'
          | 'CommunityRating'
          | 'ProductionYear'
          | 'PlayCount'
          | 'CriticRating'
          | 'IsFolder'
          | 'IsUnplayed'
          | 'IsPlayed'
          | 'SeriesSortName'
          | 'VideoBitRate'
          | 'AirTime'
          | 'Studio'
          | 'IsFavoriteOrLiked'
          | 'DateLastContentAdded'
          | 'SeriesDatePlayed'
          | 'ParentIndexNumber'
          | 'IndexNumber'
          | 'SimilarityScore'
          | 'SearchScore';
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void | ProblemDetails>({
        path: `/Shows/${seriesId}/Episodes`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags TvShows
     * @name GetSeasons
     * @summary Gets seasons for a tv series.
     * @request GET:/Shows/{seriesId}/Seasons
     * @secure
     */
    getSeasons: (
      seriesId: string,
      query?: {
        /**
         * The user id.
         * @format uuid
         */
        userId?: string;
        /** Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimited. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines, TrailerUrls. */
        fields?: ItemFields[];
        /** Optional. Filter by special season. */
        isSpecialSeason?: boolean;
        /** Optional. Filter by items that are missing episodes or not. */
        isMissing?: boolean;
        /**
         * Optional. Return items that are siblings of a supplied item.
         * @format uuid
         */
        adjacentTo?: string;
        /** Optional. Include image information in output. */
        enableImages?: boolean;
        /**
         * Optional. The max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
        /** Optional. Include user data. */
        enableUserData?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void | ProblemDetails>({
        path: `/Shows/${seriesId}/Seasons`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags TvShows
     * @name GetNextUp
     * @summary Gets a list of next up episodes.
     * @request GET:/Shows/NextUp
     * @secure
     */
    getNextUp: (
      query?: {
        /**
         * The user id of the user to get the next up episodes for.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. The record index to start at. All items with a lower index will be dropped from the results.
         * @format int32
         */
        startIndex?: number;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Specify additional fields of information to return in the output. */
        fields?: ItemFields[];
        /**
         * Optional. Filter by series id.
         * @format uuid
         */
        seriesId?: string;
        /**
         * Optional. Specify this to localize the search to a specific item or folder. Omit to use the root.
         * @format uuid
         */
        parentId?: string;
        /** Optional. Include image information in output. */
        enableImages?: boolean;
        /**
         * Optional. The max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
        /** Optional. Include user data. */
        enableUserData?: boolean;
        /**
         * Optional. Starting date of shows to show in Next Up section.
         * @format date-time
         */
        nextUpDateCutoff?: string;
        /**
         * Whether to enable the total records count. Defaults to true.
         * @default true
         */
        enableTotalRecordCount?: boolean;
        /**
         * Whether to disable sending the first episode in a series as next up.
         * @default false
         */
        disableFirstEpisode?: boolean;
        /**
         * Whether to include resumable episodes in next up results.
         * @default true
         */
        enableResumable?: boolean;
        /**
         * Whether to include watched episodes in next up results.
         * @default false
         */
        enableRewatching?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/Shows/NextUp`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags TvShows
     * @name GetUpcomingEpisodes
     * @summary Gets a list of upcoming episodes.
     * @request GET:/Shows/Upcoming
     * @secure
     */
    getUpcomingEpisodes: (
      query?: {
        /**
         * The user id of the user to get the upcoming episodes for.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. The record index to start at. All items with a lower index will be dropped from the results.
         * @format int32
         */
        startIndex?: number;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Specify additional fields of information to return in the output. */
        fields?: ItemFields[];
        /**
         * Optional. Specify this to localize the search to a specific item or folder. Omit to use the root.
         * @format uuid
         */
        parentId?: string;
        /** Optional. Include image information in output. */
        enableImages?: boolean;
        /**
         * Optional. The max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
        /** Optional. Include user data. */
        enableUserData?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/Shows/Upcoming`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),
  };
  trailers = {
    /**
     * No description
     *
     * @tags Library
     * @name GetSimilarTrailers
     * @summary Gets similar items.
     * @request GET:/Trailers/{itemId}/Similar
     * @secure
     */
    getSimilarTrailers: (
      itemId: string,
      query?: {
        /** Exclude artist ids. */
        excludeArtistIds?: string[];
        /**
         * Optional. Filter by user id, and attach user data.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimited. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines, TrailerUrls. */
        fields?: ItemFields[];
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/Trailers/${itemId}/Similar`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Trailers
     * @name GetTrailers
     * @summary Finds movies and trailers similar to a given trailer.
     * @request GET:/Trailers
     * @secure
     */
    getTrailers: (
      query?: {
        /**
         * The user id supplied as query parameter; this is required when not using an API key.
         * @format uuid
         */
        userId?: string;
        /** Optional filter by maximum official rating (PG, PG-13, TV-MA, etc). */
        maxOfficialRating?: string;
        /** Optional filter by items with theme songs. */
        hasThemeSong?: boolean;
        /** Optional filter by items with theme videos. */
        hasThemeVideo?: boolean;
        /** Optional filter by items with subtitles. */
        hasSubtitles?: boolean;
        /** Optional filter by items with special features. */
        hasSpecialFeature?: boolean;
        /** Optional filter by items with trailers. */
        hasTrailer?: boolean;
        /**
         * Optional. Return items that are siblings of a supplied item.
         * @format uuid
         */
        adjacentTo?: string;
        /**
         * Optional filter by parent index number.
         * @format int32
         */
        parentIndexNumber?: number;
        /** Optional filter by items that have or do not have a parental rating. */
        hasParentalRating?: boolean;
        /** Optional filter by items that are HD or not. */
        isHd?: boolean;
        /** Optional filter by items that are 4K or not. */
        is4K?: boolean;
        /** Optional. If specified, results will be filtered based on LocationType. This allows multiple, comma delimited. */
        locationTypes?: LocationType[];
        /** Optional. If specified, results will be filtered based on the LocationType. This allows multiple, comma delimited. */
        excludeLocationTypes?: LocationType[];
        /** Optional filter by items that are missing episodes or not. */
        isMissing?: boolean;
        /** Optional filter by items that are unaired episodes or not. */
        isUnaired?: boolean;
        /**
         * Optional filter by minimum community rating.
         * @format double
         */
        minCommunityRating?: number;
        /**
         * Optional filter by minimum critic rating.
         * @format double
         */
        minCriticRating?: number;
        /**
         * Optional. The minimum premiere date. Format = ISO.
         * @format date-time
         */
        minPremiereDate?: string;
        /**
         * Optional. The minimum last saved date. Format = ISO.
         * @format date-time
         */
        minDateLastSaved?: string;
        /**
         * Optional. The minimum last saved date for the current user. Format = ISO.
         * @format date-time
         */
        minDateLastSavedForUser?: string;
        /**
         * Optional. The maximum premiere date. Format = ISO.
         * @format date-time
         */
        maxPremiereDate?: string;
        /** Optional filter by items that have an overview or not. */
        hasOverview?: boolean;
        /** Optional filter by items that have an IMDb id or not. */
        hasImdbId?: boolean;
        /** Optional filter by items that have a TMDb id or not. */
        hasTmdbId?: boolean;
        /** Optional filter by items that have a TVDb id or not. */
        hasTvdbId?: boolean;
        /** Optional filter for live tv movies. */
        isMovie?: boolean;
        /** Optional filter for live tv series. */
        isSeries?: boolean;
        /** Optional filter for live tv news. */
        isNews?: boolean;
        /** Optional filter for live tv kids. */
        isKids?: boolean;
        /** Optional filter for live tv sports. */
        isSports?: boolean;
        /** Optional. If specified, results will be filtered by excluding item ids. This allows multiple, comma delimited. */
        excludeItemIds?: string[];
        /**
         * Optional. The record index to start at. All items with a lower index will be dropped from the results.
         * @format int32
         */
        startIndex?: number;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** When searching within folders, this determines whether or not the search will be recursive. true/false. */
        recursive?: boolean;
        /** Optional. Filter based on a search term. */
        searchTerm?: string;
        /** Sort Order - Ascending, Descending. */
        sortOrder?: SortOrder[];
        /**
         * Specify this to localize the search to a specific item or folder. Omit to use the root.
         * @format uuid
         */
        parentId?: string;
        /** Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimited. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines. */
        fields?: ItemFields[];
        /** Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimited. */
        excludeItemTypes?: BaseItemKind[];
        /** Optional. Specify additional filters to apply. This allows multiple, comma delimited. Options: IsFolder, IsNotFolder, IsUnplayed, IsPlayed, IsFavorite, IsResumable, Likes, Dislikes. */
        filters?: ItemFilter[];
        /** Optional filter by items that are marked as favorite, or not. */
        isFavorite?: boolean;
        /** Optional filter by MediaType. Allows multiple, comma delimited. */
        mediaTypes?: MediaType[];
        /** Optional. If specified, results will be filtered based on those containing image types. This allows multiple, comma delimited. */
        imageTypes?: ImageType[];
        /** Optional. Specify one or more sort orders, comma delimited. Options: Album, AlbumArtist, Artist, Budget, CommunityRating, CriticRating, DateCreated, DatePlayed, PlayCount, PremiereDate, ProductionYear, SortName, Random, Revenue, Runtime. */
        sortBy?: ItemSortBy[];
        /** Optional filter by items that are played, or not. */
        isPlayed?: boolean;
        /** Optional. If specified, results will be filtered based on genre. This allows multiple, pipe delimited. */
        genres?: string[];
        /** Optional. If specified, results will be filtered based on OfficialRating. This allows multiple, pipe delimited. */
        officialRatings?: string[];
        /** Optional. If specified, results will be filtered based on tag. This allows multiple, pipe delimited. */
        tags?: string[];
        /** Optional. If specified, results will be filtered based on production year. This allows multiple, comma delimited. */
        years?: number[];
        /** Optional, include user data. */
        enableUserData?: boolean;
        /**
         * Optional, the max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
        /** Optional. If specified, results will be filtered to include only those containing the specified person. */
        person?: string;
        /** Optional. If specified, results will be filtered to include only those containing the specified person id. */
        personIds?: string[];
        /** Optional. If specified, along with Person, results will be filtered to include only those containing the specified person and PersonType. Allows multiple, comma-delimited. */
        personTypes?: string[];
        /** Optional. If specified, results will be filtered based on studio. This allows multiple, pipe delimited. */
        studios?: string[];
        /** Optional. If specified, results will be filtered based on artists. This allows multiple, pipe delimited. */
        artists?: string[];
        /** Optional. If specified, results will be filtered based on artist id. This allows multiple, pipe delimited. */
        excludeArtistIds?: string[];
        /** Optional. If specified, results will be filtered to include only those containing the specified artist id. */
        artistIds?: string[];
        /** Optional. If specified, results will be filtered to include only those containing the specified album artist id. */
        albumArtistIds?: string[];
        /** Optional. If specified, results will be filtered to include only those containing the specified contributing artist id. */
        contributingArtistIds?: string[];
        /** Optional. If specified, results will be filtered based on album. This allows multiple, pipe delimited. */
        albums?: string[];
        /** Optional. If specified, results will be filtered based on album id. This allows multiple, pipe delimited. */
        albumIds?: string[];
        /** Optional. If specific items are needed, specify a list of item id's to retrieve. This allows multiple, comma delimited. */
        ids?: string[];
        /** Optional filter by VideoType (videofile, dvd, bluray, iso). Allows multiple, comma delimited. */
        videoTypes?: VideoType[];
        /** Optional filter by minimum official rating (PG, PG-13, TV-MA, etc). */
        minOfficialRating?: string;
        /** Optional filter by items that are locked. */
        isLocked?: boolean;
        /** Optional filter by items that are placeholders. */
        isPlaceHolder?: boolean;
        /** Optional filter by items that have official ratings. */
        hasOfficialRating?: boolean;
        /** Whether or not to hide items behind their boxsets. */
        collapseBoxSetItems?: boolean;
        /**
         * Optional. Filter by the minimum width of the item.
         * @format int32
         */
        minWidth?: number;
        /**
         * Optional. Filter by the minimum height of the item.
         * @format int32
         */
        minHeight?: number;
        /**
         * Optional. Filter by the maximum width of the item.
         * @format int32
         */
        maxWidth?: number;
        /**
         * Optional. Filter by the maximum height of the item.
         * @format int32
         */
        maxHeight?: number;
        /** Optional filter by items that are 3D, or not. */
        is3D?: boolean;
        /** Optional filter by Series Status. Allows multiple, comma delimited. */
        seriesStatus?: SeriesStatus[];
        /** Optional filter by items whose name is sorted equally or greater than a given input string. */
        nameStartsWithOrGreater?: string;
        /** Optional filter by items whose name is sorted equally than a given input string. */
        nameStartsWith?: string;
        /** Optional filter by items whose name is equally or lesser than a given input string. */
        nameLessThan?: string;
        /** Optional. If specified, results will be filtered based on studio id. This allows multiple, pipe delimited. */
        studioIds?: string[];
        /** Optional. If specified, results will be filtered based on genre id. This allows multiple, pipe delimited. */
        genreIds?: string[];
        /**
         * Optional. Enable the total record count.
         * @default true
         */
        enableTotalRecordCount?: boolean;
        /**
         * Optional, include image information in output.
         * @default true
         */
        enableImages?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/Trailers`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),
  };
  liveTv = {
    /**
     * No description
     *
     * @tags LiveTv
     * @name GetChannelMappingOptions
     * @summary Get channel mapping options.
     * @request GET:/LiveTv/ChannelMappingOptions
     * @secure
     */
    getChannelMappingOptions: (
      query?: {
        /** Provider id. */
        providerId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<ChannelMappingOptionsDto, void>({
        path: `/LiveTv/ChannelMappingOptions`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name SetChannelMapping
     * @summary Set channel mappings.
     * @request POST:/LiveTv/ChannelMappings
     * @secure
     */
    setChannelMapping: (data: SetChannelMappingDto, params: RequestParams = {}) =>
      this.request<TunerChannelMapping, void>({
        path: `/LiveTv/ChannelMappings`,
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
     * @tags LiveTv
     * @name GetLiveTvChannels
     * @summary Gets available live tv channels.
     * @request GET:/LiveTv/Channels
     * @secure
     */
    getLiveTvChannels: (
      query?: {
        /** Optional. Filter by channel type. */
        type?: 'TV' | 'Radio';
        /**
         * Optional. Filter by user and attach user data.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. The record index to start at. All items with a lower index will be dropped from the results.
         * @format int32
         */
        startIndex?: number;
        /** Optional. Filter for movies. */
        isMovie?: boolean;
        /** Optional. Filter for series. */
        isSeries?: boolean;
        /** Optional. Filter for news. */
        isNews?: boolean;
        /** Optional. Filter for kids. */
        isKids?: boolean;
        /** Optional. Filter for sports. */
        isSports?: boolean;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Filter by channels that are favorites, or not. */
        isFavorite?: boolean;
        /** Optional. Filter by channels that are liked, or not. */
        isLiked?: boolean;
        /** Optional. Filter by channels that are disliked, or not. */
        isDisliked?: boolean;
        /** Optional. Include image information in output. */
        enableImages?: boolean;
        /**
         * Optional. The max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** "Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
        /** Optional. Specify additional fields of information to return in the output. */
        fields?: ItemFields[];
        /** Optional. Include user data. */
        enableUserData?: boolean;
        /** Optional. Key to sort by. */
        sortBy?: ItemSortBy[];
        /** Optional. Sort order. */
        sortOrder?: 'Ascending' | 'Descending';
        /**
         * Optional. Incorporate favorite and like status into channel sorting.
         * @default false
         */
        enableFavoriteSorting?: boolean;
        /**
         * Optional. Adds current program info to each channel.
         * @default true
         */
        addCurrentProgram?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/LiveTv/Channels`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name GetChannel
     * @summary Gets a live tv channel.
     * @request GET:/LiveTv/Channels/{channelId}
     * @secure
     */
    getChannel: (
      channelId: string,
      query?: {
        /**
         * Optional. Attach user data.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDto, void | ProblemDetails>({
        path: `/LiveTv/Channels/${channelId}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name GetGuideInfo
     * @summary Get guid info.
     * @request GET:/LiveTv/GuideInfo
     * @secure
     */
    getGuideInfo: (params: RequestParams = {}) =>
      this.request<GuideInfo, void>({
        path: `/LiveTv/GuideInfo`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name GetLiveTvInfo
     * @summary Gets available live tv services.
     * @request GET:/LiveTv/Info
     * @secure
     */
    getLiveTvInfo: (params: RequestParams = {}) =>
      this.request<LiveTvInfo, void>({
        path: `/LiveTv/Info`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name AddListingProvider
     * @summary Adds a listings provider.
     * @request POST:/LiveTv/ListingProviders
     * @secure
     */
    addListingProvider: (
      data: ListingsProviderInfo,
      query?: {
        /** Password. */
        pw?: string;
        /**
         * Validate listings.
         * @default false
         */
        validateListings?: boolean;
        /**
         * Validate login.
         * @default false
         */
        validateLogin?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<ListingsProviderInfo, void>({
        path: `/LiveTv/ListingProviders`,
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
     * @tags LiveTv
     * @name DeleteListingProvider
     * @summary Delete listing provider.
     * @request DELETE:/LiveTv/ListingProviders
     * @secure
     */
    deleteListingProvider: (
      query?: {
        /** Listing provider id. */
        id?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/LiveTv/ListingProviders`,
        method: 'DELETE',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name GetDefaultListingProvider
     * @summary Gets default listings provider info.
     * @request GET:/LiveTv/ListingProviders/Default
     * @secure
     */
    getDefaultListingProvider: (params: RequestParams = {}) =>
      this.request<ListingsProviderInfo, void>({
        path: `/LiveTv/ListingProviders/Default`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name GetLineups
     * @summary Gets available lineups.
     * @request GET:/LiveTv/ListingProviders/Lineups
     * @secure
     */
    getLineups: (
      query?: {
        /** Provider id. */
        id?: string;
        /** Provider type. */
        type?: string;
        /** Location. */
        location?: string;
        /** Country. */
        country?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<NameIdPair[], void>({
        path: `/LiveTv/ListingProviders/Lineups`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name GetSchedulesDirectCountries
     * @summary Gets available countries.
     * @request GET:/LiveTv/ListingProviders/SchedulesDirect/Countries
     * @secure
     */
    getSchedulesDirectCountries: (params: RequestParams = {}) =>
      this.request<File, void>({
        path: `/LiveTv/ListingProviders/SchedulesDirect/Countries`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name GetLiveRecordingFile
     * @summary Gets a live tv recording stream.
     * @request GET:/LiveTv/LiveRecordings/{recordingId}/stream
     */
    getLiveRecordingFile: (recordingId: string, params: RequestParams = {}) =>
      this.request<File, ProblemDetails>({
        path: `/LiveTv/LiveRecordings/${recordingId}/stream`,
        method: 'GET',
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name GetLiveStreamFile
     * @summary Gets a live tv channel stream.
     * @request GET:/LiveTv/LiveStreamFiles/{streamId}/stream.{container}
     */
    getLiveStreamFile: (streamId: string, container: string, params: RequestParams = {}) =>
      this.request<File, ProblemDetails>({
        path: `/LiveTv/LiveStreamFiles/${streamId}/stream.${container}`,
        method: 'GET',
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name GetLiveTvPrograms
     * @summary Gets available live tv epgs.
     * @request GET:/LiveTv/Programs
     * @secure
     */
    getLiveTvPrograms: (
      query?: {
        /** The channels to return guide information for. */
        channelIds?: string[];
        /**
         * Optional. Filter by user id.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. The minimum premiere start date.
         * @format date-time
         */
        minStartDate?: string;
        /** Optional. Filter by programs that have completed airing, or not. */
        hasAired?: boolean;
        /** Optional. Filter by programs that are currently airing, or not. */
        isAiring?: boolean;
        /**
         * Optional. The maximum premiere start date.
         * @format date-time
         */
        maxStartDate?: string;
        /**
         * Optional. The minimum premiere end date.
         * @format date-time
         */
        minEndDate?: string;
        /**
         * Optional. The maximum premiere end date.
         * @format date-time
         */
        maxEndDate?: string;
        /** Optional. Filter for movies. */
        isMovie?: boolean;
        /** Optional. Filter for series. */
        isSeries?: boolean;
        /** Optional. Filter for news. */
        isNews?: boolean;
        /** Optional. Filter for kids. */
        isKids?: boolean;
        /** Optional. Filter for sports. */
        isSports?: boolean;
        /**
         * Optional. The record index to start at. All items with a lower index will be dropped from the results.
         * @format int32
         */
        startIndex?: number;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Specify one or more sort orders, comma delimited. Options: Name, StartDate. */
        sortBy?: ItemSortBy[];
        /** Sort Order - Ascending,Descending. */
        sortOrder?: SortOrder[];
        /** The genres to return guide information for. */
        genres?: string[];
        /** The genre ids to return guide information for. */
        genreIds?: string[];
        /** Optional. Include image information in output. */
        enableImages?: boolean;
        /**
         * Optional. The max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
        /** Optional. Include user data. */
        enableUserData?: boolean;
        /** Optional. Filter by series timer id. */
        seriesTimerId?: string;
        /**
         * Optional. Filter by library series id.
         * @format uuid
         */
        librarySeriesId?: string;
        /** Optional. Specify additional fields of information to return in the output. */
        fields?: ItemFields[];
        /**
         * Retrieve total record count.
         * @default true
         */
        enableTotalRecordCount?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/LiveTv/Programs`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name GetPrograms
     * @summary Gets available live tv epgs.
     * @request POST:/LiveTv/Programs
     * @secure
     */
    getPrograms: (data: GetProgramsDto, params: RequestParams = {}) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/LiveTv/Programs`,
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
     * @tags LiveTv
     * @name GetProgram
     * @summary Gets a live tv program.
     * @request GET:/LiveTv/Programs/{programId}
     * @secure
     */
    getProgram: (
      programId: string,
      query?: {
        /**
         * Optional. Attach user data.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDto, void>({
        path: `/LiveTv/Programs/${programId}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name GetRecommendedPrograms
     * @summary Gets recommended live tv epgs.
     * @request GET:/LiveTv/Programs/Recommended
     * @secure
     */
    getRecommendedPrograms: (
      query?: {
        /**
         * Optional. filter by user id.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Filter by programs that are currently airing, or not. */
        isAiring?: boolean;
        /** Optional. Filter by programs that have completed airing, or not. */
        hasAired?: boolean;
        /** Optional. Filter for series. */
        isSeries?: boolean;
        /** Optional. Filter for movies. */
        isMovie?: boolean;
        /** Optional. Filter for news. */
        isNews?: boolean;
        /** Optional. Filter for kids. */
        isKids?: boolean;
        /** Optional. Filter for sports. */
        isSports?: boolean;
        /** Optional. Include image information in output. */
        enableImages?: boolean;
        /**
         * Optional. The max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
        /** The genres to return guide information for. */
        genreIds?: string[];
        /** Optional. Specify additional fields of information to return in the output. */
        fields?: ItemFields[];
        /** Optional. include user data. */
        enableUserData?: boolean;
        /**
         * Retrieve total record count.
         * @default true
         */
        enableTotalRecordCount?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/LiveTv/Programs/Recommended`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name GetRecordings
     * @summary Gets live tv recordings.
     * @request GET:/LiveTv/Recordings
     * @secure
     */
    getRecordings: (
      query?: {
        /** Optional. Filter by channel id. */
        channelId?: string;
        /**
         * Optional. Filter by user and attach user data.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. The record index to start at. All items with a lower index will be dropped from the results.
         * @format int32
         */
        startIndex?: number;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Filter by recording status. */
        status?: 'New' | 'InProgress' | 'Completed' | 'Cancelled' | 'ConflictedOk' | 'ConflictedNotOk' | 'Error';
        /** Optional. Filter by recordings that are in progress, or not. */
        isInProgress?: boolean;
        /** Optional. Filter by recordings belonging to a series timer. */
        seriesTimerId?: string;
        /** Optional. Include image information in output. */
        enableImages?: boolean;
        /**
         * Optional. The max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
        /** Optional. Specify additional fields of information to return in the output. */
        fields?: ItemFields[];
        /** Optional. Include user data. */
        enableUserData?: boolean;
        /** Optional. Filter for movies. */
        isMovie?: boolean;
        /** Optional. Filter for series. */
        isSeries?: boolean;
        /** Optional. Filter for kids. */
        isKids?: boolean;
        /** Optional. Filter for sports. */
        isSports?: boolean;
        /** Optional. Filter for news. */
        isNews?: boolean;
        /** Optional. Filter for is library item. */
        isLibraryItem?: boolean;
        /**
         * Optional. Return total record count.
         * @default true
         */
        enableTotalRecordCount?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/LiveTv/Recordings`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name GetRecording
     * @summary Gets a live tv recording.
     * @request GET:/LiveTv/Recordings/{recordingId}
     * @secure
     */
    getRecording: (
      recordingId: string,
      query?: {
        /**
         * Optional. Attach user data.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDto, void | ProblemDetails>({
        path: `/LiveTv/Recordings/${recordingId}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name DeleteRecording
     * @summary Deletes a live tv recording.
     * @request DELETE:/LiveTv/Recordings/{recordingId}
     * @secure
     */
    deleteRecording: (recordingId: string, params: RequestParams = {}) =>
      this.request<void, void | ProblemDetails>({
        path: `/LiveTv/Recordings/${recordingId}`,
        method: 'DELETE',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name GetRecordingFolders
     * @summary Gets recording folders.
     * @request GET:/LiveTv/Recordings/Folders
     * @secure
     */
    getRecordingFolders: (
      query?: {
        /**
         * Optional. Filter by user and attach user data.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/LiveTv/Recordings/Folders`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name GetRecordingGroups
     * @summary Gets live tv recording groups.
     * @request GET:/LiveTv/Recordings/Groups
     * @deprecated
     * @secure
     */
    getRecordingGroups: (
      query?: {
        /**
         * Optional. Filter by user and attach user data.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/LiveTv/Recordings/Groups`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name GetRecordingGroup
     * @summary Get recording group.
     * @request GET:/LiveTv/Recordings/Groups/{groupId}
     * @deprecated
     * @secure
     */
    getRecordingGroup: (groupId: string, params: RequestParams = {}) =>
      this.request<any, void | ProblemDetails>({
        path: `/LiveTv/Recordings/Groups/${groupId}`,
        method: 'GET',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name GetRecordingsSeries
     * @summary Gets live tv recording series.
     * @request GET:/LiveTv/Recordings/Series
     * @deprecated
     * @secure
     */
    getRecordingsSeries: (
      query?: {
        /** Optional. Filter by channel id. */
        channelId?: string;
        /**
         * Optional. Filter by user and attach user data.
         * @format uuid
         */
        userId?: string;
        /** Optional. Filter by recording group. */
        groupId?: string;
        /**
         * Optional. The record index to start at. All items with a lower index will be dropped from the results.
         * @format int32
         */
        startIndex?: number;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Optional. Filter by recording status. */
        status?: 'New' | 'InProgress' | 'Completed' | 'Cancelled' | 'ConflictedOk' | 'ConflictedNotOk' | 'Error';
        /** Optional. Filter by recordings that are in progress, or not. */
        isInProgress?: boolean;
        /** Optional. Filter by recordings belonging to a series timer. */
        seriesTimerId?: string;
        /** Optional. Include image information in output. */
        enableImages?: boolean;
        /**
         * Optional. The max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
        /** Optional. Specify additional fields of information to return in the output. */
        fields?: ItemFields[];
        /** Optional. Include user data. */
        enableUserData?: boolean;
        /**
         * Optional. Return total record count.
         * @default true
         */
        enableTotalRecordCount?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/LiveTv/Recordings/Series`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name GetSeriesTimers
     * @summary Gets live tv series timers.
     * @request GET:/LiveTv/SeriesTimers
     * @secure
     */
    getSeriesTimers: (
      query?: {
        /** Optional. Sort by SortName or Priority. */
        sortBy?: string;
        /** Optional. Sort in Ascending or Descending order. */
        sortOrder?: 'Ascending' | 'Descending';
      },
      params: RequestParams = {},
    ) =>
      this.request<SeriesTimerInfoDtoQueryResult, void>({
        path: `/LiveTv/SeriesTimers`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name CreateSeriesTimer
     * @summary Creates a live tv series timer.
     * @request POST:/LiveTv/SeriesTimers
     * @secure
     */
    createSeriesTimer: (data: SeriesTimerInfoDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/LiveTv/SeriesTimers`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name GetSeriesTimer
     * @summary Gets a live tv series timer.
     * @request GET:/LiveTv/SeriesTimers/{timerId}
     * @secure
     */
    getSeriesTimer: (timerId: string, params: RequestParams = {}) =>
      this.request<SeriesTimerInfoDto, void | ProblemDetails>({
        path: `/LiveTv/SeriesTimers/${timerId}`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name CancelSeriesTimer
     * @summary Cancels a live tv series timer.
     * @request DELETE:/LiveTv/SeriesTimers/{timerId}
     * @secure
     */
    cancelSeriesTimer: (timerId: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/LiveTv/SeriesTimers/${timerId}`,
        method: 'DELETE',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name UpdateSeriesTimer
     * @summary Updates a live tv series timer.
     * @request POST:/LiveTv/SeriesTimers/{timerId}
     * @secure
     */
    updateSeriesTimer: (timerId: string, data: SeriesTimerInfoDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/LiveTv/SeriesTimers/${timerId}`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name GetTimers
     * @summary Gets the live tv timers.
     * @request GET:/LiveTv/Timers
     * @secure
     */
    getTimers: (
      query?: {
        /** Optional. Filter by channel id. */
        channelId?: string;
        /** Optional. Filter by timers belonging to a series timer. */
        seriesTimerId?: string;
        /** Optional. Filter by timers that are active. */
        isActive?: boolean;
        /** Optional. Filter by timers that are scheduled. */
        isScheduled?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<TimerInfoDtoQueryResult, void>({
        path: `/LiveTv/Timers`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name CreateTimer
     * @summary Creates a live tv timer.
     * @request POST:/LiveTv/Timers
     * @secure
     */
    createTimer: (data: TimerInfoDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/LiveTv/Timers`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name GetTimer
     * @summary Gets a timer.
     * @request GET:/LiveTv/Timers/{timerId}
     * @secure
     */
    getTimer: (timerId: string, params: RequestParams = {}) =>
      this.request<TimerInfoDto, void>({
        path: `/LiveTv/Timers/${timerId}`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name CancelTimer
     * @summary Cancels a live tv timer.
     * @request DELETE:/LiveTv/Timers/{timerId}
     * @secure
     */
    cancelTimer: (timerId: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/LiveTv/Timers/${timerId}`,
        method: 'DELETE',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name UpdateTimer
     * @summary Updates a live tv timer.
     * @request POST:/LiveTv/Timers/{timerId}
     * @secure
     */
    updateTimer: (timerId: string, data: TimerInfoDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/LiveTv/Timers/${timerId}`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name GetDefaultTimer
     * @summary Gets the default values for a new timer.
     * @request GET:/LiveTv/Timers/Defaults
     * @secure
     */
    getDefaultTimer: (
      query?: {
        /** Optional. To attach default values based on a program. */
        programId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<SeriesTimerInfoDto, void>({
        path: `/LiveTv/Timers/Defaults`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name AddTunerHost
     * @summary Adds a tuner host.
     * @request POST:/LiveTv/TunerHosts
     * @secure
     */
    addTunerHost: (data: TunerHostInfo, params: RequestParams = {}) =>
      this.request<TunerHostInfo, void>({
        path: `/LiveTv/TunerHosts`,
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
     * @tags LiveTv
     * @name DeleteTunerHost
     * @summary Deletes a tuner host.
     * @request DELETE:/LiveTv/TunerHosts
     * @secure
     */
    deleteTunerHost: (
      query?: {
        /** Tuner host id. */
        id?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/LiveTv/TunerHosts`,
        method: 'DELETE',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name GetTunerHostTypes
     * @summary Get tuner host types.
     * @request GET:/LiveTv/TunerHosts/Types
     * @secure
     */
    getTunerHostTypes: (params: RequestParams = {}) =>
      this.request<NameIdPair[], void>({
        path: `/LiveTv/TunerHosts/Types`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name ResetTuner
     * @summary Resets a tv tuner.
     * @request POST:/LiveTv/Tuners/{tunerId}/Reset
     * @secure
     */
    resetTuner: (tunerId: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/LiveTv/Tuners/${tunerId}/Reset`,
        method: 'POST',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name DiscoverTuners
     * @summary Discover tuners.
     * @request GET:/LiveTv/Tuners/Discover
     * @secure
     */
    discoverTuners: (
      query?: {
        /**
         * Only discover new tuners.
         * @default false
         */
        newDevicesOnly?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<TunerHostInfo[], void>({
        path: `/LiveTv/Tuners/Discover`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags LiveTv
     * @name DiscvoverTuners
     * @summary Discover tuners.
     * @request GET:/LiveTv/Tuners/Discvover
     * @secure
     */
    discvoverTuners: (
      query?: {
        /**
         * Only discover new tuners.
         * @default false
         */
        newDevicesOnly?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<TunerHostInfo[], void>({
        path: `/LiveTv/Tuners/Discvover`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),
  };
  localization = {
    /**
     * No description
     *
     * @tags Localization
     * @name GetCountries
     * @summary Gets known countries.
     * @request GET:/Localization/Countries
     * @secure
     */
    getCountries: (params: RequestParams = {}) =>
      this.request<CountryInfo[], void>({
        path: `/Localization/Countries`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Localization
     * @name GetCultures
     * @summary Gets known cultures.
     * @request GET:/Localization/Cultures
     * @secure
     */
    getCultures: (params: RequestParams = {}) =>
      this.request<CultureDto[], void>({
        path: `/Localization/Cultures`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Localization
     * @name GetLocalizationOptions
     * @summary Gets localization options.
     * @request GET:/Localization/Options
     * @secure
     */
    getLocalizationOptions: (params: RequestParams = {}) =>
      this.request<LocalizationOption[], void>({
        path: `/Localization/Options`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Localization
     * @name GetParentalRatings
     * @summary Gets known parental ratings.
     * @request GET:/Localization/ParentalRatings
     * @secure
     */
    getParentalRatings: (params: RequestParams = {}) =>
      this.request<ParentalRating[], void>({
        path: `/Localization/ParentalRatings`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),
  };
  providers = {
    /**
     * No description
     *
     * @tags Lyrics
     * @name GetRemoteLyrics
     * @summary Gets the remote lyrics.
     * @request GET:/Providers/Lyrics/{lyricId}
     * @secure
     */
    getRemoteLyrics: (lyricId: string, params: RequestParams = {}) =>
      this.request<LyricDto, void | ProblemDetails>({
        path: `/Providers/Lyrics/${lyricId}`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Subtitle
     * @name GetRemoteSubtitles
     * @summary Gets the remote subtitles.
     * @request GET:/Providers/Subtitles/Subtitles/{subtitleId}
     * @secure
     */
    getRemoteSubtitles: (subtitleId: string, params: RequestParams = {}) =>
      this.request<File, void>({
        path: `/Providers/Subtitles/Subtitles/${subtitleId}`,
        method: 'GET',
        secure: true,
        ...params,
      }),
  };
  liveStreams = {
    /**
     * No description
     *
     * @tags MediaInfo
     * @name CloseLiveStream
     * @summary Closes a media source.
     * @request POST:/LiveStreams/Close
     * @secure
     */
    closeLiveStream: (
      query: {
        /** The livestream id. */
        liveStreamId: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/LiveStreams/Close`,
        method: 'POST',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags MediaInfo
     * @name OpenLiveStream
     * @summary Opens a media source.
     * @request POST:/LiveStreams/Open
     * @secure
     */
    openLiveStream: (
      data: OpenLiveStreamDto,
      query?: {
        /** The open token. */
        openToken?: string;
        /**
         * The user id.
         * @format uuid
         */
        userId?: string;
        /** The play session id. */
        playSessionId?: string;
        /**
         * The maximum streaming bitrate.
         * @format int32
         */
        maxStreamingBitrate?: number;
        /**
         * The start time in ticks.
         * @format int64
         */
        startTimeTicks?: number;
        /**
         * The audio stream index.
         * @format int32
         */
        audioStreamIndex?: number;
        /**
         * The subtitle stream index.
         * @format int32
         */
        subtitleStreamIndex?: number;
        /**
         * The maximum number of audio channels.
         * @format int32
         */
        maxAudioChannels?: number;
        /**
         * The item id.
         * @format uuid
         */
        itemId?: string;
        /** Whether to enable direct play. Default: true. */
        enableDirectPlay?: boolean;
        /** Whether to enable direct stream. Default: true. */
        enableDirectStream?: boolean;
        /** Always burn-in subtitle when transcoding. */
        alwaysBurnInSubtitleWhenTranscoding?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<LiveStreamResponse, void>({
        path: `/LiveStreams/Open`,
        method: 'POST',
        query: query,
        body: data,
        secure: true,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),
  };
  playback = {
    /**
     * No description
     *
     * @tags MediaInfo
     * @name GetBitrateTestBytes
     * @summary Tests the network with a request with the size of the bitrate.
     * @request GET:/Playback/BitrateTest
     * @secure
     */
    getBitrateTestBytes: (
      query?: {
        /**
         * The bitrate. Defaults to 102400.
         * @format int32
         * @min 1
         * @max 100000000
         * @default 102400
         */
        size?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, void>({
        path: `/Playback/BitrateTest`,
        method: 'GET',
        query: query,
        secure: true,
        ...params,
      }),
  };
  mediaSegments = {
    /**
     * No description
     *
     * @tags MediaSegments
     * @name GetItemSegments
     * @summary Gets all media segments based on an itemId.
     * @request GET:/MediaSegments/{itemId}
     * @secure
     */
    getItemSegments: (
      itemId: string,
      query?: {
        /** Optional filter of requested segment types. */
        includeSegmentTypes?: MediaSegmentType[];
      },
      params: RequestParams = {},
    ) =>
      this.request<MediaSegmentDtoQueryResult, void | ProblemDetails>({
        path: `/MediaSegments/${itemId}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),
  };
  packages = {
    /**
     * No description
     *
     * @tags Package
     * @name GetPackages
     * @summary Gets available packages.
     * @request GET:/Packages
     * @secure
     */
    getPackages: (params: RequestParams = {}) =>
      this.request<PackageInfo[], void>({
        path: `/Packages`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Package
     * @name GetPackageInfo
     * @summary Gets a package by name or assembly GUID.
     * @request GET:/Packages/{name}
     * @secure
     */
    getPackageInfo: (
      name: string,
      query?: {
        /**
         * The GUID of the associated assembly.
         * @format uuid
         */
        assemblyGuid?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<PackageInfo, void>({
        path: `/Packages/${name}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Package
     * @name InstallPackage
     * @summary Installs a package.
     * @request POST:/Packages/Installed/{name}
     * @secure
     */
    installPackage: (
      name: string,
      query?: {
        /**
         * GUID of the associated assembly.
         * @format uuid
         */
        assemblyGuid?: string;
        /** Optional version. Defaults to latest version. */
        version?: string;
        /** Optional. Specify the repository to install from. */
        repositoryUrl?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void | ProblemDetails>({
        path: `/Packages/Installed/${name}`,
        method: 'POST',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Package
     * @name CancelPackageInstallation
     * @summary Cancels a package installation.
     * @request DELETE:/Packages/Installing/{packageId}
     * @secure
     */
    cancelPackageInstallation: (packageId: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/Packages/Installing/${packageId}`,
        method: 'DELETE',
        secure: true,
        ...params,
      }),
  };
  repositories = {
    /**
     * No description
     *
     * @tags Package
     * @name GetRepositories
     * @summary Gets all package repositories.
     * @request GET:/Repositories
     * @secure
     */
    getRepositories: (params: RequestParams = {}) =>
      this.request<RepositoryInfo[], void>({
        path: `/Repositories`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Package
     * @name SetRepositories
     * @summary Sets the enabled and existing package repositories.
     * @request POST:/Repositories
     * @secure
     */
    setRepositories: (data: RepositoryInfo[], params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/Repositories`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),
  };
  playingItems = {
    /**
     * No description
     *
     * @tags Playstate
     * @name OnPlaybackStart
     * @summary Reports that a session has begun playing an item.
     * @request POST:/PlayingItems/{itemId}
     * @secure
     */
    onPlaybackStart: (
      itemId: string,
      query?: {
        /** The id of the MediaSource. */
        mediaSourceId?: string;
        /**
         * The audio stream index.
         * @format int32
         */
        audioStreamIndex?: number;
        /**
         * The subtitle stream index.
         * @format int32
         */
        subtitleStreamIndex?: number;
        /** The play method. */
        playMethod?: 'Transcode' | 'DirectStream' | 'DirectPlay';
        /** The live stream id. */
        liveStreamId?: string;
        /** The play session id. */
        playSessionId?: string;
        /**
         * Indicates if the client can seek.
         * @default false
         */
        canSeek?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/PlayingItems/${itemId}`,
        method: 'POST',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Playstate
     * @name OnPlaybackStopped
     * @summary Reports that a session has stopped playing an item.
     * @request DELETE:/PlayingItems/{itemId}
     * @secure
     */
    onPlaybackStopped: (
      itemId: string,
      query?: {
        /** The id of the MediaSource. */
        mediaSourceId?: string;
        /** The next media type that will play. */
        nextMediaType?: string;
        /**
         * Optional. The position, in ticks, where playback stopped. 1 tick = 10000 ms.
         * @format int64
         */
        positionTicks?: number;
        /** The live stream id. */
        liveStreamId?: string;
        /** The play session id. */
        playSessionId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/PlayingItems/${itemId}`,
        method: 'DELETE',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Playstate
     * @name OnPlaybackProgress
     * @summary Reports a session's playback progress.
     * @request POST:/PlayingItems/{itemId}/Progress
     * @secure
     */
    onPlaybackProgress: (
      itemId: string,
      query?: {
        /** The id of the MediaSource. */
        mediaSourceId?: string;
        /**
         * Optional. The current position, in ticks. 1 tick = 10000 ms.
         * @format int64
         */
        positionTicks?: number;
        /**
         * The audio stream index.
         * @format int32
         */
        audioStreamIndex?: number;
        /**
         * The subtitle stream index.
         * @format int32
         */
        subtitleStreamIndex?: number;
        /**
         * Scale of 0-100.
         * @format int32
         */
        volumeLevel?: number;
        /** The play method. */
        playMethod?: 'Transcode' | 'DirectStream' | 'DirectPlay';
        /** The live stream id. */
        liveStreamId?: string;
        /** The play session id. */
        playSessionId?: string;
        /** The repeat mode. */
        repeatMode?: 'RepeatNone' | 'RepeatAll' | 'RepeatOne';
        /**
         * Indicates if the player is paused.
         * @default false
         */
        isPaused?: boolean;
        /**
         * Indicates if the player is muted.
         * @default false
         */
        isMuted?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/PlayingItems/${itemId}/Progress`,
        method: 'POST',
        query: query,
        secure: true,
        ...params,
      }),
  };
  sessions = {
    /**
     * No description
     *
     * @tags Playstate
     * @name ReportPlaybackStart
     * @summary Reports playback has started within a session.
     * @request POST:/Sessions/Playing
     * @secure
     */
    reportPlaybackStart: (data: PlaybackStartInfo, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/Sessions/Playing`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Playstate
     * @name PingPlaybackSession
     * @summary Pings a playback session.
     * @request POST:/Sessions/Playing/Ping
     * @secure
     */
    pingPlaybackSession: (
      query: {
        /** Playback session id. */
        playSessionId: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/Sessions/Playing/Ping`,
        method: 'POST',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Playstate
     * @name ReportPlaybackProgress
     * @summary Reports playback progress within a session.
     * @request POST:/Sessions/Playing/Progress
     * @secure
     */
    reportPlaybackProgress: (data: PlaybackProgressInfo, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/Sessions/Playing/Progress`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Playstate
     * @name ReportPlaybackStopped
     * @summary Reports playback has stopped within a session.
     * @request POST:/Sessions/Playing/Stopped
     * @secure
     */
    reportPlaybackStopped: (data: PlaybackStopInfo, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/Sessions/Playing/Stopped`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Session
     * @name GetSessions
     * @summary Gets a list of sessions.
     * @request GET:/Sessions
     * @secure
     */
    getSessions: (
      query?: {
        /**
         * Filter by sessions that a given user is allowed to remote control.
         * @format uuid
         */
        controllableByUserId?: string;
        /** Filter by device Id. */
        deviceId?: string;
        /**
         * Optional. Filter by sessions that were active in the last n seconds.
         * @format int32
         */
        activeWithinSeconds?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<SessionInfoDto[], void>({
        path: `/Sessions`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Session
     * @name SendFullGeneralCommand
     * @summary Issues a full general command to a client.
     * @request POST:/Sessions/{sessionId}/Command
     * @secure
     */
    sendFullGeneralCommand: (sessionId: string, data: GeneralCommand, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/Sessions/${sessionId}/Command`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Session
     * @name SendGeneralCommand
     * @summary Issues a general command to a client.
     * @request POST:/Sessions/{sessionId}/Command/{command}
     * @secure
     */
    sendGeneralCommand: (
      sessionId: string,
      command:
        | 'MoveUp'
        | 'MoveDown'
        | 'MoveLeft'
        | 'MoveRight'
        | 'PageUp'
        | 'PageDown'
        | 'PreviousLetter'
        | 'NextLetter'
        | 'ToggleOsd'
        | 'ToggleContextMenu'
        | 'Select'
        | 'Back'
        | 'TakeScreenshot'
        | 'SendKey'
        | 'SendString'
        | 'GoHome'
        | 'GoToSettings'
        | 'VolumeUp'
        | 'VolumeDown'
        | 'Mute'
        | 'Unmute'
        | 'ToggleMute'
        | 'SetVolume'
        | 'SetAudioStreamIndex'
        | 'SetSubtitleStreamIndex'
        | 'ToggleFullscreen'
        | 'DisplayContent'
        | 'GoToSearch'
        | 'DisplayMessage'
        | 'SetRepeatMode'
        | 'ChannelUp'
        | 'ChannelDown'
        | 'Guide'
        | 'ToggleStats'
        | 'PlayMediaSource'
        | 'PlayTrailers'
        | 'SetShuffleQueue'
        | 'PlayState'
        | 'PlayNext'
        | 'ToggleOsdMenu'
        | 'Play'
        | 'SetMaxStreamingBitrate'
        | 'SetPlaybackOrder',
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/Sessions/${sessionId}/Command/${command}`,
        method: 'POST',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Session
     * @name SendMessageCommand
     * @summary Issues a command to a client to display a message to the user.
     * @request POST:/Sessions/{sessionId}/Message
     * @secure
     */
    sendMessageCommand: (sessionId: string, data: MessageCommand, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/Sessions/${sessionId}/Message`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Session
     * @name Play
     * @summary Instructs a session to play an item.
     * @request POST:/Sessions/{sessionId}/Playing
     * @secure
     */
    play: (
      sessionId: string,
      query: {
        /** Enum PlayCommand. */
        playCommand: 'PlayNow' | 'PlayNext' | 'PlayLast' | 'PlayInstantMix' | 'PlayShuffle';
        /** The ids of the items to play, comma delimited. */
        itemIds: string[];
        /**
         * The starting position of the first item.
         * @format int64
         */
        startPositionTicks?: number;
        /** Optional. The media source id. */
        mediaSourceId?: string;
        /**
         * Optional. The index of the audio stream to play.
         * @format int32
         */
        audioStreamIndex?: number;
        /**
         * Optional. The index of the subtitle stream to play.
         * @format int32
         */
        subtitleStreamIndex?: number;
        /**
         * Optional. The start index.
         * @format int32
         */
        startIndex?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/Sessions/${sessionId}/Playing`,
        method: 'POST',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Session
     * @name SendPlaystateCommand
     * @summary Issues a playstate command to a client.
     * @request POST:/Sessions/{sessionId}/Playing/{command}
     * @secure
     */
    sendPlaystateCommand: (
      sessionId: string,
      command:
        | 'Stop'
        | 'Pause'
        | 'Unpause'
        | 'NextTrack'
        | 'PreviousTrack'
        | 'Seek'
        | 'Rewind'
        | 'FastForward'
        | 'PlayPause',
      query?: {
        /**
         * The optional position ticks.
         * @format int64
         */
        seekPositionTicks?: number;
        /** The optional controlling user id. */
        controllingUserId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/Sessions/${sessionId}/Playing/${command}`,
        method: 'POST',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Session
     * @name SendSystemCommand
     * @summary Issues a system command to a client.
     * @request POST:/Sessions/{sessionId}/System/{command}
     * @secure
     */
    sendSystemCommand: (
      sessionId: string,
      command:
        | 'MoveUp'
        | 'MoveDown'
        | 'MoveLeft'
        | 'MoveRight'
        | 'PageUp'
        | 'PageDown'
        | 'PreviousLetter'
        | 'NextLetter'
        | 'ToggleOsd'
        | 'ToggleContextMenu'
        | 'Select'
        | 'Back'
        | 'TakeScreenshot'
        | 'SendKey'
        | 'SendString'
        | 'GoHome'
        | 'GoToSettings'
        | 'VolumeUp'
        | 'VolumeDown'
        | 'Mute'
        | 'Unmute'
        | 'ToggleMute'
        | 'SetVolume'
        | 'SetAudioStreamIndex'
        | 'SetSubtitleStreamIndex'
        | 'ToggleFullscreen'
        | 'DisplayContent'
        | 'GoToSearch'
        | 'DisplayMessage'
        | 'SetRepeatMode'
        | 'ChannelUp'
        | 'ChannelDown'
        | 'Guide'
        | 'ToggleStats'
        | 'PlayMediaSource'
        | 'PlayTrailers'
        | 'SetShuffleQueue'
        | 'PlayState'
        | 'PlayNext'
        | 'ToggleOsdMenu'
        | 'Play'
        | 'SetMaxStreamingBitrate'
        | 'SetPlaybackOrder',
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/Sessions/${sessionId}/System/${command}`,
        method: 'POST',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Session
     * @name AddUserToSession
     * @summary Adds an additional user to a session.
     * @request POST:/Sessions/{sessionId}/User/{userId}
     * @secure
     */
    addUserToSession: (sessionId: string, userId: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/Sessions/${sessionId}/User/${userId}`,
        method: 'POST',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Session
     * @name RemoveUserFromSession
     * @summary Removes an additional user from a session.
     * @request DELETE:/Sessions/{sessionId}/User/{userId}
     * @secure
     */
    removeUserFromSession: (sessionId: string, userId: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/Sessions/${sessionId}/User/${userId}`,
        method: 'DELETE',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Session
     * @name DisplayContent
     * @summary Instructs a session to browse to an item or view.
     * @request POST:/Sessions/{sessionId}/Viewing
     * @secure
     */
    displayContent: (
      sessionId: string,
      query: {
        /** The base item kind. */
        itemType:
          | 'AggregateFolder'
          | 'Audio'
          | 'AudioBook'
          | 'BasePluginFolder'
          | 'Book'
          | 'BoxSet'
          | 'Channel'
          | 'ChannelFolderItem'
          | 'CollectionFolder'
          | 'Episode'
          | 'Folder'
          | 'Genre'
          | 'ManualPlaylistsFolder'
          | 'Movie'
          | 'LiveTvChannel'
          | 'LiveTvProgram'
          | 'MusicAlbum'
          | 'MusicArtist'
          | 'MusicGenre'
          | 'MusicVideo'
          | 'Person'
          | 'Photo'
          | 'PhotoAlbum'
          | 'Playlist'
          | 'PlaylistsFolder'
          | 'Program'
          | 'Recording'
          | 'Season'
          | 'Series'
          | 'Studio'
          | 'Trailer'
          | 'TvChannel'
          | 'TvProgram'
          | 'UserRootFolder'
          | 'UserView'
          | 'Video'
          | 'Year';
        /** The Id of the item. */
        itemId: string;
        /** The name of the item. */
        itemName: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/Sessions/${sessionId}/Viewing`,
        method: 'POST',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Session
     * @name PostCapabilities
     * @summary Updates capabilities for a device.
     * @request POST:/Sessions/Capabilities
     * @secure
     */
    postCapabilities: (
      query?: {
        /** The session id. */
        id?: string;
        /** A list of playable media types, comma delimited. Audio, Video, Book, Photo. */
        playableMediaTypes?: MediaType[];
        /** A list of supported remote control commands, comma delimited. */
        supportedCommands?: GeneralCommandType[];
        /**
         * Determines whether media can be played remotely..
         * @default false
         */
        supportsMediaControl?: boolean;
        /**
         * Determines whether the device supports a unique identifier.
         * @default true
         */
        supportsPersistentIdentifier?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/Sessions/Capabilities`,
        method: 'POST',
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Session
     * @name PostFullCapabilities
     * @summary Updates capabilities for a device.
     * @request POST:/Sessions/Capabilities/Full
     * @secure
     */
    postFullCapabilities: (
      data: ClientCapabilitiesDto,
      query?: {
        /** The session id. */
        id?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/Sessions/Capabilities/Full`,
        method: 'POST',
        query: query,
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Session
     * @name ReportSessionEnded
     * @summary Reports that a session has ended.
     * @request POST:/Sessions/Logout
     * @secure
     */
    reportSessionEnded: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/Sessions/Logout`,
        method: 'POST',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Session
     * @name ReportViewing
     * @summary Reports that a session is viewing an item.
     * @request POST:/Sessions/Viewing
     * @secure
     */
    reportViewing: (
      query: {
        /** The session id. */
        sessionId?: string;
        /** The item id. */
        itemId: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/Sessions/Viewing`,
        method: 'POST',
        query: query,
        secure: true,
        ...params,
      }),
  };
  userPlayedItems = {
    /**
     * No description
     *
     * @tags Playstate
     * @name MarkPlayedItem
     * @summary Marks an item as played for user.
     * @request POST:/UserPlayedItems/{itemId}
     * @secure
     */
    markPlayedItem: (
      itemId: string,
      query?: {
        /**
         * User id.
         * @format uuid
         */
        userId?: string;
        /**
         * Optional. The date the item was played.
         * @format date-time
         */
        datePlayed?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<UserItemDataDto, void | ProblemDetails>({
        path: `/UserPlayedItems/${itemId}`,
        method: 'POST',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Playstate
     * @name MarkUnplayedItem
     * @summary Marks an item as unplayed for user.
     * @request DELETE:/UserPlayedItems/{itemId}
     * @secure
     */
    markUnplayedItem: (
      itemId: string,
      query?: {
        /**
         * User id.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<UserItemDataDto, void | ProblemDetails>({
        path: `/UserPlayedItems/${itemId}`,
        method: 'DELETE',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),
  };
  plugins = {
    /**
     * No description
     *
     * @tags Plugins
     * @name GetPlugins
     * @summary Gets a list of currently installed plugins.
     * @request GET:/Plugins
     * @secure
     */
    getPlugins: (params: RequestParams = {}) =>
      this.request<PluginInfo[], void>({
        path: `/Plugins`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Plugins
     * @name UninstallPlugin
     * @summary Uninstalls a plugin.
     * @request DELETE:/Plugins/{pluginId}
     * @deprecated
     * @secure
     */
    uninstallPlugin: (pluginId: string, params: RequestParams = {}) =>
      this.request<void, void | ProblemDetails>({
        path: `/Plugins/${pluginId}`,
        method: 'DELETE',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Plugins
     * @name UninstallPluginByVersion
     * @summary Uninstalls a plugin by version.
     * @request DELETE:/Plugins/{pluginId}/{version}
     * @secure
     */
    uninstallPluginByVersion: (pluginId: string, version: string, params: RequestParams = {}) =>
      this.request<void, void | ProblemDetails>({
        path: `/Plugins/${pluginId}/${version}`,
        method: 'DELETE',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Plugins
     * @name DisablePlugin
     * @summary Disable a plugin.
     * @request POST:/Plugins/{pluginId}/{version}/Disable
     * @secure
     */
    disablePlugin: (pluginId: string, version: string, params: RequestParams = {}) =>
      this.request<void, void | ProblemDetails>({
        path: `/Plugins/${pluginId}/${version}/Disable`,
        method: 'POST',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Plugins
     * @name EnablePlugin
     * @summary Enables a disabled plugin.
     * @request POST:/Plugins/{pluginId}/{version}/Enable
     * @secure
     */
    enablePlugin: (pluginId: string, version: string, params: RequestParams = {}) =>
      this.request<void, void | ProblemDetails>({
        path: `/Plugins/${pluginId}/${version}/Enable`,
        method: 'POST',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Plugins
     * @name GetPluginImage
     * @summary Gets a plugin's image.
     * @request GET:/Plugins/{pluginId}/{version}/Image
     * @secure
     */
    getPluginImage: (pluginId: string, version: string, params: RequestParams = {}) =>
      this.request<File, void | ProblemDetails>({
        path: `/Plugins/${pluginId}/${version}/Image`,
        method: 'GET',
        secure: true,
        format: 'blob',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Plugins
     * @name GetPluginConfiguration
     * @summary Gets plugin configuration.
     * @request GET:/Plugins/{pluginId}/Configuration
     * @secure
     */
    getPluginConfiguration: (pluginId: string, params: RequestParams = {}) =>
      this.request<BasePluginConfiguration, void | ProblemDetails>({
        path: `/Plugins/${pluginId}/Configuration`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Accepts plugin configuration as JSON body.
     *
     * @tags Plugins
     * @name UpdatePluginConfiguration
     * @summary Updates plugin configuration.
     * @request POST:/Plugins/{pluginId}/Configuration
     * @secure
     */
    updatePluginConfiguration: (pluginId: string, params: RequestParams = {}) =>
      this.request<void, void | ProblemDetails>({
        path: `/Plugins/${pluginId}/Configuration`,
        method: 'POST',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Plugins
     * @name GetPluginManifest
     * @summary Gets a plugin's manifest.
     * @request POST:/Plugins/{pluginId}/Manifest
     * @secure
     */
    getPluginManifest: (pluginId: string, params: RequestParams = {}) =>
      this.request<void, void | ProblemDetails>({
        path: `/Plugins/${pluginId}/Manifest`,
        method: 'POST',
        secure: true,
        ...params,
      }),
  };
  quickConnect = {
    /**
     * No description
     *
     * @tags QuickConnect
     * @name AuthorizeQuickConnect
     * @summary Authorizes a pending quick connect request.
     * @request POST:/QuickConnect/Authorize
     * @secure
     */
    authorizeQuickConnect: (
      query: {
        /** Quick connect code to authorize. */
        code: string;
        /**
         * The user the authorize. Access to the requested user is required.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<boolean, void | ProblemDetails>({
        path: `/QuickConnect/Authorize`,
        method: 'POST',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags QuickConnect
     * @name GetQuickConnectState
     * @summary Attempts to retrieve authentication information.
     * @request GET:/QuickConnect/Connect
     */
    getQuickConnectState: (
      query: {
        /** Secret previously returned from the Initiate endpoint. */
        secret: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<QuickConnectResult, ProblemDetails>({
        path: `/QuickConnect/Connect`,
        method: 'GET',
        query: query,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags QuickConnect
     * @name GetQuickConnectEnabled
     * @summary Gets the current quick connect state.
     * @request GET:/QuickConnect/Enabled
     */
    getQuickConnectEnabled: (params: RequestParams = {}) =>
      this.request<boolean, any>({
        path: `/QuickConnect/Enabled`,
        method: 'GET',
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags QuickConnect
     * @name InitiateQuickConnect
     * @summary Initiate a new quick connect request.
     * @request POST:/QuickConnect/Initiate
     */
    initiateQuickConnect: (params: RequestParams = {}) =>
      this.request<QuickConnectResult, void>({
        path: `/QuickConnect/Initiate`,
        method: 'POST',
        format: 'json',
        ...params,
      }),
  };
  scheduledTasks = {
    /**
     * No description
     *
     * @tags ScheduledTasks
     * @name GetTasks
     * @summary Get tasks.
     * @request GET:/ScheduledTasks
     * @secure
     */
    getTasks: (
      query?: {
        /** Optional filter tasks that are hidden, or not. */
        isHidden?: boolean;
        /** Optional filter tasks that are enabled, or not. */
        isEnabled?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<TaskInfo[], void>({
        path: `/ScheduledTasks`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags ScheduledTasks
     * @name GetTask
     * @summary Get task by id.
     * @request GET:/ScheduledTasks/{taskId}
     * @secure
     */
    getTask: (taskId: string, params: RequestParams = {}) =>
      this.request<TaskInfo, void | ProblemDetails>({
        path: `/ScheduledTasks/${taskId}`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags ScheduledTasks
     * @name UpdateTask
     * @summary Update specified task triggers.
     * @request POST:/ScheduledTasks/{taskId}/Triggers
     * @secure
     */
    updateTask: (taskId: string, data: TaskTriggerInfo[], params: RequestParams = {}) =>
      this.request<void, void | ProblemDetails>({
        path: `/ScheduledTasks/${taskId}/Triggers`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags ScheduledTasks
     * @name StartTask
     * @summary Start specified task.
     * @request POST:/ScheduledTasks/Running/{taskId}
     * @secure
     */
    startTask: (taskId: string, params: RequestParams = {}) =>
      this.request<void, void | ProblemDetails>({
        path: `/ScheduledTasks/Running/${taskId}`,
        method: 'POST',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags ScheduledTasks
     * @name StopTask
     * @summary Stop specified task.
     * @request DELETE:/ScheduledTasks/Running/{taskId}
     * @secure
     */
    stopTask: (taskId: string, params: RequestParams = {}) =>
      this.request<void, void | ProblemDetails>({
        path: `/ScheduledTasks/Running/${taskId}`,
        method: 'DELETE',
        secure: true,
        ...params,
      }),
  };
  search = {
    /**
     * No description
     *
     * @tags Search
     * @name GetSearchHints
     * @summary Gets the search hint result.
     * @request GET:/Search/Hints
     * @secure
     */
    getSearchHints: (
      query: {
        /**
         * Optional. The record index to start at. All items with a lower index will be dropped from the results.
         * @format int32
         */
        startIndex?: number;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /**
         * Optional. Supply a user id to search within a user's library or omit to search all.
         * @format uuid
         */
        userId?: string;
        /** The search term to filter on. */
        searchTerm: string;
        /** If specified, only results with the specified item types are returned. This allows multiple, comma delimited. */
        includeItemTypes?: BaseItemKind[];
        /** If specified, results with these item types are filtered out. This allows multiple, comma delimited. */
        excludeItemTypes?: BaseItemKind[];
        /** If specified, only results with the specified media types are returned. This allows multiple, comma delimited. */
        mediaTypes?: MediaType[];
        /**
         * If specified, only children of the parent are returned.
         * @format uuid
         */
        parentId?: string;
        /** Optional filter for movies. */
        isMovie?: boolean;
        /** Optional filter for series. */
        isSeries?: boolean;
        /** Optional filter for news. */
        isNews?: boolean;
        /** Optional filter for kids. */
        isKids?: boolean;
        /** Optional filter for sports. */
        isSports?: boolean;
        /**
         * Optional filter whether to include people.
         * @default true
         */
        includePeople?: boolean;
        /**
         * Optional filter whether to include media.
         * @default true
         */
        includeMedia?: boolean;
        /**
         * Optional filter whether to include genres.
         * @default true
         */
        includeGenres?: boolean;
        /**
         * Optional filter whether to include studios.
         * @default true
         */
        includeStudios?: boolean;
        /**
         * Optional filter whether to include artists.
         * @default true
         */
        includeArtists?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<SearchHintResult, void>({
        path: `/Search/Hints`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),
  };
  startup = {
    /**
     * No description
     *
     * @tags Startup
     * @name CompleteWizard
     * @summary Completes the startup wizard.
     * @request POST:/Startup/Complete
     * @secure
     */
    completeWizard: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/Startup/Complete`,
        method: 'POST',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Startup
     * @name GetStartupConfiguration
     * @summary Gets the initial startup wizard configuration.
     * @request GET:/Startup/Configuration
     * @secure
     */
    getStartupConfiguration: (params: RequestParams = {}) =>
      this.request<StartupConfigurationDto, void>({
        path: `/Startup/Configuration`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Startup
     * @name UpdateInitialConfiguration
     * @summary Sets the initial startup wizard configuration.
     * @request POST:/Startup/Configuration
     * @secure
     */
    updateInitialConfiguration: (data: StartupConfigurationDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/Startup/Configuration`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Startup
     * @name GetFirstUser2
     * @summary Gets the first user.
     * @request GET:/Startup/FirstUser
     * @secure
     */
    getFirstUser2: (params: RequestParams = {}) =>
      this.request<StartupUserDto, void>({
        path: `/Startup/FirstUser`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Startup
     * @name SetRemoteAccess
     * @summary Sets remote access and UPnP.
     * @request POST:/Startup/RemoteAccess
     * @secure
     */
    setRemoteAccess: (data: StartupRemoteAccessDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/Startup/RemoteAccess`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Startup
     * @name GetFirstUser
     * @summary Gets the first user.
     * @request GET:/Startup/User
     * @secure
     */
    getFirstUser: (params: RequestParams = {}) =>
      this.request<StartupUserDto, void>({
        path: `/Startup/User`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Startup
     * @name UpdateStartupUser
     * @summary Sets the user name and password.
     * @request POST:/Startup/User
     * @secure
     */
    updateStartupUser: (data: StartupUserDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/Startup/User`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),
  };
  fallbackFont = {
    /**
     * No description
     *
     * @tags Subtitle
     * @name GetFallbackFontList
     * @summary Gets a list of available fallback font files.
     * @request GET:/FallbackFont/Fonts
     * @secure
     */
    getFallbackFontList: (params: RequestParams = {}) =>
      this.request<FontFile[], void>({
        path: `/FallbackFont/Fonts`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Subtitle
     * @name GetFallbackFont
     * @summary Gets a fallback font file.
     * @request GET:/FallbackFont/Fonts/{name}
     * @secure
     */
    getFallbackFont: (name: string, params: RequestParams = {}) =>
      this.request<File, void>({
        path: `/FallbackFont/Fonts/${name}`,
        method: 'GET',
        secure: true,
        ...params,
      }),
  };
  syncPlay = {
    /**
     * No description
     *
     * @tags SyncPlay
     * @name SyncPlayBuffering
     * @summary Notify SyncPlay group that member is buffering.
     * @request POST:/SyncPlay/Buffering
     * @secure
     */
    syncPlayBuffering: (data: BufferRequestDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/SyncPlay/Buffering`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags SyncPlay
     * @name SyncPlayJoinGroup
     * @summary Join an existing SyncPlay group.
     * @request POST:/SyncPlay/Join
     * @secure
     */
    syncPlayJoinGroup: (data: JoinGroupRequestDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/SyncPlay/Join`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags SyncPlay
     * @name SyncPlayLeaveGroup
     * @summary Leave the joined SyncPlay group.
     * @request POST:/SyncPlay/Leave
     * @secure
     */
    syncPlayLeaveGroup: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/SyncPlay/Leave`,
        method: 'POST',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags SyncPlay
     * @name SyncPlayGetGroups
     * @summary Gets all SyncPlay groups.
     * @request GET:/SyncPlay/List
     * @secure
     */
    syncPlayGetGroups: (params: RequestParams = {}) =>
      this.request<GroupInfoDto[], void>({
        path: `/SyncPlay/List`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags SyncPlay
     * @name SyncPlayMovePlaylistItem
     * @summary Request to move an item in the playlist in SyncPlay group.
     * @request POST:/SyncPlay/MovePlaylistItem
     * @secure
     */
    syncPlayMovePlaylistItem: (data: MovePlaylistItemRequestDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/SyncPlay/MovePlaylistItem`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags SyncPlay
     * @name SyncPlayCreateGroup
     * @summary Create a new SyncPlay group.
     * @request POST:/SyncPlay/New
     * @secure
     */
    syncPlayCreateGroup: (data: NewGroupRequestDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/SyncPlay/New`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags SyncPlay
     * @name SyncPlayNextItem
     * @summary Request next item in SyncPlay group.
     * @request POST:/SyncPlay/NextItem
     * @secure
     */
    syncPlayNextItem: (data: NextItemRequestDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/SyncPlay/NextItem`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags SyncPlay
     * @name SyncPlayPause
     * @summary Request pause in SyncPlay group.
     * @request POST:/SyncPlay/Pause
     * @secure
     */
    syncPlayPause: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/SyncPlay/Pause`,
        method: 'POST',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags SyncPlay
     * @name SyncPlayPing
     * @summary Update session ping.
     * @request POST:/SyncPlay/Ping
     * @secure
     */
    syncPlayPing: (data: PingRequestDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/SyncPlay/Ping`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags SyncPlay
     * @name SyncPlayPreviousItem
     * @summary Request previous item in SyncPlay group.
     * @request POST:/SyncPlay/PreviousItem
     * @secure
     */
    syncPlayPreviousItem: (data: PreviousItemRequestDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/SyncPlay/PreviousItem`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags SyncPlay
     * @name SyncPlayQueue
     * @summary Request to queue items to the playlist of a SyncPlay group.
     * @request POST:/SyncPlay/Queue
     * @secure
     */
    syncPlayQueue: (data: QueueRequestDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/SyncPlay/Queue`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags SyncPlay
     * @name SyncPlayReady
     * @summary Notify SyncPlay group that member is ready for playback.
     * @request POST:/SyncPlay/Ready
     * @secure
     */
    syncPlayReady: (data: ReadyRequestDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/SyncPlay/Ready`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags SyncPlay
     * @name SyncPlayRemoveFromPlaylist
     * @summary Request to remove items from the playlist in SyncPlay group.
     * @request POST:/SyncPlay/RemoveFromPlaylist
     * @secure
     */
    syncPlayRemoveFromPlaylist: (data: RemoveFromPlaylistRequestDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/SyncPlay/RemoveFromPlaylist`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags SyncPlay
     * @name SyncPlaySeek
     * @summary Request seek in SyncPlay group.
     * @request POST:/SyncPlay/Seek
     * @secure
     */
    syncPlaySeek: (data: SeekRequestDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/SyncPlay/Seek`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags SyncPlay
     * @name SyncPlaySetIgnoreWait
     * @summary Request SyncPlay group to ignore member during group-wait.
     * @request POST:/SyncPlay/SetIgnoreWait
     * @secure
     */
    syncPlaySetIgnoreWait: (data: IgnoreWaitRequestDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/SyncPlay/SetIgnoreWait`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags SyncPlay
     * @name SyncPlaySetNewQueue
     * @summary Request to set new playlist in SyncPlay group.
     * @request POST:/SyncPlay/SetNewQueue
     * @secure
     */
    syncPlaySetNewQueue: (data: PlayRequestDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/SyncPlay/SetNewQueue`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags SyncPlay
     * @name SyncPlaySetPlaylistItem
     * @summary Request to change playlist item in SyncPlay group.
     * @request POST:/SyncPlay/SetPlaylistItem
     * @secure
     */
    syncPlaySetPlaylistItem: (data: SetPlaylistItemRequestDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/SyncPlay/SetPlaylistItem`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags SyncPlay
     * @name SyncPlaySetRepeatMode
     * @summary Request to set repeat mode in SyncPlay group.
     * @request POST:/SyncPlay/SetRepeatMode
     * @secure
     */
    syncPlaySetRepeatMode: (data: SetRepeatModeRequestDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/SyncPlay/SetRepeatMode`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags SyncPlay
     * @name SyncPlaySetShuffleMode
     * @summary Request to set shuffle mode in SyncPlay group.
     * @request POST:/SyncPlay/SetShuffleMode
     * @secure
     */
    syncPlaySetShuffleMode: (data: SetShuffleModeRequestDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/SyncPlay/SetShuffleMode`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags SyncPlay
     * @name SyncPlayStop
     * @summary Request stop in SyncPlay group.
     * @request POST:/SyncPlay/Stop
     * @secure
     */
    syncPlayStop: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/SyncPlay/Stop`,
        method: 'POST',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags SyncPlay
     * @name SyncPlayUnpause
     * @summary Request unpause in SyncPlay group.
     * @request POST:/SyncPlay/Unpause
     * @secure
     */
    syncPlayUnpause: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/SyncPlay/Unpause`,
        method: 'POST',
        secure: true,
        ...params,
      }),
  };
  getUtcTime = {
    /**
     * No description
     *
     * @tags TimeSync
     * @name GetUtcTime
     * @summary Gets the current UTC time.
     * @request GET:/GetUtcTime
     */
    getUtcTime: (params: RequestParams = {}) =>
      this.request<UtcTimeResponse, any>({
        path: `/GetUtcTime`,
        method: 'GET',
        format: 'json',
        ...params,
      }),
  };
  tmdb = {
    /**
     * No description
     *
     * @tags Tmdb
     * @name TmdbClientConfiguration
     * @summary Gets the TMDb image configuration options.
     * @request GET:/Tmdb/ClientConfiguration
     * @secure
     */
    tmdbClientConfiguration: (params: RequestParams = {}) =>
      this.request<ConfigImageTypes, void>({
        path: `/Tmdb/ClientConfiguration`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),
  };
  users = {
    /**
     * No description
     *
     * @tags User
     * @name GetUsers
     * @summary Gets a list of users.
     * @request GET:/Users
     * @secure
     */
    getUsers: (
      query?: {
        /** Optional filter by IsHidden=true or false. */
        isHidden?: boolean;
        /** Optional filter by IsDisabled=true or false. */
        isDisabled?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<UserDto[], void>({
        path: `/Users`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name UpdateUser
     * @summary Updates a user.
     * @request POST:/Users
     * @secure
     */
    updateUser: (
      data: UserDto,
      query?: {
        /**
         * The user id.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, ProblemDetails | void>({
        path: `/Users`,
        method: 'POST',
        query: query,
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name GetUserById
     * @summary Gets a user by Id.
     * @request GET:/Users/{userId}
     * @secure
     */
    getUserById: (userId: string, params: RequestParams = {}) =>
      this.request<UserDto, void | ProblemDetails>({
        path: `/Users/${userId}`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name DeleteUser
     * @summary Deletes a user.
     * @request DELETE:/Users/{userId}
     * @secure
     */
    deleteUser: (userId: string, params: RequestParams = {}) =>
      this.request<void, void | ProblemDetails>({
        path: `/Users/${userId}`,
        method: 'DELETE',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name UpdateUserPolicy
     * @summary Updates a user policy.
     * @request POST:/Users/{userId}/Policy
     * @secure
     */
    updateUserPolicy: (userId: string, data: UserPolicy, params: RequestParams = {}) =>
      this.request<void, ProblemDetails | void>({
        path: `/Users/${userId}/Policy`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name AuthenticateUserByName
     * @summary Authenticates a user by name.
     * @request POST:/Users/AuthenticateByName
     */
    authenticateUserByName: (data: AuthenticateUserByName, params: RequestParams = {}) =>
      this.request<AuthenticationResult, any>({
        path: `/Users/AuthenticateByName`,
        method: 'POST',
        body: data,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name AuthenticateWithQuickConnect
     * @summary Authenticates a user with quick connect.
     * @request POST:/Users/AuthenticateWithQuickConnect
     */
    authenticateWithQuickConnect: (data: QuickConnectDto, params: RequestParams = {}) =>
      this.request<AuthenticationResult, void>({
        path: `/Users/AuthenticateWithQuickConnect`,
        method: 'POST',
        body: data,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name UpdateUserConfiguration
     * @summary Updates a user configuration.
     * @request POST:/Users/Configuration
     * @secure
     */
    updateUserConfiguration: (
      data: UserConfiguration,
      query?: {
        /**
         * The user id.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void | ProblemDetails>({
        path: `/Users/Configuration`,
        method: 'POST',
        query: query,
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name ForgotPassword
     * @summary Initiates the forgot password process for a local user.
     * @request POST:/Users/ForgotPassword
     */
    forgotPassword: (data: ForgotPasswordDto, params: RequestParams = {}) =>
      this.request<ForgotPasswordResult, any>({
        path: `/Users/ForgotPassword`,
        method: 'POST',
        body: data,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name ForgotPasswordPin
     * @summary Redeems a forgot password pin.
     * @request POST:/Users/ForgotPassword/Pin
     */
    forgotPasswordPin: (data: ForgotPasswordPinDto, params: RequestParams = {}) =>
      this.request<PinRedeemResult, any>({
        path: `/Users/ForgotPassword/Pin`,
        method: 'POST',
        body: data,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name GetCurrentUser
     * @summary Gets the user based on auth token.
     * @request GET:/Users/Me
     * @secure
     */
    getCurrentUser: (params: RequestParams = {}) =>
      this.request<UserDto, ProblemDetails | void>({
        path: `/Users/Me`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name CreateUserByName
     * @summary Creates a user.
     * @request POST:/Users/New
     * @secure
     */
    createUserByName: (data: CreateUserByName, params: RequestParams = {}) =>
      this.request<UserDto, void>({
        path: `/Users/New`,
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
     * @tags User
     * @name UpdateUserPassword
     * @summary Updates a user's password.
     * @request POST:/Users/Password
     * @secure
     */
    updateUserPassword: (
      data: UpdateUserPassword,
      query?: {
        /**
         * The user id.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void | ProblemDetails>({
        path: `/Users/Password`,
        method: 'POST',
        query: query,
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name GetPublicUsers
     * @summary Gets a list of publicly visible users for display on a login screen.
     * @request GET:/Users/Public
     */
    getPublicUsers: (params: RequestParams = {}) =>
      this.request<UserDto[], any>({
        path: `/Users/Public`,
        method: 'GET',
        format: 'json',
        ...params,
      }),
  };
  userFavoriteItems = {
    /**
     * No description
     *
     * @tags UserLibrary
     * @name MarkFavoriteItem
     * @summary Marks an item as a favorite.
     * @request POST:/UserFavoriteItems/{itemId}
     * @secure
     */
    markFavoriteItem: (
      itemId: string,
      query?: {
        /**
         * User id.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<UserItemDataDto, void>({
        path: `/UserFavoriteItems/${itemId}`,
        method: 'POST',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags UserLibrary
     * @name UnmarkFavoriteItem
     * @summary Unmarks item as a favorite.
     * @request DELETE:/UserFavoriteItems/{itemId}
     * @secure
     */
    unmarkFavoriteItem: (
      itemId: string,
      query?: {
        /**
         * User id.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<UserItemDataDto, void>({
        path: `/UserFavoriteItems/${itemId}`,
        method: 'DELETE',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),
  };
  userViews = {
    /**
     * No description
     *
     * @tags UserViews
     * @name GetUserViews
     * @summary Get user views.
     * @request GET:/UserViews
     * @secure
     */
    getUserViews: (
      query?: {
        /**
         * User id.
         * @format uuid
         */
        userId?: string;
        /** Whether or not to include external views such as channels or live tv. */
        includeExternalContent?: boolean;
        /** Preset views. */
        presetViews?: CollectionType[];
        /**
         * Whether or not to include hidden content.
         * @default false
         */
        includeHidden?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/UserViews`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags UserViews
     * @name GetGroupingOptions
     * @summary Get user view grouping options.
     * @request GET:/UserViews/GroupingOptions
     * @secure
     */
    getGroupingOptions: (
      query?: {
        /**
         * User id.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<SpecialViewOptionDto[], void | ProblemDetails>({
        path: `/UserViews/GroupingOptions`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),
  };
  years = {
    /**
     * No description
     *
     * @tags Years
     * @name GetYears
     * @summary Get years.
     * @request GET:/Years
     * @secure
     */
    getYears: (
      query?: {
        /**
         * Skips over a given number of items within the results. Use for paging.
         * @format int32
         */
        startIndex?: number;
        /**
         * Optional. The maximum number of records to return.
         * @format int32
         */
        limit?: number;
        /** Sort Order - Ascending,Descending. */
        sortOrder?: SortOrder[];
        /**
         * Specify this to localize the search to a specific item or folder. Omit to use the root.
         * @format uuid
         */
        parentId?: string;
        /** Optional. Specify additional fields of information to return in the output. */
        fields?: ItemFields[];
        /** Optional. If specified, results will be excluded based on item type. This allows multiple, comma delimited. */
        excludeItemTypes?: BaseItemKind[];
        /** Optional. If specified, results will be included based on item type. This allows multiple, comma delimited. */
        includeItemTypes?: BaseItemKind[];
        /** Optional. Filter by MediaType. Allows multiple, comma delimited. */
        mediaTypes?: MediaType[];
        /** Optional. Specify one or more sort orders, comma delimited. Options: Album, AlbumArtist, Artist, Budget, CommunityRating, CriticRating, DateCreated, DatePlayed, PlayCount, PremiereDate, ProductionYear, SortName, Random, Revenue, Runtime. */
        sortBy?: ItemSortBy[];
        /** Optional. Include user data. */
        enableUserData?: boolean;
        /**
         * Optional. The max number of images to return, per image type.
         * @format int32
         */
        imageTypeLimit?: number;
        /** Optional. The image types to include in the output. */
        enableImageTypes?: ImageType[];
        /**
         * User Id.
         * @format uuid
         */
        userId?: string;
        /**
         * Search recursively.
         * @default true
         */
        recursive?: boolean;
        /**
         * Optional. Include image information in output.
         * @default true
         */
        enableImages?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDtoQueryResult, void>({
        path: `/Years`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags Years
     * @name GetYear
     * @summary Gets a year.
     * @request GET:/Years/{year}
     * @secure
     */
    getYear: (
      year: number,
      query?: {
        /**
         * Optional. Filter by user id, and attach user data.
         * @format uuid
         */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<BaseItemDto, void | ProblemDetails>({
        path: `/Years/${year}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),
  };
}
