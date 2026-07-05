import { Component, lazy, Suspense, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { TrainPage } from "./pages/TrainPage";

const SettingsPage = lazy(() => import("./pages/SettingsPage").then((module) => ({ default: module.SettingsPage })));
const StatsPage = lazy(() => import("./pages/StatsPage").then((module) => ({ default: module.StatsPage })));
const HistoryPage = lazy(() => import("./pages/HistoryPage").then((module) => ({ default: module.HistoryPage })));
const DataPage = lazy(() => import("./pages/DataPage").then((module) => ({ default: module.DataPage })));

function RouteLoading() {
  const { t } = useTranslation();
  return (
    <div className="route-loading" role="status">
      {t("common.loading")}
    </div>
  );
}

function RouteErrorFallback() {
  const { t } = useTranslation();
  return (
    <section className="empty-state route-error" role="alert">
      <p>{t("common.routeError")}</p>
      <button className="ghost-button" onClick={() => window.location.reload()} type="button">
        {t("common.reload")}
      </button>
    </section>
  );
}

class RouteErrorBoundary extends Component<{ children: ReactNode; resetKey: string }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(previousProps: { resetKey: string }) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (this.state.failed) {
      return <RouteErrorFallback />;
    }

    return this.props.children;
  }
}

function SafeRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <RouteErrorBoundary resetKey={location.pathname}>
      <Suspense fallback={<RouteLoading />}>{children}</Suspense>
    </RouteErrorBoundary>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/train" replace />} />
          <Route path="/train" element={<TrainPage />} />
          <Route
            path="/settings"
            element={
              <SafeRoute>
                <SettingsPage />
              </SafeRoute>
            }
          />
          <Route
            path="/stats"
            element={
              <SafeRoute>
                <StatsPage />
              </SafeRoute>
            }
          />
          <Route
            path="/history"
            element={
              <SafeRoute>
                <HistoryPage />
              </SafeRoute>
            }
          />
          <Route
            path="/data"
            element={
              <SafeRoute>
                <DataPage />
              </SafeRoute>
            }
          />
        </Route>
      </Routes>
    </HashRouter>
  );
}
