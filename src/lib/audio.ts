import type { SessionConfig, TrialStimulus } from "../types";

const FREQUENCIES: Record<string, number> = {
  B: 246.94,
  C: 261.63,
  F: 349.23,
  H: 392,
  K: 440,
  L: 493.88,
  Q: 523.25,
  R: 587.33,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  G4: 392,
  A4: 440,
  C5: 523.25
};

let audioContext: AudioContext | null = null;
let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioCtor = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioCtor) {
    return null;
  }

  audioContext ??= new AudioCtor();
  return audioContext;
}

function getSpeechSynthesis(): SpeechSynthesis | null {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window) ||
    typeof SpeechSynthesisUtterance === "undefined"
  ) {
    return null;
  }

  return window.speechSynthesis;
}

function readSpeechVoices(speech: SpeechSynthesis): SpeechSynthesisVoice[] {
  return typeof speech.getVoices === "function" ? speech.getVoices() : [];
}

function loadSpeechVoices(timeoutMs = 800): Promise<SpeechSynthesisVoice[]> {
  const speech = getSpeechSynthesis();
  if (!speech) {
    return Promise.resolve([]);
  }

  const voices = readSpeechVoices(speech);
  if (voices.length > 0) {
    return Promise.resolve(voices);
  }

  voicesPromise ??= new Promise<SpeechSynthesisVoice[]>((resolve) => {
    let settled = false;
    let timer = 0;
    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timer);
      speech.removeEventListener?.("voiceschanged", finish);
      resolve(readSpeechVoices(speech));
    };
    timer = window.setTimeout(finish, timeoutMs);
    speech.addEventListener?.("voiceschanged", finish);
  }).then((loadedVoices) => {
    if (loadedVoices.length === 0) {
      voicesPromise = null;
    }
    return loadedVoices;
  });

  return voicesPromise;
}

function pickEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  return voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ?? voices[0];
}

export async function primeAudio(): Promise<void> {
  const context = getAudioContext();
  if (context?.state === "suspended") {
    await context.resume();
  }
  await loadSpeechVoices(500);
}

export async function playTone(value: string | number, durationMs = 280): Promise<boolean> {
  const context = getAudioContext();
  if (!context) {
    return false;
  }

  if (context.state === "suspended") {
    await context.resume();
  }

  const frequency = typeof value === "string" ? FREQUENCIES[value] ?? 440 : 220 + Number(value) * 40;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + durationMs / 1000);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + durationMs / 1000 + 0.02);
  return true;
}

export async function speakLetter(value: string | number): Promise<boolean> {
  const speech = getSpeechSynthesis();
  if (!speech) {
    return false;
  }

  const voices = await loadSpeechVoices(500);
  const utterance = new SpeechSynthesisUtterance(String(value));
  const voice = pickEnglishVoice(voices);
  if (voice) {
    utterance.voice = voice;
  }
  utterance.lang = voice?.lang ?? "en-US";
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (success: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timer);
      resolve(success);
    };
    const timer = window.setTimeout(() => finish(true), 350);
    utterance.onstart = () => finish(true);
    utterance.onerror = () => finish(false);

    try {
      speech.cancel();
      speech.speak(utterance);
    } catch {
      finish(false);
    }
  });
}

export async function playStimulusAudio(trial: TrialStimulus, config: SessionConfig): Promise<void> {
  const letter = trial.values["audio-letter"];
  const tone = trial.values["audio-tone"];

  if (letter !== undefined) {
    if (config.audioPreference === "tone") {
      await playTone(letter);
    } else {
      const spoke = await speakLetter(letter);
      if (!spoke && config.audioPreference === "auto") {
        await playTone(letter);
      }
    }
  }

  if (tone !== undefined) {
    await playTone(tone);
  }
}
