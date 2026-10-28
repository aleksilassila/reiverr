import { resolve } from 'node:path';

export const ENV = process.env.NODE_ENV || 'production';
export const DEV = ENV === 'development';
export const JWT_SECRET =
  process.env.SECRET ||
  (ENV === 'development'
    ? 'secret'
    : Math.random().toString(36).substring(2, 15));
export const TMDB_API_KEY =
  process.env.TMDB_API_KEY ||
  'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0YTZiMDIxZTE5Y2YxOTljMTM1NGFhMGRiMDZiOTkzMiIsInN1YiI6IjY0ODYzYWRmMDI4ZjE0MDExZTU1MDkwMiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.yyMkZlhGOGBHtw1yvpBVUUHhu7IKVYho49MvNNKt_wY';
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
export const TMDB_CACHE_TTL = Number.isNaN(Number(process.env.TMDB_CACHE_TTL))
  ? 1000 * 60 * 60 * 24 * 3 // 3 days
  : Number(process.env.TMDB_CACHE_TTL);
export const DOWNLOADS_DIR = resolve(
  process.env.DOWNLOADS_DIR ||
    process.env.TORRENT_STREAM_DOWNLOADS ||
    './downloads',
);
// The port that peers connect to, forwarded to the server. Without it the
// torrent client listens on a random port.
export const TORRENT_PORT = readPort('TORRENT_PORT');
// The UDP port of the DHT node, a random one without it
export const TORRENT_DHT_PORT = readPort('TORRENT_DHT_PORT');
if (TORRENT_DHT_PORT !== undefined && TORRENT_DHT_PORT === TORRENT_PORT) {
  throw new Error(
    'TORRENT_DHT_PORT has to differ from TORRENT_PORT, which uTP uses over UDP',
  );
}
// Whether the torrent client asks the router to forward its ports
export const TORRENT_UPNP = readFlag('TORRENT_UPNP');
export const TORRENT_NAT_PMP = readFlag('TORRENT_NAT_PMP');
// Whether the torrent client connects to browser peers, through WebSocket trackers
export const TORRENT_WEBRTC = readFlag('TORRENT_WEBRTC', true);

function readPort(name: string): number | undefined {
  const value = process.env[name];
  if (!value) return undefined;

  const port = Number(value);
  if (!(Number.isInteger(port) && port > 0 && port < 65536)) {
    throw new Error(`${name} is not a port: ${value}`);
  }
  return port;
}

function readFlag(name: string, defaultValue = false): boolean {
  const value = process.env[name];
  if (!value) return defaultValue;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`${name} is not true or false: ${value}`);
}
