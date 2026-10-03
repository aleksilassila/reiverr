import { createHash } from 'node:crypto';

export const PIECE_LENGTH = 16384;

type Bencodable = number | string | Buffer | Bencodable[] | BencodableDict;
interface BencodableDict {
  [key: string]: Bencodable;
}

function bencode(value: Bencodable): Buffer {
  if (typeof value === 'number') return Buffer.from(`i${value}e`);
  if (typeof value === 'string') return bencode(Buffer.from(value));
  if (Buffer.isBuffer(value)) {
    return Buffer.concat([Buffer.from(`${value.length}:`), value]);
  }
  if (Array.isArray(value)) {
    return Buffer.concat([
      Buffer.from('l'),
      ...value.map(bencode),
      Buffer.from('e'),
    ]);
  }

  return Buffer.concat([
    Buffer.from('d'),
    ...Object.keys(value)
      .sort()
      .flatMap((key) => [bencode(key), bencode(value[key])]),
    Buffer.from('e'),
  ]);
}

/** The contents of a .torrent file for the given files */
export function createTorrent(
  name: string,
  files: { name: string; data: Buffer }[],
) {
  const data = Buffer.concat(files.map((file) => file.data));
  const pieces: Buffer[] = [];
  for (let offset = 0; offset < data.length; offset += PIECE_LENGTH) {
    pieces.push(
      createHash('sha1')
        .update(data.subarray(offset, offset + PIECE_LENGTH))
        .digest(),
    );
  }

  return bencode({
    info: {
      name,
      'piece length': PIECE_LENGTH,
      pieces: Buffer.concat(pieces),
      files: files.map((file) => ({
        length: file.data.length,
        path: [file.name],
      })),
    },
  });
}
