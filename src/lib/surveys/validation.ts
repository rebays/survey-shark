import { z } from "zod";

const answerValueSchema = z.union([
  z.object({ kind: z.literal("single"), value: z.string(), otherText: z.string().optional() }),
  z.object({ kind: z.literal("multi"), values: z.array(z.string()), otherText: z.string().optional() }),
  z.object({ kind: z.literal("matrix"), values: z.record(z.string(), z.string()) }),
  z.object({ kind: z.literal("text"), value: z.string() }),
]);

export const responseEnvelopeSchema = z.object({
  clientUuid: z.string().min(1),
  surveySlug: z.string().min(1),
  surveyVersion: z.string().min(1),
  studentCode: z.string().min(1),
  participantCode: z.string().min(1),
  status: z.enum(["completed", "screened_out"]),
  terminatedAtQuestion: z.string().optional(),
  answers: z.record(z.string(), answerValueSchema),
  startedAt: z.string(),
  completedAt: z.string(),
});

export type ResponseEnvelopeInput = z.infer<typeof responseEnvelopeSchema>;
