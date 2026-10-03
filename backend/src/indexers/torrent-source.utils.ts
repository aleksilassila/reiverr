import parseTorrent from 'parse-torrent';

export interface TorrentSource {
  infoHash: string;
  magnetUrl?: string;
  torrentFile?: Buffer;
  /** Only a .torrent file lists its files */
  files?: { index: number; name: string; path: string; length: number }[];
}

/** Reads a magnet link or the contents of a .torrent file */
export function parseTorrentSource(source: string | Buffer): TorrentSource {
  const parsed = parseTorrent(source);
  if (!parsed?.infoHash) throw new Error('Not a torrent');

  if (typeof source === 'string') {
    return { infoHash: parsed.infoHash, magnetUrl: source };
  }

  return {
    infoHash: parsed.infoHash,
    torrentFile: source,
    files: parsed.files.map((file: any, index: number) => ({
      index,
      name: file.name,
      path: file.path,
      length: file.length,
    })),
  };
}
