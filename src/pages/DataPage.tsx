import { Download, Upload } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "../components/PageHeader";
import { createExportPayload, parseSessionRecords } from "../lib/exportImport";
import { getAllSessions, importSessions } from "../lib/storage";
import { useSessions } from "../hooks/useSessions";

export function DataPage() {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { sessions, refresh } = useSessions();
  const [message, setMessage] = useState<string | null>(null);

  const exportJson = async () => {
    const payload = createExportPayload(await getAllSessions());
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `jue-nback-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const content = await file.text();
      const records = parseSessionRecords(JSON.parse(content));
      const count = await importSessions(records);
      await refresh();
      setMessage(t("data.importSuccess", { count }));
    } catch {
      setMessage(t("data.importFailure"));
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="page-flow">
      <PageHeader title={t("data.title")} subtitle={t("data.subtitle")} />

      <section className="settings-grid">
        <div className="panel data-panel">
          <p>{t("data.localOnly")}</p>
          <div className="metric-grid compact">
            <div className="metric-card">
              <span>{t("common.sessions")}</span>
              <strong>{sessions.length}</strong>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="action-row vertical">
            <button className="primary-button full-width" onClick={exportJson} type="button">
              <Download size={18} />
              {t("data.exportJson")}
            </button>
            <button className="ghost-button full-width" onClick={() => fileRef.current?.click()} type="button">
              <Upload size={18} />
              {t("data.importJson")}
            </button>
          </div>
          <input accept="application/json" hidden onChange={importJson} ref={fileRef} type="file" />
          {message ? <p className="status-message">{message}</p> : null}
        </div>
      </section>
    </div>
  );
}
