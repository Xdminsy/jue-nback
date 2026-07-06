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
  it("increases N when every active channel has at most two errors", () => {
    expect(recommendNextN(session({}))).toBe(3);
  });

  it("decreases N when active channels have at least six total errors", () => {
    const weak = session({
      overallAccuracy: 0.5
    });
    weak.scoreByChannel.position = score({ misses: 3, falseAlarms: 0, accuracy: 0.5, recall: 0.5 });
    weak.scoreByChannel["audio-letter"] = score({ misses: 3, falseAlarms: 0, accuracy: 0.5, recall: 0.5 });
    weak.config = { ...weak.config, channels: ["position", "audio-letter"] };
    expect(recommendNextN(weak)).toBe(1);
  });

  it("keeps N unchanged for middle error counts", () => {
    const middle = session({});
    middle.scoreByChannel.position = score({ misses: 2, falseAlarms: 1 });
    expect(recommendNextN(middle)).toBe(2);
  });

  it("prioritizes the total-error decrease threshold when many channels are active", () => {
    const triple = session({
      config: { ...DEFAULT_CONFIG, channels: ["position", "audio-letter", "visual-color"], n: 3, adaptive: true }
    });

    triple.scoreByChannel.position = score({ misses: 2, falseAlarms: 0 });
    triple.scoreByChannel["audio-letter"] = score({ misses: 2, falseAlarms: 0 });
    triple.scoreByChannel["visual-color"] = score({ misses: 2, falseAlarms: 0 });

    expect(recommendNextN(triple)).toBe(2);
  });

  it("keeps fixed N unchanged", () => {
    expect(recommendNextN(session({ config: { ...DEFAULT_CONFIG, n: 3, adaptive: false } }))).toBe(3);
  });
});
