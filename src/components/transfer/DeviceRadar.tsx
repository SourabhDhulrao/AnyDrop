"use client";
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Smartphone, Monitor, Tablet, Laptop, Tv2, 
  QrCode, Camera, Pencil, CheckSquare, Square, Users, Check
} from "lucide-react";
import type { DeviceInfo } from "@/types/signaling";
import type { MyDevice } from "@/hooks/useDevice";

interface Props {
  myDevice: MyDevice | null;
  peers: DeviceInfo[];
  selectedPeers?: DeviceInfo[];
  selectedPeer?: DeviceInfo | null;
  onSelectPeer?: (peer: DeviceInfo) => void;
  onTogglePeer?: (peer: DeviceInfo) => void;
  onSelectAllPeers?: () => void;
  onClearPeers?: () => void;
  onOpenQr: () => void;
  onOpenScanner: () => void;
  roomId?: string | null;
  onEditName?: () => void;
  wsStatus?: string;
  onReconnect?: () => void;
}

function getDeviceIcon(type?: string, className = "w-6 h-6") {
  switch (type?.toLowerCase()) {
    case "phone":
      return <Smartphone className={className} />;
    case "tablet":
      return <Tablet className={className} />;
    case "laptop":
      return <Laptop className={className} />;
    case "desktop":
      return <Monitor className={className} />;
    case "smartboard":
      return <Tv2 className={className} />;
    default:
      return <Laptop className={className} />;
  }
}

export default function DeviceRadar({
  myDevice,
  peers,
  selectedPeers = [],
  selectedPeer,
  onSelectPeer,
  onTogglePeer,
  onSelectAllPeers,
  onClearPeers,
  onOpenQr,
  onOpenScanner,
  onEditName,
}: Props) {
  const allPeers = peers;

  const isPeerSelected = (peer: DeviceInfo) => {
    if (selectedPeers.length > 0) {
      return selectedPeers.some((p) => p.id === peer.id);
    }
    return selectedPeer?.id === peer.id;
  };

  const handlePeerClick = (peer: DeviceInfo) => {
    if (onTogglePeer) {
      onTogglePeer(peer);
    } else if (onSelectPeer) {
      onSelectPeer(peer);
    }
  };

  // Radial orbital positions for discovered peers
  const peerPositions = useMemo(() => {
    const count = allPeers.length;
    if (count === 0) return [];
    
    return allPeers.map((peer, i) => {
      const angle = (i * (360 / count) - 90) * (Math.PI / 180);
      const radiusPercent = count === 1 ? 36 : 37;
      const x = 50 + radiusPercent * Math.cos(angle);
      const y = 50 + radiusPercent * Math.sin(angle);
      return { peer, x, y };
    });
  }, [allPeers]);

  const allSelected = allPeers.length > 0 && selectedPeers.length === allPeers.length;

  return (
    <div className="w-full flex flex-col items-center gap-5">
      {/* ── Status Bar for Peers ── */}
      {allPeers.length > 0 && (
        <div className="w-full flex items-center justify-between px-1 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 text-[11px] font-medium">
            <Users className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>
              {selectedPeers.length > 0
                ? `${selectedPeers.length} of ${allPeers.length} selected`
                : "Tap a device to select"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onSelectAllPeers && (
              <button
                type="button"
                onClick={allSelected ? onClearPeers : onSelectAllPeers}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-semibold flex items-center gap-1 transition active:scale-95"
              >
                {allSelected ? (
                  <Square className="w-3 h-3 text-slate-500" />
                ) : (
                  <CheckSquare className="w-3 h-3 text-[#0D9488]" />
                )}
                <span>{allSelected ? "Deselect All" : "Select All"}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Fresh Seafoam / Mint Circular Radar Display ── */}
      <div className="relative w-full max-w-[380px] aspect-square rounded-full overflow-hidden radar-dish flex items-center justify-center">
        {/* Subtle Crosshairs */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-full h-[1px] bg-[#2DD4BF]/30" />
          <div className="absolute h-full w-[1px] bg-[#2DD4BF]/30" />
        </div>

        {/* Concentric Seafoam Mint Orbital Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[88%] aspect-square rounded-full border border-[#2DD4BF]/35" />
          <div className="absolute w-[66%] aspect-square rounded-full border border-[#2DD4BF]/40" />
          <div className="absolute w-[44%] aspect-square rounded-full border border-[#14B8A6]/45" />
          <div className="absolute w-[22%] aspect-square rounded-full border border-[#14B8A6]/50" />
        </div>

        {/* Translucent Mint Sonar Sweep Beam */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="radar-sweep-mint" />
        </div>

        {/* ── CENTER: Your Device Node (Vibrant Sky/Royal Blue) ── */}
        <div className="relative z-20 flex flex-col items-center">
          <motion.div
            className="relative cursor-pointer group"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEditName}
          >
            {/* Center Halo & Concentric Cyan Ring */}
            <div className="energy-ring-center" />
            <div className="absolute -inset-1 rounded-2xl bg-cyan-400/30 blur-md group-hover:opacity-100 transition duration-300" />
            
            <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-[#1D68EC] to-[#0284C7] shadow-[0_6px_22px_rgba(29,104,236,0.38)] flex flex-col items-center justify-center text-white">
              {getDeviceIcon(myDevice?.type, "w-7 h-7 sm:w-8 sm:h-8")}
              <span className="text-[10px] font-bold tracking-wider uppercase text-white/95 mt-0.5">
                YOU
              </span>
            </div>

            {/* Small Cyan Indicator Ring */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-[#2DD4BF] flex items-center justify-center text-[#0D9488] shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#2DD4BF]" />
            </div>
          </motion.div>

          {/* Device Name Pill */}
          <div className="mt-2.5 flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border border-[#D5E6F5] shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1D68EC]" />
            <span className="text-xs font-semibold text-slate-700 max-w-[130px] truncate">
              {myDevice?.name ?? "Mint Pixel"}
            </span>
            {onEditName && (
              <button
                type="button"
                onClick={onEditName}
                className="text-slate-400 hover:text-slate-600 ml-0.5"
              >
                <Pencil className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Discovered Orbiting Peers ── */}
        {peerPositions.map(({ peer, x, y }) => {
          const isSelected = isPeerSelected(peer);
          return (
            <motion.div
              key={peer.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 24 }}
              style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
              }}
              className="z-30 flex flex-col items-center"
            >
              <motion.button
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => handlePeerClick(peer)}
                className={`relative flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl transition-all duration-200 shadow-md ${
                  isSelected
                    ? "bg-gradient-to-tr from-[#1D68EC] to-[#0284C7] text-white ring-3 ring-[#2DD4BF] shadow-[0_6px_20px_rgba(29,104,236,0.4)] scale-105"
                    : "bg-white text-slate-700 border border-[#D5E6F5] hover:border-[#2DD4BF] hover:text-[#0D9488] hover:shadow-lg"
                }`}
              >
                {isSelected && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-[#1D68EC] flex items-center justify-center shadow-md border border-[#D5E6F5]">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
                {getDeviceIcon(peer.type, "w-6 h-6 sm:w-7 sm:h-7")}
              </motion.button>

              <div 
                onClick={() => handlePeerClick(peer)}
                className={`mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide cursor-pointer transition-colors max-w-[120px] truncate text-center shadow-sm ${
                  isSelected
                    ? "bg-[#E0FBF6] text-[#0F766E] border border-[#2DD4BF] font-bold"
                    : "bg-white text-slate-700 border border-[#D5E6F5] hover:text-[#0D9488]"
                }`}
              >
                {peer.name}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Bottom Action Controls: Show QR & Scan QR ── */}
      <div className="w-full max-w-[380px] flex items-center gap-3">
        <button
          id="radar-show-qr-btn"
          type="button"
          onClick={onOpenQr}
          className="flex-1 py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 border border-[#CFDFEC] shadow-sm hover:border-[#B8D3E8] transition active:scale-95"
        >
          <QrCode className="w-4 h-4 text-slate-600" />
          <span>Show QR Code</span>
        </button>

        <button
          id="radar-scan-qr-btn"
          type="button"
          onClick={onOpenScanner}
          className="flex-1 py-3 px-4 rounded-2xl bg-[#1D68EC] hover:bg-[#1755C5] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition active:scale-95"
        >
          <Camera className="w-4 h-4 text-white" />
          <span>Scan QR Code</span>
        </button>
      </div>
    </div>
  );
}
