import { XMLParser } from 'fast-xml-parser';

export interface TorznabCaps {
  /** Supported parameters of the search modes, empty when a mode is unavailable */
  search: string[];
  tvSearch: string[];
}

export interface TorznabItem {
  guid: string;
  title: string;
  size: number;
  seeders: number;
  peers: number;
  publishedAt?: Date;
  /** The tracker a meta indexer such as Jackett found the release on */
  tracker?: string;
  infoHash?: string;
  magnetUrl?: string;
  downloadUrl?: string;
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  isArray: (name) => name === 'item' || name === 'torznab:attr',
});

const MAGNET_INFO_HASH_PATTERN = /xt=urn:btih:([a-f0-9]{40})(?![a-f0-9])/i;

const text = (node: any): string | undefined =>
  typeof node === 'object' ? node?.['#text'] : node;

function parse(xml: string): any {
  const document = xmlParser.parse(xml);

  if (document.error) {
    throw new Error(
      document.error['@_description'] || 'The indexer returned an error',
    );
  }

  return document;
}

export function parseTorznabCaps(xml: string): TorznabCaps {
  const searching = parse(xml).caps?.searching;
  if (!searching) throw new Error('Not a Torznab capabilities response');

  const params = (mode: any): string[] =>
    mode?.['@_available'] === 'yes'
      ? String(mode['@_supportedParams'] ?? '')
          .split(',')
          .map((param) => param.trim())
          .filter(Boolean)
      : [];

  return {
    search: params(searching.search),
    tvSearch: params(searching['tv-search']),
  };
}

export function parseTorznabItems(xml: string): TorznabItem[] {
  const channel = parse(xml).rss?.channel;
  if (!channel) throw new Error('Not a Torznab search response');

  return (channel.item ?? []).map((item: any): TorznabItem => {
    const attribute = (name: string): string | undefined =>
      item['torznab:attr']?.find((attr: any) => attr['@_name'] === name)?.[
        '@_value'
      ];

    const links: string[] = [
      attribute('magneturl'),
      text(item.link),
      item.enclosure?.['@_url'],
      text(item.guid),
    ].filter(Boolean);
    const magnetUrl = links.find((link) => link.startsWith('magnet:'));
    const infoHash =
      attribute('infohash') ?? MAGNET_INFO_HASH_PATTERN.exec(magnetUrl)?.[1];
    const publishedAt = new Date(text(item.pubDate));

    return {
      guid: text(item.guid) ?? links[0],
      title: text(item.title) ?? '',
      size: Number(text(item.size) ?? item.enclosure?.['@_length']) || 0,
      seeders: Number(attribute('seeders')) || 0,
      peers: Number(attribute('peers')) || 0,
      publishedAt: Number.isNaN(publishedAt.getTime())
        ? undefined
        : publishedAt,
      tracker: text(item.jackettindexer) ?? text(item.prowlarrindexer),
      infoHash: infoHash?.toLowerCase(),
      magnetUrl,
      downloadUrl: links.find((link) => /^https?:\/\//.test(link)),
    };
  });
}
