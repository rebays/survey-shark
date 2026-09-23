"use client";

import { useActionState } from "react";
import { uploadRosterAction, clearRosterAction } from "./actions";

export function RosterForm({ currentRoster }: { currentRoster: string }) {
  const [state, formAction, pending] = useActionState(uploadRosterAction, undefined);

  return (
    <div className="space-y-3">
      <form action={formAction} className="space-y-2">
        <textarea
          name="roster"
          rows={6}
          defaultValue={currentRoster}
          placeholder={"One student researcher ID per line, e.g.\nSINU-001\nSINU-002"}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="text-sm font-medium rounded-md bg-slate-900 text-white px-3 py-2 hover:bg-slate-800 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save roster"}
          </button>
          {state?.count !== undefined && <span className="text-sm text-green-700">Saved {state.count} IDs</span>}
          {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
        </div>
      </form>
      <form action={clearRosterAction}>
        <button type="submit" className="text-xs text-slate-400 hover:text-slate-700 underline">
          Clear roster (allow any student ID)
        </button>
      </form>
    </div>
  );
}
