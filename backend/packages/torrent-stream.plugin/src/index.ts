import {
  EpisodeMetadata,
  MovieMetadata,
  PlaybackConfig,
  PluginProvider,
  SettingsManager,
  SourceProvider,
  Stream,
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
import { TorrentSettingsManager } from './settings';
import type { TorrentSettings } from './types';
import {
  getContentType,
  srt2webvtt,
  subtitleExtensions,
  videoExtensions,
} from './utils';

export default class TorrentPluginsProvider extends PluginProvider {
  getPlugins(): SourceProvider[] {
    return [new TorrentProvider()];
  }
}

class TorrentProvider extends SourceProvider {
  name: string = 'torrent';
  settingsManager: SettingsManager = new TorrentSettingsManager();

  getProxyUrl(sourceId: string) {
    return `/api/sources/${sourceId}/proxy`;
  }

  getMovieStreams = async (
    tmdbId: string,
    metadata: MovieMetadata,
    context: UserContext,
    config?: PlaybackConfig,
  ): Promise<{ candidates: StreamCandidate[] }> => {
    const settings = context.settings as TorrentSettings;

    if (!metadata.title || !metadata.year) return { candidates: [] };
    const torrents = await getMovieTorrents(
      settings,
      metadata.title,
      metadata.year,
    ).items;

    const candidates = getStreamCandidates(torrents, {
      runtime: metadata.runtime,
    });

    return { candidates };
  };

  getEpisodeStreams = async (
    tmdbId: string,
    metadata: EpisodeMetadata,
    context: UserContext,
    config?: PlaybackConfig,
  ): Promise<{ candidates: StreamCandidate[] }> => {
    const settings = context.settings as TorrentSettings;

    const torrents = getEpisodeTorrents(
      settings,
      metadata.series,
      metadata.season,
      metadata.episode,
    );
    const items = await torrents.items;
    const seasonPacks = await torrents.seasonPacks;

    const candidates = [
      ...getStreamCandidates(items, {
        runtime: metadata.episodeRuntime,
      }),
      ...getStreamCandidates(seasonPacks, {
        runtime: metadata.episodeRuntime,
        files: metadata.seasonEpisodes,
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

  getMovieStream = async (
    tmdbId: string,
    metadata: MovieMetadata,
    key: string,
    context: UserContext,
    config: PlaybackConfig = {
      audioStreamIndex: undefined,
      bitrate: undefined,
      progress: undefined,
      defaultLanguage: undefined,
      deviceProfile: undefined,
    },
  ): Promise<Stream | undefined> => {
    const settings = context.settings as TorrentSettings;

    if (!metadata.title || !metadata.year) {
      throw new Error('Metadata not found');
    }

    const torrent = await getMovieTorrents(
      settings,
      metadata.title,
      metadata.year,
    ).get(key);

    if (!torrent) {
      throw new Error('Torrent not found');
    }

    const src = `${this.getProxyUrl(
      context.sourceId,
    )}/magnet?link=${encodeURIComponent(torrent?.link)}&reiverr_token=${
      context.token
    }`;

    const files = await getFiles(context.userId, torrent.link);

    files.forEach((f) => console.log(`file: ${f.name}`));

    const subtitles: Subtitles[] = files
      .filter((f) => subtitleExtensions.some((ext) => f.name.endsWith(ext)))
      .map((f) => ({
        kind: 'subtitles',
        src: `${this.getProxyUrl(
          context.sourceId,
        )}/magnet?link=${encodeURIComponent(torrent.link)}&reiverr_token=${
          context.token
        }&file=${f.name}`,
        label: f.name,
        lang: 'unknown',
      }));

    return {
      src,
      audioStreamIndex: 0,
      audioStreams: [],
      duration: 0,
      key: '0',
      properties: [],
      progress: config.progress || 0,
      qualities: [],
      qualityIndex: 0,
      subtitles,
      title: torrent.title ?? 'Test',
      directPlay: true,
    };
  };

  getEpisodeStream = async (
    tmdbId: string,
    metadata: EpisodeMetadata,
    key: string,
    context: UserContext,
    config: PlaybackConfig = {
      audioStreamIndex: undefined,
      bitrate: undefined,
      progress: undefined,
      defaultLanguage: undefined,
      deviceProfile: undefined,
    },
  ): Promise<Stream | undefined> => {
    const settings = context.settings as TorrentSettings;

    const torrent = await getEpisodeTorrents(
      settings,
      metadata.series,
      metadata.season,
      metadata.episode,
    ).get(key);

    if (!torrent) {
      throw new Error('Torrent not found');
    }

    const src = `${this.getProxyUrl(
      context.sourceId,
    )}/magnet?link=${encodeURIComponent(torrent.link)}&reiverr_token=${
      context.token
    }&season=${metadata.season}&episode=${metadata.episode}`;

    const files = await getFiles(context.userId, torrent.link);

    const subtitles: Subtitles[] = files
      .filter((f) => subtitleExtensions.some((ext) => f.name.endsWith(ext)))
      .map((f) => ({
        kind: 'subtitles',
        src: `${this.getProxyUrl(
          context.sourceId,
        )}/magnet?link=${encodeURIComponent(torrent.link)}&reiverr_token=${
          context.token
        }&file=${f.name}`,
        label: f.name,
        lang: 'unknown',
      }));

    return {
      src,
      audioStreamIndex: 0,
      audioStreams: [],
      duration: 0,
      key: '0',
      properties: [],
      progress: config.progress || 0,
      qualities: [],
      qualityIndex: 0,
      subtitles,
      title: torrent.title ?? 'Test',
      directPlay: true,
    };
  };

  proxyHandler = async (
    req: any,
    res: any,
    options: { context: UserContext; uri: string; targetUrl?: string },
  ): Promise<any> => {
    const { uri, context } = options;
    const settings = context.settings as TorrentSettings;

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

    const files = await getFiles(context.userId, magnetLink);

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
                name.includes(`S${season.toString()}E${episode.toString()}`)
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
}
