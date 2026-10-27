import { hashPassword, verifyPassword } from './password.utils.js';

describe('hashPassword', () => {
  it('stores the parameters, a salt and the key', async () => {
    expect(await hashPassword('secret')).toMatch(
      /^scrypt\$16384\$8\$5\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/,
    );
  });

  it('salts every hash', async () => {
    expect(await hashPassword('secret')).not.toBe(await hashPassword('secret'));
  });
});

describe('verifyPassword', () => {
  it('accepts the hashed password only', async () => {
    const hash = await hashPassword('secret');

    expect(await verifyPassword('secret', hash)).toBe(true);
    expect(await verifyPassword('Secret', hash)).toBe(false);
    expect(await verifyPassword('', hash)).toBe(false);
  });

  it('accepts an empty password', async () => {
    expect(await verifyPassword('', await hashPassword(''))).toBe(true);
  });

  it('verifies with the parameters of the hash', async () => {
    const hash =
      'scrypt$1024$8$1$c2FsdA==$' +
      '66m7frlMbr2NLEY2RptRxs6hqtr8MhutpHFq3RpOfynSM98pU4hjEMAqm9YMaXXg7MItOX8VRVDKQxibN3NnPw==';

    expect(await verifyPassword('secret', hash)).toBe(true);
  });

  it('throws on a value that is not a hash', async () => {
    await expect(verifyPassword('secret', 'secret')).rejects.toThrow(
      'Not a password hash',
    );
  });
});
