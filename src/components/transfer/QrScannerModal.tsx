"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Image as ImageIcon, Check, AlertCircle, RefreshCw } from "lucide-react";
import jsQR from "jsqr";

interface Props {
  open: boolean;
  onClose: () => void;
  onJoinRoom: (roomId: string) => void;
}

export default function QrScannerModal({ open, onClose, onJoinRoom }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scannedRoom, setScannedRoom] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const parseRoomId = useCallback((raw: string): string => {
    const trimmed = raw.trim();
    try {
      const url = new URL(trimmed);
      const roomParam = url.searchParams.get("room");
      if (roomParam) return roomParam.toUpperCase();
    } catch {
      const match = trimmed.match(/room=([a-zA-Z0-9_-]+)/i);
      if (match) return match[1].toUpperCase();
    }
    return trimmed.toUpperCase();
  }, []);

  const handleDetectedCode = useCallback((rawText: string) => {
    const roomId = parseRoomId(rawText);
    if (!roomId) return;
    setScannedRoom(roomId);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(80);
    }
    setTimeout(() => {
      onJoinRoom(roomId);
      onClose();
    }, 700);
  }, [parseRoomId, onJoinRoom, onClose]);

  const startCamera = useCallback(async () => {
    setErrorMessage(null);
    setScannedRoom(null);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setHasCamera(false);
      setErrorMessage("Camera access is not supported on this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      setHasCamera(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        scanFrame();
      }
    } catch (err: any) {
      console.warn("[QrScanner] Camera start failed:", err);
      setHasCamera(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("Camera permission was denied. You can upload an image or enter the room code manually.");
      } else {
        setErrorMessage("Could not connect to camera. You can upload a QR image or enter code manually.");
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const scanFrame = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const video = videoRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;

    if (width > 0 && height > 0) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert"
        });

        if (code && code.data) {
          handleDetectedCode(code.data);
          return;
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(scanFrame);
  }, [handleDetectedCode]);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [open, startCamera, stopCamera]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleDetectedCode(code.data);
          } else {
            setErrorMessage("No QR code found in this image. Please try another image or enter the code.");
          }
        }
        setIsProcessingFile(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const code = parseRoomId(manualCode.trim());
    onJoinRoom(code);
    onClose();
  };

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
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 p-5 shadow-2xl flex flex-col gap-4 text-slate-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Scan QR Code</h3>
                  <p className="text-[11px] text-slate-500">Align with nearby device QR</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Camera Viewport */}
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-slate-900 flex items-center justify-center shadow-inner">
              {hasCamera !== false && (
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
              )}

              {/* Viewfinder Reticle Overlay */}
              {hasCamera !== false && !scannedRoom && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-48 h-48 border-2 border-indigo-400/40 rounded-2xl">
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-indigo-400 rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-indigo-400 rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-indigo-400 rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-indigo-400 rounded-br-lg" />

                    <motion.div
                      className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_8px_#818cf8]"
                      animate={{ top: ["10%", "90%", "10%"] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                </div>
              )}

              {/* Scanned Success Overlay */}
              {scannedRoom && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-2 p-4 text-white">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/30 border border-indigo-400 flex items-center justify-center text-indigo-300">
                    <Check className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <span className="text-xs text-slate-300 font-medium">QR Detected!</span>
                  <span className="text-sm font-mono font-bold text-indigo-300">{scannedRoom}</span>
                  <span className="text-[11px] text-slate-400">Joining room...</span>
                </div>
              )}

              {/* Camera Error / Not Supported Fallback */}
              {hasCamera === false && (
                <div className="p-4 flex flex-col items-center text-center gap-2.5 text-white">
                  <AlertCircle className="w-8 h-8 text-indigo-400" />
                  <p className="text-xs text-slate-300 font-medium max-w-[220px]">
                    {errorMessage ?? "Camera is unavailable"}
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Upload QR Image</span>
                  </button>
                </div>
              )}
            </div>

            {/* Error banner if upload failed */}
            {errorMessage && hasCamera !== false && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFile}
                className="flex-1 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>{isProcessingFile ? "Scanning..." : "Upload QR Image"}</span>
              </button>

              {hasCamera === false && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium flex items-center justify-center gap-1.5 transition"
                  title="Retry Camera"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                </button>
              )}
            </div>

            {/* Manual Code Input */}
            <form onSubmit={handleManualSubmit} className="pt-1 flex flex-col gap-1.5">
              <span className="text-[11px] text-slate-500">Or enter room code manually:</span>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="e.g. ANYDROP-MAIN-01"
                  className="flex-1 rounded-xl bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs text-slate-900 font-mono uppercase placeholder:normal-case placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold transition"
                >
                  Join
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
