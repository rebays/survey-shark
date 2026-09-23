import { notFound } from "next/navigation";
import { SURVEY_REGISTRY, getSurveyDefinition } from "@/lib/surveys/registry";
import { CollectorGate } from "@/components/collector/CollectorGate";

// Statically generated at build time so the form works fully offline after first
// load — no server round-trip is needed to render the questionnaire itself.
export function generateStaticParams() {
  return SURVEY_REGISTRY.map((s) => ({ slug: s.slug }));
}

export default async function CollectSurveyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const definition = getSurveyDefinition(slug);
  if (!definition) notFound();

  return <CollectorGate definition={definition} />;
}
