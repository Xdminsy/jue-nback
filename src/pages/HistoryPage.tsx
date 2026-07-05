import { useTranslation } from "react-i18next";
import { ChannelBadge } from "../components/ChannelBadge";
import { PageHeader } from "../components/PageHeader";
import { getPreset } from "../lib/channels";
import { useSessions } from "../hooks/useSessions";
import { formatDateTime, formatDuration, formatPercent } from "../utils/format";

export function HistoryPage() {
  const { t, i18n } = useTranslation();
  const { sessions, loading } = useSessions();

  return (
    <div className="page-flow">
      <PageHeader title={t("history.title")} subtitle={t("history.subtitle")} />

      {loading ? null : sessions.length === 0 ? (
        <section className="empty-state">{t("common.noData")}</section>
      ) : (
        <section className="panel overflow-panel">
          <table className="history-table">
            <thead>
              <tr>
                <th>{t("history.date")}</th>
                <th>{t("history.mode")}</th>
                <th>{t("common.accuracy")}</th>
                <th>{t("history.change")}</th>
                <th>{t("history.duration")}</th>
                <th>{t("history.channels")}</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => {
                const preset = getPreset(session.config.modeName);
                return (
                  <tr key={session.id}>
                    <td>{formatDateTime(session.startedAt, i18n.language)}</td>
                    <td>{preset ? t(preset.labelKey) : session.config.modeName}</td>
                    <td>{formatPercent(session.overallAccuracy)}</td>
                    <td>
                      {session.nBefore}
                      {" -> "}
                      {session.nAfter}
                    </td>
                    <td>{formatDuration(session.durationMs)}</td>
                    <td>
                      <div className="channel-row">
                        {session.config.channels.map((channel) => (
                          <ChannelBadge channel={channel} compact key={channel} />
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
