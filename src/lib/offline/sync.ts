import { offlineDb, type QueuedResponse } from "./db";

type Listener = (state: { pending: number; synced: number; syncing: boolean }) => void;

let listeners: Listener[] = [];
let syncing = false;

export function onSyncStateChange(listener: Listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

async function notify() {
  if (!offlineDb) return;
  const pending = await offlineDb.responses.where("syncStatus").anyOf(["pending", "error"]).count();
  const synced = await offlineDb.responses.where("syncStatus").equals("synced").count();
  for (const l of listeners) l({ pending, synced, syncing });
}

async function submitOne(record: QueuedResponse): Promise<boolean> {
  try {
    const res = await fetch("/api/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    // 200/201 = stored, 409 = already stored (idempotent replay) — both count as success.
    return res.ok || res.status === 409;
  } catch {
    return false;
  }
}

export async function flushQueue() {
  if (!offlineDb || syncing) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  syncing = true;
  await notify();

  try {
    const pending = await offlineDb.responses.where("syncStatus").anyOf(["pending", "error"]).toArray();
    for (const record of pending) {
      await offlineDb.responses.update(record.clientUuid, { syncStatus: "syncing" });
      const ok = await submitOne(record);
      await offlineDb.responses.update(record.clientUuid, ok ? { syncStatus: "synced" } : { syncStatus: "error", lastError: "Could not reach server" });
    }
  } finally {
    syncing = false;
    await notify();
  }
}

let wired = false;
export function wireAutoSync() {
  if (wired || typeof window === "undefined") return;
  wired = true;
  window.addEventListener("online", () => void flushQueue());
  // Cheap periodic retry in case 'online' never fires reliably (some Android WebViews).
  setInterval(() => void flushQueue(), 20_000);
  void flushQueue();
}
