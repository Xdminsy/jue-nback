export const DEFAULT_DAILY_SESSION_GOAL = 10;
export const MIN_DAILY_SESSION_GOAL = 1;
export const MAX_DAILY_SESSION_GOAL = 50;

export function normalizeDailySessionGoal(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numeric)) {
    return DEFAULT_DAILY_SESSION_GOAL;
  }

  return Math.min(MAX_DAILY_SESSION_GOAL, Math.max(MIN_DAILY_SESSION_GOAL, Math.floor(numeric)));
}
