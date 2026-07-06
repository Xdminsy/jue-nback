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

function session(overrides: Partial<SessionRecord>): SessionRecord {
  return {
    id: "session",
    startedAt: new Date().toISOString(),
    durationMs: 60_000,
    config: DEFAULT_CONFIG,
    rawTrials: [],
    trials: [],
    scoreByChannel: {
      position: score,
      "audio-letter": score,
      "audio-tone": score,
      "visual-color": score,
      "visual-shape": score
    },
    overallAccuracy: 0.8,
    nBefore: 2,
    nAfter: 2,
    ...overrides
  };
}

describe("dashboard stats", () => {
  it("tolerates older sessions with missing channel scores", () => {
    const oldSession = {
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

    const stats = buildDashboardStats([oldSession]);

    expect(stats.totalSessions).toBe(1);
    expect(stats.channelScores.position.total).toBe(10);
    expect(stats.channelScores["audio-letter"].total).toBe(0);
    expect(stats.channelScores["visual-color"].total).toBe(0);
  });

  it("counts today's sessions against the configured daily goal", () => {
    const now = new Date(2026, 6, 7, 12);
    const todayMorning = new Date(2026, 6, 7, 8).toISOString();
    const yesterday = new Date(2026, 6, 6, 20).toISOString();

    const stats = buildDashboardStats(
      [
        session({ id: "today-1", startedAt: todayMorning }),
        session({ id: "today-2", startedAt: todayMorning }),
        session({ id: "yesterday", startedAt: yesterday })
      ],
      2,
      now
    );

    expect(stats.todaySessions).toBe(2);
    expect(stats.dailySessionGoal).toBe(2);
    expect(stats.todayGoalComplete).toBe(true);
  });

  it("uses the default daily goal when none is provided", () => {
    const stats = buildDashboardStats([], undefined, new Date(2026, 6, 7));

    expect(stats.dailySessionGoal).toBe(10);
    expect(stats.todaySessions).toBe(0);
    expect(stats.todayGoalComplete).toBe(false);
  });
});
