import type { SessionRecord } from "../types";

export function recommendNextN(session: Pick<SessionRecord, "config" | "overallAccuracy" | "scoreByChannel">): number {
  const currentN = session.config.n;

  if (!session.config.adaptive) {
    return currentN;
  }

  const activeScores = session.config.channels.map((channel) => session.scoreByChannel[channel]);
  const worstRecall = Math.min(...activeScores.map((score) => score.recall));
  const worstAccuracy = Math.min(...activeScores.map((score) => score.accuracy));
  const worstFalseAlarmRate = Math.max(...activeScores.map((score) => score.falseAlarmRate));

  if (
    session.overallAccuracy >= 0.85 &&
    worstAccuracy >= 0.78 &&
    worstRecall >= 0.7 &&
    worstFalseAlarmRate <= 0.18
  ) {
    return currentN + 1;
  }

  if (
    session.overallAccuracy < 0.62 ||
    worstAccuracy < 0.55 ||
    worstRecall < 0.35 ||
    worstFalseAlarmRate > 0.38
  ) {
    return Math.max(1, currentN - 1);
  }

  return currentN;
}
