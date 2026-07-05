import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const language = i18n.language.startsWith("en") ? "en" : "zh";

  return (
    <label className="language-switcher">
      <Languages size={18} />
      <span className="sr-only">{t("common.language")}</span>
      <select
        aria-label={t("common.language")}
        value={language}
        onChange={(event) => void i18n.changeLanguage(event.target.value)}
      >
        <option value="zh">{t("common.chinese")}</option>
        <option value="en">{t("common.english")}</option>
      </select>
    </label>
  );
}
