import axios, { AxiosError } from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { StreamCandidate } from '@aleksilassila/reiverr-plugin';
import { TorrentSettings } from '../types';
import { formatSize, formatBitrate } from '../utils';

export type JackettItem = {
  title: string;
  guid: string;
  jackettindexer: string;
  type: string;
  comments: string;
  pubDate: string;
  size: number;
  files: number;
  description: string;
  link: string;
  category: string[];
  enclosure: {
    url: string;
    length: number;
    type: string;
  };
  'torznab:attr': {
    '@_name': string;
    '@_value': string;
  }[];
};

type JackettResponse = {
  items: Promise<JackettItem[]>;
  seasonPacks: Promise<JackettItem[]>;
  get: (infohash: string) => Promise<JackettItem | undefined>;
};

const jackettXmlParser = new XMLParser({ ignoreAttributes: false });

function getTorrentWithInfohash(
  items: JackettItem[],
  infohash: string,
): JackettItem | undefined {
  return items.find((i) => getTorrentAttribute(i, 'infohash') === infohash);
}

export const getTorrentAttribute = (
  item: JackettItem,
  attribute: string,
): string => {
  return (
    item['torznab:attr']?.find((i) => i['@_name'] === attribute)?.['@_value'] ??
    ''
  );
};

export const getMovieTorrents = (
  settings: TorrentSettings,
  title: string,
  year: number,
): JackettResponse => {
  const torrents = axios
    .get(`/api`, {
      baseURL: settings.baseUrl,
      params: {
        apikey: settings.apiKey,
        t: 'movie',
        q: `{${title} ${year}}`,
      },
    })
    .then(
      (res) =>
        jackettXmlParser.parse(res.data)?.rss?.channel?.item as JackettItem[],
    );

  return {
    items: torrents,
    seasonPacks: Promise.resolve([]),
    get: (infohash) =>
      torrents.then((torrents) => getTorrentWithInfohash(torrents, infohash)),
  };
};

export const getEpisodeTorrents = (
  settings: TorrentSettings,
  series: string,
  season: number,
  episode: number,
): JackettResponse => {
  const torrents = axios
    .get(`/api`, {
      baseURL: settings.baseUrl,
      params: {
        apikey: settings.apiKey,
        t: 'tvsearch',
        q: `${series} S${season.toString().padStart(2, '0')}E${episode
          .toString()
          .padStart(2, '0')}`,
        // q: `${series}`, // `${series} S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')}`
        // season: season,
        // episode: episode,
      },
    })
    .then((res) => jackettXmlParser.parse(res.data)?.rss?.channel?.item ?? []);

  const seasonPacks = axios
    .get(`/api`, {
      baseURL: settings.baseUrl,
      params: {
        apikey: settings.apiKey,
        t: 'tvsearch',
        q: `${series}`,
        // q: `${series}`, // `${series} S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')}`
        season: season,
        // episode: episode,
      },
    })
    .then((res) => jackettXmlParser.parse(res.data)?.rss?.channel?.item ?? []);

  const combined = Promise.all([torrents, seasonPacks]).then(
    ([torrents, seasonPacks]) => [...torrents, ...seasonPacks],
  );

  return {
    items: torrents,
    seasonPacks: seasonPacks,
    get: (infohash) =>
      combined.then((torrents) => getTorrentWithInfohash(torrents, infohash)),
  };
};

export function getStreamCandidates(
  torrents: JackettItem[],
  options: { runtime?: number; files?: number } = {},
): StreamCandidate[] {
  return torrents.map((torrent) => {
    const { runtime = 0, files = 1 } = options;

    const seeders = Number(getTorrentAttribute(torrent, 'seeders')) || 0;
    const peers = Number(getTorrentAttribute(torrent, 'peers')) || 0;
    const size = Number(torrent.size) || 0;

    const swarmSize = seeders + peers;

    const sizePerPeer =
      swarmSize > 0 && files > 0 ? size / files / swarmSize : 0;
    const bitratePerPeer =
      runtime > 0 && files > 0 && swarmSize > 0
        ? size / files / runtime / swarmSize
        : 0;

    return {
      key:
        getTorrentAttribute(torrent, 'infohash') ||
        torrent.title ||
        torrent.guid,
      title: torrent.title || torrent.description,
      properties: [
        {
          label: 'Seeders',
          value: seeders,
          formatted: undefined,
        },
        {
          label: 'Peers',
          value: peers,
          formatted: undefined,
        },
        {
          label: 'Size' + (files > 1 ? '/file' : ''),
          value: size / files,
          formatted: formatSize(size / files),
        },
        ...(files > 1
          ? [{ label: 'Files', value: files, formatted: undefined }]
          : []),
        ...(bitratePerPeer > 0
          ? [
              {
                label: 'Bitrate/peer',
                value: bitratePerPeer,
                formatted: formatBitrate(bitratePerPeer),
              },
            ]
          : []),
        ...(bitratePerPeer === 0 && sizePerPeer > 0
          ? [
              {
                label: 'Size/peer',
                value: sizePerPeer,
                formatted: formatSize(sizePerPeer),
              },
            ]
          : []),
      ],
    };
  });
}

export async function testConnection(settings: TorrentSettings) {
  return axios
    .get(`/api`, {
      baseURL: settings.baseUrl,
      params: {
        apikey: settings.apiKey,
      },
      timeout: 5000,
    })
    .then((res) => {
      if (res.status >= 400) {
        return 'Could not connect to Jackett: ' + res.statusText;
      }

      const data = jackettXmlParser.parse(res.data);
      if (data.error) {
        return data.error['@_description'] || 'Unknown error';
      }
    });
}
