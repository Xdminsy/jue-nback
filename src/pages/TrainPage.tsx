import { RotateCcw, Save, Zap } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ChannelBadge } from "../components/ChannelBadge";
import { MetricCard } from "../components/MetricCard";
import { PageHeader } from "../components/PageHeader";
import { ResponseButtons } from "../components/ResponseButtons";
import { VisualStimulus } from "../components/VisualStimulus";
import { getPreset } from "../lib/channels";
import { playStimulusAudio, primeAudio } from "../lib/audio";
import { keyboardEventMatchesResponseKey, responseKeyAt } from "../lib/responseKeys";
import { saveSession } from "../lib/storage";
import { useSessionStore } from "../store/sessionStore";
import type { StimulusChannel } from "../types";
import { formatDuration, formatPercent } from "../utils/format";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
}

export function TrainPage() {
  const { t } = useTranslation();
  const {
    config,
    running,
    startSession,
    recordResponse,
    showResponseWindow,
    advanceTrial,
    resetSession,
    markSaved
  } = useSessionStore();
  const savingRef = useRef(false);
  const playedAudioKeyRef = useRef<string | null>(null);
  const trial = running ? running.trials[running.currentIndex] : null;
  const preset = getPreset(config.modeName);
  const currentResponse = running?.responses.find((item) => item.trialIndex === running.currentIndex);

  useEffect(() => {
    if (!running || !trial || running.phase !== "stimulus") {
      return;
    }

    const audioKey = `${running.id}:${running.currentIndex}`;
    if (playedAudioKeyRef.current === audioKey) {
      return;
    }

    playedAudioKeyRef.current = audioKey;
    playStimulusAudio(trial, config);
  }, [config, running?.currentIndex, running?.id, running?.phase, trial]);

  useEffect(() => {
    if (!running || !trial || running.phase === "complete") {
      return;
    }

    const delay = running.phase === "stimulus" ? config.stimulusMs : config.responseMs;
    const next = running.phase === "stimulus" ? showResponseWindow : advanceTrial;
    const timer = window.setTimeout(next, delay);
    return () => window.clearTimeout(timer);
  }, [
    advanceTrial,
    config.responseMs,
    config.stimulusMs,
    running?.currentIndex,
    running?.id,
    running?.phase,
    showResponseWindow,
    trial
  ]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!running || running.phase === "complete" || event.repeat || isEditableTarget(event.target)) {
        return;
      }

      const channel = config.channels.find((item, index) =>
        keyboardEventMatchesResponseKey(event, responseKeyAt(config, index))
      );

      if (channel) {
        event.preventDefault();
        recordResponse(channel);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [config, recordResponse, running?.phase]);

  useEffect(() => {
    if (!running?.summary || running.saved || savingRef.current) {
      return;
    }

    savingRef.current = true;
    void saveSession(running.summary).then(() => {
      markSaved();
      savingRef.current = false;
    });
  }, [markSaved, running?.saved, running?.summary]);

  const start = async () => {
    await primeAudio();
    startSession();
  };

  const canRespond = Boolean(running && running.phase !== "complete");
  const current = running ? running.currentIndex + 1 : 0;
  const total = running?.trials.length ?? config.trials;
  const modeLabel = preset ? t(preset.labelKey) : config.modeName;
  const trialLabel = running ? t("train.trial", { current, total }) : modeLabel;
  const compactTrialLabel = running ? t("train.trialShort", { current, total }) : modeLabel;
  const sessionActionLabel = running?.phase === "complete" ? t("train.newSession") : t("train.startSession");
  const compactSessionActionLabel = running?.phase === "complete" ? t("train.newSessionShort") : t("common.start");

  return (
    <div className="page-flow train-page">
      <PageHeader title={t("train.title")} subtitle={t("train.subtitle")} />

      <section className="training-layout">
        <div className="training-main">
          <div className="session-toolbar">
            <div>
              <strong>{t("train.currentConfig")}</strong>
              <div className="channel-row">
                {config.channels.map((channel) => (
                  <ChannelBadge channel={channel} compact key={channel} />
                ))}
              </div>
            </div>
            <div className="toolbar-actions">
              <span className="pill">{t("train.nBack", { n: config.n })}</span>
              <span className="pill">{config.adaptive ? t("common.adaptive") : t("common.fixed")}</span>
            </div>
          </div>

          <div className="practice-area">
            <VisualStimulus channels={config.channels} trial={trial} active={running?.phase === "stimulus"} />

            <div className="practice-controls">
              <div className="trial-status">
                <span className="trial-label trial-label-full">{trialLabel}</span>
                <span className="trial-label trial-label-compact">{compactTrialLabel}</span>
                <strong>
                  {running?.phase === "stimulus"
                    ? t("common.stimulus")
                    : running?.phase === "response"
                      ? t("train.waiting")
                      : running?.phase === "complete"
                        ? t("common.complete")
                    : t("common.ready")}
                </strong>
              </div>

              <div className="action-row session-action">
                {!running || running.phase === "complete" ? (
                  <button className="primary-button" onClick={start} type="button">
                    <Zap size={18} />
                    <span className="desktop-label">{sessionActionLabel}</span>
                    <span className="mobile-label">{compactSessionActionLabel}</span>
                  </button>
                ) : (
                  <button className="ghost-button" onClick={resetSession} type="button">
                    <RotateCcw size={18} />
                    {t("common.stop")}
                  </button>
                )}
              </div>

              <ResponseButtons
                answeredChannels={currentResponse?.responses}
                channels={config.channels}
                disabled={!canRespond}
                onRespond={recordResponse}
                responseKeys={config.responseKeys}
              />

              <p className="hint-text">{t("train.hitButtons")}</p>
            </div>
          </div>
        </div>

        <aside className="training-side">
          {running?.summary ? (
            <SessionResult channels={config.channels} saved={running.saved} />
          ) : (
            <>
              <MetricCard label={t("settings.trials")} value={config.trials} />
              <MetricCard label={t("settings.matchRate")} value={formatPercent(config.matchRate)} />
              <MetricCard
                label={t("settings.stimulusMs")}
                value={`${config.stimulusMs}ms`}
                detail={`${config.responseMs}ms ${t("common.response")}`}
              />
            </>
          )}
        </aside>
      </section>
    </div>
  );
}

function SessionResult({ channels, saved }: { channels: StimulusChannel[]; saved: boolean }) {
  const { t } = useTranslation();
  const summary = useSessionStore((state) => state.running?.summary);

  if (!summary) {
    return null;
  }

  return (
    <section className="result-panel">
      <div className="result-heading">
        <div>
          <span>{t("train.score")}</span>
          <strong>{formatPercent(summary.overallAccuracy)}</strong>
        </div>
        {saved ? (
          <span className="saved-indicator">
            <Save size={16} />
            {t("train.saved")}
          </span>
        ) : null}
      </div>

      <div className="metric-grid compact">
        <MetricCard label={t("common.bestN")} value={summary.nBefore} detail={`${summary.nBefore} -> ${summary.nAfter}`} />
        <MetricCard label={t("common.minutes")} value={formatDuration(summary.durationMs)} />
      </div>

      <div className="score-list">
        {channels.map((channel) => {
          const score = summary.scoreByChannel[channel];
          return (
            <div className="score-row" key={channel}>
              <ChannelBadge channel={channel} compact />
              <span>{formatPercent(score.accuracy)}</span>
              <small>
                {t("stats.hit")} {score.hits} / {t("stats.falseAlarm")} {score.falseAlarms}
              </small>
            </div>
          );
        })}
      </div>
    </section>
  );
}
