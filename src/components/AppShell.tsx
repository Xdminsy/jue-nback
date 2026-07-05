import { Activity, BarChart3, BrainCircuit, Database, History, SlidersHorizontal } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { InstallButton } from "./InstallButton";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useSessionStore } from "../store/sessionStore";

const navItems = [
  { to: "/train", key: "nav.train", icon: Activity },
  { to: "/settings", key: "nav.settings", icon: SlidersHorizontal },
  { to: "/stats", key: "nav.stats", icon: BarChart3 },
  { to: "/history", key: "nav.history", icon: History },
  { to: "/data", key: "nav.data", icon: Database }
];

export function AppShell() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const running = useSessionStore((state) => state.running);
  const pendingSettingsDraft = useSessionStore((state) => state.pendingSettingsDraft);
  const setConfig = useSessionStore((state) => state.setConfig);
  const trainingLocked = Boolean(running && running.phase !== "complete");
  const hasPendingSettings = location.pathname === "/settings" && Boolean(pendingSettingsDraft);

  const confirmSettingsNavigation = useCallback(() => {
    if (!hasPendingSettings || !pendingSettingsDraft) {
      return true;
    }

    if (!window.confirm(t("settings.applyBeforeLeaving"))) {
      return false;
    }

    setConfig(pendingSettingsDraft);
    return true;
  }, [hasPendingSettings, pendingSettingsDraft, setConfig, t]);

  useEffect(() => {
    if (trainingLocked && location.pathname !== "/train") {
      navigate("/train", { replace: true });
    }
  }, [location.pathname, navigate, trainingLocked]);

  useEffect(() => {
    if (!trainingLocked) {
      return;
    }

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [trainingLocked]);

  useEffect(() => {
    if (!hasPendingSettings) {
      return;
    }

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasPendingSettings]);

  return (
    <div className="app-shell">
      <header className="mobile-topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <BrainCircuit size={22} />
          </div>
          <div>
            <strong>{t("appName")}</strong>
            <span>{t("pwa.offlineReady")}</span>
          </div>
        </div>
        <div className="mobile-topbar-actions">
          <LanguageSwitcher />
          <InstallButton />
        </div>
      </header>

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <BrainCircuit size={24} />
          </div>
          <div>
            <strong>{t("appName")}</strong>
            <span>{t("pwa.offlineReady")}</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary">
          {navItems.map((item) => {
            const Icon = item.icon;
            const locked = trainingLocked && item.to !== "/train";
            return (
              <NavLink
                aria-disabled={locked}
                className={({ isActive }) => clsx("nav-link", isActive && "active", locked && "locked")}
                key={item.to}
                onClick={(event) => {
                  if (locked) {
                    event.preventDefault();
                    return;
                  }

                  if (item.to !== location.pathname && !confirmSettingsNavigation()) {
                    event.preventDefault();
                  }
                }}
                title={locked ? t("train.navigationLocked") : undefined}
                to={item.to}
              >
                <Icon size={20} />
                <span>{t(item.key)}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-actions">
          <LanguageSwitcher />
          <InstallButton />
        </div>
      </aside>

      <main className={clsx("content", location.pathname === "/train" && "train-content")}>
        <Outlet />
      </main>
    </div>
  );
}
