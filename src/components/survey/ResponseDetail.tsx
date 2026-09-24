"use client";

import { useEffect, useState } from "react";
import { getLocalResponseByClientUuid } from "@/lib/offline/db";
import { getSurveyDefinition } from "@/lib/surveys/registry";
import { getAnswerDisplay, type AnswerDisplaySection } from "@/lib/surveys/display";
import type { SurveyDefinition } from "@/lib/surveys/types";

interface Meta {
  participantCode: string;
  status: string;
  submittedAt: string;
}

export function ResponseDetail({
  slug,
  studentCode,
  clientUuid,
  onBack,
}: {
  slug: string;
  studentCode: string;
  clientUuid: string;
  onBack: () => void;
}) {
  const [sections, setSections] = useState<AnswerDisplaySection[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      // Local-first: the device that filled this in already has everything it
      // needs on disk, no network required.
      const local = await getLocalResponseByClientUuid(clientUuid);
      if (local) {
        const definition = getSurveyDefinition(slug);
        if (definition && !cancelled) {
          setSections(getAnswerDisplay(definition, local.answers));
          setMeta({ participantCode: local.participantCode, status: local.status, submittedAt: local.completedAt });
          setLoading(false);
          return;
        }
      }

      try {
        const res = await fetch(`/api/collector/responses/${clientUuid}?studentCode=${encodeURIComponent(studentCode)}`);
        if (!res.ok) throw new Error("not found");
        const data = await res.json();
        if (cancelled) return;
        if (!data.definition) throw new Error("no definition");
        setSections(getAnswerDisplay(data.definition as SurveyDefinition, data.answers));
        setMeta({ participantCode: data.participantCode, status: data.status, submittedAt: data.submittedAt });
      } catch {
        if (!cancelled) {
          setError("Couldn't load this response — it may only exist on another device, and you're offline right now.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [slug, studentCode, clientUuid]);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm font-medium text-slate-900 underline">
        &larr; Back to my progress
      </button>

      {loading && <p className="text-sm text-slate-400">Loading&hellip;</p>}
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}

      {meta && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs text-slate-500">{meta.participantCode}</p>
            <p className="text-sm text-slate-500">{new Date(meta.submittedAt).toLocaleString()}</p>
          </div>
          <span className={meta.status === "completed" ? "text-green-700 text-sm font-medium" : "text-amber-700 text-sm font-medium"}>
            {meta.status === "completed" ? "Completed" : "Screened out"}
          </span>
        </div>
      )}

      {sections?.map((section) => (
        <div key={section.title} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <p className="px-5 py-3 bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-700">{section.title}</p>
          <div className="divide-y divide-slate-100 sm:grid sm:grid-cols-2 sm:divide-y-0 sm:gap-px sm:bg-slate-100">
            {section.items.map((item) => (
              <div key={item.code} className="px-5 py-3 bg-white">
                <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
                <p className="text-sm text-slate-900">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
