import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { surveys, responses } from "@/lib/db/schema";
import { getSurveyDefinition } from "@/lib/surveys/registry";
import { responseEnvelopeSchema } from "@/lib/surveys/validation";

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  if (!json) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = responseEnvelopeSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid response payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const envelope = parsed.data;

  const definition = getSurveyDefinition(envelope.surveySlug);
  if (!definition) {
    return NextResponse.json({ error: `Unknown survey slug: ${envelope.surveySlug}` }, { status: 400 });
  }

  // Ensure the survey (and this exact version's definition snapshot) exists in the DB.
  const [surveyRow] = await db
    .insert(surveys)
    .values({
      slug: definition.slug,
      title: definition.title,
      version: envelope.surveyVersion,
      definition,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: [surveys.slug, surveys.version],
      set: { title: definition.title },
    })
    .returning({ id: surveys.id });

  const inserted = await db
    .insert(responses)
    .values({
      clientUuid: envelope.clientUuid,
      surveyId: surveyRow.id,
      surveySlug: envelope.surveySlug,
      surveyVersion: envelope.surveyVersion,
      studentCode: envelope.studentCode,
      participantCode: envelope.participantCode,
      status: envelope.status,
      terminatedAtQuestion: envelope.terminatedAtQuestion,
      answers: envelope.answers,
      startedAt: new Date(envelope.startedAt),
      completedAt: new Date(envelope.completedAt),
    })
    .onConflictDoNothing({ target: responses.clientUuid })
    .returning({ id: responses.id });

  if (inserted.length === 0) {
    // Same clientUuid already stored — treat as a successful idempotent replay (offline retry).
    return NextResponse.json({ ok: true, alreadyStored: true }, { status: 409 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
