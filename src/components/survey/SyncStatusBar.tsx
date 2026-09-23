"use client";

import { useEffect, useState } from "react";
import { onSyncStateChange, flushQueue, wireAutoSync } from "@/lib/offline/sync";

export function SyncStatusBar() {
  const [state, setState] = useState({ pending: 0, synced: 0, syncing: false });
  const [online, setOnline] = useState(true);

  useEffect(() => {
    wireAutoSync();
    // navigator.onLine isn't available during the static/server render; syncing it
    // after mount is deliberate (see CollectorGate for the same pattern).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOnline(navigator.onLine);
    const offSync = onSyncStateChange(setState);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      offSync();
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return (
    <div className="flex items-center justify-between text-xs px-3 py-2 rounded-md bg-slate-100 text-slate-600 mb-4">
      <div className="flex items-center gap-2">
        <span className={`inline-block h-2 w-2 rounded-full ${online ? "bg-green-500" : "bg-amber-500"}`} />
        {online ? "Online" : "Offline — saving locally"}
        {state.pending > 0 && <span> · {state.pending} waiting to sync</span>}
        {state.syncing && <span> · syncing…</span>}
      </div>
      {state.pending > 0 && (
        <button onClick={() => void flushQueue()} className="underline hover:text-slate-900">
          Sync now
        </button>
      )}
    </div>
  );
}
