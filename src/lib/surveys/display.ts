import type { SurveyDefinition, Question, AnswerValue, AnswersMap } from "./types";

export interface AnswerDisplayItem {
  code: string;
  label: string;
  text: string;
}

export interface AnswerDisplaySection {
  title: string;
  items: AnswerDisplayItem[];
}

/** Human-readable Q&A pairs for one response, grouped by section — used to show a
 * student their own past submission (not the CSV export shape in flatten.ts). */
export function getAnswerDisplay(definition: SurveyDefinition, answers: AnswersMap): AnswerDisplaySection[] {
  return definition.sections
    .map((section) => ({
      title: section.title,
      items: section.questions
        .map((q) => {
          const answer = answers[q.code];
          if (!answer) return null;
          const text = formatAnswerText(q, answer);
          if (!text) return null;
          return { code: q.code, label: q.label, text };
        })
        .filter((item): item is AnswerDisplayItem => item !== null),
    }))
    .filter((section) => section.items.length > 0);
}

function formatAnswerText(question: Question, answer: AnswerValue): string {
  switch (answer.kind) {
    case "text":
      return answer.value.trim();
    case "single": {
      const option = question.options?.find((o) => o.value === answer.value);
      const label = option?.label ?? answer.value;
      return answer.otherText ? `${label} (${answer.otherText})` : label;
    }
    case "multi": {
      const labels = answer.values.map((v) => question.options?.find((o) => o.value === v)?.label ?? v);
      const text = labels.join(", ");
      return answer.otherText ? `${text} (${answer.otherText})` : text;
    }
    case "matrix": {
      return (question.rows ?? [])
        .map((row) => {
          const columnValue = answer.values[row.value];
          if (!columnValue) return null;
          const columnLabel = question.columns?.find((c) => c.value === columnValue)?.label ?? columnValue;
          return `${row.label}: ${columnLabel}`;
        })
        .filter((line): line is string => line !== null)
        .join(" · ");
    }
    default:
      return "";
  }
}
