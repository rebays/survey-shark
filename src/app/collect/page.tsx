import Link from "next/link";
import { SURVEY_REGISTRY } from "@/lib/surveys/registry";

export default function CollectIndexPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-sm mx-auto space-y-3">
        <h1 className="text-lg font-semibold text-slate-900">Choose a survey</h1>
        {SURVEY_REGISTRY.map((s) => (
          <Link
            key={s.slug}
            href={`/collect/${s.slug}`}
            className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-400"
          >
            <p className="font-medium text-slate-900">{s.title}</p>
            <p className="text-sm text-slate-500">~{s.estimatedMinutes ?? "?"} minutes</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
