import { CHANNEL_DEFINITIONS } from "./channels";
import { JAEGGI_DUAL_OVERLAP_RATIO, targetCountForAvailableTrials } from "./protocol";
import type { ChannelMap, SessionConfig, StimulusChannel, TrialStimulus } from "../types";

export type RandomSource = () => number;

function pickValue<T>(values: T[], rng: RandomSource, forbidden?: T): T {
  const candidates = forbidden === undefined ? values : values.filter((value) => value !== forbidden);
  const source = candidates.length > 0 ? candidates : values;
  return source[Math.floor(rng() * source.length)];
}

function pickItems<T>(values: T[], count: number, rng: RandomSource): T[] {
  const shuffled = [...values];
  const safeCount = Math.min(Math.max(0, count), shuffled.length);

  for (let index = 0; index < safeCount; index += 1) {
    const swapIndex = index + Math.floor(rng() * (shuffled.length - index));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled.slice(0, safeCount);
}

function buildTargetSchedule(config: SessionConfig, safeN: number, rng: RandomSource): ChannelMap<Set<number>> {
  const availableIndices = Array.from(
    { length: Math.max(0, config.trials - safeN) },
    (_, index) => index + safeN
  );
  const targetCount = targetCountForAvailableTrials(availableIndices.length, config.matchRate);

  if (config.channels.length === 2) {
    const minimumOverlap = Math.max(0, targetCount * 2 - availableIndices.length);
    const preferredOverlap = Math.round(targetCount * JAEGGI_DUAL_OVERLAP_RATIO);
    const overlapCount = Math.min(targetCount, Math.max(minimumOverlap, preferredOverlap));
    const singleCount = targetCount - overlapCount;
    const overlap = pickItems(availableIndices, overlapCount, rng);
    let remaining = availableIndices.filter((index) => !overlap.includes(index));
    const firstSingles = pickItems(remaining, singleCount, rng);
    remaining = remaining.filter((index) => !firstSingles.includes(index));
    const secondSingles = pickItems(remaining, singleCount, rng);

    return {
      [config.channels[0]]: new Set([...overlap, ...firstSingles]),
      [config.channels[1]]: new Set([...overlap, ...secondSingles])
    };
  }

  return Object.fromEntries(
    config.channels.map((channel) => [channel, new Set(pickItems(availableIndices, targetCount, rng))])
  ) as ChannelMap<Set<number>>;
}

export function generateTrials(config: SessionConfig, rng: RandomSource = Math.random): TrialStimulus[] {
  const trials: TrialStimulus[] = [];
  const safeN = Math.max(1, Math.floor(config.n));
  const targetSchedule = buildTargetSchedule(config, safeN, rng);

  for (let trialIndex = 0; trialIndex < config.trials; trialIndex += 1) {
    const values: ChannelMap<string | number> = {};
    const expectedMatches: ChannelMap<boolean> = {};

    for (const channel of config.channels) {
      const library = CHANNEL_DEFINITIONS[channel].values;
      const comparableValue = trialIndex >= safeN ? trials[trialIndex - safeN].values[channel] : undefined;
      const shouldMatch = comparableValue !== undefined && Boolean(targetSchedule[channel]?.has(trialIndex));

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
