import { STIMULUS_CHANNELS, type ChannelScore, type SessionConfig, type SessionRecord, type TrialResult, type TrialStimulus } from "../types";
import { recommendNextN } from "./adaptive";

function emptyScore(): ChannelScore {
  return {
    total: 0,
    hits: 0,
    misses: 0,
    falseAlarms: 0,
    correctRejections: 0,
    accuracy: 0,
    precision: 0,
    recall: 0,
    falseAlarmRate: 0,
    meanReactionMs: null
  };
}

export function buildTrialResults(trials: TrialStimulus[], responses: TrialResult[]): TrialResult[] {
  return trials.map((trial) => {
    const response = responses.find((item) => item.trialIndex === trial.trialIndex);
    return {
      trialIndex: trial.trialIndex,
      expectedMatches: { ...trial.expectedMatches },
      responses: { ...(response?.responses ?? {}) },
      reactionMs: { ...(response?.reactionMs ?? {}) }
    };
  });
}

export function scoreTrials(
  config: SessionConfig,
  trials: TrialStimulus[],
  responses: TrialResult[]
): Record<(typeof STIMULUS_CHANNELS)[number], ChannelScore> {
  const completed = buildTrialResults(trials, responses);
  const scoreByChannel = Object.fromEntries(
    STIMULUS_CHANNELS.map((channel) => [channel, emptyScore()])
  ) as Record<(typeof STIMULUS_CHANNELS)[number], ChannelScore>;
  const reactionSums = new Map<string, { total: number; count: number }>();

  for (const channel of config.channels) {
    for (const trial of completed) {
      const expected = Boolean(trial.expectedMatches[channel]);
      const responded = Boolean(trial.responses[channel]);
      const score = scoreByChannel[channel];
      score.total += 1;

      if (expected && responded) {
        score.hits += 1;
      } else if (expected && !responded) {
        score.misses += 1;
      } else if (!expected && responded) {
        score.falseAlarms += 1;
      } else {
        score.correctRejections += 1;
      }

      const reaction = trial.reactionMs[channel];
      if (reaction !== undefined) {
        const sum = reactionSums.get(channel) ?? { total: 0, count: 0 };
        sum.total += reaction;
        sum.count += 1;
        reactionSums.set(channel, sum);
      }
    }
  }

  for (const channel of config.channels) {
    const score = scoreByChannel[channel];
    const correct = score.hits + score.correctRejections;
    const attemptedPositive = score.hits + score.falseAlarms;
    const actualPositive = score.hits + score.misses;
    const actualNegative = score.falseAlarms + score.correctRejections;
    const reaction = reactionSums.get(channel);

    score.accuracy = score.total > 0 ? correct / score.total : 0;
    score.precision = attemptedPositive > 0 ? score.hits / attemptedPositive : 0;
    score.recall = actualPositive > 0 ? score.hits / actualPositive : 1;
    score.falseAlarmRate = actualNegative > 0 ? score.falseAlarms / actualNegative : 0;
    score.meanReactionMs = reaction && reaction.count > 0 ? reaction.total / reaction.count : null;
  }

  return scoreByChannel;
}

export function finalizeSession(params: {
  id: string;
  startedAt: string;
  durationMs: number;
  config: SessionConfig;
  rawTrials: TrialStimulus[];
  responses: TrialResult[];
}): SessionRecord {
  const trials = buildTrialResults(params.rawTrials, params.responses);
  const scoreByChannel = scoreTrials(params.config, params.rawTrials, trials);
  const totals = params.config.channels.reduce(
    (acc, channel) => {
      const score = scoreByChannel[channel];
      acc.correct += score.hits + score.correctRejections;
      acc.total += score.total;
      return acc;
    },
    { correct: 0, total: 0 }
  );

  const base: SessionRecord = {
    id: params.id,
    startedAt: params.startedAt,
    durationMs: params.durationMs,
    config: params.config,
    rawTrials: params.rawTrials,
    trials,
    scoreByChannel,
    overallAccuracy: totals.total > 0 ? totals.correct / totals.total : 0,
    nBefore: params.config.n,
    nAfter: params.config.n
  };

  return {
    ...base,
    nAfter: recommendNextN(base)
  };
}
