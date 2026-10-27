import {
  randomBytes,
  scrypt,
  ScryptOptions,
  timingSafeEqual,
} from 'node:crypto';

// OWASP's scrypt parameters for 16 MiB of memory
const SCRYPT_OPTIONS = { N: 2 ** 14, r: 8, p: 5 };
const SALT_BYTES = 16;
const KEY_BYTES = 64;

function deriveKey(
  password: string,
  salt: Buffer,
  options: ScryptOptions,
  keyBytes: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password, salt, keyBytes, options, (error, key) =>
      error ? reject(error) : resolve(key),
    ),
  );
}

/** A salted scrypt hash with its parameters, as `scrypt$N$r$p$<salt>$<key>` in base64 */
export async function hashPassword(password: string): Promise<string> {
  const { N, r, p } = SCRYPT_OPTIONS;
  const salt = randomBytes(SALT_BYTES);
  const key = await deriveKey(password, salt, SCRYPT_OPTIONS, KEY_BYTES);

  return [
    'scrypt',
    N,
    r,
    p,
    salt.toString('base64'),
    key.toString('base64'),
  ].join('$');
}

/** Whether the password is the one hashed, with the parameters of the hash */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  const [algorithm, N, r, p, salt, key] = hash.split('$');
  if (algorithm !== 'scrypt' || key === undefined)
    throw new Error('Not a password hash');

  const expected = Buffer.from(key, 'base64');
  const actual = await deriveKey(
    password,
    Buffer.from(salt, 'base64'),
    { N: Number(N), r: Number(r), p: Number(p) },
    expected.length,
  );

  return timingSafeEqual(actual, expected);
}
