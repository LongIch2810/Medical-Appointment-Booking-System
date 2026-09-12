import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import vi from "./locales/vi";
import en from "./locales/en";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from "./types";

export function getInitialLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && (SUPPORTED_LANGUAGES as readonly string[]).includes(saved)) {
      return saved as SupportedLanguage;
    }
  } catch (error) {
    console.warn("Unable to access localStorage for language:", error);
  }
  return DEFAULT_LANGUAGE;
}

export function setAppLanguage(lang: string): SupportedLanguage {
  const target: SupportedLanguage = (
    SUPPORTED_LANGUAGES as readonly string[]
  ).includes(lang)
    ? (lang as SupportedLanguage)
    : DEFAULT_LANGUAGE;

  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, target);
  } catch (error) {
    console.warn("Unable to save language preference:", error);
  }

  if (typeof document !== "undefined") {
    document.documentElement.lang = target;
  }

  void i18n.changeLanguage(target);
  return target;
}

const initialLng = getInitialLanguage();
if (typeof document !== "undefined") {
  document.documentElement.lang = initialLng;
}

void i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: vi },
    en: { translation: en },
  },
  lng: initialLng,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
export * from "./types";
