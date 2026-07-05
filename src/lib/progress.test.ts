import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./channels";
import { buildDashboardStats } from "./progress";
import type { ChannelScore, SessionRecord } from "../types";

const score: ChannelScore = {
  total: 10,
  hits: 3,
  misses: 1,
  falseAlarms: 1,
  correctRejections: 5,
  accuracy: 0.8,
  precision: 0.75,
  recall: 0.75,
  falseAlarmRate: 0.16,
  meanReactionMs: 600
};

describe("dashboard stats", () => {
  it("tolerates older sessions with missing channel scores", () => {
    const session = {
      id: "old-record",
      startedAt: new Date().toISOString(),
      durationMs: 60_000,
      config: {
        ...DEFAULT_CONFIG,
        channels: ["position", "audio-letter", "visual-color"]
      },
      rawTrials: [],
      trials: [],
      scoreByChannel: {
        position: score
      },
      overallAccuracy: 0.8,
      nBefore: 2,
      nAfter: 3
    } as unknown as SessionRecord;

    const stats = buildDashboardStats([session]);

    expect(stats.totalSessions).toBe(1);
    expect(stats.channelScores.position.total).toBe(10);
    expect(stats.channelScores["audio-letter"].total).toBe(0);
    expect(stats.channelScores["visual-color"].total).toBe(0);
  });
});
