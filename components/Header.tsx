"use client";

import React from "react";
import { SupportedLanguage } from "@/lib/schema";
import { translations } from "@/lib/i18n";
import { ShieldCheck, Sparkles } from "lucide-react";

interface HeaderProps {
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
}

export function Header({ language, onLanguageChange }: HeaderProps) {
  const t = translations[language];

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
            सा
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                {t.appName}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Local AI
              </span>
            </div>
            <p className="text-xs text-slate-600 line-clamp-1 max-w-md hidden md:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Right side: Privacy Badge & Language Switch */}
        <div className="flex items-center gap-3 ml-auto">
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{t.privacyBadge}</span>
          </div>

          {/* Language Switch */}
          <div
            className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200"
            role="group"
            aria-label="Select Language"
          >
            {Object.entries({
              en: "English",
              hi: "हिन्दी",
              ta: "தமிழ்",
              bn: "বাংলা",
              te: "తెలుగు",
              mr: "मराठी",
              gu: "ગુજરાતી",
              kn: "ಕನ್ನಡ",
              ml: "മലയാളം"
            }).map(([code, label]) => (
              <button
                key={code}
                type="button"
                id={`lang-btn-${code}`}
                onClick={() => onLanguageChange(code as SupportedLanguage)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  language === code
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
