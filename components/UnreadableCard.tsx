"use client";

import React from "react";
import { SupportedLanguage } from "@/lib/schema";
import { translations } from "@/lib/i18n";
import { Camera, SunMedium, MoveHorizontal, RotateCcw } from "lucide-react";

interface UnreadableCardProps {
  language: SupportedLanguage;
  summary?: string;
  onRetake: () => void;
}

export function UnreadableCard({
  language,
  summary,
  onRetake,
}: UnreadableCardProps) {
  const t = translations[language];

  return (
    <div className="bg-white rounded-2xl border border-amber-200 shadow-md p-6 sm:p-8 text-center max-w-xl mx-auto">
      <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
        <Camera className="w-8 h-8" />
      </div>

      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
        {t.unreadableTitle}
      </h3>

      <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
        {summary || t.unreadableMessage}
      </p>

      {/* Photography Tips */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-left text-xs sm:text-sm text-slate-700 space-y-2 mb-6">
        <p className="font-bold text-amber-900">Tips for a clear scan:</p>
        <div className="flex items-center gap-2">
          <SunMedium className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>Use bright, indirect lighting so shadows don't cover text.</span>
        </div>
        <div className="flex items-center gap-2">
          <MoveHorizontal className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>Lay the paper flat on a dark or contrasting table.</span>
        </div>
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>Hold your phone directly above the document and ensure text is in sharp focus.</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onRetake}
        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base shadow-sm transition-all inline-flex items-center justify-center gap-2"
      >
        <RotateCcw className="w-4 h-4" />
        {t.retakeButton}
      </button>
    </div>
  );
}
