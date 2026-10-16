"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Radio, Copy, Check, Plus, ArrowRight, 
  Users, KeyRound
} from "lucide-react";

interface Props {
  open: boolean;
  currentRoomId: string | null;
  peerCount: number;
  onJoinRoom: (roomId: string) => void;
  onCreateRoom: () => void;
  onClose: () => void;
}

const PRESET_ROOMS = [
  "ANYDROP-MAIN-01",
  "ANYDROP-OFFICE-01",
  "ANYDROP-STUDIO-01",
  "ANYDROP-CAMPUS-01",
];

export default function RoomModal({
  open,
  currentRoomId,
  peerCount,
  onJoinRoom,
  onCreateRoom,
  onClose,
}: Props) {
  const [inputRoom, setInputRoom] = useState("");
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCopy = () => {
    if (!currentRoomId) return;
    navigator.clipboard.writeText(currentRoomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRoom.trim()) return;
    onJoinRoom(inputRoom.trim().toUpperCase());
    setInputRoom("");
    onClose();
  };

  const handleSelectPreset = (roomId: string) => {
    onJoinRoom(roomId);
    onClose();
  };

  return (
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl flex flex-col gap-5 text-slate-900 relative overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-indigo-600">
                Room Settings
              </span>
              <h3 className="text-sm font-semibold text-slate-900">
                Switch or Create Room
              </h3>
            </div>
          </div>

          {/* Active Room Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Current Active Room
              </span>
              <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
                <Users className="w-3.5 h-3.5" />
                <span>{peerCount} device{peerCount !== 1 ? "s" : ""}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-mono font-bold text-indigo-700 tracking-wider">
                {currentRoomId ?? "Connecting..."}
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition shadow-sm active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-indigo-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Join Custom Room Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              <span>Join by Room Name:</span>
            </label>
            <div className="flex gap-2">
              <input
                value={inputRoom}
                onChange={(e) => setInputRoom(e.target.value)}
                placeholder="Enter Room Code (e.g. STUDIO-A)"
                className="flex-1 rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 uppercase placeholder:normal-case font-mono focus:outline-none focus:border-indigo-600"
              />
              <button
                type="submit"
                disabled={!inputRoom.trim()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs transition shadow-sm"
              >
                Join
              </button>
            </div>
          </form>

          {/* Preset Fast Switch */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Quick Switch Rooms:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_ROOMS.map((room) => {
                const isActive = currentRoomId === room;
                return (
                  <button
                    key={room}
                    onClick={() => handleSelectPreset(room)}
                    disabled={isActive}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between text-xs font-mono ${
                      isActive
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold"
                        : "bg-slate-50/80 border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <span className="truncate">{room}</span>
                    {isActive ? <Check className="w-3.5 h-3.5 text-indigo-600" /> : <ArrowRight className="w-3.5 h-3.5 opacity-40" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generate Fresh Private Room */}
          <button
            type="button"
            onClick={() => {
              onCreateRoom();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>Generate New Random Room</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
