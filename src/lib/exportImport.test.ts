import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./channels";
import { createExportPayload, parseExportPayload } from "./exportImport";
import type { SessionRecord } from "../types";

const session: SessionRecord = {
  id: "one",
  startedAt: "2026-01-01T00:00:00.000Z",
  durationMs: 1000,
  config: DEFAULT_CONFIG,
  rawTrials: [],
  trials: [],
  scoreByChannel: {
    position: {
      total: 0,
      hits: 0,
      misses: 0,
      falseAlarms: 0,
      correctRejections: 0,
      accuracy: 0,
      precision: 0,
      recall: 1,
      falseAlarmRate: 0,
      meanReactionMs: null
    },
    "audio-letter": {
      total: 0,
      hits: 0,
      misses: 0,
      falseAlarms: 0,
      correctRejections: 0,
      accuracy: 0,
      precision: 0,
      recall: 1,
      falseAlarmRate: 0,
      meanReactionMs: null
    },
    "audio-tone": {
      total: 0,
      hits: 0,
      misses: 0,
      falseAlarms: 0,
      correctRejections: 0,
      accuracy: 0,
      precision: 0,
      recall: 1,
      falseAlarmRate: 0,
      meanReactionMs: null
    },
    "visual-color": {
      total: 0,
      hits: 0,
      misses: 0,
      falseAlarms: 0,
      correctRejections: 0,
      accuracy: 0,
      precision: 0,
      recall: 1,
      falseAlarmRate: 0,
      meanReactionMs: null
    },
    "visual-shape": {
      total: 0,
      hits: 0,
      misses: 0,
      falseAlarms: 0,
      correctRejections: 0,
      accuracy: 0,
      precision: 0,
      recall: 1,
      falseAlarmRate: 0,
      meanReactionMs: null
    }
  },
  overallAccuracy: 0,
  nBefore: 2,
  nAfter: 2
};

describe("export import payload", () => {
  it("round-trips valid session data", () => {
    const payload = createExportPayload([session]);
    expect(parseExportPayload(payload).sessions).toHaveLength(1);
  });

  it("rejects invalid payloads", () => {
    expect(() => parseExportPayload({ schemaVersion: 2, sessions: [] })).toThrow();
  });
});
