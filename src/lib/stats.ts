import { STIMULUS_CHANNELS, type ChannelScore, type SessionRecord, type StimulusChannel } from "../types";

export type DayBucket = {
  date: string;
  sessions: number;
  minutes: number;
  bestN: number;
  accuracy: number;
};

export type DashboardStats = {
  totalSessions: number;
  totalMinutes: number;
  streakDays: number;
  bestN: number;
  recommendedN: number;
  averageAccuracy: number;
  recentTrend: DayBucket[];
  heatmap: DayBucket[];
  channelScores: Record<StimulusChannel, ChannelScore>;
};

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

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

function isStimulusChannel(channel: string): channel is StimulusChannel {
  return (STIMULUS_CHANNELS as readonly string[]).includes(channel);
}

function numberOr(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function scoreOrEmpty(score: Partial<ChannelScore> | undefined): ChannelScore {
  const meanReactionMs =
    typeof score?.meanReactionMs === "number" && Number.isFinite(score.meanReactionMs) ? score.meanReactionMs : null;

  return {
    total: numberOr(score?.total),
    hits: numberOr(score?.hits),
    misses: numberOr(score?.misses),
    falseAlarms: numberOr(score?.falseAlarms),
    correctRejections: numberOr(score?.correctRejections),
    accuracy: numberOr(score?.accuracy),
    precision: numberOr(score?.precision),
    recall: numberOr(score?.recall, 1),
    falseAlarmRate: numberOr(score?.falseAlarmRate),
    meanReactionMs
  };
}

function aggregateChannelScores(sessions: SessionRecord[]): Record<StimulusChannel, ChannelScore> {
  const aggregate = Object.fromEntries(STIMULUS_CHANNELS.map((channel) => [channel, emptyScore()])) as Record<
    StimulusChannel,
    ChannelScore
  >;
  const reaction = new Map<StimulusChannel, { total: number; count: number }>();

  for (const session of sessions) {
    for (const channel of session.config.channels) {
      if (!isStimulusChannel(channel)) {
        continue;
      }

      const score = scoreOrEmpty(session.scoreByChannel?.[channel]);
      const target = aggregate[channel];
      target.total += score.total;
      target.hits += score.hits;
      target.misses += score.misses;
      target.falseAlarms += score.falseAlarms;
      target.correctRejections += score.correctRejections;

      if (score.meanReactionMs !== null && Number.isFinite(score.meanReactionMs)) {
        const previous = reaction.get(channel) ?? { total: 0, count: 0 };
        previous.total += score.meanReactionMs;
        previous.count += 1;
        reaction.set(channel, previous);
      }
    }
  }

  for (const channel of STIMULUS_CHANNELS) {
    const score = aggregate[channel];
    const correct = score.hits + score.correctRejections;
    const attemptedPositive = score.hits + score.falseAlarms;
    const actualPositive = score.hits + score.misses;
    const actualNegative = score.falseAlarms + score.correctRejections;
    const reactionScore = reaction.get(channel);

    score.accuracy = score.total > 0 ? correct / score.total : 0;
    score.precision = attemptedPositive > 0 ? score.hits / attemptedPositive : 0;
    score.recall = actualPositive > 0 ? score.hits / actualPositive : 1;
    score.falseAlarmRate = actualNegative > 0 ? score.falseAlarms / actualNegative : 0;
    score.meanReactionMs =
      reactionScore && reactionScore.count > 0 ? reactionScore.total / reactionScore.count : null;
  }

  return aggregate;
}

function buildBuckets(sessions: SessionRecord[], days: number): DayBucket[] {
  const today = new Date();
  const start = addDays(today, -(days - 1));
  const buckets = new Map<string, DayBucket>();

  for (let index = 0; index < days; index += 1) {
    const key = dateKey(addDays(start, index));
    buckets.set(key, { date: key, sessions: 0, minutes: 0, bestN: 0, accuracy: 0 });
  }

  const accuracyTotals = new Map<string, { total: number; count: number }>();
  for (const session of sessions) {
    const startedAt = new Date(session.startedAt);
    if (Number.isNaN(startedAt.getTime())) {
      continue;
    }

    const key = dateKey(startedAt);
    const bucket = buckets.get(key);
    if (!bucket) {
      continue;
    }
    bucket.sessions += 1;
    bucket.minutes += Math.round(numberOr(session.durationMs) / 6000) / 10;
    bucket.bestN = Math.max(bucket.bestN, numberOr(session.nBefore), numberOr(session.nAfter));
    const accuracy = accuracyTotals.get(key) ?? { total: 0, count: 0 };
    accuracy.total += numberOr(session.overallAccuracy);
    accuracy.count += 1;
    accuracyTotals.set(key, accuracy);
  }

  for (const [key, total] of accuracyTotals) {
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.accuracy = total.total / total.count;
    }
  }

  return [...buckets.values()];
}

function computeStreak(sessions: SessionRecord[]): number {
  const trainedDays = new Set(sessions.map((session) => dateKey(new Date(session.startedAt))));
  let cursor = new Date();
  let streak = 0;

  while (trainedDays.has(dateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function buildDashboardStats(sessions: SessionRecord[]): DashboardStats {
  const sorted = [...sessions].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const latest = sorted.length > 0 ? sorted[sorted.length - 1] : undefined;
  const totalMinutes = sessions.reduce((total, session) => total + numberOr(session.durationMs) / 60000, 0);
  const bestN = sessions.reduce((best, session) => Math.max(best, numberOr(session.nBefore), numberOr(session.nAfter)), 0);
  const averageAccuracy =
    sessions.length > 0
      ? sessions.reduce((total, session) => total + numberOr(session.overallAccuracy), 0) / sessions.length
      : 0;

  return {
    totalSessions: sessions.length,
    totalMinutes,
    streakDays: computeStreak(sessions),
    bestN,
    recommendedN: numberOr(latest?.nAfter, 2),
    averageAccuracy,
    recentTrend: buildBuckets(sessions, 30),
    heatmap: buildBuckets(sessions, 42),
    channelScores: aggregateChannelScores(sessions)
  };
}
