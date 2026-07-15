"use client";

import { Language, TranslationKey, TranslationParams, translate } from "@/lib/translations";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

const LANGUAGE_STORAGE_KEY = "seatflow.language.v1";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Start with the default so server render and first client render match (no hydration
  // mismatch); the stored preference is applied in an effect once mounted.
  const [language, setLanguageState] = useState<Language>("hu");

  useEffect(() => {
    // Read the persisted preference only after mount so server render and the first client
    // render agree on "hu" (no hydration mismatch), then switch to the stored value.
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "en" || stored === "hu") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) => translate(language, key, params),
    [language]
  );

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
