import { z } from "zod";
import { STIMULUS_CHANNELS, type ExportPayload, type SessionRecord } from "../types";

const channelSchema = z.enum(STIMULUS_CHANNELS);
const channelBooleanMapSchema = z.partialRecord(channelSchema, z.boolean());
const channelNumberMapSchema = z.partialRecord(channelSchema, z.number());
const channelValueMapSchema = z.partialRecord(channelSchema, z.union([z.string(), z.number()]));

const sessionConfigSchema = z.object({
  id: z.string(),
  modeName: z.string(),
  channels: z.array(channelSchema).min(1),
  n: z.number().int().min(1),
  adaptive: z.boolean(),
  trials: z.number().int().min(1),
  stimulusMs: z.number().int().min(100),
  responseMs: z.number().int().min(100),
  matchRate: z.number().min(0).max(1),
  audioPreference: z.enum(["speech", "tone", "auto"]),
  responseKeys: z.array(z.string()).optional()
});

const channelScoreSchema = z.object({
  total: z.number(),
  hits: z.number(),
  misses: z.number(),
  falseAlarms: z.number(),
  correctRejections: z.number(),
  accuracy: z.number(),
  precision: z.number(),
  recall: z.number(),
  falseAlarmRate: z.number(),
  meanReactionMs: z.number().nullable()
});

const trialStimulusSchema = z.object({
  trialIndex: z.number().int().min(0),
  values: channelValueMapSchema,
  expectedMatches: channelBooleanMapSchema
});

const trialResultSchema = z.object({
  trialIndex: z.number().int().min(0),
  expectedMatches: channelBooleanMapSchema,
  responses: channelBooleanMapSchema,
  reactionMs: channelNumberMapSchema
});

export const sessionRecordSchema = z.object({
  id: z.string(),
  startedAt: z.string(),
  durationMs: z.number().min(0),
  config: sessionConfigSchema,
  rawTrials: z.array(trialStimulusSchema),
  trials: z.array(trialResultSchema),
  scoreByChannel: z.record(channelSchema, channelScoreSchema),
  overallAccuracy: z.number().min(0).max(1),
  nBefore: z.number().int().min(1),
  nAfter: z.number().int().min(1)
});

export const exportPayloadSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.string(),
  sessions: z.array(sessionRecordSchema)
});

export function createExportPayload(sessions: SessionRecord[]): ExportPayload {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    sessions
  };
}

export function parseExportPayload(input: unknown): ExportPayload {
  return exportPayloadSchema.parse(input) as ExportPayload;
}

export function parseSessionRecords(input: unknown): SessionRecord[] {
  const payload = parseExportPayload(input);
  return payload.sessions;
}
