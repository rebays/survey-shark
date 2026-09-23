import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { surveys, responses, students } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { logoutAction } from "./actions";
import { RosterForm } from "./RosterForm";

const TARGET_PER_STUDENT = 10;

export default async function AdminDashboardPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const [surveyRows, allResponses, rosterRows] = await Promise.all([
    db.select().from(surveys).orderBy(asc(surveys.createdAt)),
    db.select({ surveySlug: responses.surveySlug, status: responses.status, studentCode: responses.studentCode }).from(responses),
    db.select().from(students).orderBy(asc(students.studentCode)),
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
          <h1 className="text-lg font-semibold text-slate-900">Survey Shark — Admin</h1>
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
                    <td className="px-4 py-2 font-mono text-xs">{s.code}</td>
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
