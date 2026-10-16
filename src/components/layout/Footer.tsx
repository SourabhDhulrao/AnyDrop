import Link from "next/link";
import { Zap, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-slate-800/80 bg-slate-950/80">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="AnyDrop Logo"
            className="w-7 h-8 object-contain"
          />
          <img
            src="/brand-text.png"
            alt="AnyDrop"
            className="h-5 w-auto object-contain brightness-200"
          />
        </Link>

        <div className="flex items-center gap-6 text-sm text-slate-400">
          <Link href="/share" className="hover:text-emerald-400 transition-colors">Radar App</Link>
          <Link href="/#how-it-works" className="hover:text-emerald-400 transition-colors">How It Works</Link>
          <Link href="/#features" className="hover:text-emerald-400 transition-colors">Features</Link>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Private by design · No server storage</span>
        </div>
      </div>
    </footer>
  );
}
