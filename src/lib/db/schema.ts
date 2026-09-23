import { pgTable, serial, text, boolean, timestamp, jsonb, uniqueIndex, integer } from "drizzle-orm/pg-core";

export const surveys = pgTable(
  "surveys",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    version: text("version").notNull(),
    // Full SurveyDefinition snapshot at publish time, so past responses stay
    // interpretable even if the JSON source file changes later.
    definition: jsonb("definition").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("surveys_slug_version_idx").on(table.slug, table.version)]
);

export const students = pgTable(
  "students",
  {
    id: serial("id").primaryKey(),
    studentCode: text("student_code").notNull(),
    name: text("name"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("students_code_idx").on(table.studentCode)]
);

export const responses = pgTable(
  "responses",
  {
    id: serial("id").primaryKey(),
    clientUuid: text("client_uuid").notNull(),
    surveyId: integer("survey_id")
      .notNull()
      .references(() => surveys.id),
    surveySlug: text("survey_slug").notNull(),
    surveyVersion: text("survey_version").notNull(),
    studentCode: text("student_code").notNull(),
    participantCode: text("participant_code").notNull(),
    status: text("status", { enum: ["completed", "screened_out"] }).notNull(),
    terminatedAtQuestion: text("terminated_at_question"),
    answers: jsonb("answers").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("responses_client_uuid_idx").on(table.clientUuid)]
);
