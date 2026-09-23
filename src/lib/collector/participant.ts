// Short, locally-unique participant code. Not globally guaranteed unique across
// devices, but combined with the student code and submission timestamp it's more
// than sufficient to distinguish participants on a printed consent form.
export function generateParticipantCode(studentCode: string): string {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${studentCode}-${rand}`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
