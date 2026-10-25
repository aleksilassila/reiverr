import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import axios from 'axios';
import { createHash, randomUUID } from 'node:crypto';
import { normalizeTitle, yearOf } from '../library/library.utils.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { IndexerDto } from './indexers.dto.js';
import { isReleaseOfMovie, parseReleaseTitle } from './release-title.utils.js';
import { parseTorrentSource, TorrentSource } from './torrent-source.utils.js';
import {
  parseTorznabCaps,
  parseTorznabItems,
  TorznabCaps,
  TorznabItem,
} from './torznab.utils.js';

const SETTINGS_KEY = 'indexers';
const REQUEST_TIMEOUT = 30_000;
const RELEASE_TTL = 60 * 60 * 1000;
const MAX_REDIRECTS = 5;

export interface Release extends TorznabItem {
  id: string;
  indexer: string;
  /** Empty for a movie */
  seasons: number[];
  /** Empty for a movie and for a season pack */
  episodes: number[];
}

/** An item of an indexer, as the clients refer to it */
type FoundItem = TorznabItem & Pick<Release, 'id' | 'indexer'>;

interface SeriesQuery {
  name: string;
  tmdbId: string;
  tvdbId?: string;
  imdbId?: string;
  season: number;
  episode?: number;
}

interface MovieQuery {
  name: string;
  tmdbId: string;
  imdbId?: string;
  year?: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Apostrophes and colons are not searched for; indexers write them differently */
const searchable = (name: string) => name.replace(/['’:]/g, '');

@Injectable()
export class IndexersService {
  private readonly logger = new Logger(IndexersService.name);
  private readonly caps = new Map<string, Promise<TorznabCaps>>();
  // Download links carry the indexer API key, so releases stay on the server
  // and clients refer to them by id
  private readonly releases = new Map<
    string,
    { release: Release; expiresAt: number }
  >();

  constructor(
    private readonly settingsService: SettingsService,
    private readonly metadataService: MetadataService,
  ) {}

  getIndexers(): Promise<IndexerDto[]> {
    return this.settingsService.getOrCreateValue<IndexerDto[]>(
      SETTINGS_KEY,
      [],
    );
  }

  async updateIndexers(indexers: IndexerDto[]): Promise<IndexerDto[]> {
    const isValid =
      Array.isArray(indexers) &&
      indexers.every(
        (indexer) =>
          typeof indexer?.name === 'string' &&
          indexer.name.trim() &&
          typeof indexer.url === 'string' &&
          /^https?:\/\//.test(indexer.url.trim()) &&
          typeof indexer.apiKey === 'string',
      );
    if (!isValid) {
      throw new BadRequestException(
        'Indexers need a name, an http(s) URL and an API key',
      );
    }

    const value: IndexerDto[] = indexers.map((indexer) => ({
      id: indexer.id || randomUUID(),
      name: indexer.name.trim(),
      url: indexer.url.trim(),
      apiKey: indexer.apiKey.trim(),
    }));

    this.caps.clear();
    for (const indexer of value) {
      await this.getCaps(indexer).catch((e) => {
        throw new BadRequestException(`${indexer.name}: ${e.message}`);
      });
    }

    return this.settingsService.saveValue(SETTINGS_KEY, value);
  }

  /**
   * Releases of one episode, or the season packs of the season when no
   * episode is given, with the most seeded first.
   */
  async searchSeries(
    tmdbId: string,
    season: number,
    episode?: number,
  ): Promise<Release[]> {
    const metadata = await this.metadataService.getSeriesByTmdbId(tmdbId);
    if (!metadata) throw new NotFoundException('Series not found');

    const series = metadata.tmdbSeries;
    const query: SeriesQuery = {
      name: series.name,
      tmdbId,
      tvdbId: series.external_ids?.tvdb_id
        ? String(series.external_ids.tvdb_id)
        : undefined,
      imdbId: series.external_ids?.imdb_id ?? undefined,
      season,
      episode,
    };
    const items = await this.searchAll((indexer) =>
      this.searchSeriesItems(indexer, query),
    );

    return this.remember(
      items.flatMap((item): Release[] => {
        const { kind, seasons, episodes } = parseReleaseTitle(item.title);
        const matches =
          episode === undefined
            ? kind === 'season-pack' && seasons.includes(season)
            : kind === 'episode' &&
              seasons.includes(season) &&
              episodes.includes(episode);

        return matches ? [{ ...item, seasons, episodes }] : [];
      }),
    );
  }

  /** Releases of a movie, by its name and year, with the most seeded first */
  async searchMovies(tmdbId: string): Promise<Release[]> {
    const metadata = await this.metadataService.getMovieByTmdbId(tmdbId);
    if (!metadata) throw new NotFoundException('Movie not found');

    const movie = metadata.tmdbMovie;
    const query: MovieQuery = {
      name: movie.title,
      tmdbId,
      imdbId: movie.imdb_id ?? movie.external_ids?.imdb_id ?? undefined,
      year: yearOf(movie.release_date),
    };
    const titles = [movie.title, movie.original_title]
      .filter(Boolean)
      .map(normalizeTitle);
    const items = await this.searchAll((indexer) =>
      this.searchMovieItems(indexer, query),
    );

    return this.remember(
      items
        .filter((item) =>
          isReleaseOfMovie(item.title, { titles, year: query.year }),
        )
        .map((item): Release => ({ ...item, seasons: [], episodes: [] })),
    );
  }

  getRelease(id: string): Release | undefined {
    const entry = this.releases.get(id);

    return entry && entry.expiresAt > Date.now() ? entry.release : undefined;
  }

  /**
   * What a release is downloaded from: its magnet link, or the .torrent file
   * behind its download link. Fails when the link does not lead to a torrent.
   */
  async resolveTorrent(
    release: Pick<Release, 'title' | 'magnetUrl' | 'downloadUrl' | 'infoHash'>,
  ): Promise<TorrentSource> {
    try {
      if (release.magnetUrl) return parseTorrentSource(release.magnetUrl);
      if (release.downloadUrl) {
        return parseTorrentSource(await this.fetchTorrent(release.downloadUrl));
      }
      if (release.infoHash) {
        return parseTorrentSource(`magnet:?xt=urn:btih:${release.infoHash}`);
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);

      throw new BadGatewayException(
        `Could not get the torrent of "${release.title}": ${reason}`,
      );
    }

    throw new BadGatewayException(
      `"${release.title}" has no magnet link, download link or hash`,
    );
  }

  /**
   * Runs a search on every indexer and gives what they found, with the ids
   * the clients refer to the items by. Indexers that fail are logged and
   * left out; the search fails when all of them do.
   */
  private async searchAll(
    search: (indexer: IndexerDto) => Promise<TorznabItem[]>,
  ): Promise<FoundItem[]> {
    const indexers = await this.getIndexers();
    if (!indexers.length) {
      throw new BadRequestException('No indexers are configured');
    }

    const results = await Promise.allSettled(
      indexers.map(async (indexer) =>
        (await search(indexer)).map((item): FoundItem => ({
          ...item,
          id: createHash('sha1')
            .update(`${indexer.id}:${item.guid}`)
            .digest('hex'),
          indexer: item.tracker ?? indexer.name,
        })),
      ),
    );

    const failures = results.flatMap((result, i) =>
      result.status === 'rejected'
        ? [`${indexers[i].name}: ${result.reason?.message}`]
        : [],
    );
    failures.forEach((failure) =>
      this.logger.warn(`Search failed, ${failure}`),
    );
    if (failures.length === indexers.length) {
      throw new BadGatewayException(failures.join('; '));
    }

    return results.flatMap((result) =>
      result.status === 'fulfilled' ? result.value : [],
    );
  }

  /**
   * Searches by an id the indexer supports and falls back to the series name
   * when it supports none or the id search finds nothing.
   */
  private async searchSeriesItems(
    indexer: IndexerDto,
    query: SeriesQuery,
  ): Promise<TorznabItem[]> {
    const { tvSearch } = await this.getCaps(indexer);
    const { season, episode } = query;

    const mode = { t: tvSearch.length ? 'tvsearch' : 'search' };
    const supportsNumbers =
      tvSearch.includes('season') &&
      (episode === undefined || tvSearch.includes('ep'));
    const numbers = supportsNumbers ? { season, ep: episode } : {};

    const id = tvSearch.includes('tmdbid')
      ? { tmdbid: query.tmdbId }
      : tvSearch.includes('tvdbid') && query.tvdbId
        ? { tvdbid: query.tvdbId }
        : tvSearch.includes('imdbid') && query.imdbId
          ? { imdbid: query.imdbId }
          : undefined;

    if (id && supportsNumbers) {
      const items = parseTorznabItems(
        await this.request(indexer, { ...mode, ...id, ...numbers }),
      );
      if (items.length) return items;
    }

    const name = searchable(query.name);
    const numbering =
      `S${pad(season)}` + (episode === undefined ? '' : `E${pad(episode)}`);

    return parseTorznabItems(
      await this.request(indexer, {
        ...mode,
        q: supportsNumbers ? name : `${name} ${numbering}`,
        ...numbers,
      }),
    );
  }

  /**
   * Searches by an id the indexer supports and falls back to the movie name
   * with its year when it supports none or the id search finds nothing.
   */
  private async searchMovieItems(
    indexer: IndexerDto,
    query: MovieQuery,
  ): Promise<TorznabItem[]> {
    const { movieSearch } = await this.getCaps(indexer);

    const mode = { t: movieSearch.length ? 'movie' : 'search' };
    const id = movieSearch.includes('tmdbid')
      ? { tmdbid: query.tmdbId }
      : movieSearch.includes('imdbid') && query.imdbId
        ? { imdbid: query.imdbId }
        : undefined;

    if (id) {
      const items = parseTorznabItems(
        await this.request(indexer, { ...mode, ...id }),
      );
      if (items.length) return items;
    }

    const name = searchable(query.name);
    const { year } = query;
    const byYear = year !== undefined && movieSearch.includes('year');

    return parseTorznabItems(
      await this.request(indexer, {
        ...mode,
        q: year === undefined || byYear ? name : `${name} ${year}`,
        ...(byYear && { year }),
      }),
    );
  }

  private getCaps(indexer: IndexerDto): Promise<TorznabCaps> {
    const key = `${indexer.url}|${indexer.apiKey}`;

    if (!this.caps.has(key)) {
      const caps = this.request(indexer, { t: 'caps' }).then(parseTorznabCaps);
      caps.catch(() => this.caps.delete(key));
      this.caps.set(key, caps);
    }

    return this.caps.get(key);
  }

  private async request(
    indexer: IndexerDto,
    params: Record<string, string | number | undefined>,
  ): Promise<string> {
    const base = indexer.url.replace(/\/+$/, '');

    const response = await axios.get<string>(
      base.endsWith('/api') ? base : `${base}/api`,
      {
        params: { apikey: indexer.apiKey, ...params },
        responseType: 'text',
        timeout: REQUEST_TIMEOUT,
      },
    );

    return response.data;
  }

  private async fetchTorrent(
    url: string,
    redirects = MAX_REDIRECTS,
  ): Promise<string | Buffer> {
    const response = await axios.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
      maxRedirects: 0,
      timeout: REQUEST_TIMEOUT,
      validateStatus: (status) => status < 400,
    });

    // Jackett redirects its download links to a magnet link for some trackers
    const location: string | undefined = response.headers.location;
    if (response.status >= 300 && location) {
      if (location.startsWith('magnet:')) return location;
      if (!redirects) throw new Error('Too many redirects');

      return this.fetchTorrent(
        new URL(location, url).toString(),
        redirects - 1,
      );
    }

    return Buffer.from(response.data);
  }

  /**
   * Keeps the releases of a search for the clients to refer to by id, the
   * most seeded first and each torrent once: the same torrent can be listed
   * by several indexers
   */
  private remember(releases: Release[]): Release[] {
    const sorted = [...releases].sort((a, b) => b.seeders - a.seeders);
    const unique = sorted.filter(
      (release, i) =>
        !release.infoHash ||
        sorted.findIndex((r) => r.infoHash === release.infoHash) === i,
    );

    const now = Date.now();
    for (const [id, entry] of this.releases) {
      if (entry.expiresAt <= now) this.releases.delete(id);
    }
    for (const release of unique) {
      this.releases.set(release.id, { release, expiresAt: now + RELEASE_TTL });
    }

    return unique;
  }
}
