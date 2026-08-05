import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ru from "./locales/ru/translation.json";

i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
  },
  lng: "ru",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

async function loadLocale(lng: string) {
  if (i18n.hasResourceBundle(lng, "translation")) return;
  try {
    const mod = await import("./locales/en/translation.json");
    i18n.addResourceBundle(lng, "translation", mod.default, true, true);
    if (i18n.language === lng) i18n.emit("loaded", lng);
  } catch {
    // не критично: останется fallback
  }
}

i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
  void loadLocale(lng);
});

export default i18n;
