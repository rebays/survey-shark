"use client";

import type { Question, AnswerValue } from "@/lib/surveys/types";

export function QuestionField({
  question,
  value,
  onChange,
  error,
}: {
  question: Question;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  error?: string;
}) {
  return (
    <div className="py-4 border-b border-slate-100 last:border-b-0">
      <label className="block font-medium text-slate-900 mb-1">
        {question.label}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {question.helpText && <p className="text-sm text-slate-500 mb-2">{question.helpText}</p>}

      {question.readOnly ? (
        <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-600">
          {value?.kind === "text" ? value.value : ""}
        </div>
      ) : (
        <QuestionInput question={question} value={value} onChange={onChange} />
      )}

      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}) {
  switch (question.type) {
    case "text":
      return <TextInput question={question} value={value} onChange={onChange} />;
    case "single_choice":
      return <SingleChoiceInput question={question} value={value} onChange={onChange} />;
    case "multi_choice":
      return <MultiChoiceInput question={question} value={value} onChange={onChange} />;
    case "matrix":
      return <MatrixInput question={question} value={value} onChange={onChange} />;
    default:
      return null;
  }
}

function TextInput({ question, value, onChange }: { question: Question; value: AnswerValue | undefined; onChange: (v: AnswerValue) => void }) {
  const text = value?.kind === "text" ? value.value : "";
  if (question.multiline) {
    return (
      <textarea
        rows={3}
        value={text}
        onChange={(e) => onChange({ kind: "text", value: e.target.value })}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
      />
    );
  }
  return (
    <input
      type="text"
      value={text}
      onChange={(e) => onChange({ kind: "text", value: e.target.value })}
      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
    />
  );
}

function SingleChoiceInput({ question, value, onChange }: { question: Question; value: AnswerValue | undefined; onChange: (v: AnswerValue) => void }) {
  const selected = value?.kind === "single" ? value.value : undefined;
  const otherText = value?.kind === "single" ? value.otherText : undefined;
  const selectedOption = question.options?.find((o) => o.value === selected);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {question.options?.map((option) => (
          <label
            key={option.value}
            className={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm cursor-pointer ${
              selected === option.value ? "border-slate-900 bg-slate-50" : "border-slate-200"
            }`}
          >
            <input
              type="radio"
              name={question.code}
              checked={selected === option.value}
              onChange={() => onChange({ kind: "single", value: option.value, otherText: option.allowOther ? otherText : undefined })}
              className="accent-slate-900"
            />
            {option.label}
          </label>
        ))}
      </div>
      {selectedOption?.allowOther && (
        <input
          type="text"
          placeholder="Please specify"
          value={otherText ?? ""}
          onChange={(e) => onChange({ kind: "single", value: selectedOption.value, otherText: e.target.value })}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      )}
    </div>
  );
}

function MultiChoiceInput({ question, value, onChange }: { question: Question; value: AnswerValue | undefined; onChange: (v: AnswerValue) => void }) {
  const values = value?.kind === "multi" ? value.values : [];
  const otherText = value?.kind === "multi" ? value.otherText : undefined;
  const otherSelected = question.options?.some((o) => o.allowOther && values.includes(o.value));
  const atMax = !!question.maxSelections && values.length >= question.maxSelections;

  function toggle(optionValue: string, exclusive?: boolean) {
    const next = new Set(values);
    if (next.has(optionValue)) {
      next.delete(optionValue);
    } else {
      if (exclusive) {
        next.clear();
      } else {
        for (const opt of question.options ?? []) if (opt.exclusive) next.delete(opt.value);
        if (question.maxSelections && next.size >= question.maxSelections) return;
      }
      next.add(optionValue);
    }
    const nextValues = Array.from(next);
    onChange({ kind: "multi", values: nextValues, otherText: nextValues.some((v) => v === "other") ? otherText : undefined });
  }

  return (
    <div className="space-y-2">
      {question.maxSelections && <p className="text-xs text-slate-400">{values.length}/{question.maxSelections} selected</p>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {question.options?.map((option) => {
          const checked = values.includes(option.value);
          const disabled = !checked && atMax && !option.exclusive;
          return (
            <label
              key={option.value}
              className={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm ${checked ? "border-slate-900 bg-slate-50" : "border-slate-200"} ${
                disabled ? "opacity-40" : "cursor-pointer"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(option.value, option.exclusive)}
                className="accent-slate-900"
              />
              {option.label}
            </label>
          );
        })}
      </div>
      {otherSelected && (
        <input
          type="text"
          placeholder="Please specify"
          value={otherText ?? ""}
          onChange={(e) => onChange({ kind: "multi", values, otherText: e.target.value })}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      )}
    </div>
  );
}

function MatrixInput({ question, value, onChange }: { question: Question; value: AnswerValue | undefined; onChange: (v: AnswerValue) => void }) {
  const values = value?.kind === "matrix" ? value.values : {};

  function select(rowValue: string, columnValue: string) {
    onChange({ kind: "matrix", values: { ...values, [rowValue]: columnValue } });
  }

  return (
    <div className="space-y-4">
      {question.rows?.map((row) => (
        <div key={row.value}>
          <p className="text-sm text-slate-700 mb-1.5">{row.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {question.columns?.map((col) => {
              const checked = values[row.value] === col.value;
              return (
                <button
                  type="button"
                  key={col.value}
                  onClick={() => select(row.value, col.value)}
                  className={`text-xs rounded-full border px-2.5 py-1.5 ${
                    checked ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 text-slate-600"
                  }`}
                >
                  {col.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
