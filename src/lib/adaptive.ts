import type { SessionRecord } from "../types";
import { JAEGGI_DECREASE_MIN_TOTAL_ERRORS, JAEGGI_INCREASE_MAX_ERRORS_PER_CHANNEL } from "./protocol";

export function recommendNextN(session: Pick<SessionRecord, "config" | "overallAccuracy" | "scoreByChannel">): number {
  const currentN = session.config.n;

  if (!session.config.adaptive) {
    return currentN;
  }

  const activeScores = session.config.channels.map((channel) => session.scoreByChannel[channel]);
  const errorCounts = activeScores.map((score) => score.misses + score.falseAlarms);
  const totalErrors = errorCounts.reduce((total, errors) => total + errors, 0);

  if (totalErrors >= JAEGGI_DECREASE_MIN_TOTAL_ERRORS) {
    return Math.max(1, currentN - 1);
  }

  if (errorCounts.every((errors) => errors <= JAEGGI_INCREASE_MAX_ERRORS_PER_CHANNEL)) {
    return currentN + 1;
  }

  return currentN;
}
