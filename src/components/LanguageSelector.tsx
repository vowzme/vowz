import { useState } from "react";
import { Globe, ChevronDown } from "lucide-react";

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "ta", name: "தமிழ்", flag: "🇮🇳" },
  { code: "te", name: "తెలుగు", flag: "🇮🇳" },
  { code: "ml", name: "മലയാളം", flag: "🇮🇳" },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]["code"];

interface LanguageSelectorProps {
  currentLang: LanguageCode;
  availableLanguages: LanguageCode[];
  onLanguageChange: (lang: LanguageCode) => void;
  accent?: string;
}

export default function LanguageSelector({ currentLang, availableLanguages, onLanguageChange, accent }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const langs = SUPPORTED_LANGUAGES.filter((l) => availableLanguages.includes(l.code));
  const current = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  if (langs.length <= 1) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-medium border border-border/50 bg-card/80 backdrop-blur-sm hover:bg-card transition-colors"
        style={{ color: accent }}
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{current.flag} {current.name}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 bg-card border border-border/50 rounded-lg shadow-lg z-50 overflow-hidden min-w-[140px]">
            {langs.map((lang) => (
              <button
                key={lang.code}
                onClick={() => { onLanguageChange(lang.code); setOpen(false); }}
                className={`w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center gap-2 text-xs font-body ${
                  lang.code === currentLang ? "bg-muted font-semibold" : ""
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
