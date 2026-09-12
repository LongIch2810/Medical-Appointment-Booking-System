export const SUPPORTED_LANGUAGES = ["vi", "en"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "vi";
export const LANGUAGE_STORAGE_KEY = "lifehealth_language";

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  shortLabel: string;
  nativeName: string;
  locale: string;
}

export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  {
    code: "vi",
    label: "Tiếng Việt",
    shortLabel: "VI",
    nativeName: "Tiếng Việt",
    locale: "vi-VN",
  },
  {
    code: "en",
    label: "English",
    shortLabel: "EN",
    nativeName: "English",
    locale: "en-US",
  },
] as const;
