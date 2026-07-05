import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./channels";
import { finalizeSession } from "./scoring";
import type { SessionConfig, TrialResult, TrialStimulus } from "../types";

describe("finalizeSession", () => {
  it("counts hits, misses, false alarms, and correct rejections per channel", () => {
    const config: SessionConfig = { ...DEFAULT_CONFIG, channels: ["position"], n: 1, adaptive: false };
    const rawTrials: TrialStimulus[] = [
      { trialIndex: 0, values: { position: 0 }, expectedMatches: { position: false } },
      { trialIndex: 1, values: { position: 0 }, expectedMatches: { position: true } },
      { trialIndex: 2, values: { position: 1 }, expectedMatches: { position: false } },
      { trialIndex: 3, values: { position: 1 }, expectedMatches: { position: true } }
    ];
    const responses: TrialResult[] = [
      { trialIndex: 0, expectedMatches: {}, responses: {}, reactionMs: {} },
      { trialIndex: 1, expectedMatches: {}, responses: { position: true }, reactionMs: { position: 300 } },
      { trialIndex: 2, expectedMatches: {}, responses: { position: true }, reactionMs: { position: 350 } },
      { trialIndex: 3, expectedMatches: {}, responses: {}, reactionMs: {} }
    ];

    const session = finalizeSession({
      id: "test",
      startedAt: new Date().toISOString(),
      durationMs: 4000,
      config,
      rawTrials,
      responses
    });

    expect(session.scoreByChannel.position.hits).toBe(1);
    expect(session.scoreByChannel.position.misses).toBe(1);
    expect(session.scoreByChannel.position.falseAlarms).toBe(1);
    expect(session.scoreByChannel.position.correctRejections).toBe(1);
    expect(session.scoreByChannel.position.accuracy).toBe(0.5);
    expect(session.nAfter).toBe(1);
  });
});
