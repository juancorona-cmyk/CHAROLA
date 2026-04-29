import { createHash } from 'node:crypto';
import { getDB } from './db';

export function hashPassword(password: string): string {
  return createHash('sha256').update(`ntz:${password}`).digest('hex');
}

/** Creates the default admin from env if the table is empty. */
export async function ensureAdminExists(): Promise<void> {
  const db  = await getDB();
  const res = await db.execute('SELECT COUNT(*) as cnt FROM admin_users');
  if (Number(res.rows[0].cnt) === 0) {
    const username = (import.meta.env.ADMIN_USERNAME as string | undefined) || '';
    const password = (import.meta.env.ADMIN_PASSWORD as string | undefined) || '';
    await db.execute({
      sql:  'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)',
      args: [username, hashPassword(password)],
    });
  }
}

/** Returns true if credentials match a record in Turso. */
export async function verifyLogin(username: string, password: string): Promise<boolean> {
  await ensureAdminExists();
  const db  = await getDB();
  const res = await db.execute({
    sql:  'SELECT password_hash FROM admin_users WHERE username = ?',
    args: [username],
  });
  if (!res.rows.length) return false;
  return String(res.rows[0].password_hash) === hashPassword(password);
}

/** Cookie token: SHA-256 of the stored password_hash (stateless & invalidates on pw change). */
export function buildToken(passwordHash: string): string {
  return createHash('sha256').update(`ntz-tok:${passwordHash}`).digest('hex');
}

/** Checks cookie token against every admin_users row in Turso. */
export async function isValidToken(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  const db  = await getDB();
  const res = await db.execute('SELECT password_hash FROM admin_users');
  for (const row of res.rows) {
    if (buildToken(String(row.password_hash)) === token) return true;
  }
  return false;
}

export async function makeTokenForUser(username: string): Promise<string | null> {
  const db  = await getDB();
  const res = await db.execute({
    sql:  'SELECT password_hash FROM admin_users WHERE username = ?',
    args: [username],
  });
  if (!res.rows.length) return null;
  return buildToken(String(res.rows[0].password_hash));
}

export function getTokenFromCookies(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  const m = cookieHeader.match(/(?:^|;\s*)admin_token=([^;]+)/);
  return m ? m[1] : null;
}
