"use client";

import React, { useState, useEffect } from "react";
import { DocumentAnalysis, SupportedLanguage } from "@/lib/schema";
import { translations } from "@/lib/i18n";
import { formatDisplayDate } from "@/lib/dates";
import {
  Volume2,
  VolumeX,
  AlertTriangle,
  Building2,
  Calendar,
  ShieldAlert,
  Phone,
  HelpCircle,
  Clock,
  Info,
} from "lucide-react";

interface SummaryTabProps {
  analysis: DocumentAnalysis;
  language: SupportedLanguage;
}

export function SummaryTab({ analysis, language }: SummaryTabProps) {
  const t = translations[language];
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  // Stop speech synthesis when unmounting or switching
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleVoice = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setVoiceNotice(t.voiceUnsupported);
      return;
    }

    if (isPlayingVoice) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
      return;
    }

    setVoiceNotice(null);
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(analysis.summary);

    // Map language code to BCP 47 tags with Indian localization
    const langTagMap: Record<SupportedLanguage, string> = {
      en: "en-IN",
      hi: "hi-IN",
      ta: "ta-IN",
    };

    const targetTag = langTagMap[language] || "en-IN";
    utterance.lang = targetTag;
    utterance.rate = 0.95; // Slightly calmer, clearer pace for comprehension

    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(
      (v) =>
        v.lang.toLowerCase() === targetTag.toLowerCase() ||
        v.lang.toLowerCase().startsWith(language)
    );

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    } else if (language !== "en") {
      // If Hindi or Tamil voice isn't installed in the OS, notify gracefully
      setVoiceNotice(t.voiceUnavailable);
    }

    utterance.onend = () => setIsPlayingVoice(false);
    utterance.onerror = () => setIsPlayingVoice(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingVoice(true);
  };

  const urgencyStyles = {
    high: {
      bg: "bg-rose-50 border-rose-200 text-rose-800",
      badge: "bg-rose-600 text-white",
      icon: <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />,
      label: t.urgencyHigh,
    },
    medium: {
      bg: "bg-amber-50 border-amber-200 text-amber-900",
      badge: "bg-amber-500 text-white",
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
      label: t.urgencyMedium,
    },
    low: {
      bg: "bg-emerald-50 border-emerald-200 text-emerald-900",
      badge: "bg-emerald-600 text-white",
      icon: <Clock className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
      label: t.urgencyLow,
    },
  }[analysis.urgency || "medium"];

  const docTypeNames: Record<string, string> = {
    govt_notice: "Government Notice",
    bank_letter: "Bank / Loan Letter",
    insurance_letter: "Insurance Document",
    other: "Official Communication",
  };

  return (
    <div className="space-y-6">
      {/* Top Meta Bar & Urgency Banner */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${urgencyStyles.bg}`}
      >
        <div className="flex items-center gap-3">
          {urgencyStyles.icon}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider opacity-75">
              {t.urgencyLabel}
            </span>
            <p className="text-base sm:text-lg font-bold">{urgencyStyles.label}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
          <span className="px-3 py-1 rounded-full bg-white/80 font-semibold border border-slate-200 shadow-sm text-slate-800 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-600" />
            {docTypeNames[analysis.doc_type] || analysis.doc_type}
          </span>
          {analysis.notice_date && (
            <span className="px-3 py-1 rounded-full bg-white/80 font-semibold border border-slate-200 shadow-sm text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-600" />
              {t.noticeDateLabel}: {formatDisplayDate(analysis.notice_date)}
            </span>
          )}
        </div>
      </div>

      {/* Issuing Authority */}
      {analysis.issuer && (
        <div className="bg-slate-100/70 border border-slate-200/80 rounded-xl px-4 py-3 flex items-center gap-2.5 text-slate-800 text-sm">
          <Building2 className="w-4 h-4 text-slate-600 flex-shrink-0" />
          <span className="font-medium text-slate-500">{t.issuerLabel}:</span>
          <span className="font-bold">{analysis.issuer}</span>
        </div>
      )}

      {/* Plain Language Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Info className="w-5 h-5 text-emerald-600" />
            {t.plainSummaryTitle}
          </h3>

          {/* Voice Readout Button */}
          <button
            type="button"
            onClick={handleToggleVoice}
            id="voice-readout-toggle"
            className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              isPlayingVoice
                ? "bg-rose-600 text-white shadow-md animate-pulse"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
            }`}
          >
            {isPlayingVoice ? (
              <>
                <VolumeX className="w-4 h-4" />
                {t.voiceStopButton}
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-700" />
                {t.voiceReadoutButton}
              </>
            )}
          </button>
        </div>

        {voiceNotice && (
          <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg mb-3 border border-amber-200">
            {voiceNotice}
          </p>
        )}

        <p className="text-slate-800 text-base sm:text-lg leading-relaxed font-normal whitespace-pre-line">
          {analysis.summary}
        </p>
      </div>

      {/* "If you ignore this" note (only if stated or clearly implied) */}
      {analysis.if_ignored && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5 sm:p-6 text-slate-900">
          <h4 className="text-base sm:text-lg font-bold text-rose-900 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            {t.ifIgnoredTitle}
          </h4>
          <p className="text-sm sm:text-base text-rose-950 font-medium leading-relaxed">
            {analysis.if_ignored}
          </p>
        </div>
      )}

      {/* Official Contacts */}
      {analysis.contacts && analysis.contacts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <h4 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Phone className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            {t.contactsTitle}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {analysis.contacts.map((contact, idx) => (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-center"
              >
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {contact.label}
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-900 break-all select-all mt-0.5">
                  {contact.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unclear Points (what the letter doesn't specify) */}
      {analysis.unclear_points && analysis.unclear_points.length > 0 && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 sm:p-6">
          <h4 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
            <HelpCircle className="w-5 h-5 text-slate-500 flex-shrink-0" />
            {t.unclearPointsTitle}
          </h4>
          <ul className="space-y-2">
            {analysis.unclear_points.map((point, idx) => (
              <li
                key={idx}
                className="text-xs sm:text-sm text-slate-700 flex items-start gap-2"
              >
                <span className="text-slate-400 font-bold">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
