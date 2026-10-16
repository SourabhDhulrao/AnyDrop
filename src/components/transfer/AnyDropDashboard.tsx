"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Zap, Download, Radio, Send, Copy, Check,
  ExternalLink, Camera, Image as ImgIcon, Eye
} from "lucide-react";
import { formatBytes } from "@/lib/device";
import { useDevice }   from "@/hooks/useDevice";
import { useRoom }     from "@/hooks/useRoom";
import { useWebRTC }   from "@/hooks/useWebRTC";
import { useTransfer } from "@/hooks/useTransfer";
import DeviceRadar     from "@/components/transfer/DeviceRadar";
import TransferPanel   from "@/components/transfer/TransferPanel";
import IncomingTransferModal from "@/components/transfer/IncomingTransferModal";
import IncomingTextModal     from "@/components/transfer/IncomingTextModal";
import QrModal               from "@/components/transfer/QrModal";
import QrScannerModal        from "@/components/transfer/QrScannerModal";
import FilePreviewModal      from "@/components/transfer/FilePreviewModal";
import type { DeviceInfo }   from "@/types/signaling";

type MobileTab = "radar" | "transfer" | "received";
const DEFAULT_ROOM = "ANYDROP-MAIN-01";

export default function AnyDropDashboard() {
  const searchParams = useSearchParams();
  const urlRoom = searchParams.get("room");
  const { device, setName } = useDevice();

  // Default to radar on both mobile and PC
  const [mobileTab, setMobileTab] = useState<MobileTab>("radar");
  const [selectedPeers, setSelectedPeers] = useState<DeviceInfo[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [showQR, setShowQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [previewReceivedFile, setPreviewReceivedFile] = useState<File | null>(null);

  const dcRef = useRef<RTCDataChannel | null>(null);
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);

  const { room, joinRoom, createRoom, sendSignal, onSignal, reconnect } = useRoom(device);
  const { 
    progress, 
    incomingRequest, 
    incomingTextMessage,
    receivedTexts,
    sendFiles, 
    sendTextMessage,
    acceptTransfer, 
    declineTransfer, 
    handleDcMessage, 
    handleTransferPayload,
    receivedFiles,
    clearIncomingTextMessage,
  } = useTransfer();

  const { 
    peerStatus, 
    dataChannel, 
    getPeerDataChannel,
    initiateCall, 
    onSignal: webRtcOnSignal
  } = useWebRTC(
    device?.id, 
    sendSignal,
    (dc) => { dcRef.current = dc; },
    (data) => { if (dcRef.current) handleDcMessage(dcRef.current, data); }
  );

  useEffect(() => { dcRef.current = dataChannel; }, [dataChannel]);

  useEffect(() => {
    setSelectedPeers(prev => prev.filter(p => room.peers.some(rp => rp.id === p.id)));
  }, [room.peers]);

  useEffect(() => {
    onSignal((msg: any) => {
      if (msg.type === "TRANSFER_DATA" && msg.payload) {
        handleTransferPayload(msg.payload, msg.fromPeerId || msg.fromId);
      } else {
        webRtcOnSignal(msg);
      }
    });
  }, [onSignal, webRtcOnSignal, handleTransferPayload]);

  useEffect(() => {
    if (device && !room.joined) {
      joinRoom(urlRoom ?? DEFAULT_ROOM);
    }
  }, [device, room.joined, joinRoom, urlRoom]);

  useEffect(() => {
    if (progress?.status === "failed" && isSending) {
      setIsSending(false);
    }
  }, [progress?.status, isSending]);

  const saveName = () => {
    if (nameInput.trim()) {
      setName(nameInput);
    }
    setEditingName(false);
  };

  const handleTogglePeer = (peer: DeviceInfo) => {
    setSelectedPeers(prev => {
      const exists = prev.some(p => p.id === peer.id);
      if (exists) {
        return prev.filter(p => p.id !== peer.id);
      } else {
        // Pre-warm WebRTC P2P DataChannel connection immediately on peer selection
        const dc = getPeerDataChannel(peer.id);
        if (!dc || dc.readyState !== "open") {
          try {
            initiateCall(peer.id);
          } catch {}
        }
        return [...prev, peer];
      }
    });
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileTab("transfer");
    }
  };

  const handleSelectAllPeers = () => {
    setSelectedPeers(room.peers);
  };

  const handleClearPeers = () => {
    setSelectedPeers([]);
  };

  const handleDeselectPeer = (peerId?: string) => {
    if (peerId) {
      setSelectedPeers(prev => prev.filter(p => p.id !== peerId));
    } else {
      setSelectedPeers([]);
    }
  };

  const handleAddFiles = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearFiles = () => {
    setFiles([]);
  };

  const handleStartSend = async () => {
    if (selectedPeers.length === 0 || files.length === 0 || !device) return;
    setIsSending(true);

    for (const peer of selectedPeers) {
      const activeDc = getPeerDataChannel(peer.id);
      if (!activeDc || activeDc.readyState !== "open") {
        try {
          initiateCall(peer.id);
        } catch {}
      }
    }

    try {
      await Promise.allSettled(
        selectedPeers.map(peer => {
          return sendFiles(
            peer.id,
            files,
            device.name,
            () => getPeerDataChannel(peer.id) || dcRef.current,
            sendSignal,
            () => initiateCall(peer.id)
          );
        })
      );
    } catch (err) {
      console.error("[AnyDrop] Error during sendFiles:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendTextDirect = async (text: string) => {
    if (selectedPeers.length === 0 || !device) return;
    await Promise.allSettled(
      selectedPeers.map(peer => {
        const activeDc = getPeerDataChannel(peer.id) || dcRef.current;
        if (!activeDc || activeDc.readyState !== "open") {
          try {
            initiateCall(peer.id);
          } catch {}
        }
        return sendTextMessage(
          peer.id,
          text,
          device.name,
          activeDc,
          sendSignal
        );
      })
    );
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextId(id);
    setTimeout(() => setCopiedTextId(null), 2000);
  };

  const handleAcceptTransfer = () => {
    acceptTransfer(dcRef.current, sendSignal);
    setMobileTab("received");
  };

  const handleDeclineTransfer = () => {
    declineTransfer(dcRef.current, sendSignal);
  };

  return (
    <div className="min-h-screen text-slate-800 flex flex-col relative overflow-x-hidden">
      {/* ── Modals ── */}
      <IncomingTransferModal
        request={incomingRequest}
        onAccept={handleAcceptTransfer}
        onDecline={handleDeclineTransfer}
      />
      <IncomingTextModal
        message={incomingTextMessage}
        onClose={clearIncomingTextMessage}
      />
      <QrModal
        open={showQR}
        roomId={room.roomId}
        onClose={() => setShowQR(false)}
      />
      <QrScannerModal
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onJoinRoom={(scannedRoom) => joinRoom(scannedRoom)}
      />

      {/* ── Fresh Sky Header ── */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-[#D5E6F5]/80">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#1D68EC] flex items-center justify-center shadow-sm shadow-blue-500/25 group-hover:scale-105 transition">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">
              AnyDrop
            </span>
          </Link>
        </div>
      </header>

      {/* ── Mobile Tab Segmented Switcher (Visible on < lg screens) ── */}
      <div className="lg:hidden sticky top-16 z-30 px-3 py-2 bg-white/85 backdrop-blur-md border-b border-[#D5E6F5]">
        <div className="flex rounded-xl bg-white p-1 border border-[#CFDFEC] gap-1 shadow-xs">
          <button
            onClick={() => setMobileTab("radar")}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition active:scale-95 ${
              mobileTab === "radar"
                ? "bg-[#E0F2FE] text-[#0284C7] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Radio className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Radar ({room.peers.length})</span>
          </button>

          <button
            onClick={() => setMobileTab("transfer")}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition active:scale-95 ${
              mobileTab === "transfer"
                ? "bg-[#E0F2FE] text-[#0284C7] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Send className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Send {files.length > 0 ? `(${files.length})` : ""}</span>
          </button>

          <button
            onClick={() => setMobileTab("received")}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition active:scale-95 ${
              mobileTab === "received"
                ? "bg-[#E0F2FE] text-[#0284C7] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Download className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Received Stuff {receivedFiles.length > 0 ? `(${receivedFiles.length})` : ""}</span>
          </button>
        </div>
      </div>

      {/* ── Main Dashboard Workspace ── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 z-10 flex flex-col gap-6">
        {/* Device Name Edit Modal */}
        {editingName && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-sm">
            <div className="w-full max-w-xs rounded-2xl bg-white border border-[#CFDFEC] p-5 flex flex-col gap-3 shadow-2xl">
              <h4 className="font-semibold text-sm text-slate-900">Edit Device Name</h4>
              <input
                autoFocus
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                className="w-full rounded-xl bg-[#F8FAFD] border border-[#CFDFEC] px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#1D68EC]"
                placeholder="e.g. My Phone, Mint Pixel"
              />
              <div className="flex gap-2 justify-end mt-1">
                <button
                  onClick={() => setEditingName(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={saveName}
                  className="px-4 py-1.5 rounded-lg bg-[#1D68EC] hover:bg-[#1557D4] text-white font-semibold text-xs shadow-xs"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Desktop Two-Column Layout / Mobile Conditional View ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Column 1: Radar Discovery (Desktop always visible, Mobile when tab=radar) */}
          <div className={`lg:col-span-6 flex flex-col gap-4 ${mobileTab !== "radar" ? "hidden lg:flex" : "flex"}`}>
            <div className="glass-panel p-5 sm:p-6 flex flex-col items-center bg-white border border-[#DCE7F2]">
              {/* Header: Clean "Nearby Devices" title with cyan radar icon */}
              <div className="w-full flex items-center justify-between pb-3 border-b border-[#E2EBF2] mb-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#0D9488]" />
                  <h2 className="text-sm font-semibold tracking-wide text-slate-900">
                    Nearby Devices
                  </h2>
                </div>
                <div className="text-xs px-3 py-1 rounded-full bg-[#F0F6FC] text-slate-500 border border-[#D5E6F5] font-mono">
                  {room.peers.length} discovered
                </div>
              </div>

              {/* The Interactive Sonar Radar */}
              <DeviceRadar
                myDevice={device}
                peers={room.peers}
                selectedPeers={selectedPeers}
                onTogglePeer={handleTogglePeer}
                onSelectAllPeers={handleSelectAllPeers}
                onClearPeers={handleClearPeers}
                onOpenQr={() => setShowQR(true)}
                onOpenScanner={() => setShowScanner(true)}
                roomId={room.roomId}
                onEditName={() => {
                  setNameInput(device?.name ?? "");
                  setEditingName(true);
                }}
                wsStatus={room.wsStatus}
                onReconnect={reconnect}
              />
            </div>
          </div>

          {/* Column 2: Transfer Cockpit (Desktop always visible, Mobile when tab=transfer) */}
          <div className={`lg:col-span-6 flex flex-col gap-4 ${mobileTab !== "transfer" ? "hidden lg:flex" : "flex"}`}>
            <TransferPanel
              selectedPeers={selectedPeers}
              onDeselectPeer={handleDeselectPeer}
              peers={room.peers}
              onTogglePeer={handleTogglePeer}
              onSelectAllPeers={handleSelectAllPeers}
              onClearPeers={handleClearPeers}
              files={files}
              onAddFiles={handleAddFiles}
              onRemoveFile={handleRemoveFile}
              onClearFiles={handleClearFiles}
              onSend={handleStartSend}
              progress={progress}
              isSending={isSending}
              peerStatus={peerStatus}
              onSendText={handleSendTextDirect}
            />
          </div>

          {/* Column 3 / Full Width: Received Stuff (Files & Messages) */}
          <div className={`col-span-1 lg:col-span-12 ${mobileTab !== "received" ? "hidden lg:block" : "block"}`}>
            <div className="glass-panel p-5 sm:p-6 flex flex-col gap-5 bg-white border border-[#DCE7F2]">
              {/* Received Stuff Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E2EBF2]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7]">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900">Received Stuff</h3>
                    <p className="text-xs text-slate-400">
                      Ready to receive original files, high-res photos, and messages
                    </p>
                  </div>
                </div>

                {receivedFiles.length > 1 && (
                  <button
                    onClick={() => {
                      receivedFiles.forEach(f => {
                        const a = document.createElement("a");
                        a.href = URL.createObjectURL(f);
                        a.download = f.name;
                        a.click();
                      });
                    }}
                    className="text-xs px-3 py-1.5 rounded-xl bg-[#1D68EC] hover:bg-[#1557D4] text-white font-semibold transition shadow-xs"
                  >
                    Save All
                  </button>
                )}
              </div>

              {/* Received Items */}
              {receivedFiles.length === 0 && receivedTexts.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 gap-2">
                  <Download className="w-8 h-8 opacity-25" />
                  <p className="text-xs text-slate-500 font-medium">No transfers received yet</p>
                  <p className="text-[11px] text-slate-400">Transferred files and links will appear here immediately</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Received Files List */}
                  {receivedFiles.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {receivedFiles.map((file, i) => {
                        const objectUrl = URL.createObjectURL(file);
                        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
                        const isHeicOrRaw = ["heic", "heif", "raw", "dng", "cr2", "nef"].includes(ext);
                        const isBrowserRenderableImage = file.type.startsWith("image/") && !isHeicOrRaw;
                        return (
                          <div
                            key={`rec-file-${i}`}
                            onClick={() => setPreviewReceivedFile(file)}
                            className="p-3 rounded-2xl bg-[#F8FAFD] hover:bg-[#EFF6FF] border border-[#E2EBF2] hover:border-[#BAE6FD] flex items-center justify-between gap-3 text-xs transition cursor-pointer group shadow-2xs"
                            title="Click to preview this received file"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {isBrowserRenderableImage ? (
                                <img
                                  src={objectUrl}
                                  alt={file.name}
                                  className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                                />
                              ) : isHeicOrRaw ? (
                                <div className="w-8 h-8 rounded-lg bg-[#E0FBF6] border border-[#99F6E4] flex items-center justify-center text-[#0D9488] flex-shrink-0">
                                  <ImgIcon className="w-4 h-4" />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] flex-shrink-0">
                                  <Download className="w-4 h-4" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 truncate group-hover:text-[#1D68EC] transition">{file.name}</p>
                                <p className="text-[10px] text-slate-400">{formatBytes(file.size)} • Click to preview</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewReceivedFile(file);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0284C7] text-[11px] font-semibold transition flex items-center gap-1 shadow-2xs"
                                title="Preview this file"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>

                              <a
                                href={objectUrl}
                                download={file.name}
                                onClick={(e) => e.stopPropagation()}
                                className="px-2.5 py-1 rounded-lg bg-[#1D68EC] hover:bg-[#1557D4] text-white text-[11px] font-semibold transition flex items-center gap-1 shadow-xs"
                              >
                                Save
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Received Messages List */}
                  {receivedTexts.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Received Messages / Links:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {receivedTexts.map((msg) => (
                          <div
                            key={msg.id}
                            className="p-3 rounded-2xl bg-[#F8FAFD] border border-[#E2EBF2] flex flex-col gap-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span className="font-semibold text-[#1D68EC]">From {msg.senderName}</span>
                              <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                            <div className="text-slate-800 break-words font-mono text-[11px] bg-white p-2 rounded-xl border border-[#CFDFEC]">
                              {msg.text}
                            </div>
                            <div className="flex gap-2 justify-end mt-0.5">
                              {msg.isUrl && (
                                <a
                                  href={msg.text.startsWith("http") ? msg.text : `https://${msg.text}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] text-[#0284C7] hover:underline flex items-center gap-1 font-medium"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Open</span>
                                </a>
                              )}
                              <button
                                onClick={() => handleCopyText(msg.id, msg.text)}
                                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                              >
                                {copiedTextId === msg.id ? <Check className="w-3 h-3 text-[#1D68EC]" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedTextId === msg.id ? "Copied" : "Copy"}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Received File Preview Modal */}
      <FilePreviewModal
        file={previewReceivedFile}
        onClose={() => setPreviewReceivedFile(null)}
      />
    </div>
  );
}
