import type { SurveyDefinition, Question, AnswersMap } from "./types";

export interface CsvColumn {
  key: string;
  header: string;
}

/**
 * Every future survey gets CSV export for free: columns are derived purely from the
 * survey's own definition (including the "admin" collection-details section, since
 * participant code / student id / area / mode are modeled as ordinary questions).
 */
export function getCsvColumns(definition: SurveyDefinition): CsvColumn[] {
  const columns: CsvColumn[] = [];
  for (const section of definition.sections) {
    for (const q of section.questions) {
      columns.push(...columnsForQuestion(q));
    }
  }
  return columns;
}

function columnsForQuestion(q: Question): CsvColumn[] {
  switch (q.type) {
    case "text":
      return [{ key: q.code, header: `${q.code}: ${q.label}` }];
    case "single_choice": {
      const cols: CsvColumn[] = [{ key: q.code, header: `${q.code}: ${q.label}` }];
      if (q.options?.some((o) => o.allowOther)) {
        cols.push({ key: `${q.code}__other_text`, header: `${q.code}: Other (specify)` });
      }
      return cols;
    }
    case "multi_choice": {
      const cols: CsvColumn[] = (q.options ?? []).map((o) => ({
        key: `${q.code}__${o.value}`,
        header: `${q.code}: ${q.label} — ${o.label}`,
      }));
      if (q.options?.some((o) => o.allowOther)) {
        cols.push({ key: `${q.code}__other_text`, header: `${q.code}: Other (specify)` });
      }
      return cols;
    }
    case "matrix": {
      return (q.rows ?? []).map((r) => ({
        key: `${q.code}__${r.value}`,
        header: `${q.code}: ${q.label} — ${r.label}`,
      }));
    }
    default:
      return [];
  }
}

export function flattenAnswersToRow(definition: SurveyDefinition, answers: AnswersMap): Record<string, string> {
  const row: Record<string, string> = {};
  for (const section of definition.sections) {
    for (const q of section.questions) {
      const answer = answers[q.code];
      if (!answer) continue;
      switch (q.type) {
        case "text":
          if (answer.kind === "text") row[q.code] = answer.value;
          break;
        case "single_choice":
          if (answer.kind === "single") {
            const option = q.options?.find((o) => o.value === answer.value);
            row[q.code] = option?.label ?? answer.value;
            if (answer.otherText) row[`${q.code}__other_text`] = answer.otherText;
          }
          break;
        case "multi_choice":
          if (answer.kind === "multi") {
            for (const v of answer.values) row[`${q.code}__${v}`] = "1";
            if (answer.otherText) row[`${q.code}__other_text`] = answer.otherText;
          }
          break;
        case "matrix":
          if (answer.kind === "matrix") {
            for (const [rowValue, columnValue] of Object.entries(answer.values)) {
              const column = q.columns?.find((c) => c.value === columnValue);
              row[`${q.code}__${rowValue}`] = column?.label ?? columnValue;
            }
          }
          break;
      }
    }
  }
  return row;
}

export function toCsv(columns: CsvColumn[], rows: Record<string, string>[]): string {
  const escape = (val: string) => {
    if (val.includes(",") || val.includes("\n") || val.includes('"')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };
  const header = columns.map((c) => escape(c.header)).join(",");
  const lines = rows.map((row) => columns.map((c) => escape(row[c.key] ?? "")).join(","));
  return [header, ...lines].join("\n");
}
