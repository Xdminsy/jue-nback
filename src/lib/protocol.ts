export const JAEGGI_BASE_TRIALS = 20;
export const JAEGGI_INCREASE_MAX_ERRORS_PER_CHANNEL = 2;
export const JAEGGI_DECREASE_MIN_ERRORS_PER_CHANNEL = 6;
export const JAEGGI_DUAL_OVERLAP_RATIO = 1 / 3;

export function jaeggiBlockTrialCount(n: number): number {
  return JAEGGI_BASE_TRIALS + Math.max(1, Math.floor(n));
}

export function targetCountForAvailableTrials(availableTrials: number, matchRate: number): number {
  const safeAvailableTrials = Math.max(0, Math.floor(availableTrials));
  const safeMatchRate = Math.min(0.75, Math.max(0.05, matchRate));
  return Math.min(safeAvailableTrials, Math.max(0, Math.round(safeAvailableTrials * safeMatchRate)));
}
