"use client";

import { useMemo, useState } from "react";
import type { SurveyDefinition, AnswersMap, AnswerValue, Question, ResponseEnvelope } from "@/lib/surveys/types";
import { QuestionField } from "./QuestionField";
import { SyncStatusBar } from "./SyncStatusBar";
import { queueResponse } from "@/lib/offline/db";
import { flushQueue } from "@/lib/offline/sync";
import { generateParticipantCode, todayIso } from "@/lib/collector/participant";

type Phase = "in_progress" | "screened_out" | "completed";

function buildPrefilledAnswers(definition: SurveyDefinition, studentCode: string, participantCode: string): AnswersMap {
  const answers: AnswersMap = {};
  for (const section of definition.sections) {
    for (const q of section.questions) {
      if (!q.prefillFrom) continue;
      const value = q.prefillFrom === "studentCode" ? studentCode : q.prefillFrom === "today" ? todayIso() : participantCode;
      answers[q.code] = { kind: "text", value };
    }
  }
  return answers;
}

function isAnswered(question: Question, answer: AnswerValue | undefined): boolean {
  if (!answer) return false;
  switch (answer.kind) {
    case "text":
      return answer.value.trim().length > 0;
    case "single":
      return answer.value.length > 0;
    case "multi":
      return answer.values.length > 0;
    case "matrix":
      return (question.rows ?? []).every((r) => Boolean(answer.values[r.value]));
  }
}

export function SurveyRunner({ definition, studentCode }: { definition: SurveyDefinition; studentCode: string }) {
  const [participantCode, setParticipantCode] = useState(() => generateParticipantCode(studentCode));
  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswersMap>(() => buildPrefilledAnswers(definition, studentCode, generateParticipantCode(studentCode)));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>("in_progress");
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [sessionCount, setSessionCount] = useState(0);

  const section = definition.sections[sectionIndex];
  const isLastSection = sectionIndex === definition.sections.length - 1;

  const progressPct = useMemo(() => Math.round(((sectionIndex + 1) / definition.sections.length) * 100), [sectionIndex, definition.sections.length]);

  function setAnswer(code: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [code]: value }));
    setErrors((prev) => {
      if (!prev[code]) return prev;
      const next = { ...prev };
      delete next[code];
      return next;
    });

    if (value.kind === "single") {
      const question = section.questions.find((q) => q.code === code);
      const option = question?.options?.find((o) => o.value === value.value);
      if (option?.terminatesSurvey) {
        void submit("screened_out", code, { ...answers, [code]: value });
      }
    }
  }

  function validateSection(): boolean {
    const nextErrors: Record<string, string> = {};
    for (const q of section.questions) {
      if (q.required && !isAnswered(q, answers[q.code])) {
        nextErrors[q.code] = "This question needs an answer";
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submit(status: "completed" | "screened_out", terminatedAtQuestion: string | undefined, finalAnswers: AnswersMap) {
    const envelope: ResponseEnvelope = {
      clientUuid: crypto.randomUUID(),
      surveySlug: definition.slug,
      surveyVersion: definition.version,
      studentCode,
      participantCode,
      status,
      terminatedAtQuestion,
      answers: finalAnswers,
      startedAt,
      completedAt: new Date().toISOString(),
    };
    await queueResponse(envelope);
    void flushQueue();
    setPhase(status);
    setSessionCount((c) => c + 1);
  }

  function handleNext() {
    if (!validateSection()) return;
    if (isLastSection) {
      void submit("completed", undefined, answers);
    } else {
      setSectionIndex((i) => i + 1);
    }
  }

  function handleBack() {
    setSectionIndex((i) => Math.max(0, i - 1));
  }

  function startNextParticipant() {
    const nextCode = generateParticipantCode(studentCode);
    setParticipantCode(nextCode);
    setAnswers(buildPrefilledAnswers(definition, studentCode, nextCode));
    setSectionIndex(0);
    setErrors({});
    setStartedAt(new Date().toISOString());
    setPhase("in_progress");
  }

  if (phase === "screened_out") {
    return (
      <div className="max-w-lg lg:max-w-2xl mx-auto px-4 py-10">
        <SyncStatusBar slug={definition.slug} />
        <div className="bg-white rounded-xl border border-slate-200 p-6 lg:p-10 text-center space-y-3">
          {(definition.screenOutText ?? []).map((t, i) => (
            <p key={i} className="text-slate-600 text-sm">
              {t}
            </p>
          ))}
          <button onClick={startNextParticipant} className="mt-4 rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800">
            Start next participant
          </button>
          <p className="text-xs text-slate-400">{sessionCount} response(s) recorded this session</p>
        </div>
      </div>
    );
  }

  if (phase === "completed") {
    return (
      <div className="max-w-lg lg:max-w-2xl mx-auto px-4 py-10">
        <SyncStatusBar slug={definition.slug} />
        <div className="bg-white rounded-xl border border-slate-200 p-6 lg:p-10 text-center space-y-3">
          {(definition.thankYouText ?? []).map((t, i) => (
            <p key={i} className="text-slate-600 text-sm">
              {t}
            </p>
          ))}
          <button onClick={startNextParticipant} className="mt-4 rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800">
            Start next participant
          </button>
          <p className="text-xs text-slate-400">{sessionCount} response(s) recorded this session</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg lg:max-w-2xl mx-auto px-4 py-6 pb-28">
      <SyncStatusBar slug={definition.slug} />

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>
            Section {sectionIndex + 1} of {definition.sections.length}
          </span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-slate-900" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
      {section.description && <p className="text-sm text-slate-500 mt-1">{section.description}</p>}

      <div className="mt-2">
        {section.questions.map((q) => (
          <QuestionField key={q.code} question={q} value={answers[q.code]} onChange={(v) => setAnswer(q.code, v)} error={errors[q.code]} />
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3">
        <div className="max-w-lg lg:max-w-2xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={handleBack}
            disabled={sectionIndex === 0}
            className="text-sm font-medium text-slate-600 px-4 py-2 disabled:opacity-30"
          >
            Back
          </button>
          <button onClick={handleNext} className="flex-1 lg:flex-none lg:w-64 rounded-md bg-slate-900 text-white text-sm font-medium py-2.5 hover:bg-slate-800">
            {isLastSection ? "Submit" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
