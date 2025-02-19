import * as path from 'path';
import * as fs from 'fs';
import * as torrentStream from 'torrent-stream';

class FileCache<T> {
  private cache: T;

  constructor(private cacheFile: string, private defaultValue: T) {
    this.cache = this.readStreamCache();
  }

  private writeStreamCache(cache: T) {
    this.cache = cache;
    fs.writeFileSync(this.cacheFile, JSON.stringify(cache));
  }

  private readStreamCache(): T {
    if (fs.existsSync(this.cacheFile)) {
      const data = fs.readFileSync(this.cacheFile, 'utf8');
      if (!data) return this.defaultValue;
      return JSON.parse(data) ?? this.defaultValue;
    }

    return this.defaultValue;
  }

  update(fn: (value: T) => T): T {
    const n = fn(this.get());
    this.cache = n;
    this.writeStreamCache(n);
    return n;
  }

  get(): T {
    return this.cache ?? this.defaultValue;
  }
}

type TorrentMetadata = {
  userId: string;
  infoHash: string;
  lastAccessed: number;
};

type TorrentEntry = {
  engine: TorrentStream.TorrentEngine;
  metadata: TorrentMetadata;
};

class EngineCache {
  // maxFileCacheSize = 5 * 1024 * 1024 * 1024;
  maxActiveTorrentsPerUser = 1;
  maxTorrentKeepAlive = 1000 * 60 * 60 * 24 * 3;

  private userTorrentMetadata = new FileCache<{
    [userId: string]: TorrentMetadata;
  }>(path.join(__dirname, '..', '..', 'stream-cache.json'), {});
  private engineCache: {
    [infoHash: string]: Promise<TorrentStream.TorrentEngine>;
  } = {};

  constructor() {
    for (const metadata of Object.values(this.userTorrentMetadata.get())) {
      if (metadata.lastAccessed > Date.now() - this.maxTorrentKeepAlive) {
        console.log('initializing old torrent', metadata);
        this.getTorrent(metadata.infoHash);
      } else {
        console.log('discarding old torrent', metadata.infoHash);
        this.userTorrentMetadata.update((m) => {
          delete m[metadata.userId];
          return m;
        });
      }
    }
  }

  private async destroyEngine(infoHash: string) {
    const engine = await this.engineCache[infoHash];

    await new Promise((res) => {
      engine?.remove
        ? engine?.remove(false, () => {
            res(undefined);
          })
        : res(undefined);
    });

    await new Promise((res) => {
      engine?.destroy ? engine?.destroy(() => res(undefined)) : res(undefined);
    });

    this.userTorrentMetadata.update((metadata) => {
      const toDelete = Object.values(metadata).find(
        (m) => (m.infoHash = infoHash),
      );
      if (toDelete) delete metadata[toDelete.userId];
      return metadata;
    });
    delete this.engineCache[infoHash];
    console.log('destroyed', infoHash);
  }

  private async getTorrent(
    magnetLink: string,
  ): Promise<TorrentStream.TorrentEngine> {
    if (magnetLink in this.engineCache) {
      return this.engineCache[magnetLink];
    }

    const promise = new Promise<TorrentStream.TorrentEngine>((res, rej) => {
      const engine = torrentStream(magnetLink, {
        tmp: process.env.TORRENT_STREAM_DOWNLOADS?.startsWith('/')
          ? process.env.TORRENT_STREAM_DOWNLOADS
          : path.join(
              __dirname,
              '..',
              '..',
              process.env.TORRENT_STREAM_DOWNLOADS ??
                'torrent-stream-downloads',
            ),
      });
      engine.on('ready', () => {
        res(engine);
      });
      engine.on('download', (e) => console.info('onDownload', magnetLink, e));
      engine.on('upload', (e) => console.info('onUpload', magnetLink, e));
    });

    this.engineCache[magnetLink] = promise;

    return promise;
  }

  private getUserActiveTorrent(userId: string): TorrentMetadata | undefined {
    return this.userTorrentMetadata.get()[userId];
  }

  private async setUserActiveTorrent(userId: string, magnetLink: string) {
    const activeTorrent = this.getUserActiveTorrent(userId);

    if (activeTorrent && activeTorrent.infoHash !== magnetLink) {
      console.log(
        'destroying old torrent',
        activeTorrent.infoHash,
        magnetLink,
        activeTorrent.infoHash === magnetLink,
      );
      await this.destroyEngine(activeTorrent.infoHash);
    }

    this.userTorrentMetadata.update((metadata) => {
      metadata[userId] = {
        userId,
        infoHash: magnetLink,
        lastAccessed: Date.now(),
      };
      return metadata;
    });
  }

  async getFiles(userId: string, magnetLink: string) {
    await this.setUserActiveTorrent(userId, magnetLink);
    const engine = await this.getTorrent(magnetLink);
    return engine.files;
  }
}

const engineCache = new EngineCache();

export function getFiles(
  userId: string,
  magnetLink: string,
): Promise<TorrentStream.TorrentFile[]> {
  return engineCache.getFiles(userId, magnetLink);
}
