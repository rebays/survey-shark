import { notFound } from "next/navigation";
import { SURVEY_REGISTRY, getSurveyDefinition } from "@/lib/surveys/registry";
import { DashboardGate } from "@/components/collector/DashboardGate";

export function generateStaticParams() {
  return SURVEY_REGISTRY.map((s) => ({ slug: s.slug }));
}

export default async function StudentDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const definition = getSurveyDefinition(slug);
  if (!definition) notFound();

  return <DashboardGate slug={slug} surveyTitle={definition.title} />;
}
