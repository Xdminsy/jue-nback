import type { SessionConfig } from "../types";

export const DEFAULT_RESPONSE_KEYS = ["J", "K", "L", ";", "F"] as const;

export function normalizeResponseKey(value: unknown, index: number): string {
  const fallback = DEFAULT_RESPONSE_KEYS[index % DEFAULT_RESPONSE_KEYS.length];
  if (typeof value !== "string") {
    return fallback;
  }

  const key = value.trim();
  if (!key) {
    return fallback;
  }

  return key.length === 1 ? key.toUpperCase() : key;
}

export function normalizeResponseKeys(keys: unknown, count: number = DEFAULT_RESPONSE_KEYS.length): string[] {
  const source = Array.isArray(keys) ? keys : [];
  return Array.from({ length: Math.max(count, DEFAULT_RESPONSE_KEYS.length) }, (_, index) =>
    normalizeResponseKey(source[index], index)
  );
}

export function responseKeyAt(config: Pick<SessionConfig, "responseKeys"> | { responseKeys?: unknown }, index: number): string {
  return normalizeResponseKey(Array.isArray(config.responseKeys) ? config.responseKeys[index] : undefined, index);
}

export function keyboardEventMatchesResponseKey(event: KeyboardEvent, responseKey: string): boolean {
  const key = responseKey.toLowerCase();
  return event.key.toLowerCase() === key || event.code.toLowerCase() === `key${key}`;
}
