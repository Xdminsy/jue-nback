import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_CONFIG, ensureValidChannels } from "../lib/channels";
import { generateTrials } from "../lib/engine";
import { finalizeSession } from "../lib/scoring";
import type { SessionConfig, SessionRecord, StimulusChannel, TrialResult, TrialStimulus } from "../types";

type SessionPhase = "idle" | "stimulus" | "response" | "complete";

type RunningSession = {
  id: string;
  startedAt: string;
  startedAtMs: number;
  trialStartedAtMs: number;
  currentIndex: number;
  phase: SessionPhase;
  trials: TrialStimulus[];
  responses: TrialResult[];
  summary: SessionRecord | null;
  saved: boolean;
};

type SessionStore = {
  config: SessionConfig;
  running: RunningSession | null;
  setConfig: (config: SessionConfig) => void;
  updateConfig: (patch: Partial<SessionConfig>) => void;
  startSession: () => void;
  recordResponse: (channel: StimulusChannel) => void;
  showResponseWindow: () => void;
  advanceTrial: () => void;
  resetSession: () => void;
  markSaved: () => void;
};

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeConfig(config: SessionConfig): SessionConfig {
  const n = Math.max(1, Math.floor(config.n));
  const channels = ensureValidChannels(config.channels);
  return {
    ...config,
    channels,
    audioPreference: channels.includes("audio-letter") && config.audioPreference === "tone" ? "auto" : config.audioPreference,
    n,
    trials: Math.max(n + 1, Math.floor(config.trials)),
    stimulusMs: Math.max(100, Math.floor(config.stimulusMs)),
    responseMs: Math.max(250, Math.floor(config.responseMs)),
    matchRate: Math.min(0.75, Math.max(0.05, config.matchRate))
  };
}

function buildResponse(trialIndex: number): TrialResult {
  return {
    trialIndex,
    expectedMatches: {},
    responses: {},
    reactionMs: {}
  };
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      config: DEFAULT_CONFIG,
      running: null,
      setConfig: (config) => set({ config: normalizeConfig(config) }),
      updateConfig: (patch) =>
        set((state) => ({
          config: normalizeConfig({ ...state.config, ...patch })
        })),
      startSession: () => {
        const config = normalizeConfig(get().config);
        const now = Date.now();
        const id = makeId();
        set({
          config,
          running: {
            id,
            startedAt: new Date(now).toISOString(),
            startedAtMs: now,
            trialStartedAtMs: performance.now(),
            currentIndex: 0,
            phase: "stimulus",
            trials: generateTrials(config),
            responses: [],
            summary: null,
            saved: false
          }
        });
      },
      recordResponse: (channel) =>
        set((state) => {
          const running = state.running;
          if (!running || running.phase === "idle" || running.phase === "complete") {
            return state;
          }
          if (!state.config.channels.includes(channel)) {
            return state;
          }

          const responseIndex = running.responses.findIndex((item) => item.trialIndex === running.currentIndex);
          const responses = [...running.responses];
          const current =
            responseIndex >= 0 ? { ...responses[responseIndex] } : buildResponse(running.currentIndex);

          if (current.responses[channel]) {
            return state;
          }

          current.responses = { ...current.responses, [channel]: true };
          current.reactionMs = {
            ...current.reactionMs,
            [channel]: Math.round(performance.now() - running.trialStartedAtMs)
          };

          if (responseIndex >= 0) {
            responses[responseIndex] = current;
          } else {
            responses.push(current);
          }

          return {
            running: {
              ...running,
              responses
            }
          };
        }),
      showResponseWindow: () =>
        set((state) => {
          if (!state.running || state.running.phase !== "stimulus") {
            return state;
          }
          return {
            running: {
              ...state.running,
              phase: "response"
            }
          };
        }),
      advanceTrial: () =>
        set((state) => {
          const running = state.running;
          if (!running || running.phase === "complete") {
            return state;
          }

          const nextIndex = running.currentIndex + 1;
          if (nextIndex >= running.trials.length) {
            const summary = finalizeSession({
              id: running.id,
              startedAt: running.startedAt,
              durationMs: Date.now() - running.startedAtMs,
              config: state.config,
              rawTrials: running.trials,
              responses: running.responses
            });
            return {
              running: {
                ...running,
                phase: "complete",
                summary
              },
              config: state.config.adaptive ? { ...state.config, n: summary.nAfter, trials: Math.max(20 + summary.nAfter, state.config.trials) } : state.config
            };
          }

          return {
            running: {
              ...running,
              currentIndex: nextIndex,
              phase: "stimulus",
              trialStartedAtMs: performance.now()
            }
          };
        }),
      resetSession: () => set({ running: null }),
      markSaved: () =>
        set((state) => {
          if (!state.running) {
            return state;
          }
          return {
            running: {
              ...state.running,
              saved: true
            }
          };
        })
    }),
    {
      name: "jue-nback-session",
      partialize: (state) => ({ config: state.config })
    }
  )
);
