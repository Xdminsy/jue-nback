import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./channels";
import { generateTrials, isMatchAt } from "./engine";
import type { SessionConfig } from "../types";

function rng(values: number[]) {
  let index = 0;
  return () => values[index++ % values.length];
}

describe("generateTrials", () => {
  it("generates independent n-back matches for each active channel", () => {
    const config: SessionConfig = {
      ...DEFAULT_CONFIG,
      channels: ["position", "audio-letter"],
      n: 2,
      trials: 8,
      matchRate: 0.5
    };
    const trials = generateTrials(config, rng([0.1, 0.2, 0.9, 0.4, 0.2, 0.6, 0.1, 0.8]));

    for (let index = 0; index < trials.length; index += 1) {
      for (const channel of config.channels) {
        expect(trials[index].expectedMatches[channel]).toBe(isMatchAt(trials, index, channel, config.n));
      }
    }
  });

  it("does not create accidental non-match values when a comparison value exists", () => {
    const config: SessionConfig = { ...DEFAULT_CONFIG, channels: ["position"], n: 1, trials: 10, matchRate: 0.05 };
    const trials = generateTrials(config, () => 0.99);

    for (let index = 1; index < trials.length; index += 1) {
      if (!trials[index].expectedMatches.position) {
        expect(trials[index].values.position).not.toBe(trials[index - 1].values.position);
      }
    }
  });
});
