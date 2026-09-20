"use client";

import React, { useState } from "react";
import { SupportedLanguage, DocumentAnalysis } from "@/lib/schema";
import { translations } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { UploadZone } from "@/components/UploadZone";
import { SummaryTab } from "@/components/SummaryTab";
import { TodoTab } from "@/components/TodoTab";
import { DocumentsTab } from "@/components/DocumentsTab";
import { AskTab } from "@/components/AskTab";
import { UnreadableCard } from "@/components/UnreadableCard";
import {
  FileText,
  ListTodo,
  Files,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  const [language, setLanguage] = useState<SupportedLanguage>("en");
  const [activeTab, setActiveTab] = useState<"summary" | "todo" | "docs" | "ask">("summary");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [currentAnalysis, setCurrentAnalysis] = useState<DocumentAnalysis | null>(null);
  const [currentDocumentText, setCurrentDocumentText] = useState<string>("");

  const t = translations[language];

  const handleAnalyze = async ({ file, text }: { file?: File; text?: string }) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      let response: Response;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("language", language);
        if (text) formData.append("text", text);

        response = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            language,
          }),
        });
      }

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || t.errorApiFailed);
      }

      setCurrentAnalysis(resData.data);
      setCurrentDocumentText(text || resData.rawText || "");
      setActiveTab("summary");
    } catch (err: any) {
      const msg = err?.message || t.errorApiFailed;
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        setErrorMessage(t.errorOllamaOffline);
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentAnalysis(null);
    setCurrentDocumentText("");
    setErrorMessage(null);
    setActiveTab("summary");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navigation */}
      <Header language={language} onLanguageChange={setLanguage} />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {!currentAnalysis ? (
          <div className="space-y-6">
            {/* Hero Subtitle */}
            <div className="text-center max-w-2xl mx-auto mb-2 sm:mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold mb-3 border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                HackDevengers 2.0 Civic Tech
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                {t.tagline}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
                {t.subtagline}
              </p>
            </div>

            {/* Upload Area */}
            <UploadZone
              language={language}
              isLoading={isLoading}
              onAnalyze={handleAnalyze}
              error={errorMessage}
              onClearError={() => setErrorMessage(null)}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Action Bar when Analysis is Displayed */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span className="line-clamp-1 max-w-xs sm:max-w-md">
                  {currentAnalysis.issuer || "Official Notice"}
                </span>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t.changeDocButton}
              </button>
            </div>

            {/* If unreadable image */}
            {!currentAnalysis.readable ? (
              <UnreadableCard
                language={language}
                summary={currentAnalysis.summary}
                onRetake={handleReset}
              />
            ) : (
              <div>
                {/* Result Tabs Navigation */}
                <div
                  className="grid grid-cols-4 bg-slate-200/80 p-1.5 rounded-2xl gap-1 mb-6 border border-slate-300/60"
                  role="tablist"
                  aria-label="Analysis Sections"
                >
                  <button
                    type="button"
                    role="tab"
                    id="tab-summary"
                    aria-selected={activeTab === "summary"}
                    onClick={() => setActiveTab("summary")}
                    className={`py-3 px-2 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all ${
                      activeTab === "summary"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>{t.tabSummary}</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    id="tab-todo"
                    aria-selected={activeTab === "todo"}
                    onClick={() => setActiveTab("todo")}
                    className={`py-3 px-2 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all ${
                      activeTab === "todo"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <ListTodo className="w-4 h-4" />
                    <span>{t.tabTodo}</span>
                    {currentAnalysis.actions?.length > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800">
                        {currentAnalysis.actions.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    role="tab"
                    id="tab-docs"
                    aria-selected={activeTab === "docs"}
                    onClick={() => setActiveTab("docs")}
                    className={`py-3 px-2 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all ${
                      activeTab === "docs"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Files className="w-4 h-4" />
                    <span>{t.tabDocs}</span>
                    {currentAnalysis.documents_needed?.length > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800">
                        {currentAnalysis.documents_needed.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    role="tab"
                    id="tab-ask"
                    aria-selected={activeTab === "ask"}
                    onClick={() => setActiveTab("ask")}
                    className={`py-3 px-2 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all ${
                      activeTab === "ask"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{t.tabAsk}</span>
                  </button>
                </div>

                {/* Tab Panels */}
                {activeTab === "summary" && (
                  <SummaryTab analysis={currentAnalysis} language={language} />
                )}
                {activeTab === "todo" && (
                  <TodoTab analysis={currentAnalysis} language={language} />
                )}
                {activeTab === "docs" && (
                  <DocumentsTab analysis={currentAnalysis} language={language} />
                )}
                {activeTab === "ask" && (
                  <AskTab
                    analysis={currentAnalysis}
                    documentText={currentDocumentText}
                    language={language}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Persistent Legal Disclaimer & Privacy Footer */}
      <footer className="w-full bg-white border-t border-slate-200 mt-12 py-6 px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            ⚖️ {t.legalDisclaimer}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1 text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t.privacyBadge}
            </span>
            <span>•</span>
            <span>Zero databases. Zero saved history. Local Ollama AI processing.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
