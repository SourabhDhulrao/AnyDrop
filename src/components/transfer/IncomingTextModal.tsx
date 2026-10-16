"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, ExternalLink, Copy, Check, X, Globe } from "lucide-react";
import type { ReceivedTextMessage } from "@/hooks/useTransfer";

interface Props {
  message: ReceivedTextMessage | null;
  onClose: () => void;
}

export default function IncomingTextModal({ message, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  if (!message) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenLink = () => {
    let url = message.text.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl flex flex-col gap-5 text-slate-900 relative overflow-hidden"
        >
          {/* Close button top-right */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Top Header */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
              {message.isUrl ? <Globe className="w-5 h-5 animate-pulse" /> : <MessageSquare className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-indigo-600">
                {message.isUrl ? "Shared Link" : "Incoming Message"}
              </span>
              <h3 className="text-sm font-semibold text-slate-900">
                From <span className="text-indigo-700 font-bold">{message.senderName}</span>
              </h3>
            </div>
          </div>

          {/* Content Box */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 max-h-60 overflow-y-auto select-text break-words">
            {message.isUrl ? (
              <a
                href={message.text.startsWith("http") ? message.text : `https://${message.text}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 hover:text-sky-700 underline text-xs font-mono flex items-center gap-2 group"
              >
                <span className="break-all">{message.text}</span>
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 group-hover:translate-x-0.5 transition" />
              </a>
            ) : (
              <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
                {message.text}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleCopy}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-95 shadow-sm ${
                copied
                  ? "bg-indigo-600 text-white font-bold"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              }`}
            >
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>

            {message.isUrl && (
              <button
                onClick={handleOpenLink}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md shadow-indigo-600/25"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Link</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
