import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_CONFIG } from "./channels";
import type { TrialStimulus } from "../types";

describe("audio playback", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("speaks audio-letter stimuli instead of toning them in auto mode", async () => {
    let starts = 0;
    const speak = vi.fn((utterance: SpeechSynthesisUtterance) => {
      utterance.onstart?.(new Event("start") as SpeechSynthesisEvent);
    });

    class FakeAudioContext {
      currentTime = 0;
      destination = {};
      state: AudioContextState = "running";

      createOscillator() {
        return {
          type: "sine",
          frequency: {
            setValueAtTime: vi.fn()
          },
          connect: vi.fn(),
          start: vi.fn(() => {
            starts += 1;
          }),
          stop: vi.fn()
        };
      }

      createGain() {
        return {
          gain: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn()
          },
          connect: vi.fn()
        };
      }
    }

    class FakeUtterance {
      lang = "";
      pitch = 1;
      rate = 1;
      text: string;
      voice: SpeechSynthesisVoice | null = null;
      volume = 1;
      onerror: ((event: SpeechSynthesisErrorEvent) => void) | null = null;
      onstart: ((event: SpeechSynthesisEvent) => void) | null = null;

      constructor(text: string) {
        this.text = text;
      }
    }

    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      value: FakeAudioContext
    });
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: FakeUtterance
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        cancel: vi.fn(),
        getVoices: () => [{ lang: "en-US" }],
        speak
      }
    });

    const { playStimulusAudio } = await import("./audio");
    const trial: TrialStimulus = {
      trialIndex: 0,
      values: { "audio-letter": "B" },
      expectedMatches: { "audio-letter": false }
    };

    await playStimulusAudio(trial, { ...DEFAULT_CONFIG, channels: ["audio-letter"], audioPreference: "auto" });

    expect(speak).toHaveBeenCalledOnce();
    expect(speak.mock.calls[0][0].text).toBe("B");
    expect(starts).toBe(0);
  });

  it("plays the configured audio-tone frequency through Web Audio", async () => {
    const frequencies: number[] = [];
    let starts = 0;
    let resumes = 0;

    class FakeAudioContext {
      currentTime = 0;
      destination = {};
      state: AudioContextState = "suspended";

      async resume() {
        resumes += 1;
        this.state = "running";
      }

      createOscillator() {
        return {
          type: "sine",
          frequency: {
            setValueAtTime(value: number) {
              frequencies.push(value);
            }
          },
          connect: vi.fn(),
          start: vi.fn(() => {
            starts += 1;
          }),
          stop: vi.fn()
        };
      }

      createGain() {
        return {
          gain: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn()
          },
          connect: vi.fn()
        };
      }
    }

    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      value: FakeAudioContext
    });

    const { playStimulusAudio } = await import("./audio");
    const trial: TrialStimulus = {
      trialIndex: 0,
      values: { "audio-tone": "C4" },
      expectedMatches: { "audio-tone": false }
    };

    await playStimulusAudio(trial, { ...DEFAULT_CONFIG, channels: ["audio-tone"] });

    expect(resumes).toBe(1);
    expect(starts).toBe(1);
    expect(frequencies[0]).toBeCloseTo(261.63);
  });

  it("falls back to bundled letter samples when system speech is unavailable", async () => {
    let bufferStarts = 0;
    let toneStarts = 0;

    class FakeAudioContext {
      currentTime = 0;
      destination = {};
      state: AudioContextState = "running";

      async decodeAudioData() {
        return {} as AudioBuffer;
      }

      createBufferSource() {
        return {
          buffer: null,
          connect: vi.fn(),
          start: vi.fn(() => {
            bufferStarts += 1;
          })
        };
      }

      createOscillator() {
        return {
          type: "sine",
          frequency: {
            setValueAtTime: vi.fn()
          },
          connect: vi.fn(),
          start: vi.fn(() => {
            toneStarts += 1;
          }),
          stop: vi.fn()
        };
      }

      createGain() {
        return {
          gain: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn()
          },
          connect: vi.fn()
        };
      }
    }

    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      value: FakeAudioContext
    });
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: undefined
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: undefined
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(8)
      }))
    );

    const { playStimulusAudio } = await import("./audio");
    const trial: TrialStimulus = {
      trialIndex: 0,
      values: { "audio-letter": "B" },
      expectedMatches: { "audio-letter": false }
    };

    await playStimulusAudio(trial, { ...DEFAULT_CONFIG, channels: ["audio-letter"], audioPreference: "auto" });

    expect(fetch).toHaveBeenCalledWith("/audio/letters/B.wav");
    expect(bufferStarts).toBe(1);
    expect(toneStarts).toBe(0);
  });
});
