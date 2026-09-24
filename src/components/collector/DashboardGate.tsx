"use client";

import { useEffect, useState } from "react";
import { getCollectorSession, type CollectorSession } from "@/lib/collector/session";
import { AccessGateForm } from "./CollectorGate";
import { StudentDashboard } from "@/components/survey/StudentDashboard";

export function DashboardGate({ slug, surveyTitle }: { slug: string; surveyTitle: string }) {
  const [session, setSession] = useState<CollectorSession | null | undefined>(undefined);

  useEffect(() => {
    // Same hydration-safety reasoning as CollectorGate: defer the localStorage
    // read until after the static/server-rendered first paint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(getCollectorSession());
  }, []);

  if (session === undefined) return null;
  if (session === null) return <AccessGateForm onVerified={(s) => setSession(s)} />;
  return <StudentDashboard slug={slug} studentCode={session.studentCode} surveyTitle={surveyTitle} />;
}
