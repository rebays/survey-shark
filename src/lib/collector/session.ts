"use client";

const KEY = "survey_shark_collector";

export interface CollectorSession {
  studentCode: string;
  verifiedAt: string;
}

// This is a lightweight gate, not real auth: responses carry no participant PII by
// design, so the goal is keeping randoms off the form and attributing submissions to
// a student, not protecting sensitive data. It must work fully offline after the
// first successful check, so the session lives in localStorage rather than a cookie
// tied to a live server session.
export function getCollectorSession(): CollectorSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CollectorSession;
  } catch {
    return null;
  }
}

export function setCollectorSession(studentCode: string) {
  if (typeof window === "undefined") return;
  const session: CollectorSession = { studentCode, verifiedAt: new Date().toISOString() };
  window.localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearCollectorSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
