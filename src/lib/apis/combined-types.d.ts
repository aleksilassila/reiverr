import type { MovieDownload, MovieFileResource, RadarrRelease } from './radarr/radarr-api';
import type { EpisodeFileResource, EpisodeDownload, SonarrRelease } from './sonarr/sonarr-api';

export type Release = RadarrRelease | SonarrRelease;
export type FileResource = MovieFileResource | EpisodeFileResource;
export type Download = MovieDownload | EpisodeDownload;
