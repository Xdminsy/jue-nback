import Dexie, { type Table } from "dexie";
import type { AppPreference, SessionRecord } from "../types";

export class NBackDatabase extends Dexie {
  sessions!: Table<SessionRecord, string>;
  preferences!: Table<AppPreference, string>;

  constructor() {
    super("jue-nback");
    this.version(1).stores({
      sessions: "id, startedAt, overallAccuracy, nBefore, nAfter",
      preferences: "key"
    });
  }
}

export const db = new NBackDatabase();

export async function saveSession(session: SessionRecord): Promise<void> {
  await db.sessions.put(session);
}

export async function getAllSessions(): Promise<SessionRecord[]> {
  return db.sessions.orderBy("startedAt").reverse().toArray();
}

export async function importSessions(sessions: SessionRecord[]): Promise<number> {
  await db.sessions.bulkPut(sessions);
  return sessions.length;
}
