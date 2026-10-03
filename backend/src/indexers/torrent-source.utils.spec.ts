import { createTorrent } from '../../test/torrent-fixture.js';
import { parseTorrentSource } from './torrent-source.utils.js';

describe('parseTorrentSource', () => {
  it('reads the info hash of a magnet link, which does not list files', () => {
    const magnet = `magnet:?xt=urn:btih:${'A1'.repeat(20)}&dn=Show.S01`;

    expect(parseTorrentSource(magnet)).toEqual({
      infoHash: 'a1'.repeat(20),
      magnetUrl: magnet,
    });
  });

  it('reads the info hash and the files of a .torrent file', () => {
    const torrentFile = createTorrent('Show.S01', [
      { name: 'Show.S01E01.mkv', data: Buffer.alloc(30, 'a') },
      { name: 'Show.S01E02.mkv', data: Buffer.alloc(20, 'b') },
    ]);

    const source = parseTorrentSource(torrentFile);

    expect(source.infoHash).toMatch(/^[a-f0-9]{40}$/);
    expect(source.torrentFile).toBe(torrentFile);
    expect(source.files).toEqual([
      {
        index: 0,
        name: 'Show.S01E01.mkv',
        path: 'Show.S01/Show.S01E01.mkv',
        length: 30,
      },
      {
        index: 1,
        name: 'Show.S01E02.mkv',
        path: 'Show.S01/Show.S01E02.mkv',
        length: 20,
      },
    ]);
  });

  it('rejects what is not a torrent', () => {
    expect(() =>
      parseTorrentSource(Buffer.from('<html>Sign in</html>')),
    ).toThrow();
    expect(() => parseTorrentSource('https://example.com/file')).toThrow();
  });
});
