"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

// Supported languages
export type Language = "en" | "fr" | "nl"

export const LANGUAGES = [
  { code: "en" as const, name: "English", flag: "🇺🇸" },
  { code: "fr" as const, name: "Français", flag: "🇫🇷" },
  { code: "nl" as const, name: "Nederlands", flag: "🇳🇱" }
] as const

// Translation context type
interface TranslationContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string, fallback?: string) => string
  translations: Record<string, any>
}

// Create the context
const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

// Translation provider component
interface TranslationProviderProps {
  children: ReactNode
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const [language, setLanguage] = useState<Language>("en")
  const [translations, setTranslations] = useState<Record<string, any>>({})

  // Load translations for the current language
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const translationModule = await import(`@/locales/${language}.json`)
        setTranslations(translationModule.default || translationModule)
      } catch (error) {
        console.error(`Failed to load translations for language: ${language}`, error)
        // Fallback to English if loading fails
        if (language !== "en") {
          try {
            const fallbackModule = await import(`@/locales/en.json`)
            setTranslations(fallbackModule.default || fallbackModule)
          } catch (fallbackError) {
            console.error("Failed to load fallback translations", fallbackError)
          }
        }
      }
    }

    loadTranslations()
  }, [language])

  // Load saved language preference on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("app-language") as Language
    if (savedLanguage && LANGUAGES.some(lang => lang.code === savedLanguage)) {
      setLanguage(savedLanguage)
    }
  }, [])

  // Save language preference when it changes
  const handleSetLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage)
    localStorage.setItem("app-language", newLanguage)
  }

  // Translation function with nested key support (e.g., "common.name")
  const t = (key: string, fallback?: string): string => {
    const keys = key.split(".")
    let value = translations

    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) break
    }

    if (typeof value === "string") {
      return value
    }

    // Return fallback or key if translation not found
    return fallback || key
  }

  const contextValue: TranslationContextType = {
    language,
    setLanguage: handleSetLanguage,
    t,
    translations
  }

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  )
}

// Custom hook to use translations
export function useTranslation() {
  const context = useContext(TranslationContext)
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider")
  }
  return context
}