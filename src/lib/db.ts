import { createClient, type Client } from '@libsql/client';

let _client: Client | null = null;
let _initialized = false;

function getClient(): Client {
  if (!_client) {
    _client = createClient({
      url: import.meta.env.TURSO_URL as string,
      authToken: import.meta.env.TURSO_AUTH_TOKEN as string,
    });
  }
  return _client;
}

export async function getDB(): Promise<Client> {
  const db = getClient();
  if (!_initialized) {
    _initialized = true;
    await db.execute(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        username  TEXT    NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT    NOT NULL,
        role       TEXT    NOT NULL,
        content    TEXT    NOT NULL,
        timestamp  INTEGER NOT NULL,
        date       TEXT    NOT NULL
      )
    `);
    await db.execute('CREATE INDEX IF NOT EXISTS idx_msg_session ON chat_messages(session_id)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_msg_date    ON chat_messages(date)');
  }
  return db;
}
