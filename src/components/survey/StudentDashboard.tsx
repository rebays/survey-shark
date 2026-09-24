"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLocalResponses } from "@/lib/offline/db";
import { wireAutoSync } from "@/lib/offline/sync";
import { TARGET_PER_STUDENT } from "@/lib/surveys/constants";
import { SinuLogo } from "@/components/SinuLogo";
import { ResponseDetail } from "./ResponseDetail";

interface StatsRow {
  clientUuid: string;
  participantCode: string;
  status: "completed" | "screened_out";
  submittedAt: string;
}

interface Stats {
  target: number;
  completed: number;
  screenedOut: number;
  recent: StatsRow[];
}

export function StudentDashboard({ slug, studentCode, surveyTitle }: { slug: string; studentCode: string; surveyTitle: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingHere, setPendingHere] = useState(0);
  const [offlineFallback, setOfflineFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const localRows = await getLocalResponses(slug, studentCode);
    const pending = localRows.filter((r) => r.syncStatus === "pending" || r.syncStatus === "error").length;
    setPendingHere(pending);

    try {
      const res = await fetch(`/api/collector/stats?slug=${encodeURIComponent(slug)}&studentCode=${encodeURIComponent(studentCode)}`);
      if (!res.ok) throw new Error("request failed");
      const data: Stats = await res.json();
      setStats(data);
      setOfflineFallback(false);
    } catch {
      const completed = localRows.filter((r) => r.status === "completed").length;
      const screenedOut = localRows.filter((r) => r.status === "screened_out").length;
      const recent: StatsRow[] = [...localRows]
        .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
        .slice(0, 10)
        .map((r) => ({ clientUuid: r.clientUuid, participantCode: r.participantCode, status: r.status, submittedAt: r.completedAt }));
      setStats({ target: TARGET_PER_STUDENT, completed, screenedOut, recent });
      setOfflineFallback(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    wireAutoSync();
    // Standard fetch-on-mount: load() sets state once the request resolves, not
    // synchronously in the effect body — this is the documented data-fetching
    // pattern, not the derived-state anti-pattern the lint rule targets.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const interval = setInterval(() => void load(), 15_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, studentCode]);

  const completed = stats?.completed ?? 0;
  const target = stats?.target ?? TARGET_PER_STUDENT;
  const pct = Math.min(100, (completed / target) * 100);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-md lg:max-w-3xl mx-auto">
        {selectedUuid ? (
          <ResponseDetail slug={slug} studentCode={studentCode} clientUuid={selectedUuid} onBack={() => setSelectedUuid(null)} />
        ) : (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <SinuLogo className="mb-3" />
                <p className="text-sm text-slate-500">{surveyTitle}</p>
                <h1 className="text-lg font-semibold text-slate-900">My progress</h1>
              </div>
              <Link href={`/collect/${slug}`} className="text-sm font-medium text-slate-900 underline whitespace-nowrap">
                Back to survey
              </Link>
            </div>

            {offlineFallback && (
              <p className="text-sm text-amber-700 bg-amber-50 rounded-md px-3 py-2">
                Couldn&apos;t reach the server &mdash; showing what&apos;s saved on this device only.
              </p>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-4xl font-semibold text-slate-900">{completed}</span>
                  <span className="text-sm text-slate-500">of {target} completed</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-3">
                  <div className="h-full bg-slate-900" style={{ width: `${pct}%` }} />
                </div>
                {completed >= target ? (
                  <p className="text-sm text-green-700 font-medium">Target met &mdash; tagio tumas!</p>
                ) : (
                  <p className="text-sm text-slate-500">{target - completed} more to go</p>
                )}
                {!offlineFallback && pendingHere > 0 && (
                  <p className="text-xs text-amber-600 mt-2">
                    +{pendingHere} more completed on this device, not yet synced to the server
                  </p>
                )}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-center">
                <p className="text-sm text-slate-500 mb-1">Screened out (ineligible participants)</p>
                <p className="text-2xl font-semibold text-slate-900">{stats?.screenedOut ?? 0}</p>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-medium text-slate-500 mb-2">Recent activity</h2>
              <p className="text-xs text-slate-400 mb-2">Tap any row to see the full answers you recorded.</p>
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                {loading && <p className="px-4 py-3 text-sm text-slate-400">Loading&hellip;</p>}
                {!loading && (stats?.recent.length ?? 0) === 0 && (
                  <p className="px-4 py-3 text-sm text-slate-400">No responses recorded yet.</p>
                )}
                {stats?.recent.map((r) => (
                  <button
                    key={r.clientUuid}
                    onClick={() => setSelectedUuid(r.clientUuid)}
                    className="w-full px-4 py-3 flex items-center justify-between text-sm gap-3 hover:bg-slate-50 text-left"
                  >
                    <span className="font-mono text-xs text-slate-600 truncate">{r.participantCode}</span>
                    <span className="text-slate-400 whitespace-nowrap">{new Date(r.submittedAt).toLocaleDateString()}</span>
                    <span className={r.status === "completed" ? "text-green-700 whitespace-nowrap" : "text-amber-700 whitespace-nowrap"}>
                      {r.status === "completed" ? "Completed" : "Screened out"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
