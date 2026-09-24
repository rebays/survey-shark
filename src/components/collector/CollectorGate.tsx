"use client";

import { useEffect, useState } from "react";
import { getCollectorSession, setCollectorSession, type CollectorSession } from "@/lib/collector/session";
import { SurveyRunner } from "@/components/survey/SurveyRunner";
import { SinuLogo } from "@/components/SinuLogo";
import type { SurveyDefinition } from "@/lib/surveys/types";

export function CollectorGate({ definition }: { definition: SurveyDefinition }) {
  const [session, setSession] = useState<CollectorSession | null | undefined>(undefined);

  useEffect(() => {
    // Deliberately deferred to after mount: localStorage isn't available during the
    // static/server render, and reading it in the initializer would make the first
    // client render diverge from the prerendered HTML (hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(getCollectorSession());
  }, []);

  if (session === undefined) return null;
  if (session === null) return <AccessGateForm onVerified={(s) => setSession(s)} />;
  return <SurveyRunner definition={definition} studentCode={session.studentCode} />;
}

export function AccessGateForm({ onVerified }: { onVerified: (session: CollectorSession) => void }) {
  const [accessCode, setAccessCode] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/collector/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode, studentCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not verify. Check your codes and try again.");
        return;
      }
      setCollectorSession(data.studentCode);
      onVerified({ studentCode: data.studentCode, verifiedAt: new Date().toISOString() });
    } catch {
      setError("No connection. You need internet the first time you open this app.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div>
          <SinuLogo className="mb-3" />
          <h1 className="text-lg font-semibold text-slate-900">Field data collection</h1>
          <p className="text-sm text-slate-500">Enter the codes given by your supervisor. You only need to do this once per device.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Access code</label>
          <input
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            required
            autoFocus
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Student researcher ID</label>
          <input
            value={studentCode}
            onChange={(e) => setStudentCode(e.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-slate-900 text-white text-sm font-medium py-2 hover:bg-slate-800 disabled:opacity-60"
        >
          {submitting ? "Checking…" : "Continue"}
        </button>
      </form>
    </div>
  );
}
