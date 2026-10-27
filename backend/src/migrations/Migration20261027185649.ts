import { Migration } from '@mikro-orm/migrations';
import { randomBytes, scryptSync } from 'node:crypto';

// As hashPassword of password.utils.ts: a migration is loaded on its own
function hashPassword(password: string) {
  const [N, r, p] = [2 ** 14, 8, 5];
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 64, { N, r, p });

  return [
    'scrypt',
    N,
    r,
    p,
    salt.toString('base64'),
    key.toString('base64'),
  ].join('$');
}

/**
 * Passwords are stored as salted scrypt hashes in user.password_hash. The
 * plain text passwords stored so far are hashed in place, so the migration
 * cannot be reverted.
 */
export class Migration20261027185649 extends Migration {
  override name = 'Migration20261027185649';

  override async up(): Promise<void> {
    await this.execute(`
      alter table user
      rename column password to password_hash;
    `);

    const users = (await this.execute(
      'select id, password_hash from user',
    )) as { id: string; password_hash: string }[];
    for (const { id, password_hash } of users) {
      await this.execute('update user set password_hash = ? where id = ?', [
        hashPassword(password_hash),
        id,
      ]);
    }
  }
}
