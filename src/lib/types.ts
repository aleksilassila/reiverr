import type { components as radarrComponents } from '$lib/radarr';
import type { components as sonarrComponents } from '$lib/sonarr';

export type MovieResource = radarrComponents['schemas']['MovieResource'];

export type SeriesResource = sonarrComponents['schemas']['SeriesResource'];
