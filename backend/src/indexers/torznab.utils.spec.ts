import { parseTorznabCaps, parseTorznabItems } from './torznab.utils.js';

const feed = (items: string) => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:torznab="http://torznab.com/schemas/2015/feed">
  <channel>
    <title>Indexer</title>
    ${items}
  </channel>
</rss>`;

const HASH = 'ABCDEF0123456789ABCDEF0123456789ABCDEF01';

describe('parseTorznabItems', () => {
  it('reads a Jackett item with a download link', () => {
    const [item] = parseTorznabItems(
      feed(`<item>
        <title>1883 S01E02 1080p WEB</title>
        <guid>https://tracker.example/details/42</guid>
        <jackettindexer id="tracker">Tracker</jackettindexer>
        <pubDate>Sat, 14 Sep 2024 10:00:00 +0000</pubDate>
        <size>1500000000</size>
        <link>http://jackett:9117/dl/tracker/?jackett_apikey=key&amp;path=abc&amp;file=1883</link>
        <enclosure url="http://jackett:9117/dl/tracker/?jackett_apikey=key&amp;path=abc&amp;file=1883" length="1500000000" type="application/x-bittorrent" />
        <torznab:attr name="seeders" value="12" />
        <torznab:attr name="peers" value="20" />
        <torznab:attr name="infohash" value="${HASH}" />
      </item>`),
    );

    expect(item).toEqual({
      guid: 'https://tracker.example/details/42',
      title: '1883 S01E02 1080p WEB',
      size: 1500000000,
      seeders: 12,
      peers: 20,
      publishedAt: new Date('2024-09-14T10:00:00Z'),
      tracker: 'Tracker',
      infoHash: HASH.toLowerCase(),
      magnetUrl: undefined,
      downloadUrl:
        'http://jackett:9117/dl/tracker/?jackett_apikey=key&path=abc&file=1883',
    });
  });

  it('reads the hash of an item that only has a magnet link', () => {
    const magnet = `magnet:?xt=urn:btih:${HASH}&amp;dn=Show`;
    const [item] = parseTorznabItems(
      feed(`<item>
        <title>Show S01 720p</title>
        <guid isPermaLink="false">${magnet}</guid>
        <link>${magnet}</link>
        <enclosure url="${magnet}" length="900" type="application/x-bittorrent" />
      </item>`),
    );

    expect(item).toMatchObject({
      title: 'Show S01 720p',
      size: 900,
      seeders: 0,
      infoHash: HASH.toLowerCase(),
      magnetUrl: `magnet:?xt=urn:btih:${HASH}&dn=Show`,
      downloadUrl: undefined,
    });
  });

  it('returns nothing for an empty feed', () => {
    expect(parseTorznabItems(feed(''))).toEqual([]);
  });

  it('throws the error an indexer reports', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <error code="100" description="Invalid API Key" />`;

    expect(() => parseTorznabItems(xml)).toThrow('Invalid API Key');
    expect(() => parseTorznabCaps(xml)).toThrow('Invalid API Key');
  });

  it('rejects a response that is not a feed', () => {
    expect(() => parseTorznabItems('<html></html>')).toThrow(
      'Not a Torznab search response',
    );
  });
});

describe('parseTorznabCaps', () => {
  it('reads the supported parameters of the available search modes', () => {
    const caps = parseTorznabCaps(`<?xml version="1.0" encoding="UTF-8"?>
      <caps>
        <server title="Jackett" />
        <searching>
          <search available="yes" supportedParams="q" />
          <tv-search available="yes" supportedParams="q,season,ep,tmdbid" />
          <movie-search available="no" supportedParams="q,imdbid" />
        </searching>
      </caps>`);

    expect(caps).toEqual({
      search: ['q'],
      tvSearch: ['q', 'season', 'ep', 'tmdbid'],
      movieSearch: [],
    });
  });

  it('treats an unavailable mode as unsupported', () => {
    const caps = parseTorznabCaps(`<caps><searching>
      <search available="yes" supportedParams="q" />
      <tv-search available="no" supportedParams="q,season,ep" />
      <movie-search available="yes" supportedParams="q,imdbid,year" />
    </searching></caps>`);

    expect(caps.tvSearch).toEqual([]);
    expect(caps.movieSearch).toEqual(['q', 'imdbid', 'year']);
  });
});
