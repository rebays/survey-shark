import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { responses } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { TARGET_PER_STUDENT } from "@/lib/surveys/constants";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const studentCode = req.nextUrl.searchParams.get("studentCode");
  if (!slug || !studentCode) {
    return NextResponse.json({ error: "Missing slug or studentCode" }, { status: 400 });
  }

  const rows = await db
    .select({
      clientUuid: responses.clientUuid,
      participantCode: responses.participantCode,
      status: responses.status,
      submittedAt: responses.submittedAt,
    })
    .from(responses)
    .where(and(eq(responses.surveySlug, slug), eq(responses.studentCode, studentCode)))
    .orderBy(desc(responses.submittedAt));

  const completed = rows.filter((r) => r.status === "completed").length;
  const screenedOut = rows.filter((r) => r.status === "screened_out").length;

  return NextResponse.json({
    studentCode,
    target: TARGET_PER_STUDENT,
    completed,
    screenedOut,
    recent: rows.slice(0, 10).map((r) => ({
      clientUuid: r.clientUuid,
      participantCode: r.participantCode,
      status: r.status,
      submittedAt: r.submittedAt,
    })),
  });
}
