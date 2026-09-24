import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { responses, surveys } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { SurveyDefinition } from "@/lib/surveys/types";

export async function GET(req: NextRequest, { params }: { params: Promise<{ clientUuid: string }> }) {
  const { clientUuid } = await params;
  const studentCode = req.nextUrl.searchParams.get("studentCode");
  if (!studentCode) {
    return NextResponse.json({ error: "Missing studentCode" }, { status: 400 });
  }

  const [row] = await db.select().from(responses).where(eq(responses.clientUuid, clientUuid)).limit(1);
  if (!row || row.studentCode !== studentCode) {
    // Same response either way: don't reveal whether a response with this id exists
    // for someone else's student code.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [surveyRow] = await db.select().from(surveys).where(eq(surveys.id, row.surveyId)).limit(1);

  return NextResponse.json({
    clientUuid: row.clientUuid,
    participantCode: row.participantCode,
    status: row.status,
    submittedAt: row.submittedAt,
    answers: row.answers,
    definition: (surveyRow?.definition ?? null) as SurveyDefinition | null,
  });
}
