import { getDB } from './db';

export interface StoredMessage {
  id:         number;
  session_id: string;
  role:       'user' | 'bot';
  content:    string;
  timestamp:  number;
  date:       string;
}

export async function saveExchange(sessionId: string, userMsg: string, botReply: string) {
  const db = await getDB();
  const now  = new Date();
  const date = now.toISOString().slice(0, 10);
  const ts   = now.getTime();

  await db.batch([
    {
      sql:  'INSERT INTO chat_messages (session_id, role, content, timestamp, date) VALUES (?, ?, ?, ?, ?)',
      args: [sessionId, 'user', userMsg, ts, date],
    },
    {
      sql:  'INSERT INTO chat_messages (session_id, role, content, timestamp, date) VALUES (?, ?, ?, ?, ?)',
      args: [sessionId, 'bot', botReply, ts + 1, date],
    },
  ], 'write');
}
