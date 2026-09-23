// Generic survey definition schema.
// A new survey = a new JSON file matching SurveyDefinition, registered in registry.ts.
// No code changes needed to the rendering engine, DB schema, or admin export to add a survey.

export type QuestionType = "single_choice" | "multi_choice" | "matrix" | "text";

export interface ChoiceOption {
  value: string;
  label: string;
  /** Renders a free-text input alongside this option (e.g. "Other: ____") */
  allowOther?: boolean;
  /** Selecting this option clears any other selections in a multi_choice question (e.g. "None of the above") */
  exclusive?: boolean;
  /** Single-choice only: selecting this option ends the survey immediately (screening questions) */
  terminatesSurvey?: boolean;
}

export interface MatrixRow {
  value: string;
  label: string;
}

export interface MatrixColumn {
  value: string;
  label: string;
}

export interface Question {
  /** Stable short code matching the paper instrument, e.g. "A1", "B3" */
  code: string;
  type: QuestionType;
  label: string;
  helpText?: string;
  required: boolean;
  options?: ChoiceOption[];
  /** multi_choice only: cap on number of selections, e.g. "select up to three" */
  maxSelections?: number;
  rows?: MatrixRow[];
  columns?: MatrixColumn[];
  multiline?: boolean;
  /** Auto-fill the answer from system/session state; still stored as a normal answer */
  prefillFrom?: "studentCode" | "today" | "participantCode";
  readOnly?: boolean;
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
}

export interface SurveyDefinition {
  slug: string;
  title: string;
  version: string;
  estimatedMinutes?: number;
  introText?: string[];
  screenOutText?: string[];
  thankYouText?: string[];
  sections: Section[];
}

export type AnswerValue =
  | { kind: "single"; value: string; otherText?: string }
  | { kind: "multi"; values: string[]; otherText?: string }
  | { kind: "matrix"; values: Record<string, string> }
  | { kind: "text"; value: string };

export type AnswersMap = Record<string, AnswerValue>;

export interface ResponseEnvelope {
  clientUuid: string;
  surveySlug: string;
  surveyVersion: string;
  studentCode: string;
  participantCode: string;
  status: "completed" | "screened_out";
  terminatedAtQuestion?: string;
  answers: AnswersMap;
  startedAt: string;
  completedAt: string;
}
