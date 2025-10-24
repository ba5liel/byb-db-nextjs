import enTranslations from "@/locales/en.json"
import amTranslations from "@/locales/am.json"

export type Translations = typeof enTranslations

export const translations: Record<"en" | "am", Translations> = {
  en: enTranslations,
  am: amTranslations,
}

export function getTranslation(locale: "en" | "am") {
  return translations[locale] || translations.en
}

// Helper function to get nested translation
export function t(translations: Translations, key: string): string {
  const keys = key.split(".")
  let value: any = translations

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k]
    } else {
      return key // Return key if translation not found
    }
  }

  return typeof value === "string" ? value : key
}

