"use client";
import React, { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, FileText, Image as ImgIcon, Film, Package, 
  X, Send, Zap, MessageSquare, 
  Check, FileUp, Smartphone, Monitor, Laptop, Tablet, Radio
} from "lucide-react";
import { formatBytes, formatSpeed, formatEta } from "@/lib/device";
import type { DeviceInfo } from "@/types/signaling";
import type { TransferProgress } from "@/hooks/useTransfer";

interface Props {
  selectedPeers?: DeviceInfo[];
  selectedPeer?: DeviceInfo | null;
  onDeselectPeer?: (peerId?: string) => void;
  peers?: DeviceInfo[];
  onSelectPeer?: (peer: DeviceInfo) => void;
  onTogglePeer?: (peer: DeviceInfo) => void;
  onSelectAllPeers?: () => void;
  onClearPeers?: () => void;
  files: File[];
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onClearFiles: () => void;
  onSend: () => void;
  progress: TransferProgress | null;
  isSending: boolean;
  peerStatus?: string;
  onSendText?: (text: string) => Promise<boolean | void> | void;
}

function getDeviceIcon(type?: string) {
  switch (type?.toLowerCase()) {
    case "phone":
      return <Smartphone className="w-4 h-4 text-[#1D68EC]" />;
    case "tablet":
      return <Tablet className="w-4 h-4 text-[#0284C7]" />;
    case "laptop":
      return <Laptop className="w-4 h-4 text-[#1D68EC]" />;
    default:
      return <Monitor className="w-4 h-4 text-[#1D68EC]" />;
  }
}

function FileTypeBadge({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "heic"].includes(ext)) {
    return <ImgIcon className="w-4 h-4 text-[#0D9488]" />;
  }
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) {
    return <Film className="w-4 h-4 text-[#0284C7]" />;
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return <Package className="w-4 h-4 text-amber-600" />;
  }
  return <FileText className="w-4 h-4 text-[#1D68EC]" />;
}

export default function TransferPanel({
  selectedPeers = [],
  selectedPeer,
  onDeselectPeer,
  peers = [],
  onSelectPeer,
  onTogglePeer,
  onSelectAllPeers,
  onClearPeers,
  files,
  onAddFiles,
  onRemoveFile,
  onClearFiles,
  onSend,
  progress,
  isSending,
  peerStatus,
  onSendText,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<"files" | "text">("files");
  const [textMessage, setTextMessage] = useState("");
  const [isSendingText, setIsSendingText] = useState(false);
  const [textSentSuccess, setTextSentSuccess] = useState(false);

  const targets: DeviceInfo[] = selectedPeers.length > 0 
    ? selectedPeers 
    : selectedPeer 
    ? [selectedPeer] 
    : [];

  const isPeerActive = (p: DeviceInfo) => targets.some(t => t.id === p.id);

  const handlePeerClick = (peer: DeviceInfo) => {
    if (onTogglePeer) {
      onTogglePeer(peer);
    } else if (onSelectPeer) {
      onSelectPeer(peer);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      onAddFiles(Array.from(e.dataTransfer.files));
    }
  }, [onAddFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onAddFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const handleSendDirectText = async () => {
    if (!textMessage.trim() || targets.length === 0 || isSendingText) return;
    setIsSendingText(true);
    try {
      if (onSendText) {
        await onSendText(textMessage.trim());
      }
      setTextSentSuccess(true);
      setTextMessage("");
      setTimeout(() => setTextSentSuccess(false), 2500);
    } catch (err) {
      console.error("Failed to send text:", err);
    } finally {
      setIsSendingText(false);
    }
  };

  const handleAddAsFile = () => {
    if (!textMessage.trim()) return;
    const blob = new Blob([textMessage], { type: "text/plain" });
    const file = new File([blob], `note-${new Date().toISOString().slice(11, 19).replace(/:/g, "-")}.txt`, { type: "text/plain" });
    onAddFiles([file]);
    setTextMessage("");
    setActiveTab("files");
  };

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="glass-panel p-5 sm:p-6 flex flex-col gap-4 bg-white border border-[#DCE7F2]">
      {/* ── Target Device(s) Header ── */}
      <div className="flex flex-col gap-2 pb-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            TARGET DEVICES
          </span>

          <div className="flex items-center gap-2">
            {peers.length > 1 && onSelectAllPeers && (
              <button
                type="button"
                onClick={targets.length === peers.length ? onClearPeers : onSelectAllPeers}
                className="text-[11px] font-semibold text-[#1D68EC] hover:underline transition"
              >
                {targets.length === peers.length ? "Deselect All" : "Select All"}
              </button>
            )}

            {targets.length > 0 && onClearPeers && (
              <button
                type="button"
                onClick={onClearPeers}
                className="text-[11px] text-slate-400 hover:text-rose-600 transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Selected Devices Chips List OR Empty Hint Banner matching screenshot */}
        {targets.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-0.5">
            {targets.map((peer) => (
              <div
                key={peer.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-xs text-[#1E40AF] shadow-sm"
              >
                {getDeviceIcon(peer.type)}
                <span className="font-semibold text-[#1E40AF] max-w-[120px] truncate">{peer.name}</span>
                <button
                  type="button"
                  onClick={() => onDeselectPeer ? onDeselectPeer(peer.id) : onTogglePeer?.(peer)}
                  className="p-0.5 rounded hover:bg-blue-100 text-blue-500 hover:text-rose-600 transition ml-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-[#F1F6FA] border border-[#E2EBF2] text-xs text-slate-500 flex items-center">
            <span>Tap devices on the radar or list below to send files</span>
          </div>
        )}

        {/* Available Peer Checkbox Cards */}
        {peers.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Discovered Devices ({peers.length}):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {peers.map((peer) => {
                const active = isPeerActive(peer);
                return (
                  <button
                    key={peer.id}
                    type="button"
                    onClick={() => handlePeerClick(peer)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition group text-left ${
                      active
                        ? "bg-[#EFF6FF] border-[#93C5FD] text-[#1E40AF] shadow-sm"
                        : "bg-[#F8FAFD] border-[#E2EBF2] hover:border-[#CFDFEC] text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        active ? "bg-blue-200 text-[#1D68EC]" : "bg-white border border-[#E2EBF2] text-slate-500"
                      }`}>
                        {getDeviceIcon(peer.type)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{peer.name}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{peer.type}</p>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                      active ? "bg-[#1D68EC] border-[#1D68EC] text-white" : "border-slate-300 bg-white text-transparent"
                    }`}>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Mode Switcher: Files vs Quick Text ── */}
      <div className="flex rounded-xl bg-white p-1 border border-[#CFDFEC] gap-1">
        <button
          onClick={() => setActiveTab("files")}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeTab === "files"
              ? "bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD] shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileUp className="w-3.5 h-3.5" />
          <span>Files & Media ({files.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("text")}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeTab === "text"
              ? "bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD] shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Send Text / Link</span>
        </button>
      </div>

      {/* ── Files Tab ── */}
      {activeTab === "files" && (
        <div className="flex flex-col gap-3">
          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
          <input
            ref={mediaInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />

          {/* Dropzone matching reference design */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2.5 ${
              isDragging
                ? "border-[#2DD4BF] bg-[#F0FDF4] shadow-md scale-[1.01]"
                : "border-[#CFDFEC] bg-[#F8FAFD] hover:border-[#2DD4BF] hover:bg-[#F0FDF4]/50"
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-[#E0FBF6] border border-[#A7F3D0] flex items-center justify-center text-[#0D9488] shadow-xs">
              <Upload className="w-6 h-6" />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Tap to pick files or drop them here
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Photos, videos, documents, zip archives — unlimited size
              </p>
            </div>
          </div>

          {/* Quick Mobile Action Buttons matching screenshot */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-[#CFDFEC] text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition shadow-xs active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span>Browse Files</span>
            </button>
            <button
              type="button"
              onClick={() => mediaInputRef.current?.click()}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#E6F8F5] hover:bg-[#D3F5EE] border border-[#B2EFE6] text-xs font-semibold text-[#0F766E] flex items-center justify-center gap-1.5 transition shadow-xs active:scale-95"
            >
              <ImgIcon className="w-3.5 h-3.5 text-[#0D9488]" />
              <span>Photos & Videos</span>
            </button>
          </div>

          {/* Files List Preview */}
          {files.length > 0 && (
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Selected: {files.length} ({formatBytes(totalBytes)})</span>
                <button
                  onClick={onClearFiles}
                  className="text-rose-600 hover:text-rose-700 font-semibold"
                >
                  Clear all
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 pr-1">
                {files.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="p-2.5 rounded-xl bg-[#F8FAFD] border border-[#E2EBF2] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileTypeBadge name={file.name} />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-400">{formatBytes(file.size)}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveFile(i)}
                      className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-rose-600 transition flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Quick Text Tab ── */}
      {activeTab === "text" && (
        <div className="flex flex-col gap-3">
          <textarea
            value={textMessage}
            onChange={(e) => setTextMessage(e.target.value)}
            placeholder="Type or paste clipboard text, website URLs, passwords, or notes to send instantly..."
            rows={4}
            className="w-full rounded-2xl bg-[#F8FAFD] border border-[#CFDFEC] p-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1D68EC] transition resize-none font-mono"
          />

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{textMessage.length} characters</span>
            {textMessage.trim() && (
              <button
                type="button"
                onClick={handleAddAsFile}
                className="text-[11px] text-[#1D68EC] hover:underline font-semibold"
              >
                Convert to .txt File
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Active Transfer Progress Bar ── */}
      {progress && (
        <div className="p-3.5 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex flex-col gap-2">
          {(() => {
            const pct = Math.min(100, Math.round((progress.transferred / Math.max(progress.total, 1)) * 100));
            return (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#1E40AF]">
                    {progress.status === "completed" ? "Transfer Complete!" : progress.speed > 0 ? "Transferring..." : "Connecting..."}
                  </span>
                  <span className="font-mono text-[#1D68EC] font-bold">{pct}%</span>
                </div>

                <div className="h-2 rounded-full bg-blue-100 overflow-hidden relative">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#1D68EC] to-[#2DD4BF] rounded-full"
                    style={{ width: `${pct}%` }}
                    transition={{ ease: "easeOut", duration: 0.2 }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>{formatBytes(progress.transferred)} / {formatBytes(progress.total)}</span>
                  <span>{formatSpeed(progress.speed)} · {formatEta(progress.eta)}</span>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ── Send CTA Button (Vibrant Royal Blue) ── */}
      {activeTab === "files" ? (
        <button
          id="send-files-btn"
          onClick={onSend}
          disabled={targets.length === 0 || files.length === 0 || isSending}
          className="btn-primary-blue w-full py-3.5 rounded-2xl text-base justify-center transition disabled:opacity-40"
        >
          <Zap className={`w-5 h-5 ${isSending ? "animate-pulse" : ""}`} />
          <span>
            {isSending
              ? peerStatus === "connecting"
                ? `Connecting to ${targets.length > 1 ? `${targets.length} Devices` : targets[0]?.name || "Device"}...`
                : progress && progress.transferred === 0
                ? `Waiting for ${targets.length > 1 ? `${targets.length} Devices` : targets[0]?.name || "Peer"} to accept...`
                : "Sending..."
              : targets.length === 0
              ? "Select Target Device(s) to Send"
              : files.length === 0
              ? "Add Files to Send"
              : `Send ${files.length} File${files.length > 1 ? "s" : ""} to ${
                  targets.length === 1 ? targets[0].name : `${targets.length} Devices`
                }`}
          </span>
        </button>
      ) : (
        <button
          id="send-text-btn"
          onClick={handleSendDirectText}
          disabled={targets.length === 0 || !textMessage.trim() || isSendingText}
          className={`btn-primary-blue w-full py-3.5 rounded-2xl text-base justify-center transition disabled:opacity-40 ${
            textSentSuccess ? "!bg-[#0D9488] font-bold" : ""
          }`}
        >
          {textSentSuccess ? (
            <>
              <Check className="w-5 h-5" />
              <span>Message Sent to {targets.length === 1 ? targets[0].name : `${targets.length} Devices`}!</span>
            </>
          ) : isSendingText ? (
            <>
              <Radio className="w-5 h-5 animate-spin" />
              <span>Sending Message...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>
                {targets.length === 0
                  ? "Select Target Device(s) to Send"
                  : !textMessage.trim()
                  ? "Type a Message or Link to Send"
                  : `Send Message to ${targets.length === 1 ? targets[0].name : `${targets.length} Devices`}`}
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
