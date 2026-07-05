import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./channels";
import { recommendNextN } from "./adaptive";
import type { ChannelScore, SessionRecord, StimulusChannel } from "../types";
import { STIMULUS_CHANNELS } from "../types";

function score(overrides: Partial<ChannelScore>): ChannelScore {
  return {
    total: 20,
    hits: 6,
    misses: 1,
    falseAlarms: 1,
    correctRejections: 12,
    accuracy: 0.9,
    precision: 0.85,
    recall: 0.85,
    falseAlarmRate: 0.08,
    meanReactionMs: 420,
    ...overrides
  };
}

function session(overrides: Partial<SessionRecord>): Pick<SessionRecord, "config" | "overallAccuracy" | "scoreByChannel"> {
  const scoreByChannel = Object.fromEntries(STIMULUS_CHANNELS.map((channel) => [channel, score({})])) as Record<
    StimulusChannel,
    ChannelScore
  >;
  return {
    config: { ...DEFAULT_CONFIG, channels: ["position"], n: 2, adaptive: true },
    overallAccuracy: 0.9,
    scoreByChannel,
    ...overrides
  };
}

describe("recommendNextN", () => {
  it("increases N after strong adaptive performance", () => {
    expect(recommendNextN(session({}))).toBe(3);
  });

  it("decreases N after weak performance", () => {
    const weak = session({
      overallAccuracy: 0.5
    });
    weak.scoreByChannel.position = score({ accuracy: 0.5, recall: 0.25, falseAlarmRate: 0.4 });
    expect(recommendNextN(weak)).toBe(1);
  });

  it("keeps fixed N unchanged", () => {
    expect(recommendNextN(session({ config: { ...DEFAULT_CONFIG, n: 3, adaptive: false } }))).toBe(3);
  });
});
