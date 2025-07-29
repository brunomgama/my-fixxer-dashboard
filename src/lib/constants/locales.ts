export const LOCALES = [
    {
      label: "French",
      code: "FR",
      flag: "🇫🇷",
    },
    {
      label: "Dutch",
      code: "NL",
      flag: "🇳🇱",
    },
  ] as const
  
  export type LocaleCode = (typeof LOCALES)[number]["code"]