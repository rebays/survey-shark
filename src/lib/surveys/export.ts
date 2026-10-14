import { db } from "@/lib/db";
import { surveys, responses } from "@/lib/db/schema";
import { and, eq, asc } from "drizzle-orm";
import { getCsvColumns, flattenAnswersToRow, toCsv, type CsvColumn } from "./flatten";
import type { SurveyDefinition, AnswersMap } from "./types";

/**
 * Builds the responses CSV for one survey — every response, or only one student's
 * when `studentCode` is given. Shared by the admin export and the student's own
 * "Download my responses" so both always have identical columns.
 * Returns null if the survey slug is unknown.
 */
export async function buildResponsesCsv(slug: string, studentCode?: string): Promise<string | null> {
  const surveyRows = await db.select().from(surveys).where(eq(surveys.slug, slug)).orderBy(asc(surveys.createdAt));
  if (surveyRows.length === 0) return null;

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

  const filter = studentCode
    ? and(eq(responses.surveySlug, slug), eq(responses.studentCode, studentCode))
    : eq(responses.surveySlug, slug);
  const responseRows = await db.select().from(responses).where(filter).orderBy(asc(responses.submittedAt));

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

  return toCsv(columns, csvRows);
}
