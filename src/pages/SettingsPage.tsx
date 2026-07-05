import * as Switch from "@radix-ui/react-switch";
import { Check, Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChannelBadge } from "../components/ChannelBadge";
import { PageHeader } from "../components/PageHeader";
import { CHANNEL_DEFINITIONS, MODE_PRESETS, configFromPreset, ensureValidChannels } from "../lib/channels";
import { useSessionStore } from "../store/sessionStore";
import { STIMULUS_CHANNELS, type SessionConfig, type StimulusChannel } from "../types";
import { formatPercent } from "../utils/format";

export function SettingsPage() {
  const { t } = useTranslation();
  const storedConfig = useSessionStore((state) => state.config);
  const setConfig = useSessionStore((state) => state.setConfig);
  const [draft, setDraft] = useState<SessionConfig>(storedConfig);
  const [saved, setSaved] = useState(false);

  const selectedPreset = useMemo(
    () => MODE_PRESETS.find((preset) => preset.id === draft.modeName),
    [draft.modeName]
  );

  const apply = () => {
    setConfig({
      ...draft,
      channels: ensureValidChannels(draft.channels)
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const setNumber = (key: keyof Pick<SessionConfig, "n" | "trials" | "stimulusMs" | "responseMs">, value: number) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const toggleChannel = (channel: StimulusChannel) => {
    setDraft((current) => {
      const exists = current.channels.includes(channel);
      const channels = exists
        ? current.channels.filter((item) => item !== channel)
        : [...current.channels, channel];
      return {
        ...current,
        modeName: "custom",
        id: "custom",
        channels: ensureValidChannels(channels)
      };
    });
  };

  return (
    <div className="page-flow settings-page">
      <div className="settings-heading">
        <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />
        <button className="primary-button settings-apply-button" onClick={apply} type="button">
          <Check size={18} />
          {saved ? t("settings.saved") : t("common.apply")}
        </button>
      </div>

      <section className="settings-grid settings-page-grid">
        <div className="panel settings-panel">
          <label className="field">
            <span>{t("settings.preset")}</span>
            <select
              value={selectedPreset?.id ?? "custom"}
              onChange={(event) => {
                const preset = MODE_PRESETS.find((item) => item.id === event.target.value);
                if (preset) {
                  setDraft(configFromPreset(preset, draft));
                }
              }}
            >
              {MODE_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {t(preset.labelKey)}
                </option>
              ))}
              <option value="custom">{t("common.custom")}</option>
            </select>
          </label>

          {selectedPreset ? <p className="muted">{t(selectedPreset.descriptionKey)}</p> : null}

          <div className="channel-toggle-grid">
            {STIMULUS_CHANNELS.map((channel) => {
              const checked = draft.channels.includes(channel);
              return (
                <button
                  className={checked ? "channel-toggle selected" : "channel-toggle"}
                  key={channel}
                  onClick={() => toggleChannel(channel)}
                  type="button"
                >
                  <ChannelBadge channel={channel} />
                  {checked ? <Check size={18} /> : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="panel settings-panel">
          <div className="settings-control-grid">
            <NumberStepper
              label={t("settings.nLevel")}
              min={1}
              value={draft.n}
              onChange={(value) => setNumber("n", value)}
            />

            <label className="switch-field">
              <span>{t("settings.adaptive")}</span>
              <Switch.Root
                checked={draft.adaptive}
                className="switch-root"
                onCheckedChange={(adaptive) => setDraft((current) => ({ ...current, adaptive }))}
              >
                <Switch.Thumb className="switch-thumb" />
              </Switch.Root>
            </label>

            <NumberStepper
              label={t("settings.trials")}
              min={draft.n + 1}
              value={draft.trials}
              onChange={(value) => setNumber("trials", value)}
            />

            <NumberStepper
              label={`${t("settings.stimulusMs")} (ms)`}
              min={100}
              step={50}
              value={draft.stimulusMs}
              onChange={(value) => setNumber("stimulusMs", value)}
            />

            <NumberStepper
              label={`${t("settings.responseMs")} (ms)`}
              min={250}
              step={50}
              value={draft.responseMs}
              onChange={(value) => setNumber("responseMs", value)}
            />

            <label className="field">
              <span>
                {t("settings.matchRate")} <strong>{formatPercent(draft.matchRate)}</strong>
              </span>
              <input
                max={0.75}
                min={0.05}
                onChange={(event) => setDraft((current) => ({ ...current, matchRate: Number(event.target.value) }))}
                step={0.05}
                type="range"
                value={draft.matchRate}
              />
            </label>

            {draft.channels.includes("audio-letter") ? (
              <label className="field settings-wide-field">
                <span>{t("settings.audioPreference")}</span>
                <select
                  value={draft.audioPreference === "tone" ? "auto" : draft.audioPreference}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      audioPreference: event.target.value as SessionConfig["audioPreference"]
                    }))
                  }
                >
                  <option value="auto">{t("settings.auto")}</option>
                  <option value="speech">{t("settings.speech")}</option>
                </select>
              </label>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function NumberStepper({
  label,
  value,
  min,
  step = 1,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="stepper">
        <button onClick={() => onChange(Math.max(min, value - step))} title="Decrease" type="button">
          <Minus size={16} />
        </button>
        <input min={min} onChange={(event) => onChange(Number(event.target.value))} type="number" value={value} />
        <button onClick={() => onChange(value + step)} title="Increase" type="button">
          <Plus size={16} />
        </button>
      </div>
    </label>
  );
}
