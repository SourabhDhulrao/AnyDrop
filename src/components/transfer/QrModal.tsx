"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, QrCode, Clock } from "lucide-react";
import QRCode from "qrcode";

interface Props {
  open: boolean;
  roomId: string | null;
  onClose: () => void;
}

export default function QrModal({ open, roomId, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [timer, setTimer] = useState(300);

  const shareUrl = typeof window !== "undefined" && roomId
    ? `${window.location.origin}/?room=${encodeURIComponent(roomId)}`
    : "";

  useEffect(() => {
    if (!open || !canvasRef.current || !shareUrl) return;
    QRCode.toCanvas(canvasRef.current, shareUrl, {
      width: 220,
      margin: 2,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    }).catch(console.error);
  }, [open, shareUrl]);

  useEffect(() => {
    if (!open) { setTimer(300); return; }
    const t = setInterval(() => setTimer(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [open]);

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const qrMin = String(Math.floor(timer / 60)).padStart(2, "0");
  const qrSec = String(timer % 60).padStart(2, "0");

  return (
    <AnimatePresence>
      {open && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl flex flex-col gap-5 text-slate-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Scan to Connect</h3>
                  <p className="text-[11px] text-slate-500">Scan this code from another device</p>
                </div>
              </div>

              <button
                id="close-qr-modal"
                onClick={onClose}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QR Canvas Box */}
            <div className="flex flex-col items-center justify-center p-3.5 bg-slate-50 rounded-2xl border border-slate-200 mx-auto">
              <canvas ref={canvasRef} className="rounded-lg shadow-sm" />
            </div>

            {/* Room Code Badge */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 text-center">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Room Code</span>
              <p className="text-xl font-mono font-bold text-indigo-600 tracking-widest mt-0.5">
                {roomId ?? "------"}
              </p>
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 mt-1">
                <Clock className="w-3 h-3" />
                <span>Expires in {qrMin}:{qrSec}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5">
              <button
                id="copy-link-btn"
                onClick={copyLink}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-200 transition active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-indigo-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>{copied ? "Link Copied!" : "Copy Share Link"}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
