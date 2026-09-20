"use client";

import React from "react";
import { DocumentAnalysis, SupportedLanguage, ActionItem } from "@/lib/schema";
import { translations } from "@/lib/i18n";
import { formatDisplayDate } from "@/lib/dates";
import { generateIcs, downloadIcsFile } from "@/lib/ics";
import {
  Calendar,
  Download,
  AlertCircle,
  Quote,
  CheckCircle,
  Clock,
  Sparkles,
} from "lucide-react";

interface TodoTabProps {
  analysis: DocumentAnalysis;
  language: SupportedLanguage;
}

export function TodoTab({ analysis, language }: TodoTabProps) {
  const t = translations[language];
  const actions = analysis.actions || [];

  const handleExportSingle = (action: ActionItem) => {
    const icsContent = generateIcs([action], analysis.issuer, `Deadline: ${action.task}`);
    const filename = `saathi-deadline-${action.deadline.resolved_date || "task"}.ics`;
    downloadIcsFile(filename, icsContent);
  };

  const handleExportAll = () => {
    const icsContent = generateIcs(actions, analysis.issuer, "Saathi All Deadlines");
    downloadIcsFile("saathi-all-deadlines.ics", icsContent);
  };

  const hasAnyResolvedDeadline = actions.some((a) => a.deadline && a.deadline.resolved_date);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            {t.actionsTitle}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {actions.length} action item{actions.length === 1 ? "" : "s"} identified
          </p>
        </div>

        {hasAnyResolvedDeadline && (
          <button
            type="button"
            onClick={handleExportAll}
            id="download-all-ics-btn"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            {t.downloadAllIcsButton}
          </button>
        )}
      </div>

      {actions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-600">
          <p className="text-sm sm:text-base">{t.noActionsMessage}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {actions.map((action, idx) => {
            const hasResolved = Boolean(action.deadline?.resolved_date);
            const isUnresolvedRelative =
              action.deadline?.type === "relative" && !action.deadline?.resolved_date;

            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Task Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                        {action.task}
                      </h4>
                    </div>
                  </div>

                  {/* Single action calendar download */}
                  {hasResolved && (
                    <button
                      type="button"
                      onClick={() => handleExportSingle(action)}
                      title={t.addToCalendarButton}
                      className="p-2 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition-colors flex-shrink-0"
                    >
                      <Calendar className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Deadline Details */}
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Resolved Date & Original Quote */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {t.deadlineLabel}
                    </span>

                    {hasResolved ? (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-sm sm:text-base flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-emerald-600" />
                          {action.deadline.resolved_date}
                          <span className="text-xs font-normal text-emerald-700">
                            ({formatDisplayDate(action.deadline.resolved_date)})
                          </span>
                        </span>
                      </div>
                    ) : isUnresolvedRelative ? (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>{t.deadlineUnresolvedNote}</span>
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-slate-500 italic">
                        No specific deadline date stated.
                      </p>
                    )}

                    {/* ALWAYS show original quote with deadline */}
                    {action.deadline?.quote && (
                      <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 flex items-start gap-2">
                        <Quote className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-700 font-mono italic">
                          "{action.deadline.quote}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: Why It Matters */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {t.whyItMattersLabel}
                    </span>
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100">
                      {action.why_it_matters}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
