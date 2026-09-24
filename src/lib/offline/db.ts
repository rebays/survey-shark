import Dexie, { type Table } from "dexie";
import type { ResponseEnvelope } from "@/lib/surveys/types";

export interface QueuedResponse extends ResponseEnvelope {
  syncStatus: "pending" | "syncing" | "synced" | "error";
  lastError?: string;
  queuedAt: string;
}

class SurveyShartDB extends Dexie {
  responses!: Table<QueuedResponse, string>;

  constructor() {
    super("survey-shark");
    this.version(1).stores({
      // clientUuid is the primary key so re-queuing the same response is a no-op.
      responses: "clientUuid, surveySlug, studentCode, syncStatus, queuedAt",
    });
  }
}

export const offlineDb = typeof window !== "undefined" ? new SurveyShartDB() : null;

export async function queueResponse(envelope: ResponseEnvelope) {
  if (!offlineDb) return;
  await offlineDb.responses.put({
    ...envelope,
    syncStatus: "pending",
    queuedAt: new Date().toISOString(),
  });
}

export async function getPendingCount(): Promise<number> {
  if (!offlineDb) return 0;
  return offlineDb.responses.where("syncStatus").anyOf(["pending", "error"]).count();
}

export async function getSyncedCount(): Promise<number> {
  if (!offlineDb) return 0;
  return offlineDb.responses.where("syncStatus").equals("synced").count();
}

// Every response this device has ever queued for one student on one survey,
// regardless of sync status. Lets the student's own progress view work fully
// offline (server totals are still the source of truth once reachable).
export async function getLocalResponses(surveySlug: string, studentCode: string): Promise<QueuedResponse[]> {
  if (!offlineDb) return [];
  return offlineDb.responses.where({ surveySlug, studentCode }).toArray();
}

// Lets a student open one of their own past submissions with no network at all,
// since the full answers are already sitting on this device from when it was filled in.
export async function getLocalResponseByClientUuid(clientUuid: string): Promise<QueuedResponse | undefined> {
  if (!offlineDb) return undefined;
  return offlineDb.responses.get(clientUuid);
}
