import * as Switch from "@radix-ui/react-switch";
import { Check, Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChannelBadge } from "../components/ChannelBadge";
import { PageHeader } from "../components/PageHeader";
import { CHANNEL_DEFINITIONS, MODE_PRESETS, configFromPreset, ensureValidChannels } from "../lib/channels";
import { MAX_DAILY_SESSION_GOAL, MIN_DAILY_SESSION_GOAL, normalizeDailySessionGoal } from "../lib/dailyGoal";
import { jaeggiBlockTrialCount } from "../lib/protocol";
import { normalizeResponseKey, responseKeyAt } from "../lib/responseKeys";
import { normalizeConfig, useSessionStore } from "../store/sessionStore";
import { STIMULUS_CHANNELS, type SessionConfig, type StimulusChannel } from "../types";
import { formatPercent } from "../utils/format";

export function SettingsPage() {
  const { t } = useTranslation();
  const storedConfig = useSessionStore((state) => state.config);
  const storedDailySessionGoal = useSessionStore((state) => state.dailySessionGoal);
  const setConfig = useSessionStore((state) => state.setConfig);
  const setDailySessionGoal = useSessionStore((state) => state.setDailySessionGoal);
  const setPendingSettingsDraft = useSessionStore((state) => state.setPendingSettingsDraft);
  const setPendingDailySessionGoal = useSessionStore((state) => state.setPendingDailySessionGoal);
  const [draft, setDraft] = useState<SessionConfig>(storedConfig);
  const [dailyGoalDraft, setDailyGoalDraft] = useState(storedDailySessionGoal);
  const [saved, setSaved] = useState(false);
  const normalizedDraft = useMemo(() => normalizeConfig(draft), [draft]);
  const normalizedDailyGoalDraft = useMemo(() => normalizeDailySessionGoal(dailyGoalDraft), [dailyGoalDraft]);
  const configHasPendingChanges = useMemo(
    () => configKey(draft) !== configKey(storedConfig),
    [draft, storedConfig]
  );
  const dailyGoalHasPendingChanges = normalizedDailyGoalDraft !== storedDailySessionGoal;

  const selectedPreset = useMemo(
    () => MODE_PRESETS.find((preset) => preset.id === draft.modeName),
    [draft.modeName]
  );

  useEffect(() => {
    setPendingSettingsDraft(configHasPendingChanges ? normalizedDraft : null);
    setPendingDailySessionGoal(dailyGoalHasPendingChanges ? normalizedDailyGoalDraft : null);
    return () => {
      setPendingSettingsDraft(null);
      setPendingDailySessionGoal(null);
    };
  }, [
    configHasPendingChanges,
    dailyGoalHasPendingChanges,
    normalizedDailyGoalDraft,
    normalizedDraft,
    setPendingDailySessionGoal,
    setPendingSettingsDraft
  ]);

  const apply = () => {
    setConfig(normalizedDraft);
    setDailySessionGoal(normalizedDailyGoalDraft);
    setDraft(normalizedDraft);
    setDailyGoalDraft(normalizedDailyGoalDraft);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const setNumber = (key: keyof Pick<SessionConfig, "n" | "trials" | "stimulusMs" | "responseMs">, value: number) => {
    setDraft((current) => {
      if (key === "n" && current.adaptive) {
        return { ...current, n: value, trials: jaeggiBlockTrialCount(value) };
      }

      if (key === "trials" && current.adaptive) {
        return { ...current, trials: jaeggiBlockTrialCount(current.n) };
      }

      return { ...current, [key]: value };
    });
  };

  const setResponseKey = (index: number, value: string) => {
    setDraft((current) => {
      const responseKeys = [...(current.responseKeys ?? [])];
      responseKeys[index] = value ? normalizeResponseKey(value.slice(-1), index) : "";
      return { ...current, responseKeys };
    });
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

          <NumberStepper
            label={t("settings.dailyGoal")}
            max={MAX_DAILY_SESSION_GOAL}
            min={MIN_DAILY_SESSION_GOAL}
            value={dailyGoalDraft}
            onChange={setDailyGoalDraft}
          />

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
                onCheckedChange={(adaptive) =>
                  setDraft((current) => ({
                    ...current,
                    adaptive,
                    trials: adaptive ? jaeggiBlockTrialCount(current.n) : current.trials
                  }))
                }
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

            <div className="settings-wide-field response-key-settings">
              <span>{t("settings.responseKeys")}</span>
              <div className="response-key-grid">
                {draft.channels.map((channel, index) => {
                  const definition = CHANNEL_DEFINITIONS[channel];
                  return (
                    <label className="field response-key-field" key={`${channel}-${index}`}>
                      <span>
                        {t("settings.responseKeySlot", {
                          slot: index + 1,
                          channel: t(definition.shortLabelKey)
                        })}
                      </span>
                      <input
                        aria-label={t("settings.responseKeySlot", {
                          slot: index + 1,
                          channel: t(definition.shortLabelKey)
                        })}
                        className="response-key-input"
                        inputMode="text"
                        maxLength={1}
                        onChange={(event) => setResponseKey(index, event.target.value)}
                        value={responseKeyAt(draft, index)}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function configKey(config: SessionConfig): string {
  return JSON.stringify(normalizeConfig(config));
}

function NumberStepper({
  label,
  value,
  min,
  max,
  step = 1,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  const clamp = (next: number) => Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min, next));

  return (
    <label className="field">
      <span>{label}</span>
      <div className="stepper">
        <button onClick={() => onChange(clamp(value - step))} title="Decrease" type="button">
          <Minus size={16} />
        </button>
        <input
          max={max}
          min={min}
          onChange={(event) => onChange(clamp(Number(event.target.value)))}
          type="number"
          value={value}
        />
        <button onClick={() => onChange(clamp(value + step))} title="Increase" type="button">
          <Plus size={16} />
        </button>
      </div>
    </label>
  );
}
