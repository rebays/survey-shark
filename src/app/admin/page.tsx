import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { surveys, responses, students } from "@/lib/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { logoutAction } from "./actions";
import { RosterForm } from "./RosterForm";
import { SinuLogo } from "@/components/SinuLogo";
import { TARGET_PER_STUDENT } from "@/lib/surveys/constants";

const RESPONSE_LIST_COLUMNS = {
  clientUuid: responses.clientUuid,
  participantCode: responses.participantCode,
  studentCode: responses.studentCode,
  status: responses.status,
  submittedAt: responses.submittedAt,
};

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ student?: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const { student: studentFilterRaw } = await searchParams;
  const studentFilter = studentFilterRaw?.trim() || undefined;

  const [surveyRows, allResponses, rosterRows, recentResponses, filteredResponses] = await Promise.all([
    db.select().from(surveys).orderBy(asc(surveys.createdAt)),
    db.select({ surveySlug: responses.surveySlug, status: responses.status, studentCode: responses.studentCode }).from(responses),
    db.select().from(students).orderBy(asc(students.studentCode)),
    db.select(RESPONSE_LIST_COLUMNS).from(responses).orderBy(desc(responses.submittedAt)).limit(30),
    studentFilter
      ? db.select(RESPONSE_LIST_COLUMNS).from(responses).where(eq(responses.studentCode, studentFilter)).orderBy(asc(responses.submittedAt))
      : Promise.resolve(null),
  ]);

  const latestBySlug = new Map<string, (typeof surveyRows)[number]>();
  for (const s of surveyRows) latestBySlug.set(s.slug, s);

  const bySlug = new Map<string, { total: number; completed: number; screenedOut: number }>();
  const byStudent = new Map<string, { total: number; completed: number }>();
  for (const r of allResponses) {
    const s = bySlug.get(r.surveySlug) ?? { total: 0, completed: 0, screenedOut: 0 };
    s.total += 1;
    if (r.status === "completed") s.completed += 1;
    else s.screenedOut += 1;
    bySlug.set(r.surveySlug, s);

    const st = byStudent.get(r.studentCode) ?? { total: 0, completed: 0 };
    st.total += 1;
    if (r.status === "completed") st.completed += 1;
    byStudent.set(r.studentCode, st);
  }

  const rosterCodes = rosterRows.map((r) => r.studentCode);
  const allStudentCodes = new Set([...rosterCodes, ...byStudent.keys()]);
  const studentTable = Array.from(allStudentCodes)
    .map((code) => ({ code, ...(byStudent.get(code) ?? { total: 0, completed: 0 }) }))
    .sort((a, b) => a.completed - b.completed);

  const totalCompleted = Array.from(bySlug.values()).reduce((sum, s) => sum + s.completed, 0);
  const target = Math.max(rosterCodes.length, studentTable.length, 1) * TARGET_PER_STUDENT;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SinuLogo />
            <h1 className="text-lg font-semibold text-slate-900">Survey Shark — Admin</h1>
          </div>
          <form action={logoutAction}>
            <button className="text-sm text-slate-500 hover:text-slate-900">Sign out</button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <section>
          <h2 className="text-sm font-medium text-slate-500 mb-3">Overall progress</h2>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-2xl font-semibold text-slate-900">{totalCompleted}</span>
              <span className="text-sm text-slate-500">of ~{target} target completed responses</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-slate-900"
                style={{ width: `${Math.min(100, (totalCompleted / target) * 100)}%` }}
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium text-slate-500 mb-3">Surveys</h2>
          <div className="space-y-3">
            {surveyRows.length === 0 && (
              <p className="text-sm text-slate-500">No responses have been submitted yet. Once fieldwork starts, surveys appear here automatically.</p>
            )}
            {Array.from(new Set(surveyRows.map((s) => s.slug))).map((slug) => {
              const latest = latestBySlug.get(slug)!;
              const stats = bySlug.get(slug) ?? { total: 0, completed: 0, screenedOut: 0 };
              return (
                <div key={slug} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{latest.title}</p>
                    <p className="text-sm text-slate-500">
                      {stats.completed} completed · {stats.screenedOut} screened out · version {latest.version}
                    </p>
                  </div>
                  <a
                    href={`/api/admin/export?slug=${encodeURIComponent(slug)}`}
                    className="text-sm font-medium rounded-md bg-slate-900 text-white px-3 py-2 hover:bg-slate-800"
                  >
                    Export CSV
                  </a>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-slate-500">
              {studentFilter ? (
                <>
                  Responses for <span className="font-mono">{studentFilter}</span>, oldest first
                </>
              ) : (
                "Recent responses"
              )}
            </h2>
            {studentFilter && (
              <Link href="/admin" className="text-xs text-slate-500 underline">
                Clear filter
              </Link>
            )}
          </div>

          <form method="get" action="/admin" className="flex items-center gap-2 mb-3">
            <select
              key={studentFilter ?? "all"}
              name="student"
              defaultValue={studentFilter ?? ""}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm bg-white"
            >
              <option value="">All students (most recent 30)</option>
              {Array.from(allStudentCodes)
                .sort()
                .map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
            </select>
            <button type="submit" className="text-sm font-medium rounded-md bg-slate-900 text-white px-3 py-1.5 hover:bg-slate-800">
              View
            </button>
          </form>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {studentFilter && <th className="text-left font-medium px-4 py-2 w-10">#</th>}
                  <th className="text-left font-medium px-4 py-2">Participant code</th>
                  {!studentFilter && <th className="text-left font-medium px-4 py-2">Student</th>}
                  <th className="text-left font-medium px-4 py-2">Status</th>
                  <th className="text-left font-medium px-4 py-2">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {(studentFilter ? filteredResponses ?? [] : recentResponses).map((r, i) => (
                  <tr key={r.clientUuid} className="border-t border-slate-100 hover:bg-slate-50">
                    {studentFilter && <td className="px-4 py-2 text-slate-400">{i + 1}</td>}
                    <td className="px-4 py-2">
                      <Link href={`/admin/responses/${r.clientUuid}`} className="font-mono text-xs font-semibold text-slate-900 underline">
                        {r.participantCode}
                      </Link>
                    </td>
                    {!studentFilter && <td className="px-4 py-2 font-mono text-xs text-slate-600">{r.studentCode}</td>}
                    <td className="px-4 py-2">
                      {r.status === "completed" ? (
                        <span className="text-green-700 bg-green-50 rounded-full px-2 py-0.5 text-xs font-medium">Completed</span>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 rounded-full px-2 py-0.5 text-xs font-medium">Screened out</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-500 whitespace-nowrap">{r.submittedAt.toLocaleString()}</td>
                  </tr>
                ))}
                {(studentFilter ? filteredResponses ?? [] : recentResponses).length === 0 && (
                  <tr>
                    <td colSpan={studentFilter ? 4 : 4} className="px-4 py-6 text-center text-slate-400">
                      {studentFilter ? "No responses for this student yet." : "No responses submitted yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {!studentFilter && recentResponses.length === 30 && (
              <p className="px-4 py-2 text-xs text-slate-400 border-t border-slate-100">
                Showing the 30 most recent — filter by student above to see everyone&apos;s, or export CSV for the full list.
              </p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium text-slate-500 mb-3">Student roster</h2>
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <p className="text-sm text-slate-500">
              {rosterCodes.length > 0
                ? `${rosterCodes.length} student IDs loaded. Only these IDs can start a collection session.`
                : "No roster loaded — any student researcher ID is currently accepted. Paste one ID per line to restrict access."}
            </p>
            <RosterForm currentRoster={rosterCodes.join("\n")} />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium text-slate-500 mb-3">Per-student progress (target {TARGET_PER_STUDENT} each)</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left font-medium px-4 py-2">Student ID</th>
                  <th className="text-left font-medium px-4 py-2">Completed</th>
                  <th className="text-left font-medium px-4 py-2">Screened out</th>
                  <th className="text-left font-medium px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {studentTable.map((s) => (
                  <tr key={s.code} className="border-t border-slate-100">
                    <td className="px-4 py-2">
                      <Link href={`/admin?student=${encodeURIComponent(s.code)}`} className="font-mono text-xs underline text-slate-900">
                        {s.code}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{s.completed}</td>
                    <td className="px-4 py-2 text-slate-500">{s.total - s.completed}</td>
                    <td className="px-4 py-2">
                      {s.completed >= TARGET_PER_STUDENT ? (
                        <span className="text-green-700 bg-green-50 rounded-full px-2 py-0.5 text-xs font-medium">Target met</span>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 rounded-full px-2 py-0.5 text-xs font-medium">
                          {TARGET_PER_STUDENT - s.completed} to go
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {studentTable.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                      No student activity yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
