import { useTranslation } from "react-i18next";
import { ChannelBadge } from "../components/ChannelBadge";
import { MetricCard } from "../components/MetricCard";
import { PageHeader } from "../components/PageHeader";
import { buildDashboardStats, type DayBucket } from "../lib/progress";
import { useSessions } from "../hooks/useSessions";
import { STIMULUS_CHANNELS } from "../types";
import { formatMinutes, formatPercent } from "../utils/format";

export function ProgressPage() {
  const { t } = useTranslation();
  const { sessions, loading } = useSessions();
  const stats = buildDashboardStats(sessions);

  return (
    <div className="page-flow">
      <PageHeader title={t("stats.title")} subtitle={t("stats.subtitle")} />

      <section className="metric-grid">
        <MetricCard label={t("common.sessions")} value={stats.totalSessions} />
        <MetricCard label={t("common.minutes")} value={formatMinutes(stats.totalMinutes)} />
        <MetricCard label={t("common.streak")} value={stats.streakDays} />
        <MetricCard label={t("common.bestN")} value={stats.bestN || "-"} />
        <MetricCard label={t("common.recommendedN")} value={stats.recommendedN} />
        <MetricCard label={t("common.accuracy")} value={formatPercent(stats.averageAccuracy)} />
      </section>

      {loading ? null : sessions.length === 0 ? (
        <section className="empty-state">{t("common.noData")}</section>
      ) : (
        <>
          <section className="panel">
            <h2>{t("stats.recentTrend")}</h2>
            <TrendChart data={stats.recentTrend} label={t("common.accuracy")} />
          </section>

          <section className="panel">
            <h2>{t("stats.heatmap")}</h2>
            <div className="heatmap">
              {stats.heatmap.map((day) => (
                <span
                  aria-label={`${day.date}: ${day.sessions}`}
                  className="heat-cell"
                  data-level={Math.min(4, day.sessions)}
                  key={day.date}
                  title={`${day.date}: ${day.sessions}`}
                />
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>{t("stats.channels")}</h2>
            <div className="channel-score-grid">
              {STIMULUS_CHANNELS.filter((channel) => stats.channelScores[channel].total > 0).map((channel) => {
                const score = stats.channelScores[channel];
                return (
                  <div className="channel-score-card" key={channel}>
                    <ChannelBadge channel={channel} />
                    <strong>{formatPercent(score.accuracy)}</strong>
                    <span>
                      {t("stats.hit")} {score.hits} / {t("stats.miss")} {score.misses} / {t("stats.falseAlarm")}{" "}
                      {score.falseAlarms}
                    </span>
                    <small>
                      {t("stats.responseMs")}:{" "}
                      {score.meanReactionMs === null ? "-" : `${Math.round(score.meanReactionMs)}ms`}
                    </small>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <h2>{t("common.sessions")}</h2>
            <SessionBars data={stats.recentTrend} label={t("common.sessions")} />
          </section>
        </>
      )}
    </div>
  );
}

function TrendChart({ data, label }: { data: DayBucket[]; label: string }) {
  const width = 320;
  const height = 160;
  const padding = 18;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const points = data.map((day, index) => {
    const x = padding + (data.length <= 1 ? 0 : (index / (data.length - 1)) * chartWidth);
    const y = padding + (1 - clamp01(day.accuracy)) * chartHeight;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const first = data[0]?.date ?? "";
  const latest = data.length > 0 ? data[data.length - 1] : undefined;
  const last = latest?.date ?? "";
  const latestAccuracy = formatPercent(latest?.accuracy ?? 0);

  return (
    <div className="chart-box simple-chart" role="img" aria-label={`${label}: ${latestAccuracy}`}>
      <svg className="chart-svg" focusable="false" preserveAspectRatio="none" viewBox={`0 0 ${width} ${height}`}>
        {[0, 0.5, 1].map((tick) => {
          const y = padding + (1 - tick) * chartHeight;
          return <line className="chart-grid-line" key={tick} x1={padding} x2={width - padding} y1={y} y2={y} />;
        })}
        <polyline className="trend-line" points={points.join(" ")} />
        {data.map((day, index) => {
          if (day.sessions === 0) {
            return null;
          }
          const x = padding + (data.length <= 1 ? 0 : (index / (data.length - 1)) * chartWidth);
          const y = padding + (1 - clamp01(day.accuracy)) * chartHeight;
          return <circle className="trend-dot" cx={x} cy={y} key={day.date} r="3.5" />;
        })}
      </svg>
      <div className="chart-axis-row">
        <span>{first}</span>
        <strong>{latestAccuracy}</strong>
        <span>{last}</span>
      </div>
    </div>
  );
}

function SessionBars({ data, label }: { data: DayBucket[]; label: string }) {
  const maxSessions = Math.max(1, ...data.map((day) => day.sessions));
  const first = data[0]?.date ?? "";
  const last = data.length > 0 ? data[data.length - 1].date : "";
  const total = data.reduce((sum, day) => sum + day.sessions, 0);

  return (
    <div className="chart-box simple-chart" role="img" aria-label={`${label}: ${total}`}>
      <div className="bar-chart">
        {data.map((day) => (
          <span className="bar-track" key={day.date} title={`${day.date}: ${day.sessions}`}>
            <span className="bar-fill" style={{ height: `${Math.max(4, (day.sessions / maxSessions) * 100)}%` }} />
          </span>
        ))}
      </div>
      <div className="chart-axis-row">
        <span>{first}</span>
        <strong>{total}</strong>
        <span>{last}</span>
      </div>
    </div>
  );
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}
