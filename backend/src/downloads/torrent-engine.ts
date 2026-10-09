export const TORRENT_ENGINE = 'TORRENT_ENGINE';

export interface TorrentFile {
  index: number;
  name: string;
  /** Path inside the torrent */
  path: string;
  length: number;
}

export interface TorrentStats {
  peers: number;
  /** Bytes per second */
  downloadSpeed: number;
  uploadSpeed: number;
  /** Bytes transferred since the torrent was added */
  downloaded: number;
  uploaded: number;
}

export interface TorrentHandle {
  readonly infoHash: string;
  /** Resolves once the file list is known and data from an earlier run is verified */
  readonly ready: Promise<TorrentFile[]>;
  /** Downloads these files and nothing else */
  setWantedFiles(indexes: number[]): void;
  /** Share of the file that is downloaded, from 0 to 1 */
  getFileProgress(index: number): number;
  /** Whether the whole file is downloaded and written to disk */
  isFileComplete(index: number): boolean;
  /** Called when a wanted file becomes complete */
  onFileComplete(listener: (index: number) => void): void;
  /** Called when the torrent fails while it runs */
  onError(listener: (error: Error) => void): void;
  getFilePath(index: number): string;
  /** Whether any part of the torrent is on disk */
  hasData(): boolean;
  getStats(): TorrentStats;
  /** Stops all transfers. Downloaded data stays on disk. */
  destroy(): Promise<void>;
}

export interface TorrentEngine {
  /**
   * Starts a torrent from a magnet link or the contents of a .torrent file.
   * Nothing is downloaded until files are wanted, data it has is seeded.
   */
  add(source: string | Buffer, directory: string): TorrentHandle;
}
