import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function InstallButton() {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt) {
    return null;
  }

  return (
    <button
      aria-label={t("pwa.install")}
      className="ghost-button full-width"
      onClick={async () => {
        await prompt.prompt();
        setPrompt(null);
      }}
      type="button"
    >
      <Download size={18} />
      {t("pwa.install")}
    </button>
  );
}
