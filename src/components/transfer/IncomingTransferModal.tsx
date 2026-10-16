"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";
import { formatBytes } from "@/lib/device";
import type { TransferRequest } from "@/hooks/useTransfer";

interface Props {
  request: TransferRequest | null;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingTransferModal({ request, onAccept, onDecline }: Props) {
  return (
    <AnimatePresence>
      {request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl flex flex-col gap-5 text-slate-900"
          >
            {/* Top Icon */}
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] mb-3 shadow-sm">
                <Download className="w-7 h-7 animate-bounce" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Incoming Transfer</h3>
              <p className="text-xs text-slate-500 mt-1">
                <span className="font-semibold text-[#1D68EC]">{request.senderName}</span> wants to share files with you
              </p>
            </div>

            {/* Files Summary Box */}
            <div className="rounded-2xl bg-[#F8FAFD] border border-[#E2EBF2] p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-1.5 border-b border-[#E2EBF2]">
                <span>{request.files.length} File{request.files.length !== 1 ? "s" : ""}</span>
                <span className="font-mono text-[#1D68EC] font-semibold">{formatBytes(request.totalSize)}</span>
              </div>

              <div className="max-h-32 overflow-y-auto flex flex-col gap-1.5 pr-1">
                {request.files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-700 font-medium truncate max-w-[190px]">{file.name}</span>
                    <span className="text-slate-400 font-mono flex-shrink-0 ml-2">{formatBytes(file.size)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                id="decline-transfer-btn"
                onClick={onDecline}
                className="flex-1 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center justify-center gap-1.5 border border-[#CFDFEC] shadow-xs active:scale-95"
              >
                <X className="w-4 h-4" />
                <span>Decline</span>
              </button>

              <button
                id="accept-transfer-btn"
                onClick={onAccept}
                className="flex-1 py-3 rounded-xl bg-[#1D68EC] hover:bg-[#1557D4] text-white font-semibold text-xs transition shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Accept</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
