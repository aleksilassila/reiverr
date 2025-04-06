import {
  CatalogueItem,
  MediaSourceProvider,
  PaginatedResponse,
  PaginationParams,
  PlaybackConfig,
  Stream,
  StreamActionResponse,
  StreamCandidate,
  Subtitles,
  UserContext,
} from '@aleksilassila/reiverr-plugin';
import {
  getEpisodeTorrents,
  getMovieTorrents,
  getStreamCandidates,
} from './lib/jackett.api';
import { getFiles } from './lib/torrent-manager';
import type { TorrentSettings } from './types';
import {
  EPISODE_SEPARATOR,
  getContentType,
  srt2webvtt,
  subtitleExtensions,
  videoExtensions,
} from './utils';

export class TorrentMediaSourceProvider extends MediaSourceProvider {
  private proxyUrl: string;

  constructor(context: UserContext) {
    super(context);
    this.proxyUrl = `/api/sources/${this.sourceId}/proxy`;
  }

  getTmdbMovieCandidates?:
    | ((options: {
        tmdbMovie: any;
      }) => Promise<{ candidates: StreamCandidate[] }>)
    | undefined = async ({ tmdbMovie }) => {
    const settings = this.settings as TorrentSettings;

    const year = tmdbMovie.release_date
      ? new Date(tmdbMovie.release_date).getFullYear()
      : undefined;

    if (!tmdbMovie.title || !year) return { candidates: [] };
    const torrents = await getMovieTorrents(settings, tmdbMovie.title, year)
      .items;

    const candidates = getStreamCandidates(torrents, {
      runtime: tmdbMovie.runtime,
    });

    return { candidates };
  };

  getTmdbEpisodeCandidates?:
    | ((options: {
        tmdbSeries: any;
        tmdbEpisode: any;
      }) => Promise<{ candidates: StreamCandidate[] }>)
    | undefined = async ({ tmdbSeries, tmdbEpisode }) => {
    const settings = this.settings as TorrentSettings;

    const torrents = getEpisodeTorrents(
      settings,
      tmdbSeries.name,
      tmdbEpisode.season_number,
      tmdbEpisode.episode_number,
    );
    const items = await torrents.items;
    const seasonPacks = await torrents.seasonPacks;

    const seasonEpisodes =
      tmdbSeries?.seasons?.find(
        (s: any) => s.season_number === tmdbEpisode.season_number,
      )?.episode_count ?? 1;
    const candidates = [
      ...getStreamCandidates(items, {
        runtime: tmdbEpisode.runtime,
        season: tmdbEpisode.season_number,
        episode: tmdbEpisode.episode_number,
      }),
      ...getStreamCandidates(seasonPacks, {
        runtime: tmdbEpisode.runtime,
        files: seasonEpisodes,
        season: tmdbEpisode.season_number,
        episode: tmdbEpisode.episode_number,
      }),
    ];

    candidates.sort((a, b) => {
      const aSeeders =
        Number(a.properties.find((p) => p.label === 'Seeders')?.value) || 0;
      const bSeeders =
        Number(b.properties.find((p) => p.label === 'Seeders')?.value) || 0;
      const aPeers =
        Number(a.properties.find((p) => p.label === 'Peers')?.value) || 0;
      const bPeers =
        Number(b.properties.find((p) => p.label === 'Peers')?.value) || 0;

      if (aSeeders + aPeers > bSeeders + bPeers) return -1;
      if (aSeeders + aPeers < bSeeders + bPeers) return 1;

      return 0;
    });

    return { candidates };
  };

  handleAction?: (options: {
    streamId: string;
    action: string;
    config?: PlaybackConfig;
  }) => Promise<StreamActionResponse> = async (options) => {
    if (options.action === 'stream') {
      return this.getStream({
        streamId: options.streamId,
        config: options.config,
      }).then((stream) => ({ stream }));
    }

    return {
      error: {
        message: 'Action not supported',
      },
    };
  };

  getStream: (options: {
    streamId: string;
    config?: PlaybackConfig;
  }) => Promise<Stream | undefined> = async ({ streamId, config }) => {
    const settings = this.settings as TorrentSettings;
    const [link, season, episode] = streamId.split(EPISODE_SEPARATOR);

    // const torrent = await getEpisodeTorrents(
    //   settings,
    //   metadata.series,
    //   metadata.season,
    //   metadata.episode,
    // ).get(key);

    if (!link) {
      throw new Error('Torrent not found');
    }

    let src = `${this.proxyUrl}/magnet?link=${encodeURIComponent(link)}&reiverr_token=${
      this.token
    }`;

    if (season && episode) {
      src += `&season=${season}&episode=${episode}`;
    }

    const files = await getFiles(this.userId, link);

    const subtitles: Subtitles[] = files
      .filter((f) => subtitleExtensions.some((ext) => f.name.endsWith(ext)))
      .map((f) => ({
        kind: 'subtitles',
        src: `${this.proxyUrl}/magnet?link=${encodeURIComponent(link)}&reiverr_token=${
          this.token
        }&file=${f.name}`,
        label: f.name,
        lang: 'unknown',
      }));

    return {
      streamId,
      src,
      audioStreamIndex: 0,
      audioStreams: [],
      duration: 0,
      properties: [],
      progress: config?.progress || 0,
      qualities: [],
      qualityIndex: 0,
      subtitles,
      title: 'Unknown',
      directPlay: true,
    };
  };

  proxyHandler?:
    | ((options: {
        req: any;
        res: any;
        uri: string;
        targetUrl?: string;
      }) => Promise<any>)
    | undefined = async ({ req, res, uri, targetUrl }) => {
    const settings = this.settings as TorrentSettings;

    const params = new URLSearchParams(uri.split('?').slice(1).join('?'));
    const magnetLink = params.get('link');
    const fileName = params.get('file');
    const season = params.get('season');
    const episode = params.get('episode');

    console.log('magnetLink', magnetLink);

    if (!magnetLink) {
      res.status(400).send('No magnet link provided');
      return;
    }

    const files = await getFiles(this.userId, magnetLink);

    let file: TorrentStream.TorrentFile | undefined;

    if (fileName) {
      file = files.find((f) => f.name === fileName);
    } else {
      const videoFiles = files.filter((f) =>
        videoExtensions.some((ext) => f.name.endsWith(ext)),
      );
      file =
        videoFiles.length > 1 && season && episode
          ? videoFiles.find((f) => {
              const name = f.name.toUpperCase();
              return (
                name.includes(
                  `S${season.toString().padStart(2, '0')}E${episode
                    .toString()
                    .padStart(2, '0')}`,
                ) ||
                name.includes(`S${season.toString()}E${episode.toString()}`) ||
                name.includes(
                  `${season.toString().padStart(2, '0')}X${episode
                    .toString()
                    .padStart(2, '0')}`,
                ) ||
                name.includes(`${season.toString()}X${episode.toString()}`)
              );
            }) || videoFiles[0]
          : videoFiles[0];
    }

    if (file) {
      const extension = file.name.split('.').pop();
      const contentType = extension ? getContentType(extension) : undefined;
      console.log(
        'serving file',
        file.name,
        'with content type',
        contentType,
        file.length,
      );

      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : file.length - 1;
        const chunksize = end - start + 1;
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${file.length}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          ...(contentType ? { 'Content-Type': contentType } : {}),
        });
        file.createReadStream({ start, end }).pipe(res);
      } else if (extension === 'srt') {
        res.setHeader('Content-Type', 'text/vtt');

        const srt = await new Promise<string>(async (resolve, reject) => {
          const stream = await file.createReadStream();
          let body = '';
          stream.on('data', (chunk: string) => {
            body += chunk;
          });
          stream.on('end', () => {
            resolve(body);
          });
          stream.on('error', (err: any) => {
            reject(err);
          });
        });

        res.send(srt2webvtt(srt));
      } else {
        res.setHeader('Accept-Ranges', 'bytes');
        if (contentType) {
          res.setHeader('Content-Type', contentType);
        }
        res.setHeader('Content-Length', file.length);
        file.createReadStream().pipe(res);
      }

      // res.setHeader('Accept-Ranges', 'bytes');
      // res.setHeader('Content-Type', 'video/' + extension);
      // res.setHeader('Content-Length', file.length);
      // file.createReadStream().pipe(res);
    } else {
      res.status(404).send('No file found');
    }
  };

  getCatalogue?:
    | ((options: {
        pagination: PaginationParams;
        order?: string;
        direction?: string;
      }) => Promise<PaginatedResponse<CatalogueItem>>)
    | undefined;

  getMovieCatalogue?:
    | ((options: {
        pagination: PaginationParams;
        order?: string;
        direction?: string;
      }) => Promise<PaginatedResponse<CatalogueItem>>)
    | undefined;

  getSeriesCatalogue?:
    | ((options: {
        pagination: PaginationParams;
        order?: string;
        direction?: string;
      }) => Promise<PaginatedResponse<CatalogueItem>>)
    | undefined;

  getMissingInCatalogue?:
    | (<T extends object = object>(options: {
        pagination: PaginationParams;
        order?: string;
        direction?: string;
        myListItems: Record<string, T>;
      }) => Promise<PaginatedResponse<T>>)
    | undefined;
}
