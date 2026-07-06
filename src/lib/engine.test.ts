import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./channels";
import { generateTrials, isMatchAt } from "./engine";
import type { SessionConfig } from "../types";

describe("generateTrials", () => {
  it("generates fixed Jaeggi-style target counts for dual-channel blocks", () => {
    const config: SessionConfig = {
      ...DEFAULT_CONFIG,
      channels: ["position", "audio-letter"],
      n: 2,
      trials: 22,
      matchRate: 0.3
    };
    const trials = generateTrials(config, () => 0);
    const positionTargets = trials.flatMap((trial) => (trial.expectedMatches.position ? [trial.trialIndex] : []));
    const audioTargets = trials.flatMap((trial) => (trial.expectedMatches["audio-letter"] ? [trial.trialIndex] : []));
    const overlappingTargets = positionTargets.filter((trialIndex) => audioTargets.includes(trialIndex));

    expect(positionTargets).toHaveLength(6);
    expect(audioTargets).toHaveLength(6);
    expect(overlappingTargets).toHaveLength(2);
    expect(positionTargets.every((trialIndex) => trialIndex >= config.n)).toBe(true);
    expect(audioTargets.every((trialIndex) => trialIndex >= config.n)).toBe(true);

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
