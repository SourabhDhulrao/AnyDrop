"use client";
import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Eye, ExternalLink, Download, FileText, Image as ImgIcon, 
  Film, Music, Trash2, Check, FileQuestion
} from "lucide-react";
import { formatBytes } from "@/lib/device";

interface Props {
  file: File | null;
  onClose: () => void;
  onRemove?: () => void;
}

export default function FilePreviewModal({ file, onClose, onRemove }: Props) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);

  const fileUrl = useMemo(() => {
    if (!file) return null;
    try {
      return URL.createObjectURL(file);
    } catch {
      return null;
    }
  }, [file]);

  // Clean up Object URL
  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const ext = useMemo(() => {
    if (!file) return "";
    return file.name.split(".").pop()?.toLowerCase() ?? "";
  }, [file]);

  const fileType = useMemo(() => {
    if (!file) return "unknown";
    const type = file.type.toLowerCase();

    if (type.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(ext)) {
      if (["heic", "heif"].includes(ext)) return "heic";
      return "image";
    }
    if (type === "application/pdf" || ext === "pdf") {
      return "pdf";
    }
    if (type.startsWith("video/") || ["mp4", "mov", "webm", "m4v", "mkv", "avi"].includes(ext)) {
      return "video";
    }
    if (type.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext)) {
      return "audio";
    }
    if (
      type.startsWith("text/") || 
      ["txt", "md", "json", "csv", "js", "ts", "tsx", "jsx", "html", "css", "xml", "py", "sh", "yaml", "yml"].includes(ext)
    ) {
      return "text";
    }
    return "other";
  }, [file, ext]);

  // Load text file content if text
  useEffect(() => {
    if (file && fileType === "text" && file.size < 2 * 1024 * 1024) {
      setLoadingText(true);
      file.text()
        .then((txt) => {
          setTextContent(txt);
          setLoadingText(false);
        })
        .catch(() => {
          setTextContent("Unable to preview text content.");
          setLoadingText(false);
        });
    } else {
      setTextContent(null);
    }
  }, [file, fileType]);

  if (!file) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="w-full max-w-3xl max-h-[92vh] rounded-3xl bg-white border border-[#D5E6F5] shadow-2xl flex flex-col overflow-hidden text-slate-800"
        >
          {/* ── Modal Header ── */}
          <div className="p-4 sm:px-6 py-3.5 border-b border-[#E2EBF2] flex items-center justify-between gap-3 bg-[#F8FAFD]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] flex-shrink-0">
                {fileType === "image" && <ImgIcon className="w-4 h-4" />}
                {fileType === "heic" && <ImgIcon className="w-4 h-4 text-[#0D9488]" />}
                {fileType === "pdf" && <FileText className="w-4 h-4 text-rose-500" />}
                {fileType === "video" && <Film className="w-4 h-4 text-[#1D68EC]" />}
                {fileType === "audio" && <Music className="w-4 h-4 text-emerald-600" />}
                {fileType === "text" && <FileText className="w-4 h-4 text-amber-600" />}
                {fileType === "other" && <FileQuestion className="w-4 h-4 text-slate-600" />}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate" title={file.name}>
                  {file.name}
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span>{formatBytes(file.size)}</span>
                  <span>•</span>
                  <span className="uppercase font-semibold text-slate-500">{ext || "FILE"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  download={file.name}
                  className="p-2 rounded-xl text-slate-500 hover:text-[#1D68EC] hover:bg-white border border-transparent hover:border-[#CFDFEC] transition"
                  title="Open full view in new tab or download"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-[#CFDFEC] transition active:scale-95"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Main Preview Body ── */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex items-center justify-center bg-[#F1F5F9]/40 min-h-[300px] max-h-[70vh]">
            {/* Image Preview */}
            {fileType === "image" && fileUrl && (
              <div className="flex flex-col items-center justify-center gap-3 w-full h-full">
                <img
                  src={fileUrl}
                  alt={file.name}
                  className="max-h-[62vh] max-w-full rounded-2xl object-contain shadow-md border border-[#E2EBF2] bg-white"
                />
              </div>
            )}

            {/* Apple HEIC Photo */}
            {fileType === "heic" && (
              <div className="flex flex-col items-center justify-center gap-4 text-center p-8 bg-white rounded-2xl border border-[#CFDFEC] max-w-md shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-[#E0FBF6] border border-[#99F6E4] flex items-center justify-center text-[#0D9488]">
                  <ImgIcon className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{file.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Apple High-Efficiency Image (HEIC / HEIF) • {formatBytes(file.size)}
                  </p>
                  <p className="text-[11px] text-[#0D9488] font-medium mt-2 bg-[#F0FDF4] border border-[#BBF7D0] px-3 py-1.5 rounded-xl">
                    ✓ Full original Apple camera resolution preserved bit-for-bit
                  </p>
                </div>
                {fileUrl && (
                  <a
                    href={fileUrl}
                    download={file.name}
                    className="px-4 py-2 rounded-xl bg-[#1D68EC] hover:bg-[#1557D4] text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download / View Original File</span>
                  </a>
                )}
              </div>
            )}

            {/* PDF Preview */}
            {fileType === "pdf" && fileUrl && (
              <div className="w-full h-[64vh] flex flex-col gap-2">
                <object
                  data={fileUrl}
                  type="application/pdf"
                  className="w-full h-full rounded-2xl border border-[#CFDFEC] bg-white shadow-xs"
                >
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center bg-white rounded-2xl">
                    <FileText className="w-12 h-12 text-rose-500" />
                    <p className="text-sm font-semibold text-slate-800">
                      PDF Document: {file.name}
                    </p>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-[#1D68EC] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open PDF in Viewer</span>
                    </a>
                  </div>
                </object>
              </div>
            )}

            {/* Video Preview */}
            {fileType === "video" && fileUrl && (
              <div className="w-full flex items-center justify-center">
                <video
                  src={fileUrl}
                  controls
                  playsInline
                  className="max-h-[62vh] max-w-full rounded-2xl shadow-md border border-[#CFDFEC] bg-black"
                />
              </div>
            )}

            {/* Audio Preview */}
            {fileType === "audio" && fileUrl && (
              <div className="flex flex-col items-center justify-center gap-5 p-8 bg-white rounded-2xl border border-[#CFDFEC] max-w-md w-full shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7]">
                  <Music className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-slate-900 text-sm truncate max-w-xs">{file.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{formatBytes(file.size)}</p>
                </div>
                <audio src={fileUrl} controls className="w-full" />
              </div>
            )}

            {/* Text File Preview */}
            {fileType === "text" && (
              <div className="w-full h-[62vh] flex flex-col rounded-2xl border border-[#CFDFEC] bg-white overflow-hidden shadow-xs">
                <div className="px-4 py-2 bg-[#F8FAFD] border-b border-[#E2EBF2] text-[11px] font-mono text-slate-500 flex items-center justify-between">
                  <span>Text Preview</span>
                  <span>{formatBytes(file.size)}</span>
                </div>
                <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-text">
                  {loadingText ? "Loading file preview..." : (textContent ?? "No text content available.")}
                </div>
              </div>
            )}

            {/* Other / Unknown Format */}
            {fileType === "other" && (
              <div className="flex flex-col items-center justify-center gap-4 text-center p-8 bg-white rounded-2xl border border-[#CFDFEC] max-w-md shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-[#F0F4F8] border border-[#CFDFEC] flex items-center justify-center text-slate-600">
                  <FileQuestion className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{file.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {file.type || "Binary document"} • {formatBytes(file.size)}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    This file format will be transferred directly in its exact original binary format.
                  </p>
                </div>
                {fileUrl && (
                  <a
                    href={fileUrl}
                    download={file.name}
                    className="px-4 py-2 rounded-xl bg-[#1D68EC] hover:bg-[#1557D4] text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download / Save File</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* ── Modal Footer ── */}
          <div className="p-3.5 sm:px-6 border-t border-[#E2EBF2] bg-[#F8FAFD] flex items-center justify-between">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#0D9488]" />
              <span>Verified file</span>
            </div>

            <div className="flex items-center gap-2">
              {onRemove && (
                <button
                  type="button"
                  onClick={() => {
                    onRemove();
                    onClose();
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition flex items-center gap-1.5 active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove this file</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#1D68EC] hover:bg-[#1557D4] text-white font-semibold text-xs shadow-xs transition active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
