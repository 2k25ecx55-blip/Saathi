"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { SupportedLanguage } from "@/lib/schema";
import { translations } from "@/lib/i18n";
import { SAMPLE_LETTERS, SampleLetter } from "@/lib/sampleLetters";
import {
  Upload,
  Camera,
  FileText,
  FileUp,
  AlertCircle,
  Loader2,
  Sparkles,
  CheckCircle2,
  X,
  FlipHorizontal,
  RotateCcw,
} from "lucide-react";

interface UploadZoneProps {
  language: SupportedLanguage;
  isLoading: boolean;
  onAnalyze: (payload: { file?: File; text?: string }) => void;
  error?: string | null;
  onClearError?: () => void;
}

type CameraError = "denied" | "not-found" | "unknown" | null;

export function UploadZone({
  language,
  isLoading,
  onAnalyze,
  error,
  onClearError,
}: UploadZoneProps) {
  const t = translations[language];
  const [activeInputTab, setActiveInputTab] = useState<"file" | "paste">("file");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<CameraError>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((tr) => tr.stop());
      }
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const startCamera = useCallback(async (mode: "environment" | "user" = "environment") => {
    stopCamera();
    setCapturedPreview(null);
    setCameraError(null);
    setIsCameraLoading(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      const name = err?.name || "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setCameraError("denied");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setCameraError("not-found");
      } else {
        setCameraError("unknown");
      }
    } finally {
      setIsCameraLoading(false);
    }
  }, [stopCamera]);

  const flipCamera = useCallback(() => {
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);
    startCamera(newMode);
  }, [facingMode, startCamera]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const previewUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedPreview(previewUrl);
    stopCamera();

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `saathi-capture-${Date.now()}.jpg`, { type: "image/jpeg" });
        handleFileChange(file);
      },
      "image/jpeg",
      0.92
    );
  }, [facingMode, stopCamera]);

  const handleFileChange = (file: File | null) => {
    setValidationError(null);
    onClearError?.();

    if (!file) { setSelectedFile(null); return; }

    if (file.size > 5 * 1024 * 1024) {
      setValidationError(t.errorFileTooLarge);
      setSelectedFile(null);
      return;
    }

    const type = file.type.toLowerCase();
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg", "application/pdf"];
    if (!validTypes.includes(type) && !file.name.match(/\.(jpg|jpeg|png|webp|pdf)$/i)) {
      setValidationError(t.errorInvalidFormat);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (activeInputTab === "file") {
      if (!selectedFile) { setValidationError("Please select or capture an image or PDF file."); return; }
      onAnalyze({ file: selectedFile });
    } else {
      if (!pastedText.trim()) { setValidationError("Please paste the text of your letter."); return; }
      onAnalyze({ text: pastedText.trim() });
    }
  };

  const handleLoadSample = (sample: SampleLetter) => {
    setActiveInputTab("paste");
    setPastedText(sample.text);
    setSelectedFile(null);
    setValidationError(null);
    onClearError?.();
    onAnalyze({ text: sample.text });
  };

  const resetCamera = () => {
    stopCamera();
    setCapturedPreview(null);
    setCameraError(null);
    setSelectedFile(null);
  };

  const showCameraUI = (isCameraActive || isCameraLoading || cameraError !== null) && !capturedPreview;

  return (
    <section className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7">
      <div className="text-center max-w-2xl mx-auto mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{t.uploadTitle}</h2>
        <p className="text-sm text-slate-600 mt-1.5">{t.uploadSubtitle}</p>
      </div>

      {/* Quick Sample Selector */}
      <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          {t.trySampleButton}:
        </span>
        {SAMPLE_LETTERS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => handleLoadSample(s)}
            disabled={isLoading}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 text-slate-700 transition-colors disabled:opacity-50"
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-5">
        <button
          type="button"
          onClick={() => { setActiveInputTab("file"); setValidationError(null); resetCamera(); }}
          className={`pb-3 px-4 font-semibold text-sm sm:text-base border-b-2 transition-all flex items-center gap-2 ${
            activeInputTab === "file" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileUp className="w-4 h-4" />
          {t.fileTabTitle}
        </button>
        <button
          type="button"
          onClick={() => { setActiveInputTab("paste"); setValidationError(null); resetCamera(); }}
          className={`pb-3 px-4 font-semibold text-sm sm:text-base border-b-2 transition-all flex items-center gap-2 ${
            activeInputTab === "paste" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          {t.pasteTabTitle}
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {activeInputTab === "file" ? (
          <div>
            {/* Hidden canvas for frame capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* ─── Live Camera Viewfinder ─── */}
            {showCameraUI && (
              <div className="relative rounded-xl overflow-hidden bg-black border-2 border-emerald-500 shadow-lg min-h-[280px]">
                {/* Loading */}
                {isCameraLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
                    <p className="text-white text-sm font-medium">Starting camera…</p>
                  </div>
                )}

                {/* Error state */}
                {cameraError && !isCameraLoading && (
                  <div className="flex flex-col items-center justify-center p-8 gap-4 min-h-[280px]">
                    <AlertCircle className="w-12 h-12 text-rose-400" />
                    <div className="text-center">
                      <p className="text-white font-bold text-base">
                        {cameraError === "denied" ? "Camera Permission Denied"
                          : cameraError === "not-found" ? "No Camera Found"
                          : "Camera Unavailable"}
                      </p>
                      <p className="text-slate-400 text-sm mt-1 max-w-xs">
                        {cameraError === "denied"
                          ? "Please allow camera access in your browser settings and try again."
                          : cameraError === "not-found"
                          ? "No camera was detected on this device. Try uploading a file instead."
                          : "Could not start the camera. Please try again or upload a file."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={resetCamera}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                      <X className="w-4 h-4" /> Close
                    </button>
                  </div>
                )}

                {/* Live video feed */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
                  className={`w-full max-h-[420px] object-cover ${!isCameraActive || isCameraLoading ? "hidden" : ""}`}
                />

                {/* Camera controls */}
                {isCameraActive && !isCameraLoading && (
                  <div className="absolute inset-x-0 bottom-0 pb-5 pt-6 flex items-center justify-center gap-6 bg-gradient-to-t from-black/70 to-transparent">
                    <button
                      type="button"
                      onClick={resetCamera}
                      title="Close camera"
                      className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    {/* Shutter */}
                    <button
                      type="button"
                      onClick={capturePhoto}
                      title="Capture photo"
                      className="w-18 h-18 rounded-full bg-white border-[5px] border-emerald-500 hover:scale-105 active:scale-95 transition-transform shadow-2xl flex items-center justify-center"
                      style={{ width: "4.5rem", height: "4.5rem" }}
                    >
                      <Camera className="w-7 h-7 text-emerald-700" />
                    </button>
                    <button
                      type="button"
                      onClick={flipCamera}
                      title="Switch camera"
                      className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                    >
                      <FlipHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ─── Captured Photo Preview ─── */}
            {capturedPreview && (
              <div className="relative rounded-xl overflow-hidden border-2 border-emerald-400 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={capturedPreview}
                  alt="Captured letter"
                  className="w-full max-h-[400px] object-contain bg-black"
                />
                <div className="absolute inset-x-0 bottom-0 pb-4 pt-3 flex items-center justify-center gap-3 bg-gradient-to-t from-black/60 to-transparent">
                  <button
                    type="button"
                    onClick={() => { resetCamera(); startCamera(facingMode); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" /> Retake
                  </button>
                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600/90 text-white text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Ready to analyze
                  </div>
                </div>
              </div>
            )}

            {/* ─── Default Drop Zone (no camera UI) ─── */}
            {!showCameraUI && !capturedPreview && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-colors ${
                  dragOver ? "border-emerald-500 bg-emerald-50/50"
                  : selectedFile ? "border-emerald-400 bg-emerald-50/20"
                  : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="file-upload-input"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-slate-900 text-sm sm:text-base">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    <button
                      type="button"
                      onClick={() => { setSelectedFile(null); setCapturedPreview(null); }}
                      className="text-xs font-semibold text-emerald-700 hover:underline mt-1"
                    >
                      Change file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-medium text-slate-700">
                        {t.dragDropText}{" "}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="font-bold text-emerald-700 hover:text-emerald-800 underline"
                        >
                          {t.browseText}
                        </button>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG, WEBP, and PDF up to 5 MB</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setCameraError(null); startCamera(facingMode); }}
                      className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm"
                    >
                      <Camera className="w-4 h-4" />
                      {t.takePhotoText}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            <textarea
              id="letter-paste-textarea"
              rows={8}
              value={pastedText}
              onChange={(e) => { setPastedText(e.target.value); setValidationError(null); onClearError?.(); }}
              placeholder={t.pastePlaceholder}
              className="w-full p-4 rounded-xl border border-slate-300 text-slate-900 text-sm sm:text-base font-mono bg-slate-50 focus:bg-white focus:border-emerald-600 transition-colors"
            />
          </div>
        )}

        {/* Error Alert */}
        {(validationError || error) && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm" role="alert">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Notice</p>
              <p className="text-xs sm:text-sm mt-0.5">{validationError || error}</p>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            id="analyze-submit-button"
            disabled={
              isLoading ||
              (activeInputTab === "file" && !selectedFile) ||
              (activeInputTab === "paste" && !pastedText.trim())
            }
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin" />{t.analyzingButton}</>
            ) : (
              <><Sparkles className="w-5 h-5" />{t.analyzeButton}</>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}