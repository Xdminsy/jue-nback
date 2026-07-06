export const STIMULUS_CHANNELS = [
  "position",
  "audio-letter",
  "audio-tone",
  "visual-color",
  "visual-shape"
] as const;

export type StimulusChannel = (typeof STIMULUS_CHANNELS)[number];

export type Locale = "zh" | "en";

export type AudioPreference = "speech" | "tone" | "auto";

export type ChannelMap<T> = Partial<Record<StimulusChannel, T>>;

export type SessionConfig = {
  id: string;
  modeName: string;
  channels: StimulusChannel[];
  n: number;
  adaptive: boolean;
  trials: number;
  stimulusMs: number;
  responseMs: number;
  matchRate: number;
  audioPreference: AudioPreference;
  responseKeys: string[];
  sessionKey: string;
};

export type TrialStimulus = {
  trialIndex: number;
  values: ChannelMap<string | number>;
  expectedMatches: ChannelMap<boolean>;
};

export type TrialResult = {
  trialIndex: number;
  expectedMatches: ChannelMap<boolean>;
  responses: ChannelMap<boolean>;
  reactionMs: ChannelMap<number>;
};

export type ChannelScore = {
  total: number;
  hits: number;
  misses: number;
  falseAlarms: number;
  correctRejections: number;
  accuracy: number;
  precision: number;
  recall: number;
  falseAlarmRate: number;
  meanReactionMs: number | null;
};

export type SessionRecord = {
  id: string;
  startedAt: string;
  durationMs: number;
  config: SessionConfig;
  rawTrials: TrialStimulus[];
  trials: TrialResult[];
  scoreByChannel: Record<StimulusChannel, ChannelScore>;
  overallAccuracy: number;
  nBefore: number;
  nAfter: number;
};

export type ModePreset = {
  id: string;
  labelKey: string;
  descriptionKey: string;
  channels: StimulusChannel[];
};

export type ExportPayload = {
  schemaVersion: 1;
  exportedAt: string;
  sessions: SessionRecord[];
};

export type AppPreference = {
  key: string;
  value: unknown;
};
