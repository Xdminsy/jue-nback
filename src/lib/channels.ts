import { jaeggiBlockTrialCount } from "./protocol";
import { DEFAULT_SESSION_KEY } from "./responseKeys";
import type { ModePreset, SessionConfig, StimulusChannel } from "../types";

export type ChannelDefinition = {
  id: StimulusChannel;
  labelKey: string;
  shortLabelKey: string;
  values: Array<string | number>;
};

export const CHANNEL_DEFINITIONS: Record<StimulusChannel, ChannelDefinition> = {
  position: {
    id: "position",
    labelKey: "channels.position",
    shortLabelKey: "channels.positionShort",
    values: [0, 1, 2, 3, 4, 5, 6, 7, 8]
  },
  "audio-letter": {
    id: "audio-letter",
    labelKey: "channels.audioLetter",
    shortLabelKey: "channels.audioLetterShort",
    values: ["B", "C", "F", "H", "K", "L", "Q", "R"]
  },
  "audio-tone": {
    id: "audio-tone",
    labelKey: "channels.audioTone",
    shortLabelKey: "channels.audioToneShort",
    values: ["C4", "D4", "E4", "G4", "A4", "C5"]
  },
  "visual-color": {
    id: "visual-color",
    labelKey: "channels.visualColor",
    shortLabelKey: "channels.visualColorShort",
    values: ["teal", "coral", "amber", "violet", "lime", "rose"]
  },
  "visual-shape": {
    id: "visual-shape",
    labelKey: "channels.visualShape",
    shortLabelKey: "channels.visualShapeShort",
    values: ["circle", "square", "triangle", "diamond", "star", "hexagon"]
  }
};

export const MODE_PRESETS: ModePreset[] = [
  {
    id: "standard-dual",
    labelKey: "presets.standardDual",
    descriptionKey: "presets.standardDualDescription",
    channels: ["position", "audio-letter"]
  },
  {
    id: "tone-dual",
    labelKey: "presets.toneDual",
    descriptionKey: "presets.toneDualDescription",
    channels: ["position", "audio-tone"]
  },
  {
    id: "color-audio",
    labelKey: "presets.colorAudio",
    descriptionKey: "presets.colorAudioDescription",
    channels: ["visual-color", "audio-letter"]
  },
  {
    id: "shape-audio",
    labelKey: "presets.shapeAudio",
    descriptionKey: "presets.shapeAudioDescription",
    channels: ["visual-shape", "audio-letter"]
  },
  {
    id: "single-position",
    labelKey: "presets.singlePosition",
    descriptionKey: "presets.singlePositionDescription",
    channels: ["position"]
  },
  {
    id: "triple",
    labelKey: "presets.triple",
    descriptionKey: "presets.tripleDescription",
    channels: ["position", "audio-letter", "visual-color"]
  }
];

export const DEFAULT_CONFIG: SessionConfig = {
  id: "default",
  modeName: "standard-dual",
  channels: ["position", "audio-letter"],
  n: 2,
  adaptive: true,
  trials: jaeggiBlockTrialCount(2),
  stimulusMs: 750,
  responseMs: 2250,
  matchRate: 0.3,
  audioPreference: "auto",
  responseKeys: ["J", "K", "L", ";", "F"],
  sessionKey: DEFAULT_SESSION_KEY
};

export function getPreset(id: string): ModePreset | undefined {
  return MODE_PRESETS.find((preset) => preset.id === id);
}

export function configFromPreset(preset: ModePreset, base = DEFAULT_CONFIG): SessionConfig {
  return {
    ...base,
    id: preset.id,
    modeName: preset.id,
    channels: [...preset.channels],
    trials: base.adaptive ? jaeggiBlockTrialCount(base.n) : Math.max(base.trials, jaeggiBlockTrialCount(base.n))
  };
}

export function ensureValidChannels(channels: StimulusChannel[]): StimulusChannel[] {
  return channels.length > 0 ? channels : ["position"];
}
