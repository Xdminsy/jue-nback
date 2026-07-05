import { CHANNEL_DEFINITIONS } from "./channels";
import type { ChannelMap, SessionConfig, StimulusChannel, TrialStimulus } from "../types";

export type RandomSource = () => number;

function pickValue<T>(values: T[], rng: RandomSource, forbidden?: T): T {
  const candidates = forbidden === undefined ? values : values.filter((value) => value !== forbidden);
  const source = candidates.length > 0 ? candidates : values;
  return source[Math.floor(rng() * source.length)];
}

export function generateTrials(config: SessionConfig, rng: RandomSource = Math.random): TrialStimulus[] {
  const trials: TrialStimulus[] = [];
  const safeN = Math.max(1, Math.floor(config.n));
  const matchRate = Math.min(0.75, Math.max(0.05, config.matchRate));

  for (let trialIndex = 0; trialIndex < config.trials; trialIndex += 1) {
    const values: ChannelMap<string | number> = {};
    const expectedMatches: ChannelMap<boolean> = {};

    for (const channel of config.channels) {
      const library = CHANNEL_DEFINITIONS[channel].values;
      const comparableValue = trialIndex >= safeN ? trials[trialIndex - safeN].values[channel] : undefined;
      const shouldMatch = comparableValue !== undefined && rng() < matchRate;

      expectedMatches[channel] = shouldMatch;
      values[channel] = shouldMatch
        ? comparableValue
        : pickValue(library, rng, comparableValue as string | number | undefined);
    }

    trials.push({ trialIndex, values, expectedMatches });
  }

  return trials;
}

export function isMatchAt(
  trials: TrialStimulus[],
  trialIndex: number,
  channel: StimulusChannel,
  n: number
): boolean {
  if (trialIndex < n) {
    return false;
  }

  return trials[trialIndex].values[channel] === trials[trialIndex - n].values[channel];
}
