import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./i18n";
import "./styles.css";

async function clearDevServiceWorker() {
  try {
    if (!("serviceWorker" in navigator) || typeof navigator.serviceWorker.getRegistrations !== "function") {
      return;
    }

    const wasControlled = Boolean(navigator.serviceWorker.controller);
    const registrations = await navigator.serviceWorker.getRegistrations();
    const cacheKeys = "caches" in window && typeof window.caches.keys === "function" ? await window.caches.keys() : [];

    await Promise.all(registrations.map((registration) => registration.unregister()));
    await Promise.all(
      cacheKeys
        .filter((key) => /jue-nback|workbox|vite-pwa/i.test(key))
        .map((key) => window.caches.delete(key))
    );

    if (wasControlled && registrations.length > 0 && window.sessionStorage.getItem("jue-nback-dev-sw-cleared") !== "1") {
      window.sessionStorage.setItem("jue-nback-dev-sw-cleared", "1");
      window.location.reload();
    }
  } catch {
    // Dev-only cleanup must never block app startup on partial WebView implementations.
  }
}

if (import.meta.env.DEV) {
  void clearDevServiceWorker();
} else {
  registerSW({ immediate: true });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
