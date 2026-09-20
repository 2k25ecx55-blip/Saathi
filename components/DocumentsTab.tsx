"use client";

import React, { useState } from "react";
import { DocumentAnalysis, SupportedLanguage } from "@/lib/schema";
import { translations } from "@/lib/i18n";
import { Files, CheckSquare, Square, CheckCircle2, ShieldCheck } from "lucide-react";

interface DocumentsTabProps {
  analysis: DocumentAnalysis;
  language: SupportedLanguage;
}

export function DocumentsTab({ analysis, language }: DocumentsTabProps) {
  const t = translations[language];
  const documents = analysis.documents_needed || [];

  // React state only: items ticked by index
  const [checkedIndices, setCheckedIndices] = useState<Record<number, boolean>>({});

  const toggleCheck = (index: number) => {
    setCheckedIndices((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const checkedCount = Object.values(checkedIndices).filter(Boolean).length;
  const totalCount = documents.length;
  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Files className="w-5 h-5 text-emerald-600" />
              {t.docsTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              {t.docsSubtitle}
            </p>
          </div>

          {totalCount > 0 && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm self-start sm:self-auto">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                {checkedCount} / {totalCount} {t.checkedCount}
              </span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Checklist items */}
      {totalCount === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-600">
          <p className="text-sm sm:text-base">{t.noDocsMessage}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {documents.map((doc, idx) => {
            const isChecked = Boolean(checkedIndices[idx]);
            return (
              <label
                key={idx}
                onClick={() => toggleCheck(idx)}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                  isChecked
                    ? "bg-emerald-50/50 border-emerald-300 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                }`}
              >
                <button
                  type="button"
                  aria-checked={isChecked}
                  className="mt-0.5 text-emerald-600 flex-shrink-0"
                >
                  {isChecked ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                <div className="flex-1">
                  <span
                    className={`text-sm sm:text-base font-medium transition-all ${
                      isChecked
                        ? "line-through text-slate-400"
                        : "text-slate-900"
                    }`}
                  >
                    {doc}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      )}

      {/* Ephemeral Privacy Note */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 py-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Checklist state lives in memory only. No data is stored or logged.</span>
      </div>
    </div>
  );
}
