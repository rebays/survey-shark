import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { surveys, responses } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { getCsvColumns, flattenAnswersToRow, toCsv, type CsvColumn } from "@/lib/surveys/flatten";
import type { SurveyDefinition, AnswersMap } from "@/lib/surveys/types";

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  const surveyRows = await db.select().from(surveys).where(eq(surveys.slug, slug)).orderBy(asc(surveys.createdAt));
  if (surveyRows.length === 0) return NextResponse.json({ error: "Unknown survey" }, { status: 404 });

  const definitionById = new Map<number, SurveyDefinition>(surveyRows.map((s) => [s.id, s.definition as SurveyDefinition]));
  const latestDefinition = surveyRows[surveyRows.length - 1].definition as SurveyDefinition;
  const columns: CsvColumn[] = [
    { key: "response_id", header: "Response ID" },
    { key: "survey_version", header: "Survey version" },
    { key: "status", header: "Status" },
    { key: "terminated_at_question", header: "Terminated at question" },
    { key: "submitted_at", header: "Submitted at (UTC)" },
    ...getCsvColumns(latestDefinition),
  ];

  const responseRows = await db.select().from(responses).where(eq(responses.surveySlug, slug)).orderBy(asc(responses.submittedAt));

  const csvRows = responseRows.map((r) => {
    const definition = definitionById.get(r.surveyId) ?? latestDefinition;
    return {
      response_id: String(r.id),
      survey_version: r.surveyVersion,
      status: r.status,
      terminated_at_question: r.terminatedAtQuestion ?? "",
      submitted_at: r.submittedAt.toISOString(),
      ...flattenAnswersToRow(definition, r.answers as AnswersMap),
    };
  });

  const csv = toCsv(columns, csvRows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-responses.csv"`,
    },
  });
}
