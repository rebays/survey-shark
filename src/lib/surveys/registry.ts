import type { SurveyDefinition } from "./types";
import { facebookHoniara2026 } from "./definitions/facebook-honiara-2026";

// Add future surveys here — this is the only file that needs to change to add a new survey.
export const SURVEY_REGISTRY: SurveyDefinition[] = [facebookHoniara2026];

export function getSurveyDefinition(slug: string): SurveyDefinition | undefined {
  return SURVEY_REGISTRY.find((s) => s.slug === slug);
}
