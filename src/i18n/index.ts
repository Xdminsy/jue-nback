import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "./locales";

const savedLanguage = typeof localStorage !== "undefined" ? localStorage.getItem("jue-language") : null;

i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage === "en" || savedLanguage === "zh" ? savedLanguage : "zh",
  fallbackLng: "zh",
  interpolation: {
    escapeValue: false
  }
});

i18n.on("languageChanged", (language) => {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("jue-language", language);
  }
  document.documentElement.lang = language === "en" ? "en" : "zh-CN";
});

export default i18n;
