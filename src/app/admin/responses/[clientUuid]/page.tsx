import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { responses, surveys } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAnswerDisplay } from "@/lib/surveys/display";
import type { AnswersMap, SurveyDefinition } from "@/lib/surveys/types";

export default async function AdminResponseDetailPage({ params }: { params: Promise<{ clientUuid: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const { clientUuid } = await params;
  const [row] = await db.select().from(responses).where(eq(responses.clientUuid, clientUuid)).limit(1);
  if (!row) notFound();

  const [surveyRow] = await db.select().from(surveys).where(eq(surveys.id, row.surveyId)).limit(1);
  const definition = surveyRow?.definition as SurveyDefinition | undefined;
  const sections = definition ? getAnswerDisplay(definition, row.answers as AnswersMap) : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/admin" className="text-sm font-medium text-slate-900 underline">
            &larr; Back to dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-between">
          <div>
            <p className="font-mono text-lg font-bold text-slate-900">{row.participantCode}</p>
            <p className="text-sm text-slate-500">
              Student <span className="font-mono">{row.studentCode}</span> · {row.submittedAt.toLocaleString()}
            </p>
          </div>
          <span className={row.status === "completed" ? "text-green-700 bg-green-50 rounded-full px-3 py-1 text-sm font-medium" : "text-amber-700 bg-amber-50 rounded-full px-3 py-1 text-sm font-medium"}>
            {row.status === "completed" ? "Completed" : "Screened out"}
          </span>
        </div>

        {!definition && (
          <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
            Couldn&apos;t find the survey definition for this response &mdash; the raw answers still exist, but can&apos;t be displayed in readable form.
          </p>
        )}

        {sections.map((section) => (
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
      </main>
    </div>
  );
}
