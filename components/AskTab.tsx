"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DocumentAnalysis, SupportedLanguage, ChatMessage } from "@/lib/schema";
import { translations } from "@/lib/i18n";
import {
  MessageSquare,
  Send,
  Loader2,
  ShieldCheck,
  User,
  Bot,
  AlertCircle,
  Building2,
  Phone,
} from "lucide-react";

interface AskTabProps {
  analysis: DocumentAnalysis;
  documentText?: string;
  language: SupportedLanguage;
}

export function AskTab({ analysis, documentText, language }: AskTabProps) {
  const t = translations[language];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAsking]);

  const handleSend = async (e?: React.FormEvent | React.KeyboardEvent) => {
    e?.preventDefault();
    const query = inputValue.trim();
    if (!query || isAsking) return;

    setChatError(null);
    setInputValue("");
    
    // Reset textarea height manually after clearing
    const textarea = document.getElementById("ask-question-input") as HTMLTextAreaElement;
    if (textarea) textarea.style.height = "auto";

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: query }];
    setMessages(newMessages);
    setIsAsking(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentText: documentText || analysis.summary,
          analysisSummary: analysis.summary,
          contacts: analysis.contacts,
          conversation: newMessages,
          question: query,
          language,
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
           const resData = await response.json();
           throw new Error(resData.error || "Failed to get an answer.");
        }
        throw new Error("Failed to get an answer from the server.");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder("utf-8");
      
      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
           const chunkValue = decoder.decode(value, { stream: true });
           setMessages((prev) => {
             const updated = [...prev];
             const last = { ...updated[updated.length - 1] };
             last.content += chunkValue;
             updated[updated.length - 1] = last;
             return updated;
           });
        }
      }
    } catch (err: any) {
      setChatError(err?.message || "Failed to communicate with local AI assistant.");
    } finally {
      setIsAsking(false);
    }
  };

  const sampleQuestionsMap: Record<SupportedLanguage, string[]> = {
    en: [
      "What is the penalty if I miss the deadline?",
      "Who should I contact for help?",
      "Do I have to visit in person or can I do this online?",
    ],
    hi: [
      "क्या मुझे कोई जुर्माना या पेनल्टी देनी होगी?",
      "मुझे सहायता के लिए किस नंबर पर कॉल करना चाहिए?",
      "क्या मुझे खुद दफ़्तर जाना होगा या ऑनलाइन कर सकते हैं?",
    ],
    ta: [
      "நான் ஏதேனும் அபராதம் செலுத்த வேண்டுமா?",
      "உதவிக்கு நான் யாரைத் தொடர்பு கொள்ள வேண்டும்?",
      "நான் நேரில் செல்ல வேண்டுமா அல்லது ஆன்லைனில் செய்யலாமா?",
    ],
    bn: [
      "আমাকে কি কোনো জরিমানা দিতে হবে?",
      "সাহায্যের জন্য আমি কার সাথে যোগাযোগ করব?",
      "আমাকে কি সরাসরি যেতে হবে নাকি অনলাইনে করতে পারব?",
    ],
    te: [
      "నేను ఏదైనా జరిమానా చెల్లించాలా?",
      "సహాయం కోసం నేను ఎవరిని సంప్రదించాలి?",
      "నేను స్వయంగా వెళ్లాలా లేదా ఆన్‌లైన్‌లో చేయవచ్చా?",
    ],
    mr: [
      "मला काही दंड भरावा लागेल का?",
      "मदतीसाठी मी कोणाशी संपर्क साधावा?",
      "मला प्रत्यक्ष जावे लागेल की मी ऑनलाइन करू शकतो?",
    ],
    gu: [
      "શું મારે કોઈ દંડ ભરવો પડશે?",
      "મદદ માટે મારે કોનો સંપર્ક કરવો જોઈએ?",
      "શું મારે રૂબરૂ જવું પડશે કે ઓનલાઈન કરી શકાશે?",
    ],
    kn: [
      "ನಾನು ಯಾವುದೇ ದಂಡ ಪಾವತಿಸಬೇಕೇ?",
      "ಸಹಾಯಕ್ಕಾಗಿ ನಾನು ಯಾರನ್ನು ಸಂಪರ್ಕಿಸಬೇಕು?",
      "ನಾನು ಖುದ್ದಾಗಿ ಹೋಗಬೇಕೇ ಅಥವಾ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಮಾಡಬಹುದೇ?",
    ],
    ml: [
      "ഞാൻ എന്തെങ്കിലും പിഴ അടയ്ക്കേണ്ടതുണ്ടോ?",
      "സഹായത്തിനായി ഞാൻ ആരെ ബന്ധപ്പെടണം?",
      "ഞാൻ നേരിട്ട് പോകണമോ അതോ ഓൺലൈനായി ചെയ്യാമോ?",
    ],
  };
  const sampleQuestions = sampleQuestionsMap[language] || sampleQuestionsMap.en;

  return (
    <div className="space-y-4">
      {/* Header & Grounding Guardrail Note */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              {t.askTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              {t.askSubtitle}
            </p>
          </div>
        </div>

        {/* Quick Contacts Banner */}
        {analysis.contacts && analysis.contacts.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              Contacts in letter:
            </span>
            {analysis.contacts.map((c, i) => (
              <span
                key={i}
                className="px-2.5 py-1 bg-slate-100 rounded-lg font-mono text-slate-800"
              >
                {c.label}: {c.value}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Chat Messages Log */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm min-h-[320px] max-h-[500px] overflow-y-auto flex flex-col space-y-4">
        {messages.length === 0 ? (
          <div className="my-auto text-center py-8 px-4">
            <Bot className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 font-semibold text-sm sm:text-base">
              {t.askEmptyNotice}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {t.askWarningGrounded}
            </p>

            {/* Starter chips */}
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputValue(q);
                  }}
                  className="text-xs font-medium px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 text-slate-700 transition-colors text-left"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm text-xs font-bold">
                  सा
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] p-3.5 sm:p-4 rounded-2xl text-sm sm:text-base leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                  msg.role === "user"
                    ? "bg-emerald-600 text-white rounded-br-none shadow-sm"
                    : "bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200/80 [&>p]:mb-2 last:[&>p]:mb-0 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-2 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-2 [&>h1]:font-bold [&>h2]:font-bold [&>h3]:font-bold [&>h4]:font-bold"
                }`}
              >
                {msg.role === "assistant" ? (
                  <>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                    {isAsking && index === messages.length - 1 && (
                      <span className="inline-block w-1.5 h-4 ml-1 bg-emerald-600 animate-pulse" />
                    )}
                  </>
                ) : (
                  <p className="whitespace-pre-line">{msg.content}</p>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {isAsking && (
          <div className="flex gap-3 items-center text-slate-500 text-sm">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
              सा
            </div>
            <div className="p-3 bg-slate-100 rounded-2xl flex items-center gap-2 text-xs sm:text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Consulting document details...</span>
            </div>
          </div>
        )}

        {chatError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{chatError}</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="flex gap-2">
        <textarea
          id="ask-question-input"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
          placeholder={t.askPlaceholder}
          disabled={isAsking}
          rows={1}
          style={{ resize: "none", minHeight: "48px", maxHeight: "150px" }}
          className="flex-1 p-3 sm:p-3.5 rounded-xl border border-slate-300 text-slate-900 text-sm sm:text-base bg-white focus:border-emerald-600 shadow-sm transition-colors disabled:opacity-50 overflow-y-auto"
        />
        <button
          type="submit"
          id="ask-question-submit"
          disabled={!inputValue.trim() || isAsking}
          className="px-5 sm:px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm sm:text-base shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAsking ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span className="hidden sm:inline">{t.askSendButton}</span>
              <Send className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
